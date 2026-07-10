const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const prisma = require('../../prisma/prisma.js');

const bdd = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Save your coordinates.")
        .setDMPermission(false)
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26),
            )
        .addStringOption((option) => 
            option
                .setName("dimension")
                .setDescription("Your coordinates' dimension")
                .setRequired(true)
                .setChoices(
                    { name: "Overworld", value: "overworld_dimension" },
                    { name: "Nether", value: "nether_dimension" },
                    { name: "End", value: "end_dimension" }
                )
            )
        .addStringOption((option) =>
            option
                .setName("alias")
                .setDescription("Alias to be associated to those coordinates (e.g. end portal)")
                .setRequired(true)
                .setMaxLength(100)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const coordinates = interaction.options.getString("coordinates");
        const dimension = interaction.options.getString("dimension");
        const alias = interaction.options.getString("alias");
        const interaction_user = interaction.user.id;

        const db = await prisma.regrole.findFirst({
            where: {
                guildId: interaction.guildId,
            }
        });

        console.log(db)

        let clearance = true;

        const registratorRole = db?.REGISTRATOR;

        if ((registratorRole === "admin")){
            if(interaction.member.permissions.has(PermissionFlagsBits.Administrator)){
                clearance = true
            }
            else {
                clearance = false
                await interaction.editReply(
                {content: `You don't have permission to do this!`,
                ephemeral: true,}
                );
                return;
            }
        } else if (registratorRole === "custom") {
            const customRole = interaction.member.guild.roles.cache.find(role => role.name === "Nauta Admin");
            if (customRole && interaction.member.roles.cache.has(customRole.id)){
                clearance = true;
            } else {
                clearance = false;
                await interaction.editReply(
                    {content: `You don't have permission to do this!`,
                    ephemeral: true,}
                );
                return;
            }
        } else {clearance = true}

        const listacoords = await bdd.cords.findMany({
            where: {
                guildId: interaction.guildId,
            },
            orderBy: {
                alias: "asc",
            }
        });

        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // Reject values that are not numbers, commas, minus signs, or spaces.
        const Has_not_numeric_characters = /[^0-9,\-\s]/.test(coordinates);
        const coordinates_untrimmed = coordinates.split(",")

        if (listacoords.some(coord => coord.alias === alias)){
            await interaction.editReply( {content: "That alias is already in use.", ephemeral: true });
            return
        } else if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.editReply( {content: "Please enter at least X and Z coordinates", ephemeral: true });
            return
        }
        else if (Has_not_numeric_characters) {
            await interaction.editReply( {content: "Please enter numeric values separated by commas", ephemeral: true });
            return
        }
        else if (!coordinates_untrimmed[2]) {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = null
            z_coordinates = coordinates_untrimmed[1].trim()
        }
        else {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = coordinates_untrimmed[1].trim()
            z_coordinates = coordinates_untrimmed[2].trim()
        }

        console.log(interaction.options.data);

        if (clearance===true){
            try{
                await interaction.editReply(
                {content: `Registering coordinates...`,
                ephemeral: true,}
                );
                await prisma.cords.create({
                    data: {
                        guildId: interaction.guildId,
                        interaction_user,
                        alias,
                        x_coordinates,
                        y_coordinates,
                        z_coordinates,
                        dimension,
                    }
                });
                await interaction.editReply({content: "Your coordinates have been recorded!", ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.editReply({
                    content: "Error saving coordinates.",
                    ephemeral: true,
                });
            }
        }
    },
};
