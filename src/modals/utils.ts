import {ChannelSelectMenuBuilder, LabelBuilder, TextInputBuilder, TextInputStyle} from "discord.js";
import {ChannelType} from 'discord-api-types/v10';


/**
 * Creates a text input wrapped in a label.
 *
 * @param id - Custom ID of the input, used to retrieve its value on submit
 * @param label - Text displayed above the input.
 * @param textInputStyle - Input style for the input box
 * @returns A `LabelBuilder`, including label and text input
 */
export function createTextInputAndLabel(id: string, label: string, textInputStyle: TextInputStyle): LabelBuilder {
    const input = new TextInputBuilder()
        .setCustomId(id)
        .setStyle(textInputStyle);

    return new LabelBuilder()
        .setLabel(label)
        .setTextInputComponent(input);
}

/**
 * Creates a channel select menu wrapped in a label.
 *
 * @param id - Custom ID of the input, used to retrieve its value on submit
 * @param label - Text displayed above the input.
 * @param channelType - If provided, restricts the selection to forum channels.
 * @returns A `LabelBuilder`, including label and channel input
 */
export function createChannelPickerAndLabelComponent(id: string, label: string, channelType?: ChannelType): LabelBuilder {
    const channelPicker = new ChannelSelectMenuBuilder()
        .setCustomId(id);

    if (channelType) {
        channelPicker.setChannelTypes(channelType)
    }

    return new LabelBuilder()
        .setLabel(label)
        .setChannelSelectMenuComponent(channelPicker);
}
