const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-permission")
        .setDescription("Set permissions for deleting coordinates.")
        .addStringOption((option) => 
            option
                .setName("rol")
                .setDescription("Rol able to delete coordinates.")
                .setRequired(true)
                .setChoices(
                    { name: "Administor roles", value: "admin" },
                    { name: 'Custom "Nauta admin" role. ', value: "custom" },
                    { name: "Everyone", value: "everyone" }
                )
                .setDefaultMemberPermissions("0x0000000000000008")
            ),
    async execute(interaction) {
        if (interaction.getStringOption("rol") === "custom"){
            const customrole = await interaction.guild.roles.create({
                name: 'Nauta Admin',
                color: 0x7950c0,
                reason: 'Role created to manage and delete coordinates stored in Nauta Bot.'
            });
        }
        
    },
};