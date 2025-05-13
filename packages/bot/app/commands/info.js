import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition } from "../utils.js";
import { getScoutToken } from "../db/scoutData/scoutService.js";

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Show your toon's name, laff, and location.")
  .setIntegrationTypes(1)
  .setContexts([0, 1, 2])
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("(Optional) Get the specified user's toon info.")
      .setRequired(false),
  );

export async function execute(req, res, target) {
  const item = await getScoutToken(target);
  const toon = item.data;
  const embed = new EmbedBuilder()
    .setColor("Greyple")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setThumbnail(getToonRendition(toon, "waving"))
    .addFields(
      { name: "Laff", value: simplifyLaff(toon) },
      { name: "Location", value: simplifyLocation(toon) },
    )
    .setTimestamp(item.modified);

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}

function simplifyLaff(toon) {
  return `${toon.laff.current}/${toon.laff.max}`;
}

function simplifyLocation(toon) {
  const loc = toon.location;
  let msg = `${loc.district}, ${loc.zone}`;
  if (loc.zone !== loc.neighborhood) {
    msg += `, ${loc.neighborhood}`;
  }
  return msg;
}
