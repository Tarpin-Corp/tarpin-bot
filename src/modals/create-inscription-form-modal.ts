import {ModalBuilder, TextInputStyle} from "discord.js";
import {ChannelType} from 'discord-api-types/v10';
import {createChannelPickerAndLabelComponent, createTextInputAndLabel} from "./utils"

/**
 * Builds the event registration modal.
 *
 * The modal contains two fields:
 * - a short text input for the event name;
 * - a channel picker to choose where the message will be posted.
 *
 * @returns The modal as a ModalBuilder
 */
export function inscriptionModal(): ModalBuilder {
    return new ModalBuilder()
        .setCustomId('create-inscription-form-modal')
        .setTitle('Test')
        .addLabelComponents(createTextInputAndLabel("title-picker-input", "Nom de la soirée", TextInputStyle.Short))
        .addLabelComponents(createChannelPickerAndLabelComponent("channel-picker-input", "Poster le message dans", ChannelType.GuildForum))
}
