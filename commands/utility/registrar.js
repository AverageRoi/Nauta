const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("registrar")
    .setDescription("Introduce las coordenadas para registrar'")
    .addStringOption((option) => 
        option
            .setName("coordenadas")
            .setDescription("X, Y, Z or X, Z")
            .setRequired(true)
            .setMaxLength(26), // Lo que he contado como las coordenadas más alejadas del World Border en caracteres
        )
        // Creo que Str es lo mejor aunque sea un int, ya que es fácil liarnos y podemos dividirlo y hacer typecasting después
    .addStringOption((option) => 
        option
            .setName("dimension")
            .setDescription("La dimensión de las coordenadas")
            .setRequired(true)
            .setChoices(
                { name: "Overworld", value: "overworld_dimension" },
                { name: "Nether", value: "nether_dimension" },
                { name: "End", value: "end_dimension" }
            )
        ),

    async execute(interaction) {
        const coordinates_from_user = interaction.options.getString("coordenadas");
        const dimension = interaction.options.getString("dimension");

        const coordinates_untrimmed = coordinates_from_user.split(",")

        // Declaro las variables, me acabo de enterar de que las variables declaradas dentro de ifs no persisten,
        // pero los valores asignados dentro de ifs si.

        let x_coordinates;
        let y_coordinates;
        let z_coordinates

        // Para ver si no han introducido los datos necesarios
        if (!coordinates_untrimmed[0] || !coordinates_untrimmed[1])  {
            await interaction.reply( {content: "Please enter at least X and Y coordinates", flags: MessageFlags.Ephemeral });
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

        // Aquí iría la conexión con el prisma.js y todas esas cosiñas
        
        
        await interaction.reply( {content: "Your coordinates have been recorded!", flags: MessageFlags.Ephemeral });
    },
};