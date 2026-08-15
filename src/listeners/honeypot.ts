import {Client, ContainerBuilder, Message, MessageFlags, Snowflake, TextBasedChannel} from 'discord.js';
import {getChannelName, readJsonFile, writeJsonFile} from '../utils';

interface KickedCounter {
    counter: number;
}

interface KickedMember {
    id: Snowflake,
    timestamp: number
}

const messagesCache = new Map<Snowflake, Message[]>();
const kickedMembers: KickedMember[] = [];

const CACHE_TIME_THRESHOLD = 5 * 60_000;

const KICKED_COUNTER_PATH = 'src/data/kickedCounter.json';

/**
 * Function that clear messages from the cache that are older than the cache time threshold
 */
function clearMessages(): void {
    for (const memberMessages of messagesCache.values()) {
        while (memberMessages.length && memberMessages[0].createdTimestamp < CACHE_TIME_THRESHOLD) {
            memberMessages.shift();
        }
    }
}

/**
 * Function that clear KickedMembers from the cache that are older than the cache time threshold
 */
function clearKicked(): void {
    while (kickedMembers.length && kickedMembers[0].timestamp < CACHE_TIME_THRESHOLD) {
        kickedMembers.shift();
    }
}

/**
 * Utility function that delete the message from the messageCache
 * @param authorId {string} Id of the author
 * @param message {Message} message to delete
 */
function deleteMessage(authorId: Snowflake, message: Message): void {
    message.delete()
        .then(() => {
            console.log('deleted message', authorId, message.content);
            const messages: Message[] = messagesCache.get(authorId) ?? [];
            messages.splice(messages.indexOf(message), 1);
        })
        .catch((e: unknown) => {
            console.error(`Échec de la suppression du message`);
            console.error(e)
        });
}

/**
 * Add a message in the message cache for the specified author
 * @param authorId {string} Id of the author
 * @param message {Message} message to add
 */
function addMessage(authorId: Snowflake, message: Message): void {
    if (!messagesCache.has(authorId)) {
        messagesCache.set(authorId, []);
    }
    // @ts-expect-error Cannot be undefined as the check with "has" and the set
    messagesCache.get(authorId).push(message);
}

/**
 * Listener for the honeypot functionality
 * @param message {Message<boolean> & {channel: Exclude<Message<boolean>["channel"], PartialGroupDMChannel>}} Message to be handled
 * @param client {Client} Bot
 */
function honeypotListener(message: Message, client: Client): void {
    console.log(`Message "${message.content}" reçu dans ${getChannelName(message.channel)}`);
    // Guard cause for DM
    if (!message.inGuild()) return;

    clearKicked();
    clearMessages();


    const authorId = message.author.id;

    // Guard cause for the bot itself
    if (authorId === client.user?.id) return;

    addMessage(authorId, message);

    // If the message is coming from a member that has already been kicked, delete all the user messages stored in the cache
    (messagesCache.get(authorId) ?? [])
        .filter(() => kickedMembers.some(member => member.id === authorId))
        .forEach(msg => {
            deleteMessage(authorId, msg);
        });

    // Guard cause for the honeypot channel
    if (message.channelId !== process.env.HONEY_POT_ID) return;
    const scammerMember = message.member;

    // Guard cause in case the message come from a kicked user.
    if (!scammerMember) {
        deleteMessage(authorId, message);
        return;
    }

    // Guard cause for user with the immunity role
    if (scammerMember.roles.cache.has(process.env.IMMUNITY_ROLE ?? "")) return;


    const kickedMember = {id: authorId, timestamp: Date.now()};

    // If the user has not been kicked already
    if (!kickedMembers.map(k => k.id).some(id => id === authorId)) {
        kickedMembers.push(kickedMember);
        // Kick the scammer member and delete all messages from this user from the cache
        scammerMember.kick('Tu as envoyé un message dans un channel destiné aux scams')
            .then(() => {
                readJsonFile<KickedCounter>(KICKED_COUNTER_PATH)
                    .then(async fileContent => {
                        const counter = fileContent.counter;
                        writeJsonFile(KICKED_COUNTER_PATH, {'counter': counter + 1});
                        await editWarningMessage(client, counter + 1);
                    })
                    .catch(console.error);
            })
            .catch((e: unknown) => {
                // If the kick fails, remove the member from the kick list
                kickedMembers.splice(kickedMembers.indexOf(kickedMember), 1);
                console.error(`Échec de l'expulsion de ${message.author.displayName}`);
                console.error(e);
            });
    }
    (messagesCache.get(authorId) ?? [])
        .forEach((msg) => {
            deleteMessage(authorId, msg);
        });
}

/**
 * Function that build a Discord container. It is destined to the warning message from the honeypot
 *
 * @param counter {number}  The counter of members kicked from the guild
 * @returns {ContainerBuilder} The warning message
 */
function buildWarningMessage(counter: number): ContainerBuilder {
    const ames = counter === 1 ? 'âme figure' : 'âmes figurent';
    const messageCount = counter === 0
        ? '-# Pour l\'instant, aucune âme ne figure dans son registre. Veillons à ce qu\'il en reste ainsi.'
        : `-# Déjà ${String(counter)} ${ames} dans son registre, ne vous faites pas avoir`;
    return new ContainerBuilder()
        .setAccentColor(0xff0000)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('# Aventurier ! Plus un bruit et surtout n\'écrivez pas dans ce salon'))
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('### Ici est enfermé le *Collecteur*, un esprit tortueux capturé par le Tavernier'))
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent('### Il n\'attend qu\'un seul mot de votre part pour inscrire votre nom dans son grimoire et vous effacer à jamais de la taverne'))
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) => textDisplay.setContent(messageCount));
}

/**
 * Function that edits the warning message to update the kicked counter.
 * The function considers the first message of the honeypot being the warning message from the bot
 *
 * @param client {Client<boolean>} The bot
 * @param counter {number} The new counter of members kicked from the guild
 */
async function editWarningMessage(client: Client, counter: number): Promise<void> {
    const honeypotId = process.env.HONEY_POT_ID ?? "";
    try {
        const channel = await client.channels.fetch(honeypotId);
        if (channel === null) {
            console.error(`Aucun channel n'a été trouvé`);
            return;
        }
        if (!("messages" in channel)) {
            console.error(`Il n'y a pas de messages trouvable dans ce channel`);
            return;
        }

        const messages = await channel.messages.fetch();
        if (messages.size === 0) {
            console.error("Aucun message n'est présent dans le channel");
            return;
        }

        const message = messages.last();

        await message?.edit({
            components: [buildWarningMessage(counter)],
            flags: MessageFlags.IsComponentsV2,
        });
    } catch
        (e) {
        console.error(
            `La récupération ou modification du message du channel "${honeypotId}" n'a pas fonctionné`,
        );
        console.error(e);
    }
}

/**
 * Listener that send the warning message if there isn't one in the honeypot channel
 *
 * @param client {Client<boolean>} The bot
 */
async function honeypotMessageListener(client: Client): Promise<void> {
    const honeypotId = process.env.HONEY_POT_ID ?? "";
    try {
        const channel: TextBasedChannel = await client.channels.fetch(honeypotId) as TextBasedChannel;
        if (!channel.isTextBased() || !channel.isSendable()) {
            console.error(`Le channel donné "${honeypotId}" n'est pas configuré correctement pour pouvoir recevoir et envoyer des messages`);
            return;
        }
        const messages = await channel.messages.fetch();
        if (messages.size > 0) return;

        const warningMessage = buildWarningMessage(0);

        await channel.send({
            components: [warningMessage],
            flags: MessageFlags.IsComponentsV2,
        });

    } catch (e) {
        console.error(`La récupération du channel "${honeypotId}" n'a pas fonctionné`);
        console.error(e);
    }

}

export {honeypotListener, honeypotMessageListener};