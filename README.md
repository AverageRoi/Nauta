# Nauta

**Shared spatial lookup for Minecraft communities. Save, search, and find locations across dimensions directly from Discord.**

Nauta turns a Discord server's scattered Minecraft coordinates into a persistent, searchable location system.

Instead of bases, farms, portals, shops, and other locations disappearing into old messages, screenshots, or personal notes, Nauta stores them as shared server data and makes them available through Discord commands.

Its most distinctive feature is proximity search: Nauta can find saved locations near a player's current position and account for coordinate differences between Minecraft dimensions.

> **Status:** Live · actively deployed  
> **Runtime:** Render  
> **Interface:** Discord slash commands  
> **Stack:** JavaScript · discord.js · Prisma · PostgreSQL  
> **Focus:** Shared spatial data · proximity search · cross-dimensional coordinates

[Website](https://nautabot.netlify.app/) · [Add Nauta](https://discord.com/oauth2/authorize?client_id=1515786853356277820&permissions=274877958144&integration_type=0&scope=bot)

---

## The problem

Minecraft coordinates are easy to save and surprisingly easy to lose.

A base gets posted in one channel. A farm is buried in an old message. Someone sends a Nether portal location privately. Another player keeps important coordinates in a screenshot.

Eventually, the server has plenty of location information but no single place to retrieve it.

Nauta treats locations as **shared server data** instead.

A coordinate can be saved once and then found later by anyone with access to that server's collection.

---

# What Nauta does

Nauta provides a persistent location layer for Minecraft servers using Discord as the interface.

### Location storage

Saved locations can contain:

- a name or alias;
- X / Y / Z coordinates;
- Minecraft dimension;
- and associated location information.

Locations belong to the Discord server's shared collection rather than to a single user's notes.

### Search and retrieval

Users can retrieve saved locations by name or alias without searching through old messages.

### Nearby-location search

Given a player's current coordinates, Nauta can search the server's saved locations and return those within a selected distance.

### Cross-dimensional lookup

Nauta understands that Minecraft dimensions do not always share the same coordinate scale.

When a search crosses between the **Overworld and Nether**, Nauta converts the relevant coordinates before calculating proximity.

### Multi-dimensional storage

Locations can be stored for:

- Overworld;
- Nether;
- End.

### Controlled editing

Saved locations can be edited or deleted through permission-aware commands rather than allowing every user to alter shared data.

---

# `/near-me`

The feature that best represents Nauta is `/near-me`.

At first, the problem sounds simple:

> Given the player's position, find saved locations nearby.

For a single dimension, that mostly means calculating distance.

Across dimensions, it becomes a spatial-conversion problem.

A Nether location cannot be compared directly against an Overworld position because the two dimensions use different coordinate scales.

Nauta therefore separates the search into two paths:

```text
Player coordinates
        │
        ▼
Parse X,Z or X,Y,Z
        │
        ▼
Load saved server locations
        │
        ├──────── Same dimension
        │               │
        │               ▼
        │        Calculate distance
        │
        └──────── Target dimension
                        │
                        ▼
                Convert coordinate scale
                        │
                        ▼
                 Calculate distance
        │
        ▼
Return locations inside the requested range
