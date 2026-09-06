# Nauta

**Save Minecraft locations once. Find them when your server actually needs them.**

Nauta is a live Discord bot for Minecraft communities to keep a shared collection of important locations, search them later, and find useful places near a player's current position.

Instead of coordinates disappearing into old messages, screenshots, spreadsheets, or someone's private notes, Nauta keeps them available to the whole server.

**[Add Nauta to your server](https://discord.com/oauth2/authorize?client_id=1515786853356277820&integration_type=0&permissions=274877958144&scope=bot)** · **[Visit the website](https://nautabot.netlify.app/)**

| | |
| --- | --- |
| **Status** | Live · actively deployed |
| **Hosting** | Render |
| **Stack** | JavaScript · discord.js · Prisma · PostgreSQL |
| **Interface** | Discord slash commands |
| **Built for** | Shared locations · nearby searches · Minecraft dimensions |

---

## Why Nauta exists

Minecraft coordinates are useful until nobody remembers where they were posted.

A base ends up in one channel, a farm in another, and a Nether portal in someone's screenshot. Pipo and I wanted a simple way for a server to save locations once and find them again without maintaining a separate spreadsheet or searching through Discord history.

That became Nauta.

---

## What Nauta does

A server can use Nauta to maintain shared locations such as:

- bases;
- farms;
- portals;
- shops;
- community builds;
- resource areas;
- meeting points;
- and other places worth keeping.

Saved locations can include a **name or alias, coordinates, dimension, and associated information**.

Nauta supports:

- saving and retrieving locations;
- finding locations by name or alias;
- searching for nearby saved places;
- Overworld, Nether, and End locations;
- Overworld/Nether coordinate conversion for relevant searches;
- editing and deleting locations with permission checks;
- and other coordinate-related utilities.

Full command documentation is available on the **[Nauta website](https://nautabot.netlify.app/)**.

---

## `/near-me`

`/near-me` is the feature that best shows what Nauta does beyond simply storing coordinates.

A player provides their current position, and Nauta searches the server's saved locations for places within the chosen range.

```text
Player coordinates
       │
       ▼
Parse X,Z or X,Y,Z
       │
       ▼
Load saved server locations
       │
       ├── Same dimension ──→ calculate distance
       │
       └── Other supported dimension
                    │
                    ▼
             convert coordinates
                    │
                    ▼
              calculate distance
       │
       ▼
Return nearby locations
```

The command accepts either:

```text
X, Z
```

or:

```text
X, Y, Z
```

For nearby searches, the horizontal X/Z distance is what matters, so users do not need to provide an unnecessary Y coordinate.

The Overworld and Nether also use different coordinate scales. When a search crosses between them, Nauta accounts for that before comparing distances.

So Nauta can answer not only:

> **Where did we save that farm?**

but also:

> **What useful places have we saved near where I am?**

---

## Persistent shared data

Nauta uses **Prisma with PostgreSQL**.

Saved locations therefore survive bot restarts and deployments and can be used by several different commands over time.

```text
Discord
   │
   ▼
discord.js
   │
   ▼
Command modules
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

A saved location can later be found, compared, edited, renamed, or deleted while every command works with the same underlying data.

---

## How it is built

Nauta separates Discord interactions into command modules rather than placing every workflow in one event handler.

| Area | Role |
| --- | --- |
| **`index.js`** | Starts the client, connects to the database, loads commands and routes interactions |
| **`commands/utility/`** | Individual slash-command workflows |
| **`prisma/`** | Persistent data model and Prisma files |
| **`deploy-commands.js`** | Registers application commands with Discord |
| **`config.json`** | Bot configuration |

The bot is currently hosted on **Render** with PostgreSQL-backed persistent storage.

---

## How the project grew

Nauta started with a simple idea: give a coordinate a name, save it, and retrieve it later.

Once several commands needed to read and modify the same locations, the project needed shared persistent storage. Nearby searches added coordinate parsing and distance calculations; cross-dimensional searches added coordinate conversion.

The project grew around making the original idea more useful rather than around adding unrelated features.

---

## Built by

Nauta was co-developed by:

- **Rodrigo Vélez (`AverageRoi`)**
- **Pipo (`B-M198`)**

We both worked across the project. Pipo focused more heavily on **database logic and calculations**, while I focused more heavily on **Discord interactions and user-facing behaviour**.

Nauta also has a separate repository for its public website and documentation.

---

## Scope and usage

Nauta is deliberately focused. It is not an in-game mod, world-map renderer, or Minecraft server plugin.

Its job is simpler:

> **Give a Minecraft community one shared place for useful coordinates and make those places easy to find again from Discord.**

The source is public so the project and its development can be inspected. The official hosted bot is the intended way to use Nauta; the current project terms do not grant permission to independently deploy or self-host it.

See [`LICENSE.md`](LICENSE.md) for the applicable terms.

Nauta is an independent project and is not affiliated with or endorsed by Discord, Mojang Studios, or Microsoft.

---

## Current status

**Live and actively maintained.**

**[Add Nauta to your server](https://discord.com/oauth2/authorize?client_id=1515786853356277820&integration_type=0&permissions=274877958144&scope=bot)** · **[Visit Nauta](https://nautabot.netlify.app/)**
