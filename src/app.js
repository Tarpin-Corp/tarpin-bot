import 'dotenv/config';

import { Client, Events, GatewayIntentBits } from 'discord.js';
import honeypotListener from './listeners/honeypot.js';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

/* Client's listener definition */
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	readyClient.user.setActivity('Destructeur de scammeur');
});

client.on(Events.MessageCreate, (message) => {
	honeypotListener(message, client)
		.catch(console.error);
});

client.login(process.env.TOKEN);

