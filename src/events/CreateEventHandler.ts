import {ButtonInteraction, GuildMember, MessageFlags} from "discord.js";
import {addTable, createContainer, getTable} from "../utils/template-utils";
import {GameTableHandler} from "../utils/GameTableHandler";

export async function buttonHandling(interaction: ButtonInteraction) {
    if (interaction.customId === 'add-gm-button') {
        const gm = interaction.member as GuildMember;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        addTable(new GameTableHandler(interaction.channel!, gm, "Systeme de test", []))

    } else if (interaction.customId === "join-game") {
        getTable(0).addPlayer(interaction.member as GuildMember);
    }

    await interaction.update(
        {
            components: [createContainer()],
            flags: MessageFlags.IsComponentsV2,
        }
    );
}