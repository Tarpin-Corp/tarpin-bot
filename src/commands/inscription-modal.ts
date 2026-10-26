import {
    ChatInputCommandInteraction,
    LabelBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
export const data = new SlashCommandBuilder()
    .setName('inscription-modal')
    .setDescription('Ouvre un modal d\'inscription pour le JDR a la taverne');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const input = new TextInputBuilder()
        .setCustomId('test')
        .setStyle(TextInputStyle.Short);

    const label = new LabelBuilder()
        .setLabel('Test')
        .setTextInputComponent(input);

    const modal = new ModalBuilder()
        .setCustomId('inscription-modal')
        .setTitle('Test')
        .addLabelComponents(label);

    await interaction.showModal(modal);
}