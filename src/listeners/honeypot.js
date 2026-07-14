/**
 * @typedef {{kicked: string, timestamp: number}} KickedMember
 */

/** @type {Map<string, Array<Message>>} */
const messageCache = new Map();

/** @type {Array<KickedMember>} */
const kickedMembers = [];
const timer = 5 * 60_000;


/**
 * Function that clear messages from the cache that are older than the cache time threshold
 */
function clearMessages() {
	for (const messages of messageCache.values()) {
		while (messages.length && messages[0].createdTimestamp < timer) {
			messages.shift();
		}
	}
}

/**
 * Function that clear KickedMembers from the cache that are older than the cache time threshold
 */
function clearKicked() {
	while (kickedMembers.length && kickedMembers[0].timestamp < timer) {
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
			const messages = messageCache.get(authorId);
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
	if (!messageCache.has(authorId)) {
		messageCache.set(authorId, []);
	}
	messageCache.get(authorId).push(message);
}

/**
 * Listener for the honeypot functionality
 * @param message {Message<boolean> & {channel: Exclude<Message<boolean>["channel"], PartialGroupDMChannel>}} Message to be handled
 * @param client {Client} Bot
 */
const listener = async (message, client) => {
	console.log(`Message "${message.content}" reçu dans ${message.channel.name}`);
	// Guard cause for DM
	if (!message.inGuild()) return;

	const authorId = message.author.id;

	clearKicked(kickedMembers);
	clearMessages(message);

	addMessage(authorId, message);

	// If the message is coming from a member that has already been kicked, delete all the user messages stored in the cache
	[...messageCache.get(authorId)]
		.filter(() => kickedMembers.some(member => member.kicked === message.author.id))
		.forEach(msg => deleteMessage(authorId, msg));

	// Guard cause for the honeypot channel
	if (message.channelId !== process.env.HONEY_POT_ID) return;
	const scammerMember = message.member;

	// Guard cause in case the message come from a kicked user.
	if (!scammerMember) {
		deleteMessage(authorId, message);
		return;
	}

	// Guard cause for the bot itself or for user with the immunity role
	if (message.author.id === client.user.id || scammerMember.roles.cache.has(process.env.IMMUNITY_ROLE)) return;

	// Kick the scammer member and delete all messages from this user from the cache
	scammerMember.kick('Tu as envoyé un message dans un channel destiné aux scams')
		.then(() => kickedMembers.push({ kicked: message.author.id, timestamp: Date.now() }))
		.catch(e => console.error(`Échec de l'expultion de ${message.author}: ${e}`));


	[...messageCache.get(authorId)]
		.forEach((msg) => deleteMessage(authorId, msg));
};

export default listener;