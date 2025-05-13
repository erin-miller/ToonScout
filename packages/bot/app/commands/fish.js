import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { FishCalculator } from "toonapi-calculator";
import { getToonRendition } from "../utils.js";
import { getScoutToken } from "../db/scoutData/scoutService.js";

const fisherman =
  "https://static.toontownrewritten.wiki/uploads/e/eb/Crocodile_fishing.png";
const bucket = "https://i.imgur.com/jpy0keb.png";
const teleport = "https://scouttoon.info/images/teleport.png";
const fish = [
  "https://scouttoon.info/fish/amoreeel.png",
  "https://scouttoon.info/fish/balloonfish.png",
  "https://scouttoon.info/fish/bearacuda.png",
  "https://scouttoon.info/fish/catfish.png",
  "https://scouttoon.info/fish/clownfish.png",
  "https://scouttoon.info/fish/cuttthroat.png",
  "https://scouttoon.info/fish/devilray.png",
  "https://scouttoon.info/fish/dog.png",
  "https://scouttoon.info/fish/frozenfish.png",
  "https://scouttoon.info/fish/jellyfish.png",
  "https://scouttoon.info/fish/kingcrab.png",
  "https://scouttoon.info/fish/moonfish.png",
  "https://scouttoon.info/fish/nurseshark.png",
  "https://scouttoon.info/fish/pianofish.png",
  "https://scouttoon.info/fish/poolshark.png",
  "https://scouttoon.info/fish/seahorse.png",
  "https://scouttoon.info/fish/starfish.png",
];
let footer = "";

export const data = new SlashCommandBuilder()
  .setName("fish")
  .setDescription("Get advising on catching new fish.")
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
  footer = getFooter(item.data);
  const row = new ActionRowBuilder().addComponents(
    getWhatButton(target),
    getWhereButton(target),
  );

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [getHomeEmbed(item)],
      components: [row],
    },
  });
}

export async function handleButton(req, customId) {
  let embed;
  let row;
  let target;
  let state;

  const parts = customId.split(":");
  const action = parts[0];

  if (parts.length === 3) {
    state = parts[1];
    target = parts[2];
  } else {
    state = null;
    target = parts[1];
  }

  const item = await getScoutToken(target);

  switch (action) {
    case "fish-refresh":
      switch (state) {
        case "what":
          embed = getWhatEmbed(item);
          row = getWhatRow(target);
          break;
        case "where":
          embed = getWhereEmbed(item);
          row = getWhereRow(target);
          break;
        default:
          return;
      }
      break;
    case "fish-where":
      embed = getWhereEmbed(item);
      row = getWhereRow(target);
      break;
    case "fish-what":
      embed = getWhatEmbed(item);
      row = getWhatRow(target);
      break;
    case "fish-home":
      embed = getHomeEmbed(item);
      row = getHomeRow(target);
      break;
    default:
      return;
  }

  return { embed, row };
}

function getHomeEmbed(item) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Blue")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle("Welcome to the Fish Advisor!")
    .setDescription(`You have caught **${getFishCount(toon.fish)}**!`)
    .setImage(fisherman)
    .addFields(
      { name: "What?", value: "Find what new fish are easiest to catch!" },
      {
        name: "Where?",
        value:
          "Find what locations give you the best\nchance at catching a new fish!",
      },
    )
    .setFooter(footer)
    .setTimestamp(item.modified);
}

function getWhereEmbed(item) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Blue")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle("Where should I go?")
    .setThumbnail(teleport)
    .setDescription(getFishInfo(toon.fish, "where"))
    .setFooter(footer)
    .setTimestamp(item.modified);
}

function getWhatEmbed(item) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Blue")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle("What should I catch?")
    .setThumbnail(getRandomFish())
    .setDescription(getFishInfo(toon.fish, "what"))
    .setFooter(footer)
    .setTimestamp(item.modified);
}

function getFooter(toon) {
  return {
    text: `You are 90% likely to catch in\nthe number of confident buckets.\n${getFishCount(toon.fish)}`,
    iconURL: bucket,
  };
}

function getFishCount(toon) {
  const fishcalc = new FishCalculator(JSON.stringify(toon));
  const catchable = fishcalc.getCatchable().length;
  const caught = fishcalc.getCaught().length;
  return `${caught}/${catchable} fish`;
}

function getWhereButton(target) {
  return new ButtonBuilder()
    .setCustomId(`fish-where:${target}`)
    .setLabel("Where?")
    .setStyle("Secondary");
}

function getWhatButton(target) {
  return new ButtonBuilder()
    .setCustomId(`fish-what:${target}`)
    .setLabel("What?")
    .setStyle("Secondary");
}

function getHomeButton(target) {
  return new ButtonBuilder()
    .setCustomId(`fish-home:${target}`)
    .setLabel("Home")
    .setStyle("Primary");
}

function getRefreshButton(type, target) {
  return new ButtonBuilder()
    .setCustomId(`fish-refresh:${type}:${target}`)
    .setLabel("Refresh")
    .setStyle("Danger");
}

function getHomeRow(target) {
  return new ActionRowBuilder().addComponents(
    getWhatButton(target),
    getWhereButton(target),
  );
}

function getWhatRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("what", target),
    getHomeButton(target),
    getWhereButton(target),
  );
}

function getWhereRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("where", target),
    getHomeButton(target),
    getWhatButton(target),
  );
}

function getRandomFish() {
  const random = Math.floor(Math.random() * fish.length);
  return fish[random];
}

function getFishInfo(toon, type) {
  const fishcalc = new FishCalculator(JSON.stringify(toon));
  let topFive;

  if (fishcalc.getNew().length === 0) {
    return `You have maxed fishing. Congratulations!`;
  }

  if (type === "where") {
    topFive = fishcalc
      .sortBestLocation()
      .filter(
        ([
          _,
          {
            total,
            buckets: { confBuckets },
          },
        ]) => total > 0 && confBuckets > 0,
      ) // Skip 0 values
      .slice(0, 5)
      .map(
        (
          [
            location,
            {
              total,
              buckets: { confBuckets, avgBuckets },
            },
          ],
          index,
        ) =>
          `**${index + 1}. ${location} (${(total * 100).toFixed(2)}%)**` +
          `Confident Buckets: ${confBuckets}\n` +
          `Average Buckets: ${avgBuckets}`,
      )
      .join("\n\n"); // Single line space between entries

    return topFive || "No suitable fishing locations found.";
  }

  if (type === "what") {
    topFive = fishcalc
      .sortBestRarity()
      .filter((fish) => fish.probability > 0 && fish.buckets.confBuckets > 0) // Skip 0 values
      .slice(0, 5)
      .map(
        (fish, index) =>
          `**${index + 1}. ${fish.name} (${(fish.probability * 100).toFixed(2)}%)**` +
          `Location: ${fish.location}\n` +
          `Confident Buckets: ${fish.buckets.confBuckets}\n` +
          `Average Buckets: ${fish.buckets.avgBuckets}`,
      )
      .join("\n\n"); // Single line space between entries

    return topFive || "No suitable fish available.";
  }
}
