import os
import discord

from __future__ import annotations

from discord.ext import commands

intents = discord.Intents.all()

class Commands_Basic (commands.Cog):
    def __init__(self, bot: discord.Bot):
        self.bot=bot

        @discord.slash.command(name="ping", description="Porfa funciona :)")
        async def ping(self, ctx: discord.ApplicationsContext):
            await ctx.respond("Pong :D")
        @discord.slash.command(name="who?", description="Otro test de ctx...")
        async def who(self, ctx: discord.ApplicationsContext):
            await ctx.respond(ctx.author)
        



def setup (bot: discord.Bot):
    bot.add_cog(Commands_Basic(bot))