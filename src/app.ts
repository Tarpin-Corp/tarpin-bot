import 'dotenv/config';

import {Client, Events, ForumChannel, GatewayIntentBits, MessageFlags, TextChannel} from 'discord.js';
import {honeypotListener, honeypotMessageListener} from './listeners/honeypot';
import {commands} from "./commands";
import {sendFFCMessage, createContainer} from "./utils/template-utils";

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

            const title =  interaction.fields.getTextInputValue("date-picker-input");

            // @ts-ignore
            interaction.fields.getSelectedChannels("channel-picker-input").forEach((channel) => {
                void sendFFCMessage(channel as ForumChannel, title);
            })

            void interaction.reply(`Post "${title}" créé !`);
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'add-gm-button') {
            void interaction.message.edit({
                components: [createContainer("test update")],
                flags: MessageFlags.IsComponentsV2
            })
        }
    }

    return;
});

client
    .login(process.env.TOKEN)
    .catch(console.error);

