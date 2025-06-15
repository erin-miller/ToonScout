import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { FlowerCalculator } from "toonapi-calculator";
import { getToonRendition } from "../util/cmds.js";
import { getScoutToken } from "../util/api.js";
import { getCombo } from "./flowers.js";

export const data = new SlashCommandBuilder()
  .setName("garden")
  .setDescription("Get gardening advice and view your stats.")
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("(Optional) Get the specified user's toon info.")
      .setRequired(false)
  );

export async function execute(req, res, target) {
  const item = await getScoutToken(target);
  const toon = item.data;
  const calc = new FlowerCalculator(JSON.stringify(toon.flowers));
  const days = calc.getDaysToUpgrade();
  const comboLevel = calc.getComboLevel();

  let desc;
  if (days === null) {
    desc = "You've maxed your shovel! Congratulations!";
  } else {
    desc = `**${days}** days until next shovel upgrade!\n\nPlant the flowers below to gain experience.`;
  }

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle("Gardening")
    .setDescription(desc)
    .addFields(getCombo(toon.flowers, comboLevel))
    .setFooter({
      text: `${toon.flowers.shovel.name} • ${toon.flowers.wateringCan.name}`,
    })
    .setTimestamp(item.modified);

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}
