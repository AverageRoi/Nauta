const { SlashCommandBuilder, EmbedBuilder} = require("discord.js")
//Bah ya sabes esto no lo comento jsjsj
const prisma = require("../../prisma/prisma.js")

module.exports = {
    //Todo el slash command está hecho rápido para que funcione, igual no está bien en plan front
    data: new SlashCommandBuilder()
        .setName("near-me")
        .setDescription("Search the nearest saved coordinates relative to your position")
        //hago que sólo se pueda usar en servidores
        .setDMPermission(false)
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("Your current location in X, Y, Z or X, Z")
                .setRequired(true)
                // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
                .setMaxLength(26),
            )
            // Creo que Str es lo mejor aunque sea un int, ya que es fácil liarnos y podemos dividirlo y hacer typecasting después
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

        // Declaro las variables, me acabo de enterar de que las variables declaradas dentro de ifs no persisten,
        // pero los valores asignados dentro de ifs si.
        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // Reject values that are not numbers, commas, minus signs, or spaces.
        const Has_not_numeric_characters = /[^0-9,\-\s]/.test(coordinates);
        const coordinates_untrimmed = coordinates.split(",")

        // Para ver si no han introducido los datos necesarios
        if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.reply( {content: "Please enter at least X and Z coordinates", ephemeral: true });
            return
        }
        else if (Has_not_numeric_characters) {
            await interaction.reply( {content: "Please enter numeric values separated by commas", ephemeral: true });
            return
        }
        // Para ver si sólo hay x e y
        else if (!coordinates_untrimmed[2]) {
            x_coordinates = coordinates_untrimmed[0].trim()
            // Sólo por si acaso
            y_coordinates = null
            z_coordinates = coordinates_untrimmed[1].trim()
        }
        else {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = coordinates_untrimmed[1].trim()
            z_coordinates = coordinates_untrimmed[2].trim()
        }

        //Trabajo con las coordenadas en float porque me es más fácil, luego habría que volver a pasarlas a string pero bueno
        x_coordinates = parseFloat(x_coordinates);
        y_coordinates = parseFloat(y_coordinates);
        z_coordinates = parseFloat(z_coordinates);

        //Importar base de datos del servidor
        const dbcords = await prisma.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },

            orderBy: {
                alias: "asc",
            },
        });

        //filtrar por dimensión
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

            // Lo que hago es sacar de los valores con dimensión nether, multiplico la coordenada de la base de datos por ocho, para que esté en formato overworld.
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
