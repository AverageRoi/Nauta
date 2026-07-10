//index.js
// Código que inicial que dice la guía para el setup (un poco cambiado)

// Require the necessary discord.js classes (para el cliente, comandos y todo eso)
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

// Como somos un web service (no vamos a pagar por un bg worker), necesitamos un puerto,
// por lo que empezamos con requerir el server
// Render web services require an HTTP listener.
const http = require("node:http");

// Se consigue el token por una environmental variable
const BOT_TOKEN = process.env.BOT_TOKEN;

// Command handler (para no tener que hacer una larga cadena de if elifs si hay muchos comandos)
const fs = require("node:fs");
const path = require("node:path");


// Create a new client instance (con todos los intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ],
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Colección de comandos para que pueda acceder a los archivos .js de los comandos y otros archivos
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandsFolders = fs.readdirSync(foldersPath);

// El workflow para fetch todo los commandos que terminan en .js de commands. Cada archivo tiene dos propiedades,
// data (info del comando) y execute (comportamiento). Si falta alguna te avisa, pero vamos, se basa todo en una colección.
// Load command modules into a Discord collection keyed by command name.
for (const folder of commandsFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.`);
        }
    }
}

// Listener para cada vez que alguien utilice un comando (Discord crea un event que nosotros escuchamos y respondemos)
client.on(Events.InteractionCreate, async interaction => {
    // Si hay otro tipo de interacción, digamos un componente de un mensaje, no se registra en la consola.
    // Se puede quitar en el futuro si necesitamos respuestas como comandos sin que sean slash commands.
    // Button collectors handle component interactions locally.
    if (!interaction.isChatInputCommand()) return;

    // Si es un comando, comprueba la interacción y si el comando existe en nuetra colección, si la interacción no funciona
    // por lo que sea, entonces da un error con mensaje efímero.
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command){
        console.error(`No command has been found to have the name ${interaction.commandName}.`)
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
    console.error(error);

    const errorMessage = {
        content: "There was an error while trying to execute this command :(",
        flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
    } else {
        await interaction.reply(errorMessage);
    }
    }

// Log in to Discord with your client's token
client.login(BOT_TOKEN);

// Render nos da el puerto, pero si no tenemos un fallback a 10000
const PORT = process.env.PORT || 10000;

// Creamos el http server y lo anunciamos en la consola
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running.");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Health server listening on port ${PORT}`);
}); });
