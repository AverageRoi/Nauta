const {
    Client,
    GatewayIntentBits,
    Collection
} = require('discord.js'); //cargar discord js

const fs = require('fs'); //librería fs (manejar archivos, usado en cargar carpetas o archvios json por ejemplo)

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] //Intents de discord

});

// Cargar comandos
const commandFiles = fs
  .readdirSync('./commands') 
  .filter(file => file.endsWith('.js')); //Cargar los comandos a partir de sus archivos dle tipo: "nombreComando.js"

for (const file of commandFiles) {

  const command =
    require(`./commands/${file}`); //Importar el archivo del comando

  client.commands.set(
    command.data.name,
    command //importar el nombre del comando
  );

}

// Evento ready
client.once('clientReady', () => {

  console.log(
    `Conectado como ${client.user.tag}` //Pequeño aviso on_ready.
  );
});

//Falta poner lo de: client.login(process.env.TOKEN); ... Pero aún no sé cómo vamos a cargar el env :)