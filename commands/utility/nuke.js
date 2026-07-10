const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require("discord.js");

const prisma = require("../../prisma/prisma.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Delete all saved coordinates from this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      await interaction.reply({
        content: "You don't have permission to do this!",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const cancelButton = new ButtonBuilder()
      .setCustomId("nuke_cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const confirmButton = new ButtonBuilder()
      .setCustomId("nuke_confirm")
      .setLabel("Delete all coordinates")
      .setStyle(ButtonStyle.Danger);

    const confirmationRow = new ActionRowBuilder().addComponents(
      cancelButton,
      confirmButton
    );

    await interaction.reply({
      content:
        "**Delete all saved coordinates?**\n\nThis cannot be undone.",
      components: [confirmationRow],
      flags: MessageFlags.Ephemeral,
    });

    const confirmationMessage = await interaction.fetchReply();

    const collector =
      confirmationMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (buttonInteraction) =>
          buttonInteraction.user.id === interaction.user.id &&
          ["nuke_cancel", "nuke_confirm"].includes(
            buttonInteraction.customId
          ),
        time: 30_000,
        max: 1,
      });

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "nuke_cancel") {
        await buttonInteraction.update({
          content: "Coordinate deletion cancelled.",
          components: [],
        });

        return;
      }

      await buttonInteraction.update({
        content: "Deleting all saved coordinates...",
        components: [],
      });

      try {
        const result = await prisma.cords.deleteMany({
          where: {
            guildId: interaction.guildId,
          },
        });

        if (result.count === 0) {
          await interaction.editReply({
            content: "No coordinates are stored for this server.",
            components: [],
          });

          return;
        }

        await interaction.editReply({
          content: `Deleted ${result.count} saved coordinate${
            result.count === 1 ? "" : "s"
          }.`,
          components: [],
        });
      } catch (error) {
        console.error("Unable to delete coordinates:", error);

        await interaction.editReply({
          content: "Unable to delete coordinates.",
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size > 0) {
        return;
      }

      await interaction
        .editReply({
          content: "Deletion cancelled: confirmation timed out.",
          components: [],
        })
        .catch(() => null);
    });
  },
};