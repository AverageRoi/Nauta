# Nauta

**Nauta — navigate your Minecraft world.**

A live Discord bot for Minecraft communities to save important locations, find them again later, and see what useful places are nearby.

Instead of coordinates disappearing into old messages, screenshots, spreadsheets, or someone's private notes, Nauta keeps them in one shared collection for the server.

**[Add Nauta to your server](https://discord.com/oauth2/authorize?client_id=1515786853356277820&permissions=274877958144&integration_type=0&scope=bot)** · **[Visit the website](https://nautabot.netlify.app/)**

| | |
| --- | --- |
| **Status** | Live · actively deployed |
| **Hosting** | Render |
| **Interface** | Discord slash commands |
| **Stack** | JavaScript · discord.js · Prisma · PostgreSQL |
| **Built for** | Shared Minecraft locations · nearby search · dimension-aware coordinates |

---

## Why we built it

Minecraft coordinates are really easy to lose.

A base gets posted in one channel. Someone sends a farm location a week later. A Nether portal ends up in a screenshot. Eventually the server has plenty of useful coordinates, but nobody knows where to find them.

Pipo and I wanted something simpler:

> **Save a useful place once, then let the server find it again whenever someone needs it.**

That became Nauta.

What started as a basic coordinate-saving bot gradually grew into a shared location system with persistent storage, aliases, permissions, nearby searches, and support for different Minecraft dimensions.

---

## What Nauta does

### Save locations for the whole server

Nauta keeps a shared collection of Minecraft locations rather than tying coordinates to one person's notes.

A saved location can include its:

- name or alias;
- coordinates;
- Minecraft dimension;
- and other information associated with the location.

Once saved, the location remains available to the server through Discord.

### Find places again

Players can retrieve locations by their saved name or alias instead of scrolling through old conversations.

This works well for things such as:

- bases;
- farms;
- portals;
- shops;
- community builds;
- resource areas;
- meeting points;
- and other places worth remembering.

### Find what is nearby

Nauta can also start with the player's current position instead of a location name.

Using `/near-me`, a player can give Nauta their coordinates and ask which saved locations are within a selected distance.

### Work with different dimensions

Locations can be stored in the:

- **Overworld**
- **Nether**
- **End**

Nauta keeps the dimension with each location so identical-looking coordinates in different dimensions are not treated as the same place.

For searches between the Overworld and Nether, it also accounts for the difference in coordinate scale before comparing distances.

### Keep shared data under control

Because these locations belong to the server rather than one person, Nauta also includes permission-aware editing and deletion.

That lets communities maintain a shared collection without making every saved location freely editable by everyone.

---

# `/near-me`

`/near-me` is probably the feature that best represents how Nauta grew beyond the original idea.

At first, it sounds simple:

> Give the bot your coordinates and return saved places within a certain distance.

For locations in the same dimension, that is mostly a distance calculation.

Then dimensions get involved.

A Nether location cannot be compared directly with an Overworld position because Minecraft uses a different coordinate scale between the two.

Nauta handles that before calculating the distance.

```text
Player coordinates
       │
       ▼
Parse X,Z or X,Y,Z
       │
       ▼
Load the server's saved locations
       │
       ├──────── Same dimension
       │              │
       │              ▼
       │       Compare distance
       │
       └──────── Target dimension
                      │
                      ▼
              Convert coordinates
                      │
                      ▼
               Compare distance
       │
       ▼
Return locations inside the selected range
