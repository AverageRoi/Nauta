const { SlashCommandBuilder} = require("discord.js")
const{ prisma } = require("../../cords_bot/prisma/prisma.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("near-me")
        .setDescription(" Busca cosas cerca de ti")
        .setDMPermission(false) //hago que sólo se pueda usar en servidores
        .addStringOption((option) => 
            option
                .setName("coordenadas")
                .setDescription("X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
            )
            // Creo que Str es lo mejor aunque sea un int, ya que es fácil liarnos y podemos dividirlo y hacer typecasting después
        .addStringOption((option) => 
            option
                .setName("dimension")
                .setDescription("La dimensión de las coordenadas")
                .setRequired(true)
                .setChoices(
                    { name: "Overworld", value: "overworld_dimension" },
                    { name: "Nether", value: "nether_dimension" },
                    { name: "End", value: "end_dimension" },
                    { name: "Overworld/Nether", value: "all_dimension"},
                )
            ),
    
    async execute(interaction){
        const coordinates = interaction.options.getString("coordenadas");
        const dimension = interaction.options.getString("dimension");
        const interaction_user = interaction.user.id;

        // Declaro las variables, me acabo de enterar de que las variables declaradas dentro de ifs no persisten,
        // pero los valores asignados dentro de ifs si.

        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // True if the coordinate has weird values we don't accept
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

        Float(x_coordinates);
        Float(x_coordinates);
        Float(x_coordinates);

        const dbcords = await prisma.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },

            // Order alphabetically
            orderBy: {
                alias: "asc",
            },
        });

        const filteredCoordinates = dbcords.filter(
        (coordinate) =>
            coordinate.dimension === dimension.databaseValue
        );

        console.log(filteredCoordinates);

        const nearCords = filteredCoordinates.filter((coordinate) => {
            const db_x = parseFloat(coordinate.x_coordinates);
            const db_z = parseFloat(coordinate.z_coordinates);
            
            const dist = Math.sqrt(
                (x_coordinates - db_x) ** 2 + (z_coordiantes - db_z) ** 2
            );

            return dist <= 500;
        });
        
        console.log(nearCords)

    }
}