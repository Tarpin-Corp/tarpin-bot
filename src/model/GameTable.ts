import {ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, GuildMember,} from "discord.js";

/**
 * Lifecycle status of a game table.
 * Values are the user-facing labels displayed in the registration message.
 * TODO: Make find way for an admin to change a table's status
 */
export enum GameTableStatus {
    PENDING= "En attente de validation", CONFIRMED = "Table validée", CANCELLED = "Table annulée"
}

/**
 * A game table within an RPG night: one GM, one game system, and a list of players.
 */
export class GameTable {
    private gm: GuildMember;
    private system: string;
    private players: GuildMember[];
    private status : GameTableStatus;


    constructor(gm: GuildMember, system: string) {
        this.gm = gm;
        this.system = system;
        this.players = [] as GuildMember[];
        this.status = GameTableStatus.PENDING;
    }

    /**
     * Appends this table's display to a Components container:
     * a separator, a text block (GM, status, system, player list),
     * and a join button.
     *
     * The join button follow the syntax `join-game:<gmId>` to be
     * easily retrieved in the `create-event-handler`
     *
     * @param container - Container to append the table components to.
     * @returns The same container, to allow chaining.
     */
    addTo(container: ContainerBuilder): ContainerBuilder {
        const playerList = this.players
            .map(player => `- <@${player.id}>`)
            .join('\n');

        return container
            .addSeparatorComponents(separator => separator)
            .addTextDisplayComponents(text =>
                text.setContent(`# **<@${this.gm.id}>** : ${this.status}\nSysteme : ${this.system}\n\n${playerList || '*Table vide*'}`)
            )
            .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`join-game:${this.gm.id}`)
                    .setLabel(`Rejoindre la table de ${this.gm.displayName}`)
                    .setStyle(ButtonStyle.Success)
            ));
    }

    addPlayer(player: GuildMember) {
        this.players.push(player);
    }

    gmId(): string {
        return this.gm.id;
    }
}