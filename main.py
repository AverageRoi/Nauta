from __future__ import annotations

import os
import discord

def create_bot() -> discord.Bot:
    intents = discord.Intents.all()
    bot = discord.Bot(intents=intents)
    return bot

    async def _load_cogs():
        bot.load_extension("cogs.commands")

        # Ensure only in allowed guild
        allowed = 1487045117830369334
        if allowed:
            g = bot.get_guild(allowed)
            if g is None:
                print(f"Bot is only allowed in {allowed}. Shutting down.")
                await bot.close()
                return

        # Start keepalive server
        try:
            # start once
            if not getattr(bot, "_keepalive_started", False):
                bot._keepalive_started = True
                bot.loop.create_task(start_keepalive())
        except Exception:
            pass

if __name__ == "__main__":
    token = os.getenv("DISCORD_TOKEN")
    if not token:
        raise SystemExit("DISCORD_TOKEN environment variable is missing.")
    bot = create_bot()
    bot.run(token)