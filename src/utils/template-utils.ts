import {ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, ForumChannel, MessageFlags} from "discord.js";

const TEXT_DISPLAY_FFC: string = "# Ouverture des inscriptions pour le Club de JDR !\n" +
    "\n" +
    "**Horaire:** 18h30\n" +
    "\n" +
    "Pour Rappel, un PAF d'entrée de **20 euros** comportant:\n" +
    "- la session de 4h de jdr !\n" +
    "- Une boisson au choix !\n" +
    "- Une planche à partager et de quoi grignoter avec votre groupe de JDR !\n" +
    "\n" +
    "-# Puis 5€ supplémentaire pour les boissons sans alcool, et 8€ pour celles avec alcool.\n" +
    "\n" +
    "Pour vous inscrire:\n"


export function createContainer(label: string): ContainerBuilder {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('add-gm-button')
            .setLabel(label)
            .setStyle(ButtonStyle.Primary)
    );

    return new ContainerBuilder()
        .setAccentColor(0xe38454)
        .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(TEXT_DISPLAY_FFC)
        )
        .addActionRowComponents(row)
}

export async function sendFFCMessage(channel: ForumChannel, title: string) {
    await channel.threads.create({
        name: title,
        message: {
            components: [createContainer("Proposez une table en tant que MJ avec un JDR")],
            flags: MessageFlags.IsComponentsV2
        }
    });
}