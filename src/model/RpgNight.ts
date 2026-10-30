import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    ForumChannel, ForumThreadChannel,
    MessageFlags
} from "discord.js";
import {GameTable} from "./GameTable";

/**
 * An RPG night event: a registration post in a forum channel,
 * to which GMs can add tables and players can join them.
 */
export class RpgNight {
    private readonly tables: GameTable[];
    private readonly title: string;
    /** Forum channel where the registration thread is created. */
    private readonly channel: ForumChannel;
    /**
     * Thread holding the registration message.
     * Only set once `sendInscriptionMessage()` has completed.
     */
    private thread!: ForumThreadChannel;

    //TODO properly store this text
    private static readonly TEXT_DISPLAY_FFC: string = "# Ouverture des inscriptions pour le Club de JDR !\n" +
        "\n" +
        "**Horaire:** 18h30\n" +
        "\n" +
        "Pour Rappel, un PAF d'entrée de **20 euros** comportant:\n" +
        "- la session de 4h de jdr !\n" +
        "- Une boisson au choix !\n" +
        "- Une planche à partager et de quoi grignoter avec votre groupe de JDR !\n" +
        "\n" +
        "-# Puis 5€ supplémentaire pour les boissons sans alcool, et 8€ pour celles avec alcool.\n" +
        "\n" +
        "Pour vous inscrire:\n"

    /**
     * Creates a new event with no tables.
     * NB : The registration message is not posted until
     * `sendInscriptionMessage()` is called.
     *
     * @param channel - Forum channel where the event will be posted.
     * @param title - Event name.
     */
    constructor(channel: ForumChannel, title: string) {
        this.tables = [];
        this.channel = channel;
        this.title = title;
    }

    /**
     * Builds the full registration message as a Components  container:
     * the static header, a "propose a table" button, then each table in order.
     *
     * The "propose a table" button follow the syntax `add-gm-button:<channelId>`
     * for easy retrieval
     *
     * Called on creation and after every change to re-render the message.
     * TODO Investigate to check if we can just append to an existing message rather than rewritting it entirely
     *
     * @returns The container to send or to update the message with.
     */
    public asContainer(): ContainerBuilder {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId(`add-gm-button:${this.channel.id}`)
                .setLabel("Proposez une table en tant que MJ")
                .setStyle(ButtonStyle.Primary)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xe38454)
            .addTextDisplayComponents(text => text.setContent(RpgNight.TEXT_DISPLAY_FFC))
            .addActionRowComponents(row);

        // Each table appends its own section
        for (const table of this.tables) {
            table.addTo(container);
        }

        return container;
    }

    /**
     * Creates the forum thread holding the registration message
     * and stores it for later lookups.
     */
    public async sendInscriptionMessage() {
        this.thread = await this.channel.threads.create({
            name: this.title,
            message: {
                components: [this.asContainer()],
                flags: MessageFlags.IsComponentsV2
            }
        });
    }

    public addTable(table: GameTable): void {
        this.tables.push(table);
    }

    /**
     * Finds a table by its GM's ID.
     *
     * @param gmId - Discord ID of the GM.
     * @returns The matching table, or `undefined` if none.
     */
    public getTableByGmId(gmId: string): GameTable | undefined {
        return this.tables.find((table) => table.gmId() === gmId);
    }

    public getChannel(): ForumChannel {
        return this.channel;
    }

    public getThread() : ForumThreadChannel {
        return this.thread;
    }
}