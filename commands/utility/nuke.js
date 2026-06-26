const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const prisma = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete")
        .setDescription("Delete all info from this server coordinates (this is irreversible)."),

    async execute(interaction) {

        if(interaction.member.permissions.has(PermissionFlagsBits.Administrator)){
            await interaction.reply(
                {content: `Deleting coordinates from this server...`,
                ephemeral: true,}
            );
            try {
                const result = await prisma.cords.deleteMany({
                    where: {
                        guildId: interaction.guildId,
                    }})
                if (result.count === 0){
                    await interaction.editReply(
                        `No coordinates stored by this server.`
                    );
                    return;
                }
                await interaction.editReply(
                    `All coordinates deleted.`
                );
            }
            catch (error) {
                console.error('Error: ', error)
                await interaction.editReply(
                    {content: `Unable to delete coordinates.`,
                    ephemeral: true}
                );
            }
        } else {
            await interaction.reply("You don't have permission to do this!")
        }
    },
};