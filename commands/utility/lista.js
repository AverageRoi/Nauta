const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lista")
        .setDescription("Abrir lista de coordenadas"),
    async execute(interaction) {
        //Importamos el script de la bdd
        let prisma
        if (!prisma){
            prisma = require('../../prisma/prisma.js')
        }

        const dicciodatos = prisma.findMany({ //findUnique - findMany (se entiende lo que hacen)
            guildId: interaction.guildId //busca todos los datos asociados al servidor de la interacción
        });

        await interaction.reply("Imagina que esto fuese una lista de coordenadas."); //Ejemplo, sólo quiero cargar la base de datos jsjsjs
        console.log(dicciodatos) //suelta todos los datos en la consola
    },
};