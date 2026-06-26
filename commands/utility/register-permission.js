const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const prisma = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register-permission")
        .setDescription("Set permissions for registering coordinates.")
        .addStringOption((option) => 
            option
                .setName("rol")
                .setDescription("Rol able to register coordinates.")
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
        
        let customrole = interaction.guild.roles.cache.find(role => role.name === 'Nauta Admin');
        if (!customrole && interaction.options.getString("rol") === "custom"){
            customrole = await interaction.guild.roles.create({
                name: 'Nauta Admin',
                color: 0x7950c0,
                reason: 'Role created to manage and delete coordinates stored in Nauta Bot.'
            });
        };

        await prisma.regrole.upsert({
            where: {guildId: interaction.guildId},
            update: {REGISTRATOR: interaction.options.getString("rol")},
            create: {guildId: interaction.guildId, REGISTRATOR: interaction.options.getString("rol")},
        })

        interaction.editReply(`Permissions adjusted for ${interaction.options.getString("rol")} to be Nauta admins.`);
    },
};