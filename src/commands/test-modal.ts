import {
    ChatInputCommandInteraction,
    LabelBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('test-modal')
    .setDescription('Ouvre un modal de test');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const input = new TextInputBuilder()
        .setCustomId('test')
        .setStyle(TextInputStyle.Short);

    const label = new LabelBuilder()
        .setLabel('Test')
        .setTextInputComponent(input);

    const modal = new ModalBuilder()
        .setCustomId('testModal')
        .setTitle('Test')
        .addLabelComponents(label);

    await interaction.showModal(modal);
}