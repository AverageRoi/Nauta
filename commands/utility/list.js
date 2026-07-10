const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const prisma = require("../../prisma/prisma.js");

const DIMENSIONS = {

    overworld: {
        databaseValue: "overworld_dimension",
        label: "Overworld",
        color: 0x36eb51,
        buttonStyle: ButtonStyle.Success,

        description: "**The list of Overworld coordinates**",

        thumbnail: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fp4.wallpaperbetter.com%2Fwallpaper%2F483%2F418%2F410%2Fminecraft-shaders-william-wythers-overhauled-overworld-nature-hd-wallpaper-preview.jpg&f=1&nofb=1&ipt=3a6974e15e3a5eee3790a53ba83c51eed7883949a9ebadfa621ea160f0bcfcd0"
    },

    nether: {

        databaseValue: "nether_dimension",
        label: "Nether",
        color: 0x910500,
        buttonStyle: ButtonStyle.Danger,

        description: "**The list of Nether coordinates**",

        thumbnail: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fminecraft.fr%2Fwp-content%2Fuploads%2F2025%2F04%2Fgrottes-du-nether-lave-et-lumiere-mellow-shader-minecraft-1200x675.jpg&f=1&nofb=1&ipt=f8c3bee58f6f84f48d83106aad42a23caa1ae887d789f0b01590aa4058278ef7"
    },

    end: {
        databaseValue: "end_dimension",
        label: "End",
        color: 0xa500da,
        buttonStyle: ButtonStyle.Secondary,

        description: "**The list of End coordinates**",

        thumbnail: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallpapers.com%2Fimages%2Fhd%2Fminecraft-jouney-ends-fwd0y2twts0i6e1m.jpg&f=1&nofb=1&ipt=17e2a1d35ec13ace328234925cb5f674e09e6c8be5fa61c04a7e14f7a0b21776"
    },
};

const default_dimension = "overworld";

// Discord can only show up to 25 fields per embed page.
const max_visible_coordinates = 25;

// Button collectors expire after 10 minutes.
const collector_time = 10 * 60 * 1000;

function truncateText(value, maximumLength) {
    const text = String(value ?? "");

    if (text.length <= maximumLength) {
        return text;
    }

    return `${text.slice(0, maximumLength - 1)}…`;
}

    function buildCoordinateField(coordinate, index) {
    // Fall back to a generated name if the alias is empty.
        const alias =
        coordinate.alias?.trim() ||
        `Coordinate ${index + 1}`;

    const x = String(coordinate.x_coordinates ?? "?");
    const z = String(coordinate.z_coordinates ?? "?");

    let fieldValue;

    if (coordinate.y_coordinates !== null) {
        const y = String(coordinate.y_coordinates);
        fieldValue = `\`${x}, ${y}, ${z}\``;
    } else {
        fieldValue = `\`${x}, ?, ${z}\``;
    }

    return {
        name: truncateText(alias, 256),
        value: truncateText(fieldValue, 1024),
        inline: true,
    };
}

function getCoordinatePageData(
    allCoordinates,
    selectedDimensionKey,
    requestedPage = 0
) {

    // Fall back to Overworld if an invalid dimension key reaches this helper.
    const dimension = 
        DIMENSIONS[selectedDimensionKey] ??
        DIMENSIONS[default_dimension];

    // Match Prisma records to the selected Discord dimension.
    const filteredCoordinates = allCoordinates.filter(
        (coordinate) =>
            coordinate.dimension === dimension.databaseValue
    );

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredCoordinates.length / max_visible_coordinates
        )
    );

    const currentPage = Math.min(
        Math.max(requestedPage, 0),
        totalPages - 1
    );

    const startIndex = currentPage * max_visible_coordinates;

    const visibleCoordinates = filteredCoordinates.slice(
        startIndex,
        startIndex + max_visible_coordinates
    );

    return {
        dimension,
        filteredCoordinates,
        visibleCoordinates,
        currentPage,
        totalPages,
        startIndex,
    };
}

function buildCoordinatesEmbed(
    allCoordinates,
    selectedDimensionKey,
    requestedPage = 0
) {
    const {
        dimension,
        filteredCoordinates,
        visibleCoordinates,
        currentPage,
        totalPages,
        startIndex,
    } = getCoordinatePageData(
        allCoordinates,
        selectedDimensionKey,
        requestedPage
    );

    const embed = new EmbedBuilder()
        .setColor(dimension.color)
        .setTitle(
            `${dimension.label} coordinates`
        )
        .setDescription(dimension.description)
        .setTimestamp()
        .setThumbnail(dimension.thumbnail);

    if (visibleCoordinates.length === 0) {
        embed.addFields({
            name: "No coordinates found",
            value:
                `There are currently no coordinates registered for the ` +
                `**${dimension.label}** in this server.`,
            inline: false,
        });
    } else {
        const coordinateFields = visibleCoordinates.map(
            (coordinate, index) =>
                buildCoordinateField(
                    coordinate,
                    startIndex + index
                )
        );

        embed.addFields(coordinateFields);
    }


    if (totalPages > 1) {
        const firstVisibleCoordinate = startIndex + 1;
        const lastVisibleCoordinate =
            startIndex + visibleCoordinates.length;

        embed.setFooter({
            text:
                `Showing ${firstVisibleCoordinate}-` +
                `${lastVisibleCoordinate} of ` +
                `${filteredCoordinates.length} coordinates • ` +
                `Page ${currentPage + 1}/${totalPages}`,
        });
    } else {
        const coordinateWord =
            filteredCoordinates.length === 1
                ? "coordinate"
                : "coordinates";

        embed.setFooter({
            text:
                `${filteredCoordinates.length} ` +
                `${coordinateWord} registered`,
        });
    }

   return embed;
}

function buildDimensionButtons(
    selectedDimensionKey,
    disableAll = false
) {
    const buttons = Object.entries(DIMENSIONS).map(
        ([dimensionKey, dimension]) => {
            return new ButtonBuilder()
                .setCustomId(`coordinates:${dimensionKey}`)
                .setLabel(dimension.label)
                .setStyle(dimension.buttonStyle)

                // Disable the selected dimension and, when requested, every button.
                .setDisabled(
                    disableAll ||
                    dimensionKey === selectedDimensionKey
                );
        }
    );

    return new ActionRowBuilder().addComponents(buttons);
}

function buildPaginationButtons(
    currentPage,
    totalPages,
    disableAll = false
) {
    const previousButton = new ButtonBuilder()
        .setCustomId("coordinates:pagination:previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableAll || currentPage === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId("coordinates:pagination:next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(
            disableAll ||
            currentPage >= totalPages - 1
        );

    return new ActionRowBuilder().addComponents(
        previousButton,
        nextButton
    );
}

function buildListComponents(
    allCoordinates,
    selectedDimensionKey,
    requestedPage,
    disableAll = false
) {
    const {
        currentPage,
        totalPages,
    } = getCoordinatePageData(
        allCoordinates,
        selectedDimensionKey,
        requestedPage
    );

    const components = [
        buildDimensionButtons(
            selectedDimensionKey,
            disableAll
        ),
    ];

    if (totalPages > 1) {
        components.push(
            buildPaginationButtons(
                currentPage,
                totalPages,
                disableAll
            )
        );
    }

    return components;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("list")
        .setDescription("Open the server coordinate list"),

    async execute(interaction) {
        // Coordinates are server-specific, so this command requires a guild.
        if (!interaction.inGuild()) {
            await interaction.reply({
                content:
                    "This command can only be used inside a server :/",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        // Acknowledge the command before loading data from the database.
        
        await interaction.deferReply();

        try {
            const coordinates = await prisma.cords.findMany({
                where: {
                    guildId: interaction.guildId,
                },

                orderBy: {
                    alias: "asc",
                },
            });

            let selectedDimension = default_dimension;
            let selectedPage = 0;

            
            const initialEmbed = buildCoordinatesEmbed(
                coordinates,
                selectedDimension,
                selectedPage
            );

            const initialComponents = buildListComponents(
                coordinates,
                selectedDimension,
                selectedPage
            );

            const responseMessage = await interaction.editReply({
                embeds: [initialEmbed],
                components: initialComponents,
            });

            const collector =
                responseMessage.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: collector_time,
                });

            collector.on(
                "collect",
                async (buttonInteraction) => {
                    try {
                        // Only the user who ran /list can control this message.
                        if (
                            buttonInteraction.user.id !==
                            interaction.user.id
                        ) {
                            await buttonInteraction.reply({
                                content:
                                    "This is not your list, please generate your own",
                                flags: MessageFlags.Ephemeral,
                            });

                            return;
                        }

                        // Ignore buttons that are not part of the coordinate browser.
                        if (
                            !buttonInteraction.customId.startsWith(
                                "coordinates:"
                            )
                        ) {
                            await buttonInteraction.reply({
                                content:
                                    "This button does not belong to the " +
                                    "coordinate browser.",
                                flags: MessageFlags.Ephemeral,
                            });

                            return;
                        }

                        const customIdParts =
                            buttonInteraction.customId.split(":");

                        if (customIdParts[1] === "pagination") {
                            const direction = customIdParts[2];
                            const pageData = getCoordinatePageData(
                                coordinates,
                                selectedDimension,
                                selectedPage
                            );

                            if (direction === "previous") {
                                selectedPage = Math.max(
                                    pageData.currentPage - 1,
                                    0
                                );
                            } else if (direction === "next") {
                                selectedPage = Math.min(
                                    pageData.currentPage + 1,
                                    pageData.totalPages - 1
                                );
                            } else {
                                await buttonInteraction.reply({
                                    content:
                                        "That page action is not valid",
                                    flags: MessageFlags.Ephemeral,
                                });

                                return;
                            }
                        } else {
                            const selectedKey = customIdParts[1];

                            // Validate custom IDs before using them as dimension keys.
                            if (!DIMENSIONS[selectedKey]) {
                                await buttonInteraction.reply({
                                    content:
                                        "That dimension is not valid",
                                    flags: MessageFlags.Ephemeral,
                                });

                                return;
                            }

                            selectedDimension = selectedKey;
                            selectedPage = 0;
                        }

                        const updatedEmbed =
                            buildCoordinatesEmbed(
                                coordinates,
                                selectedDimension,
                                selectedPage
                            );

                        const updatedComponents =
                            buildListComponents(
                                coordinates,
                                selectedDimension,
                                selectedPage
                            );

                        
                        await buttonInteraction.update({
                            embeds: [updatedEmbed],
                            components: updatedComponents,
                        });
                    } catch (error) {
                        console.error(
                            "Error updating embed and actions rows, try again please",
                            error
                        );

                        if (
                            !buttonInteraction.replied &&
                            !buttonInteraction.deferred
                        ) {
                            await buttonInteraction
                                .reply({
                                    content:
                                        "Something **else** went wrong while changing dimensions, please try again or contact our support server",
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(console.error);
                        }
                    }
                }
            );

        
            collector.on("end", async () => {
                try {
                    const disabledComponents =
                        buildListComponents(
                            coordinates,
                            selectedDimension,
                            selectedPage,
                            true
                        );

                    await responseMessage.edit({
                        components: disabledComponents,
                    });
                } catch (error) {

                    // The message or channel may no longer exist when the collector ends.
                    console.error(
                        "Could not disable coordinate buttons",
                        error
                    );
                }
            });
        } catch (error) {
            console.error(
                "Error executing the /list command",
                error
            );

            if (interaction.deferred || interaction.replied) {
                await interaction
                    .editReply({
                        content:
                            "I could not load the coordinates from the database.",
                        embeds: [],
                        components: [],
                    })
                    .catch(console.error);
            } else {
                
                await interaction
                    .reply({
                        content:
                            "I could not load the coordinates from the database (prisma was extra slow)",
                        flags: MessageFlags.Ephemeral,
                    })
                    .catch(console.error);
            }
        }
    },
};
