import {Client, ContainerBuilder, Message, MessageFlags, Snowflake, TextBasedChannel} from 'discord.js';
import {getChannelName, readJsonFile, writeJsonFile} from '../utils/utils';
import OperationQueue from "../utils/OperationQueue";

interface KickedCounter {
    counter: number;
}

interface KickedMember {
    id: Snowflake,
    timestamp: number
}

const memberQueue = new OperationQueue<Snowflake>();

const messagesCache = new Map<Snowflake, Message[]>();
const kickedMembersCache: KickedMember[] = [];

const CACHE_TIME_THRESHOLD = 5 * 60_000;

const KICKED_COUNTER_PATH = 'src/data/kickedCounter.json';

/**
 * Function that clear messages from the cache that are older than the cache time threshold
 */
async function clearOutdatedCachedMessages(): Promise<void> {
    for (const member of messagesCache.keys()) {
        await memberQueue.run(member, () => {
            const messages = messagesCache.get(member) ?? [];
            messagesCache.set(member, messages.filter(msg => msg.createdTimestamp >= CACHE_TIME_THRESHOLD));
        });
    }
}

/**
 * Function that clear KickedMembers from the cache that are older than the cache time threshold
 */
async function clearOutdatedCachedKickedMember(): Promise<void> {
    await memberQueue.run(process.env.GUILD_ID ?? "", () => {
        while (kickedMembersCache.length && kickedMembersCache[0].timestamp < CACHE_TIME_THRESHOLD) {
            kickedMembersCache.shift();
        }
    })
}

/**
 * Utility function that delete the message from the messageCache
 * @param authorId {string} Id of the author
 */
async function deleteCachedMessagesFromAuthor(authorId: Snowflake): Promise<void> {
    const messages = await memberQueue.run(authorId, () => {
        const authorMessage: Message[] = messagesCache.get(authorId) ?? [];
        messagesCache.delete(authorId);
        return authorMessage;
    });

    if (messages.length === 0) return;

    try {
        const promisedDeletion = messages.map(async message => {
            await message.delete()
                .then(() => {
                    console.log('deleted message from', authorId, message.content);
                })
                .catch((e: unknown) => {
                    console.error(`Échec de la suppression du message: ${message.content}`)
                    console.error(e);
                });
        });

        await Promise.all(promisedDeletion);
    } catch (e) {
        console.error(`Échec de la suppression des message`);
        console.error(e);
    }
}

/**
 * Add a message in the message cache for the specified author
 * @param authorId {string} Id of the author
 * @param message {Message} message to add
 */
async function addMessageToCache(authorId: Snowflake, message: Message): Promise<void> {
    await memberQueue.run(authorId, () => {
        if (!messagesCache.has(authorId)) {
            messagesCache.set(authorId, []);
        }
        // @ts-expect-error Cannot be undefined due to the check with "has" and "set"
        messagesCache.get(authorId).push(message);
    })
}

/**
 * Listener for the honeypot functionality
 * @param message {Message} Message to be handled
 * @param client {Client} Bot
 */
async function honeypotListener(message: Message, client: Client): Promise<void> {
    console.log(`Message "${message.content}" reçu dans ${getChannelName(message.channel)}`);
    // Guard cause for DM
    if (!message.inGuild()) return;

    await clearOutdatedCachedKickedMember();
    await clearOutdatedCachedMessages();


    const authorId = message.author.id;

    // Guard cause for the bot itself
    if (authorId === client.user?.id) return;

    await addMessageToCache(authorId, message);

    // If the message is coming from a member that has already been kicked, delete all the user messages stored in the cache
    if (kickedMembersCache.some(kickedMember => kickedMember.id === authorId)) {
        await deleteCachedMessagesFromAuthor(authorId);
    }

    // Guard cause for the honeypot channel
    if (message.channelId !== process.env.HONEY_POT_ID) return;
    const scammerMember = message.member;

    // Guard cause in case the message come from a kicked user.
    if (!scammerMember) {
        await deleteCachedMessagesFromAuthor(authorId);
        return;
    }

    // Guard cause for user with the immunity role
    if (scammerMember.roles.cache.has(process.env.IMMUNITY_ROLE ?? "")) return;

    await memberQueue.run(authorId, () => {
        const kickedMember = {id: scammerMember.id, timestamp: Date.now()};

        // Guard cause for when the user is already kicked
        if (kickedMembersCache.map(k => k.id).some(id => id === kickedMember.id)) {
            return;
        }

        kickedMembersCache.push(kickedMember);
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
                kickedMembersCache.splice(kickedMembersCache.indexOf(kickedMember), 1);
                console.error(`Échec de l'expulsion de ${message.author.displayName}`);
                console.error(e);
            });
    });

    await deleteCachedMessagesFromAuthor(authorId);
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