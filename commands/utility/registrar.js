//registrar.js
const { SlashCommandBuilder } = require("discord.js");
let prisma;

//Esto es solo para comprobar si existe alias. Se importa por otro lado la bdd.
const bdd = require("../../prisma/prisma.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("register")
        .setDescription("Save your coordinates.")
        .setDMPermission(false) //hago que sólo se pueda usar en servidores
        .addStringOption((option) => 
            option
                .setName("coordinates")
                .setDescription("X, Y, Z or X, Z")
                .setRequired(true)
                .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
            )
            // Creo que Str es lo mejor aunque sea un int, ya que es fácil liarnos y podemos dividirlo y hacer typecasting después
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
            if (!prisma) {
                prisma = require('../../prisma/prisma.js');
            }
        
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

        let clearance = false;

        const registratorRole = db?.REGISTRATOR;

        if ((registratorRole === "admin")){
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
        } else if (registratorRole === "custom") {
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

        const listacoords = await bdd.cords.findMany({ //Esto es solo para comprobar si existe alias. Se importa por otro lado la bdd.
            where: {
                guildId: interaction.guildId,
            },
            orderBy: {
                alias: "asc",
            }
        });

        // Declaro las variables, me acabo de enterar de que las variables declaradas dentro de ifs no persisten,
        // pero los valores asignados dentro de ifs si.

        let x_coordinates;
        let y_coordinates;
        let z_coordinates;

        // True if the coordinate has weird values we don't accept
        const Has_not_numeric_characters = /[^0-9,\-\s]/.test(coordinates);
        const coordinates_untrimmed = coordinates.split(",")

        // Para ver si no han introducido los datos necesarios
        if (listacoords.some(coord => coord.alias === alias)){
            await interaction.reply( {content: "That alias is already in use.", ephemeral: true });
            return
        } else if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.reply( {content: "Please enter at least X and Z coordinates", ephemeral: true });
            return
        }
        else if (Has_not_numeric_characters) {
            await interaction.reply( {content: "Please enter numeric values separated by commas", ephemeral: true });
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

        console.log(interaction.options.data);

        // Aquí iría la conexión con el prisma.js y todas esas cosiñas ~ Se aprecia el galego ahí :3
        if (clearance===true){
            try{
                await interaction.reply(
                {content: `Registering coordinates...`,
                ephemeral: true,}
                );
                await prisma.cords.create({ //he cambiado upsert a create porque no es necesario actualizar
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
                await interaction.reply({content: "Your coordinates have been recorded!", ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "Error guardando las coordenadas.",
                    ephemeral: true,
                });
            }
        }
    },
};