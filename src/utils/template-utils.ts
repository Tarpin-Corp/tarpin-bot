import {ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, ForumChannel, MessageFlags} from "discord.js";
import {GameTableHandler} from "./GameTableHandler";

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

const tables: GameTableHandler[] = [];

export function createContainer(): ContainerBuilder {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('add-gm-button')
            .setLabel("Proposez une table en tant que MJ")
            .setStyle(ButtonStyle.Primary)
    );

    const container = new ContainerBuilder()
        .setAccentColor(0xe38454)
        .addTextDisplayComponents(text => text.setContent(TEXT_DISPLAY_FFC))
        .addActionRowComponents(row);

    for (const table of tables) {
        table.addTo(container);
    }

    return container;
}

export async function sendFFCMessage(channel: ForumChannel, title: string) {
    await channel.threads.create({
        name: title,
        message: {
            components: [createContainer()],
            flags: MessageFlags.IsComponentsV2
        }
    });
}

export function addTable(table: GameTableHandler): void {
    tables.push(table);
}

export function getTable(index: number){
    return tables[index];
}
