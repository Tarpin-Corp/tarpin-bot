import 'dotenv/config';

import {Client, Events, GatewayIntentBits} from 'discord.js';
import {honeypotListener, honeypotMessageListener} from './listeners/honeypot';

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
    honeypotMessageListener(readyClient)
        .then(() => {console.log('Message de bienvenue créer !')})
        .catch(console.error);
});

client.on(Events.MessageCreate, message => {
    try {
        honeypotListener(message, client);
        honeypotMessageListener(client)
            .catch(console.error);
    } catch (e) {
        console.error("Une erreur innatendu est survenu");
        console.error(e);
    }
});

client
    .login(process.env.TOKEN)
    .catch(console.error);

