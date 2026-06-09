const { SlashCommandBuilder} = require("discord.js")
const prisma = require("../../prisma/prisma.js") //Bah ya sabes esto no lo comento jsjsj

module.exports = {
    data: new SlashCommandBuilder() //Todo el slash command está hecho rápido para que funcione, igual no está bien en plan front
        .setName("near-me")
        .setDescription(" Busca cosas cerca de ti")
        .setDMPermission(false) //hago que sólo se pueda usar en servidores
        .addStringOption((option) => 
            option
                .setName("coordenadas")
                .setDescription("X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
            ) //Ehhh sí, los comentarios por aquí son tuyos porque hay un poco de copia-pega
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
        const interaction_user = interaction.user.id;  //Lo mismo, copia-pega en algunas partes

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

        x_coordinates = parseFloat(x_coordinates);
        y_coordinates = parseFloat(y_coordinates);
        z_coordinates = parseFloat(z_coordinates);

        //IMportar base de datos del servidor
        const dbcords = await prisma.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },

            // Order alphabetically
            orderBy: {
                alias: "asc",
            },
        });

        //filtrar pro dimensión
        const filteredCoordinates = dbcords.filter((coordinate) => {
            if (dimension === "all_dimension") {
                return coordinate.dimension === "overworld_dimension" || coordinate.dimension === "nether_dimension";
            }
            return coordinate.dimension === dimension;
        });

        console.log(filteredCoordinates);
        //Filtrar por cercanía de 500 bloques, se puede ampliar reducir cambiadno el número señalado
        const nearCords = filteredCoordinates.filter((coordinate) => {
            const db_x = parseFloat(coordinate.x_coordinates);
            const db_z = parseFloat(coordinate.z_coordinates);
            
            const dist = Math.sqrt(
                (x_coordinates - db_x) ** 2 + (z_coordinates - db_z) ** 2
            );

            return dist <= 500; //Este número
        });
        
        console.log(nearCords) //Sí, falta que discord haga algo con esta info, pero tengo que comer jshdjsjh 

    }
}

//Cómo se me puede dar tan mal comentar código? Lo siento. :sad: