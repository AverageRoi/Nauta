# Nauta

Nauta is a Discord bot for saving and finding Minecraft locations without digging through old messages, screenshots, or coordinate channels.

**[Website](https://nautabot.netlify.app/)** · **[Add Nauta](https://discord.com/oauth2/authorize?client_id=1515786853356277820&permissions=274877958144&integration_type=0&scope=bot)**

## Why We Built It

Minecraft coordinates are **really** easy to lose.

You put a base in one channel, a farm in another, send someone a portal location, save a screenshot somewhere, and a week later nobody remembers where anything is. Pipo and I wanted a simple way to save locations directly from Discord and find them again without maintaining a spreadsheet or scrolling through old messages.

So we built Nauta.

The idea was pretty basic at first: give a coordinate a name, save it, and ask the bot for it later. Then we kept adding the things we actually wanted while using it.

## What Nauta Does

Nauta stores Minecraft locations for a Discord server.

A saved location can include coordinates, a name or alias, its dimension, and other information associated with the location. Users can find saved coordinates later, search for locations near them, and edit or delete information when they have the required permissions.

The main idea is that the coordinates belong to the server's shared collection rather than disappearing into one person's notes.

Some of the main functions include:

* saving Minecraft locations;
* finding a location by its saved name or alias;
* searching for nearby saved locations;
* working with Overworld, Nether, and End locations;
* editing and deleting saved coordinates with permission checks; and
* other coordinate-related utilities.

The full command documentation is available on the Nauta website.

## The Part I Found Most Interesting

The command I spent the most time thinking about was `/near-me`.

At first it sounds pretty easy. The user gives Nauta their current coordinates and the bot finds saved locations within a certain distance.

That works until dimensions get involved.

A saved location in the Nether cannot just be compared directly with Overworld coordinates because the two dimensions do not use the same coordinate scale. If a user is in the Overworld but also wants to know whether a saved Nether location is nearby, Nauta has to convert the coordinates before calculating the distance.

The command also accepts coordinates as either:

```text
X, Z
```

or:

```text
X, Y, Z
```

I did not want separate commands depending on whether the user cared about the Y coordinate. For nearby searches, the horizontal X/Z distance is what matters, so the input is validated and parsed before the bot compares it with stored locations.

In a simplified form:

```text
user coordinates
        |
        v
validate and parse X,Z or X,Y,Z
        |
        v
get the server's saved coordinates
        |
        +--> same dimension
        |        |
        |        v
        |   calculate distance
        |
        +--> target dimension
                 |
                 v
         convert coordinate scale
                 |
                 v
          calculate distance
        |
        v
show locations inside the selected range
```

This was one of those features where the command became much more interesting after trying to make it actually useful.

## How It Works

Nauta is built in JavaScript with `discord.js`.

Discord interactions are loaded into a command collection and routed to separate command modules. The bot uses Prisma with PostgreSQL for persistent data, so saved locations are not tied to a single running bot process.

A simplified view of the bot is:

```text
Discord slash command
        |
        v
index.js routes the interaction
        |
        v
command module
        |
        v
     Prisma
        |
        v
    PostgreSQL
```

Commands are kept in separate files instead of putting every interaction into one large event handler. They share the same stored coordinate data, which became increasingly important once locations could be added, searched, edited, deleted, and compared with each other.

## Project Structure

```text
Nauta/
├── commands/
│   └── utility/
├── prisma/
├── config.json
├── deploy-commands.js
├── index.js
├── package.json
└── LICENSE.md
```

### `index.js`

Starts the Discord client, connects to the database, loads command modules, and routes interactions to the correct command.

### `commands/utility/`

Contains Nauta's slash-command modules and their individual workflows.

### `prisma/`

Contains the database schema and Prisma-related files used for persistent storage.

### `deploy-commands.js`

Registers Nauta's application commands with Discord.

### `config.json`

Contains bot configuration used by the project.

## What I Learned From Building It

Nauta was one of the first projects where I had to think seriously about data surviving beyond a single bot session.

At the beginning, I tended to think about commands individually: make one command work, then move to the next one. That becomes harder when several commands are changing and reading the same information.

Once a coordinate could be saved, renamed, edited, deleted, searched for, and compared with coordinates in another dimension, the commands had to agree on what a location actually was and how its data should be stored.

I also learned that a feature that sounds simple can become mostly about edge cases. `/near-me` started as "calculate a distance." Most of the work ended up being input formats, dimension handling, filtering, and deciding what the user should actually see.

Nauta is definitely one of the projects where I learned by building first and then realizing why some structure was necessary.

## Who Built It

Nauta was co-developed by **Rodrigo Vélez (`AverageRoi`)** and **Pipo (`B-M198`)**.

We both worked across the bot, but Pipo focused more on database logic and calculations, while I focused more on Discord interactions and user-facing output.

Nauta also has a separate website repository for its public pages and documentation.

## Using Nauta

Nauta is intended to be used through the official hosted Discord bot.

The public source repository exists so the project and its development can be viewed, but the current Nauta terms do not grant permission to independently deploy or self-host the bot.

For commands, project information, and current documentation, see the Nauta website.

## Project Status

Nauta is a real project that grew while we were using and developing it.

Some parts of the code reflect that history more than others. The command structure and persistent storage were added as the bot became more complex, and there are still parts I would separate or clean up if I kept refactoring the original code.

The coordinate parsing and dimension logic are the first areas I would move into independent utilities and test separately. Right now, some of that logic still lives directly inside the command modules.

I would rather leave that visible than pretend Nauta was designed perfectly before we started building it.

## License and Terms

Use of Nauta is governed by the terms in [`LICENSE.md`](LICENSE.md).

Nauta is an independent project and is not affiliated with or endorsed by Discord, Mojang Studios, or Microsoft.
