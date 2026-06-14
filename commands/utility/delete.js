const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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

        const db = await prisma.derole.findFirst({
            where: {
                guildId: interaction.guildId,
            }
        });

        let clearance = false;

        const deletorRole = db?.DELETOR;

        if ((deletorRole === "admin")){
            if(interaction.member.permissions.has(PermissionFlagsBits.Administrator)){
                clearance = true
            }
            else {
                clearance = false
                await interaction.reply(
                {content: `You don't have permission to do this!`,
                ephemeral: true,}
                );
                return;
            }
        } else if (deletorRole === "custom") {
            const customRole = interaction.member.guild.roles.cache.find(role => role.name === "Nauta Admin");
            if (customRole && interaction.member.roles.cache.has(customRole.id)){
                clearance = true;
            } else {
            clearance = false;
            await interaction.reply(
                {content: `You don't have permission to do this!`,
                ephemeral: true,}
            );
            return;
            }
        } else {clearance = true}
        
        
        if (clearance){
            await interaction.reply(
                {content: `Deleting coordinates from ${aliasborrar}...`,
                ephemeral: true,}
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
                    {content: `Unable to delete coordinates.`,
                    ephemeral: true}
                );
            }
        }
    },
};