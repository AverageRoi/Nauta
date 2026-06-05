//registrar.js
const { SlashCommandBuilder } = require("discord.js");
let prisma;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("registrar")
        .setDescription("Introduce las coordenadas para registrar")
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
                    { name: "End", value: "end_dimension" }
                )
            ),

    async execute(interaction) {
            if (!prisma) {
                prisma = require('../../prisma/prisma.js');
            }
        
        const coordinates = interaction.options.getString("coordenadas");
        const dimension = interaction.options.getString("dimension");

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

 
        // Aquí iría la conexión con el prisma.js y todas esas cosiñas ~ Se aprecia el galego ahí :3
        try{
            await prisma.cords.upsert({ //upsert -> si hay valor, sustituye; si no hay, crea
                where: {
                    guildId: interaction.guildId //cargamos el servidor para poder expandir en un futuro
                },
                update: {
                    x_coordinates,
                    y_coordinates,
                    z_coordinates, //guardamos dos valores: coordinates y dimension
                    dimension,
                },
                create: {
                    guildId: interaction.guildId, // o los creamos, por eso del upsert
                    x_coordinates,
                    y_coordinates,
                    z_coordinates,
                    dimension,
                }
            });
            await interaction.reply({content: "Your coordinates have been recorded!", ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "Error guardando las coordenadas.",
                ephemeral: true,
            });
        }
    },
};