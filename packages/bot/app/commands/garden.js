import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { FlowerCalculator } from "toonapi-calculator";
import { getScoutToken } from "../db/scoutData/scoutService.js";
import { getToonRendition } from "../utils.js";

const itos = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
};

const FLOWER_INDEX = {
  red: "<:red:1302446974074749013>",
  gray: "<:gray:1302446966114095174>",
  violet: "<:violet:1302446956898942996>",
  aqua: "<:aqua:1302446947424014356>",
  yellow: "<:yellow:1302446926079197236>",
  pink: "<:pink:1302446915421732974>",
  blue: "<:blue:1302446881619841024>",
  orange: "<:orange:1302446873138823258>",
  green: "<:green:1302446863923810465>",
  cyan: "<:cyan:1302446947424014356>",
};

export const data = new SlashCommandBuilder()
  .setName("garden")
  .setDescription("Get flower jellybean combinations.")
  .setIntegrationTypes(1)
  .setContexts([0, 1, 2])
  .addIntegerOption((option) =>
    option
      .setName("combo")
      .setDescription(
        "(1-8) What number jellybean combination are you looking for?",
      )
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(8),
  );

export async function execute(req, res, target) {
  const item = await getScoutToken(target);

  const choice = req.body.data.options.find(
    (option) => option.name === "combo",
  ).value;

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [getBeanEmbed(item, choice)],
    },
  });
}

function getBeanEmbed(item, choice) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Green")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle(`${itos[choice]}-Jellybean Flowers`)
    .addFields(getCombo(toon.flowers, choice));
}

function getCombo(toon, choice) {
  const calc = new FlowerCalculator(JSON.stringify(toon));
  const flowers = calc.getCombo(choice);
  const combo = flowers.map(([name, beans]) => ({
    name: name,
    value: beans.map((bean) => getEmote(bean)).join(" "),
  }));
  return combo;
}

function getEmote(color) {
  return FLOWER_INDEX[color] || color;
}
