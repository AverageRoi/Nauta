const { SlashCommandBuilder} = require("discord.js")
const prisma = require("../../prisma/prisma.js") //Bah ya sabes esto no lo comento jsjsj

module.exports = {
    data: new SlashCommandBuilder() //Todo el slash command está hecho rápido para que funcione, igual no está bien en plan front
        .setName("near-me")
        .setDescription("Search the nearest saved coordinates relative to your position")
        .setDMPermission(false) //hago que sólo se pueda usar en servidores
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
            ) //Ehhh sí, los comentarios por aquí son tuyos porque hay un poco de copia-pega
            // Creo que Str es lo mejor aunque sea un int, ya que es fácil liarnos y podemos dividirlo y hacer typecasting después
        .addStringOption((option) => 
            option
                .setName("dimension")
                .setDescription("Dimension of the coordinates")
                .setRequired(true)
                .setChoices(
                    { name: "Overworld", value: "overworld_dimension" },
                    { name: "Nether", value: "nether_dimension" },
                    { name: "End", value: "end_dimension" },
                    { name: "Overworld/Nether", value: "all_dimension" },
                )
            )
        .addNumberOption((option) =>
            option
                .setName("distancia")
                .setDescription("Search coordinates within a ___ block range (500 by default)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10000)
        ),
    
    async execute(interaction){
        const coordinates = interaction.options.getString("coordinates");
        const dimension = interaction.options.getString("dimension");
        const interaction_user = interaction.user.id;  //Lo mismo, copia-pega en algunas partes
        const maxdist = interaction.options.getNumber("distancia") ?? 500;

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

        x_coordinates = parseFloat(x_coordinates); //Trabajo con las coordenadas en float porque me es más fácil, luego habría que volver a pasarlas a string pero bueno
        y_coordinates = parseFloat(y_coordinates);
        z_coordinates = parseFloat(z_coordinates);

        //Importar base de datos del servidor
        const dbcords = await prisma.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },

            // Order alphabetically
            orderBy: {
                alias: "asc",
            },
        });

        //filtrar por dimensión
        const filteredCoordinates = dbcords.filter((coordinate) => {
            if (dimension === "all_dimension") {
                return coordinate.dimension === "overworld_dimension" || coordinate.dimension === "nether_dimension";
            }
            return coordinate.dimension === dimension;
        });

        console.log("Filtered:", filteredCoordinates);

        const nearCords = filteredCoordinates.filter((coordinate) => {
            const db_x = parseFloat(coordinate.x_coordinates);
            const db_z = parseFloat(coordinate.z_coordinates);


            const dist = Math.sqrt((x_coordinates - db_x) ** 2 + (z_coordinates - db_z) ** 2);

            // Lo que hago es sacar de los valores con dimensión nether, multiplico la coordenada de la base de datos por ocho, para que esté en formato overworld. No tengo claro si tiene sentido.
            return dist <= maxdist;
        });
        
        console.log('Final:', nearCords); //Sí, falta que discord haga algo con esta info, pero tengo que comer jshdjsjh 

        const estavariablesellamafoca = String(nearCords.y_coordinates) ?? "?" //protección para la y cuando no está y esas cosiñas

        const finalEmbed = `${nearCords.alias}: ${nearCords.x_coordinates}, ${estavariablesellamafoca}, ${nearCords.z_coordinates}`
    
        await interaction.reply({content: finalEmbed})
    }
}

//Cómo se me puede dar tan mal comentar código? Lo siento. :sad: