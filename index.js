// Código que inicial que dice la guía para el setup (un poco cambiado)
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');

// Se consigue el token por una environmental variable
const BOT_TOKEN = process.env.BOT_TOKEN;

// Create a new client instance (con todos los intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
// Log in to Discord with your client's token
client.login(BOT_TOKEN);