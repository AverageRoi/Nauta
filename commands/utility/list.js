const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

const prisma = require("../../prisma/prisma.js");

const DIMENSIONS = {

    overworld: {
        databaseValue: "overworld_dimension",
        label: "Overworld",
        color: 0x3986ed,
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

// The default dimension
const default_dimension = "overworld";

// Discord can only show up to 25 fields per embed page, we'll improve this later
const max_visible_coordinates = 25;

// Buttons will remain active for 10 min max
const collector_time = 10 * 60 * 1000;

// Parsing:
function truncateText(value, maximumLength) {
    const text = String(value ?? "");

    if (text.length <= maximumLength) {
        return text;
    }

    // One character available for ellipsis (just in case)
    return `${text.slice(0, maximumLength - 1)}…`;
}

    function buildCoordinateField(coordinate, index) {
    // If alias in null, undefined, or weird stuff happens, we change it to the next one
        const alias =
        coordinate.alias?.trim() ||
        `Coordinate ${index + 1}`;

    // If x or z coordinates are missing, we indicate it (should NOT happen normally)
    const x = String(coordinate.x_coordinates ?? "?");
    const z = String(coordinate.z_coordinates ?? "?");

    let fieldValue = `**X:** \`${x}\`\n`;

    if (coordinate.y_coordinates !== null) {
        const y = String(coordinate.y_coordinates);
        fieldValue += `**Y:** \`${y}\`\n`;
    }

    fieldValue += `**Z:** \`${z}\``;

    // We also make it be within Discord embed limits
    return {
        name: truncateText(alias, 256),
        value: truncateText(fieldValue, 1024),
        inline: true,
    };
}

// EMBED BUILDER TIME (YAY)

function buildCoordinatesEmbed(allCoordinates, selectedDimensionKey) {

    // Fallback to Overworld if somehow smt weird reaches this
    const dimension = 
        DIMENSIONS[selectedDimensionKey] ??
        DIMENSIONS[default_dimension];

    // Filter the arrays Prisma returns, so dbb and Discord values can relate to each other
    const filteredCoordinates = allCoordinates.filter(
        (coordinate) =>
            coordinate.dimension === dimension.databaseValue
    );

    // For now, we'll only show 25 coordinates per dimension
    const visibleCoordinates = filteredCoordinates.slice(
        0,
        max_visible_coordinates
    );

    const embed = new EmbedBuilder()
        .setColor(dimension.color)
        .setTitle(
            `${dimension.label} coordinates`
        )
        .setDescription(dimension.description)
        .setTimestamp()
        .setThumbnail(dimension.thumbnail);

    // Now, we have to deal with empty states
    if (visibleCoordinates.length === 0) {
        embed.addFields({
            name: "No coordinates found",
            value:
                `There are currently no coordinates registered for ` +
                `**${dimension.label}** in this server.`,
            inline: false,
        });
    } else {
        // Convert each Prisma record into an embed field.
        const coordinateFields = visibleCoordinates.map(
            (coordinate, index) =>
                buildCoordinateField(coordinate, index)
        );

        embed.addFields(coordinateFields);
    }


     // Explain when some records have been hidden because of the 25 field limit.

    if (filteredCoordinates.length > max_visible_coordinates) {
        embed.setFooter({
            text:
                `Showing ${max_visible_coordinates} of ` +
                `${filteredCoordinates.length} coordinates`,
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

// ACTION ROW BUILDER

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

                // We'll also disable the currently selected dimension so the user
                // cannot repeatedly click a button that would change nothing.
                // When disableAll is true, every button is disabled.
                .setDisabled(
                    disableAll ||
                    dimensionKey === selectedDimensionKey
                );
        }
    );

    return new ActionRowBuilder().addComponents(buttons);
}

// Now what we've all been waiting for: COMMAND EXPORT

module.exports = {
    data: new SlashCommandBuilder()
        .setName("list")
        .setDescription("Open the server coordinate list"),

    async execute(interaction) {
        // We disable it in DMs
        if (!interaction.inGuild()) {
            await interaction.reply({
                content:
                    "This command can only be used inside a server :/",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        // We need to acknowledge the slash command immediately.
        // So that the database operation has time to finish without
        // Discord displaying "The application did not respond."
        
        await interaction.deferReply();

        try {
            // This is what Gpt says, I think it's called coordinates
            const coordinates = await prisma.cords.findMany({
                where: {
                    guildId: interaction.guildId,
                },

                // Order alphabetically
                orderBy: {
                    alias: "asc",
                },
            });

            let selectedDimension = default_dimension;

            
            // Build the initial Overworld interface.
            const initialEmbed = buildCoordinatesEmbed(
                coordinates,
                selectedDimension
            );

            const initialButtonRow = buildDimensionButtons(
                selectedDimension
            );

            // editReply() replaces the deferred "thinking" response.
            // It also returns the Message object, which lets us attach
            // a component collector directly to this specific message.

            const responseMessage = await interaction.editReply({
                embeds: [initialEmbed],
                components: [initialButtonRow],
            });

            // Create a collector for button interactions attached to
            // this particular response message.

            const collector =
                responseMessage.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: collector_time,
                });

            // Runs every time one of the buttons is clicked.
            collector.on(
                "collect",
                async (buttonInteraction) => {
                    try {
                        // Only the person who ran /list can control this
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

                        // Verify that this button belongs to this feature. (GPT insisted on this feature, it's "safe programming", bleh)
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

                        // Extract the dimension key. "coordinates:nether" becomes "nether".

                        const selectedKey =
                            buttonInteraction.customId.split(":")[1];

                        // Do not trust a custom ID without validating it
                        if (!DIMENSIONS[selectedKey]) {
                            await buttonInteraction.reply({
                                content:
                                    "That dimension is not valid",
                                flags: MessageFlags.Ephemeral,
                            });

                            return;
                        }

                        // Update the interface state.
                        selectedDimension = selectedKey;

                        // Build a completely new embed and button row
                        // using the newly selected dimension.
                        const updatedEmbed =
                            buildCoordinatesEmbed(
                                coordinates,
                                selectedDimension
                            );

                        const updatedButtonRow =
                            buildDimensionButtons(
                                selectedDimension
                            );

                        
                        // update() acknowledges the button interaction and edits the message containing the button.
                        
                        // The bot therefore updates the same message
                        // instead of sending a new message every time.
                        
                        await buttonInteraction.update({
                            embeds: [updatedEmbed],
                            components: [updatedButtonRow],
                        });
                    } catch (error) {
                        console.error(
                            "Error updating embed and actions rows, try again please",
                            error
                        );

                        // If the button has not already been acknowledged, we send the user a private error response.
                        if (
                            !buttonInteraction.replied &&
                            !buttonInteraction.deferred
                        ) {
                            await buttonInteraction
                                .reply({
                                    content:
                                        "Something else went wrong while changing dimensions, please try again",
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(console.error);
                        }
                    }
                }
            );

        
            // Runs after the collector reaches its time limit.
            collector.on("end", async () => {
                try {
                     // Rebuild the row with disableAll set to true. Prevents further interactions from failing.
                    const disabledButtonRow =
                        buildDimensionButtons(
                            selectedDimension,
                            true
                        );

                    await responseMessage.edit({
                        components: [disabledButtonRow],
                    });
                } catch (error) {

                    // Editing can fail if the message or channel was delted before collector ended.
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

            // Because deferReply() already acknowledged the interaction,
            // editReply() must be used instead of reply().
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
                
                // This branch is just in case. Under normal circumstances,
                // deferReply() already happened before the Prisma query.
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