const { REST, Routes, PermissionFlagsBits} = require('discord.js');  //Cargar discordjs

const commands = [
    //Aquí hay que cargar las opciones de los slash commands, cuando vayamos teniendo alguno lo vamos rellenando.
]

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN); //Habbrá que revisar cómo cargamos el env

(async () => {
  try {
    console.log('Registrando comandos...'); //Onready para debug

  await rest.put(
    Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID //Importar los comandos de arriba al servidor de discord a partir del id del cliente y guild
  ),
  { body: commands }
);

    console.log('Comandos registrados correctamente'); //Check para debug
  } catch (error) {
    console.error(error);
  }
})(); 