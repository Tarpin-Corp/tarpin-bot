import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    GuildMember,
    TextBasedChannel
} from "discord.js";

const instances: GameTableHandler[] = [];

export class GameTableHandler {
    private channel: TextBasedChannel;
    private gm: GuildMember;
    private system: string;
    private players: GuildMember[];


    constructor(channel: TextBasedChannel, gm: GuildMember, system: string, players: GuildMember[]) {
        this.gm = gm;
        this.system = system;
        this.players = players;
        this.channel = channel;
    }

    addTo(container: ContainerBuilder): ContainerBuilder {
        const playerList = this.players
            .map(player => `- <@${player.id}>`)
            .join('\n');

        return container
            .addSeparatorComponents(separator => separator)
            .addTextDisplayComponents(text =>
                text.setContent(`**${this.gm.displayName}** : ${this.system}\n\n${playerList || '*Table vide*'}`)
            )
            .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`join-game`)
                    .setLabel(`Rejoindre la table de ${this.gm.displayName}`)
                    .setStyle(ButtonStyle.Success)
            ));
    }

    addPlayer(player: GuildMember) {
        this.players.push(player);
    }
}

export function handler() {
    return instances;
}