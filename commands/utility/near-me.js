const { SlashCommandBuilder, EmbedBuilder} = require("discord.js")
const prisma = require("../../prisma/prisma.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("near-me")
        .setDescription("Search the nearest saved coordinates relative to your position")
        .setDMPermission(false)
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("Your current location in X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26),
            )
        .addStringOption((option) => 
            option
                .setName("dimension")
                .setDescription("Dimension of your coordinates")
                .setRequired(true)
                .setChoices(
                    { name: "Overworld", value: "overworld_dimension" },
                    { name: "Nether", value: "nether_dimension" },
                    { name: "End", value: "end_dimension" },
                )
            )
        .addStringOption((option) =>
            option
                .setName("target")
                .setDescription("Choose any other dimension to check for coordinates (apart from current)")
                .setChoices(
                    {name: "Include Nether (you are in the Overworld)", value: "nether_dimension"},
                    {name: "Include Overworld (you are in the Nether)", value: "overworld_dimension"}
                )
        )
        .addNumberOption((option) =>
            option
                .setName("distance")
                .setDescription("Search coordinates within a certain block range (500 by default)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10000)
        ),
    
    async execute(interaction){
        const coordinates = interaction.options.getString("coordinates");
        const dimension = interaction.options.getString("dimension");
        const target = interaction.options.getString("target")
        const maxdist = interaction.options.getNumber("distance") ?? 500;

        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // Reject values that are not numbers, commas, minus signs, or spaces.
        const Has_not_numeric_characters = /[^0-9,\-\s]/.test(coordinates);
        const coordinates_untrimmed = coordinates.split(",")

        if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.reply( {content: "Please enter at least X and Z coordinates", ephemeral: true });
            return
        }
        else if (Has_not_numeric_characters) {
            await interaction.reply( {content: "Please enter numeric values separated by commas", ephemeral: true });
            return
        }
        else if (!coordinates_untrimmed[2]) {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = null
            z_coordinates = coordinates_untrimmed[1].trim()
        }
        else {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = coordinates_untrimmed[1].trim()
            z_coordinates = coordinates_untrimmed[2].trim()
        }

        x_coordinates = parseFloat(x_coordinates);
        y_coordinates = parseFloat(y_coordinates);
        z_coordinates = parseFloat(z_coordinates);

        const dbcords = await prisma.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },

            orderBy: {
                alias: "asc",
            },
        });

        const filteredCoordinates = dbcords.filter((coordinate) => {
            return coordinate.dimension === dimension;
        });

        const filteredTargetCoordinates = dbcords.filter((coordinate) => {
            return coordinate.dimension === target;
        })

        const nearCords = filteredCoordinates.filter((coordinate) => {
            const db_x = parseFloat(coordinate.x_coordinates);
            const db_z = parseFloat(coordinate.z_coordinates);

            const dist = Math.sqrt((x_coordinates - db_x) ** 2 + (z_coordinates - db_z) ** 2);

            return dist <= maxdist;
        });
        
        const nearTargetCords = filteredTargetCoordinates.filter((coordinate) => {
            const x = parseFloat(coordinate.x_coordinates);
            const z = parseFloat(coordinate.z_coordinates);

            // Convert target coordinates into the current dimension scale before measuring distance.
            const factor = target === "nether_dimension" ? 8 : 1 / 8;

            const targetdist = Math.sqrt(
                (x_coordinates - x * factor) ** 2 +
                (z_coordinates - z * factor) ** 2
            );
            
            return targetdist <= maxdist;
        });

        const dimensionNames = {
            overworld_dimension: "Overworld",
            nether_dimension: "Nether",
            end_dimension: "End",
        };

        const getDimName = (dim) => dimensionNames[dim] ?? dim;

        const embed = new EmbedBuilder()
            .setColor(0x36eb51)
            .setTitle("Nearby Coordinates")
            .setDescription(
                `Showing coordinates within **${maxdist} blocks** of your location`
            )
            .setTimestamp();

        if (nearCords.length > 0) {
            embed.addFields({
                name: getDimName(dimension),
                value: nearCords
                    .map(coord => {
                        const y = coord.y_coordinates ?? "?";

                        return (
                            `**${coord.alias}**\n` +
                            `\`${coord.x_coordinates}, ${y}, ${coord.z_coordinates}\``
                        );
                    })
                    .join("\n\n"),
                inline: false,
            });
        }

        if (target && nearTargetCords.length > 0) {
            embed.addFields({
                name: dimensionNames[target],
                value: nearTargetCords
                    .map(coord => {
                        const y = coord.y_coordinates ?? "?";

                        return (
                            `**${coord.alias}**\n` +
                            `\`${coord.x_coordinates}, ${y}, ${coord.z_coordinates}\``
                        );
                    })
                    .join("\n\n"),
                inline: false,
            });
        }

        if (
            nearCords.length === 0 &&
            (!target || nearTargetCords.length === 0)
        ) {
            embed.setDescription(
                `No coordinates were found within **${maxdist} blocks**.`
            );
        }

        await interaction.reply({
            embeds: [embed],
        });
    }
}
