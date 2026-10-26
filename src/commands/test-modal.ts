import {
    ChannelSelectMenuBuilder,
    ChatInputCommandInteraction,
    LabelBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import {ChannelTypes} from "discord-interactions";

export const data = new SlashCommandBuilder()
    .setName('test-modal')
    .setDescription('Ouvre un modal de test');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {


    const modal = new ModalBuilder()
        .setCustomId('testModal')
        .setTitle('Test')
        .addLabelComponents(createTextInputAndLabel("date-picker", TextInputStyle.Short))
        .addLabelComponents(createChannelPickerAndLabelComponent("channel-picker"))


    await interaction.showModal(modal);
}

function createTextInputAndLabel (id: string, textInputStyle: TextInputStyle): LabelBuilder {
    const input = new TextInputBuilder()
        .setCustomId(`${id}-input`)
        .setStyle(textInputStyle);

    return new LabelBuilder()
        .setLabel(`${id}-label`)
        .setTextInputComponent(input);
}

function createChannelPickerAndLabelComponent(id:string){
    const channelPicker = new ChannelSelectMenuBuilder()
        .setCustomId(`${id}-input`)


    return new LabelBuilder()
        .setLabel(`${id}-label`)
        .setChannelSelectMenuComponent(channelPicker);
}