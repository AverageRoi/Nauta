const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

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
                    { name: "Administor roles", value: "admin" },
                    { name: 'Custom "Nauta admin" role. ', value: "custom" },
                    { name: "Everyone", value: "everyone" }
                )
            )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        if (interaction.options.getString("rol") === "custom"){
            const customrole = await interaction.guild.roles.create({
                name: 'Nauta Admin',
                color: 0x7950c0,
                reason: 'Role created to manage and delete coordinates stored in Nauta Bot.'
            });
        }
        
    },
};