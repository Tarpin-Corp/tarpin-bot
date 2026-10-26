import 'dotenv/config';

import {Client, Events, GatewayIntentBits} from 'discord.js';
import {honeypotListener, honeypotMessageListener} from './listeners/honeypot';
import {commands} from "./commands";

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
    console.log(`Prêt ! Connecté en tant que ${readyClient.user.tag}`);
    readyClient.user.setActivity('Destructeur de scammeur');
    honeypotMessageListener(readyClient)
        .then(() => {
            console.log('Message de bienvenue créé !')
        })
        .catch(console.error);
});

client.on(Events.MessageCreate, message => {
    honeypotListener(message, client)
        .catch(console.error);
    honeypotMessageListener(client)
        .catch(console.error);
});

client.on(Events.InteractionCreate, (interaction) => {
    if (interaction.isChatInputCommand()) {
        const {commandName} = interaction;
        commands[commandName as keyof typeof commands].execute(interaction).catch(console.error);
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'testModal') {
            interaction.reply({ content: `Your submission was received successfully! (${interaction.fields.getTextInputValue('test')})` }).catch(console.error);
        }
    }

    return;
});

client
    .login(process.env.TOKEN)
    .catch(console.error);

