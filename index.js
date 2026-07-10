const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');

// Render web services require an HTTP listener.
const http = require("node:http");

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

const fs = require("node:fs");
const path = require("node:path");


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ],
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandsFolders = fs.readdirSync(foldersPath);

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
            console.log("[WARNING] The command at ${filePath} is missing a required 'data' or 'execute' property.");
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    // Button collectors handle component interactions locally.
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command){
        console.error("No command has been found to have the name ${interaction.commandName}.")
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "There was an error while trying to execute this command :(",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
});

client.login(BOT_TOKEN);

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running.");
}).listen(PORT, "0.0.0.0", () => {
    console.log(`Health server listening on port ${PORT}`);
});
