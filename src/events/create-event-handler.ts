import {ButtonInteraction, ForumChannel, GuildMember, MessageFlags, ModalSubmitInteraction} from "discord.js";
import {GameTable} from "../model/GameTable";
import {RpgNight} from "../model/RpgNight";

/**
 * Handles button clicks
 *
 * Supported buttons (custom ID format: `<action>:<id>`):
 * - `add-gm-button:<channelId>`: the clicking member becomes a GM and opens a new table
 *   on the event posted in the given channel.
 * - `join-game:<gmId>`: the clicking member joins the table run by the given GM.
 *
 * After any change, the original message is updated to reflect the new event state.
 *
 * @param interaction - The button interaction to handle.
 * @param ttrpgEvents - In-memory list of active RPG nights. Should be replaced by access from database
 */
export async function buttonHandling(interaction: ButtonInteraction, ttrpgEvents: RpgNight[]) {
    let ttrpgEvent: RpgNight | undefined;

    if (interaction.customId.startsWith("add-gm-button")) {
        const gm = interaction.member as GuildMember;
        const channelId = interaction.customId.split(":")[1]
        ttrpgEvent = ttrpgEvents.find((event: RpgNight) => event.getChannel().id === channelId);
        ttrpgEvent?.addTable(new GameTable(gm, "Systeme de test"))

    } else if (interaction.customId.startsWith("join-game")) {
        const gmId = interaction.customId.split(":")[1]
        ttrpgEvent = ttrpgEvents.find((event: RpgNight) => event.getThread().id === interaction.channelId);
        const table = ttrpgEvent?.getTableByGmId(gmId);
        table?.addPlayer(interaction.member as GuildMember);
    }

    if (ttrpgEvent != undefined) {
        await interaction.update(
            {
                components: [(ttrpgEvent).asContainer()],
                flags: MessageFlags.IsComponentsV2,
            }
        );
    }
}

/**
 * Handles submission of the RPG night creation modal.
 *
 * Creates one `RpgNight` per selected channel, stores it in the event list,
 * and posts its registration message.
 *
 * @param interaction - The modal submit interaction to handle.
 * @param ttrpgEvents - In-memory list of active RPG nights; new events are pushed into it.
 */
export async function modalSubmitHandler(interaction: ModalSubmitInteraction, ttrpgEvents: RpgNight[]) {
    if (interaction.customId === "create-inscription-form-modal") {

        const title = interaction.fields.getTextInputValue("title-picker-input");

        interaction.fields.getSelectedChannels("channel-picker-input")?.forEach((channel) => {
            const ttrpgEvent: RpgNight = new RpgNight(channel as ForumChannel, title);
            ttrpgEvents.push(ttrpgEvent);
            void ttrpgEvent.sendInscriptionMessage();
        })

        await interaction.reply(`Post "${title}" créé !`);
    }
}