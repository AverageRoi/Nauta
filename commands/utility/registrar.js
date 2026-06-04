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

        // Aquí iría la conexión con el prisma.js y todas esas cosiñas ~ Se aprecia el galego ahí :3
        try{
            await prisma.guildConfig.upsert({ //upsert -> si hay valor, sustituye; si no hay, crea
                where: {
                    guildId: interaction.guildId //cargamos el servidor para poder expandir en un futuro
                },
                update: {
                    coordinates, //guardamos dos valores: coordinates y dimension
                    dimension,
                },
                create: {
                    guildId: interaction.guildId, // o los creamos, por eso del upsert
                    coordinates,
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