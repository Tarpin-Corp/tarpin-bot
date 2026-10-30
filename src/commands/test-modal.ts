import {ChatInputCommandInteraction, SlashCommandBuilder} from 'discord.js';
import {inscriptionModal} from "../modals/create-inscription-form-modal";

export const data = new SlashCommandBuilder()
    .setName('test-modal')
    .setDescription('Ouvre un modal de test');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
   await interaction.showModal(inscriptionModal());
}