const { SlashCommandBuilder } = require("discord.js");
const prisma = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete all info from an alias")
        .addStringOption((option) =>
            option
                .setName("alias")
                .setDescription("Alias to be associated to those coordinates (e.g. end portal)")
                .setRequired(true)
                .setMaxLength(100)
        ),

    async execute(interaction) {
        const aliasborrar = interaction.options.getString("alias");

        await interaction.reply(
            `Deleting coordinates from ${aliasborrar}...`,
        );
        try {
            const result = await prisma.cords.deleteMany({
                where: {
                    guildId: interaction.guildId,
                    alias: aliasborrar,
                }})
            if (result.count === 0){
                await interaction.editReply(
                    `No coordinates under "${aliasborrar}".`
                );
                return;
            }
            await interaction.editReply(
                `"${aliasborrar}" deleted.`
            );
        }
        catch (error) {
            console.error('Error: ', error)
            await interaction.editReply(
                `Unable to delete coordinates.`,
            );
        }
    },
};