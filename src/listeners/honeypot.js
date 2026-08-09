import { MessageFlags, ContainerBuilder } from 'discord.js';
import { readJsonFile, writeJsonFile } from '../utils/utils.js';

/**
 * @typedef {{id: string, timestamp: number}} KickedMember
 */

/** @type {Map<string, Array<Message>>} */
const messagesCache = new Map();

/** @type {Array<KickedMember>} */
const kickedMembers = [];
const CACHE_TIME_THRESHOLD = 5 * 60_000;

const KICKED_COUNTER_PATH = 'src/data/kickedCounter.json';


/**
 * Function that clear messages from the cache that are older than the cache time threshold
 */
function clearMessages() {
	for (const memberMessages of messagesCache.values()) {
		while (memberMessages.length && memberMessages[0].createdTimestamp < CACHE_TIME_THRESHOLD) {
			memberMessages.shift();
		}
	}
}

/**
 * Function that clear KickedMembers from the cache that are older than the cache time threshold
 */
function clearKicked() {
	while (kickedMembers.length && kickedMembers[0].timestamp < CACHE_TIME_THRESHOLD) {
		kickedMembers.shift();
	}
}

/**
 * Utility function that delete the message from the messageCache
 * @param authorId {string} Id of the author
 * @param message {Message} message to delete
 */
function deleteMessage(authorId, message) {
	message.delete()
		.then(() => {
			console.log('deleted message', authorId, message.content);
			const messages = messagesCache.get(authorId);
			messages.splice(messages.indexOf(message), 1);
		})
		.catch(e => console.error(`Échec de la suppression du message ${e}`));
}

/**
 * Add a message in the message cache for the specified author
 * @param authorId {string} Id of the author
 * @param message {Message} message to add
 */
function addMessage(authorId, message) {
	if (!messagesCache.has(authorId)) {
		messagesCache.set(authorId, []);
	}
	messagesCache.get(authorId).push(message);
}

/**
 * Listener for the honeypot functionality
 * @param message {Message<boolean> & {channel: Exclude<Message<boolean>["channel"], PartialGroupDMChannel>}} Message to be handled
 * @param client {Client} Bot
 */
async function honeypotListener(message, client) {
	console.log(`Message "${message.content}" reçu dans ${message.channel.name}`);
	// Guard cause for DM
	if (!message.inGuild()) return;

	clearKicked();
	clearMessages();


	const authorId = message.author.id;

	// Guard cause for the bot itself
	if (authorId === client.user.id) return;

	addMessage(authorId, message);

	// If the message is coming from a member that has already been kicked, delete all the user messages stored in the cache
	[...messagesCache.get(authorId)]
		.filter(() => kickedMembers.some(member => member.id === authorId))
		.forEach(msg => deleteMessage(authorId, msg));

	// Guard cause for the honeypot channel
	if (message.channelId !== process.env.HONEY_POT_ID) return;
	const scammerMember = message.member;

	// Guard cause in case the message come from a kicked user.
	if (!scammerMember) {
		deleteMessage(authorId, message);
		return;
	}

	// Guard cause for user with the immunity role
	if (scammerMember.roles.cache.has(process.env.IMMUNITY_ROLE)) return;


	const kickedMember = { id: authorId, timestamp: Date.now() };

	// If the user has not been kicked already
	if (!kickedMembers.map(k => k.id).some(id => id === authorId)) {
		kickedMembers.push(kickedMember);
		// Kick the scammer member and delete all messages from this user from the cache
		scammerMember.kick('Tu as envoyé un message dans un channel destiné aux scams')
			.then(() => {
				readJsonFile(KICKED_COUNTER_PATH).then(fileContent => {
					const counter = fileContent.counter;
					writeJsonFile(KICKED_COUNTER_PATH, { 'counter': counter + 1 });
					editWarningMessage(client, counter + 1);
				});
			})
			.catch(e => {
				// If the kick fails, remove the member from the kick list
				kickedMembers.splice(kickedMembers.indexOf(kickedMember), 1);
				console.error(`Échec de l'expulsion de ${message.author}: ${e}`);
			});
	}

	[...messagesCache.get(authorId)]
		.forEach((msg) => deleteMessage(authorId, msg));
}

/**
 * Function that edits the warning message to update the kicked counter.
 * The function considers the first message of the honeypot being the warning message from the bot
 *
 * @param client {Client<boolean>} The bot
 * @param counter {number} The new counter of members kicked from the guild
 */
function editWarningMessage(client, counter) {
	client.channels.fetch(process.env.HONEY_POT_ID).then(channel => {
		channel.messages.fetch().then(messages => {
			const message = messages.first();

			message.edit({
				components: [buildWarningMessage(counter)],
				flags: MessageFlags.IS_COMPONENTS_V2,
			});
		});
	}).catch(e => {
		console.error(`La récupération du channel ${process.env.HONEY_POT_ID} n'a pas fonctionné`);
		console.error(e);
	});
}

/**
 * Function that build a Discord container. It is destined to the warning message from the honeypot
 *
 * @param counter {number}  The counter of members kicked from the guild
 * @returns {ContainerBuilder} The warning message
 */
function buildWarningMessage(counter) {
	const ames = counter === 1 ? 'âme figure' : 'âmes figurent';
	const messageCount = counter === 0
		? '-# Pour l\'instant, aucune âme ne figure dans son registre. Veillons à ce qu\'il en reste ainsi.'
		: `-# Déjà ${counter} ${ames} dans son registre, ne vous faites pas avoir`;
	return new ContainerBuilder()
		.setAccentColor(0xff0000)
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent('# Aventurier ! Plus un bruit et surtout n\'écrivez pas dans ce salon'))
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent('### Ici est enfermé le *Collecteur*, un esprit tortueux capturé par le Tavernier'))
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent('### Il n\'attend qu\'un seul mot de votre part pour inscrire votre nom dans son grimoire et vous effacer à jamais de la taverne'))
		.addSeparatorComponents((separator) => separator)
		.addTextDisplayComponents((textDisplay) => textDisplay.setContent(messageCount));
}

/**
 * Listener that send the warning message if there isn't one in the honeypot channel
 *
 * @param client {Client<boolean>} The bot
 */
async function honeypotMessageListener(client) {
	client.channels.fetch(process.env.HONEY_POT_ID).then(channel => {
		channel.messages.fetch().then(messages => {
			if (messages.size > 0) return;

			const warningMessage = buildWarningMessage(0);

			channel.send({
				components: [warningMessage],
				flags: MessageFlags.IsComponentsV2,
			});
		});
	}).catch(e => {
		console.error(`La récupération du channel ${process.env.HONEY_POT_ID} n'a pas fonctionné`);
		console.error(e);
	});

}

export { honeypotListener, honeypotMessageListener };