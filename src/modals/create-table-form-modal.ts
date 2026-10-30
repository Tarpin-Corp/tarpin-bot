import {ModalBuilder, TextInputStyle} from "discord.js";
import {createTextInputAndLabel} from "./utils";

export function createTableFormModal(): ModalBuilder {
    return new ModalBuilder()
        .setCustomId('create-table-form-modal')
        .setTitle('Proposer une table')
        .addLabelComponents(createTextInputAndLabel("system-picker-input", "Nom du système", TextInputStyle.Short))
}