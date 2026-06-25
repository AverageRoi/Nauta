const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const prisma = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-permission")
        .setDescription("Set permissions for deleting coordinates.")
        .addStringOption((option) => 
            option
                .setName("rol")
                .setDescription("Rol able to delete coordinates.")
                .setRequired(true)
                .addChoices(
                    { name: "Administrator roles", value: "admin" },
                    { name: 'Custom "Nauta admin" role. ', value: "custom" },
                    { name: "Everyone", value: "everyone" }
                )
            )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        let customrole = interaction.guild.roles.cache.get('Nauta Admin');
        if (!customrole && interaction.options.getString("rol") === "custom"){
            customrole = await interaction.guild.roles.create({
                name: 'Nauta Admin',
                color: 0x7950c0,
                reason: 'Role created to manage and delete coordinates stored in Nauta Bot.'
            });
        };

        await prisma.derole.upsert({
            where: {guildId: interaction.guildId},
            update: {DELETOR: interaction.options.getString("rol")},
            create: {guildId: interaction.guildId, DELETOR: interaction.options.getString("rol")},
        })

        interaction.editReply(`Permissions adjusted for ${interaction.options.getString("rol")} to be Nauta admins.`);
    },
};