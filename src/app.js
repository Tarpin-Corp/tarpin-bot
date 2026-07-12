import 'dotenv/config';

import { Client, Events, GatewayIntentBits } from 'discord.js';
import listener from './honeypot/honeypot.js';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

/* Définition des listeners */
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	readyClient.user.setActivity('Destructeur de scammeur');
});

client.on(Events.MessageCreate, (message) => {
	try {
		listener(message, client);
	}
	catch (e) {
		console.error(`Message handle error: ${e}`);
		console.error(`Message received: ${message}`);
	}
});

client.login(process.env.TOKEN);

