const { SlashCommandBuilder, Client } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("server").setDescription("Provides info about the server"),
    async execute(interaction) {
        await interaction.reply(
            `You are in ${interaction.guild.name}. \n \n However... I am immense. I am now in **${interaction.client.guilds.cache.size} servers**. \n You are derisory in comparison. Do not further bother in trying.`,
        );
    },
};