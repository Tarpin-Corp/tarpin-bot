import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("tar-ping")
    .setDescription("Replies with Pong!");

export async function execute(interaction: ChatInputCommandInteraction) {
    return interaction.reply("Pong!");
}
