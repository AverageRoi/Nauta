const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const prisma = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("edit")
        .setDescription("Edit coordinates associated with an alias.")
        .addStringOption((option) =>
            option
                .setName("alias")
                .setDescription("Alias associated to those coordinates (e.g. end portal)")
                .setRequired(true)
                .setMaxLength(100)
        )
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("New coordinates: X, Y, Z or X, Z.")
                .setRequired(true)
                .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
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
        ),

    async execute(interaction) {
        const aliasborrar = interaction.options.getString("alias");

        const coordinates = interaction.options.getString("coordinates");
        const dimension = interaction.options.getString("dimension");
        const interaction_user = interaction.user.id;

        const db = await prisma.derole.findFirst({
            where: {
                guildId: interaction.guildId,
            }
        });

        const listacoords = await prisma.cords.findMany({ //Esto es solo para comprobar si existe alias. Se importa por otro lado la bdd.
            where: {
                guildId: interaction.guildId,
            },
            orderBy: {
                alias: "asc",
            }
        });

        console.log(db)

        let clearance = true;

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
        
        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // True if the coordinate has weird values we don't accept
        const Has_not_numeric_characters = /[^0-9,\-\s]/.test(coordinates);
        const coordinates_untrimmed = coordinates.split(",")

        // Para ver si no han introducido los datos necesarios
        if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.editReply( {content: "Please enter at least X and Z coordinates", ephemeral: true });
            return
        }
        else if (Has_not_numeric_characters) {
            await interaction.editReply( {content: "Please enter numeric values separated by commas", ephemeral: true });
            return
        }
        // Para ver si sólo hay x e y
        else if (!coordinates_untrimmed[2]) {
            x_coordinates = coordinates_untrimmed[0].trim()
            // Sólo por si acaso
            y_coordinates = null
            z_coordinates = coordinates_untrimmed[1].trim()
        }
        else {
            x_coordinates = coordinates_untrimmed[0].trim()
            y_coordinates = coordinates_untrimmed[1].trim()
            z_coordinates = coordinates_untrimmed[2].trim()
        }

        if (clearance){
            await interaction.reply(
                {content: `Editing coordinates from ${aliasborrar}...`,
                ephemeral: true,}
            );
            try {
                const result = await prisma.cords.updateMany({
                    where: {
                        guildId: interaction.guildId,
                        alias: aliasborrar,
                    },
                    data: {
                        x_coordinates,
                        y_coordinates,
                        z_coordinates,
                        dimension,
                    },
                })
                if (result.count === 0){
                    await interaction.editReply(
                        `No coordinates under "${aliasborrar}".`
                    );
                    return;
                }
                await interaction.editReply(
                    `"${aliasborrar}" edited.`
                );
            }
            catch (error) {
                console.error('Error: ', error)
                await interaction.editReply(
                    {content: `Unable to edit coordinates.`,
                    ephemeral: true}
                );
            }
        } else {
            await interaction.reply("You don't have permission to do this!")
        }
    },
};