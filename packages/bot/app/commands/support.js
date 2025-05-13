import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";

export const data = new SlashCommandBuilder()
  .setName("support")
  .setDescription("Get a link to our support server.")
  .setIntegrationTypes(1)
  .setContexts([0, 1, 2]);

export async function execute(req, res, target) {
  const invite = "https://discord.gg/Qb929SrdRP";

  const embed = new EmbedBuilder()
    .setColor("LuminousVividPink")
    .setTitle("Support Server")
    .setDescription(
      `Need help or have feedback? Come speak with us on our [support server](${invite})!`,
    );

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}
