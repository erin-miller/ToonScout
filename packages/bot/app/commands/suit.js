import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition } from "../utils.js";
import { SuitsCalculator } from "toonapi-calculator";
import { getScoutToken } from "../db/scoutData/scoutService.js";

const levels = {
  s: {
    "Cold Caller": 5,
    Telemarketer: 6,
    "Name Dropper": 7,
    "Glad Hander": 8,
    "Mover & Shaker": 9,
    "Two-Face": 10,
    "The Mingler": 11,
    "Mr. Hollywood": 50,
  },
  m: {
    "Short Change": 5,
    "Penny Pincher": 6,
    Tightwad: 7,
    "Bean Counter": 8,
    "Number Cruncher": 9,
    "Money Bags": 10,
    "Loan Shark": 11,
    "Robber Baron": 50,
  },
  l: {
    "Bottom Feeder": 5,
    Bloodsucker: 6,
    "Double Talker": 7,
    "Ambulance Chaser": 8,
    "Back Stabber": 9,
    "Spin Doctor": 10,
    "Legal Eagle": 11,
    "Big Wig": 50,
  },
  c: {
    Flunky: 5,
    "Pencil Pusher": 6,
    Yesman: 7,
    Micromanager: 8,
    Downsizer: 9,
    "Head Hunter": 10,
    "Corporate Raider": 11,
    "The Big Cheese": 50,
  },
};

const gear = "https://scouttoon.info/images/coggear.png";
const sellIcon = "https://scouttoon.info/images/emblem_sell.png";
const cashIcon = "https://scouttoon.info/images/emblem_cash.png";
const lawIcon = "https://scouttoon.info/images/emblem_law.png";
const bossIcon = "https://scouttoon.info/images/emblem_boss.png";

export const data = new SlashCommandBuilder()
  .setName("suit")
  .setDescription("Find information about your cog suits.")
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

  const row = new ActionRowBuilder().addComponents(
    getSellButton(target),
    getCashButton(target),
    getLawButton(target),
    getBossButton(target),
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
    case "suit-refresh":
      switch (state) {
        case "home":
          embed = getHomeEmbed(item);
          row = getHomeRow(target);
          break;
        case "sell":
          embed = getSellEmbed(item);
          row = getSellRow(target);
          break;
        case "cash":
          embed = getCashEmbed(item);
          row = getCashRow(target);
          break;
        case "law":
          embed = getLawEmbed(item);
          row = getLawRow(target);
          break;
        case "boss":
          embed = getBossEmbed(item);
          row = getBossRow(target);
          break;
        default:
          return;
      }
      break;
    case "suit-home":
      embed = getHomeEmbed(item);
      row = getHomeRow(target);
      break;
    case "suit-sell":
      embed = getSellEmbed(item);
      row = getSellRow(target);
      break;
    case "suit-cash":
      embed = getCashEmbed(item);
      row = getCashRow(target);
      break;
    case "suit-law":
      embed = getLawEmbed(item);
      row = getLawRow(target);
      break;
    case "suit-boss":
      embed = getBossEmbed(item);
      row = getBossRow(target);
      break;
    default:
      return;
  }

  return { embed, row };
}

function getBossRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("boss", target),
    getHomeButton(target),
    getSellButton(target),
    getCashButton(target),
    getLawButton(target),
  );
}

function getLawRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("law", target),
    getHomeButton(target),
    getSellButton(target),
    getCashButton(target),
    getBossButton(target),
  );
}

function getCashRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("cash", target),
    getHomeButton(target),
    getSellButton(target),
    getLawButton(target),
    getBossButton(target),
  );
}

function getSellRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("sell", target),
    getHomeButton(target),
    getCashButton(target),
    getLawButton(target),
    getBossButton(target),
  );
}

function getHomeRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("home", target),
    getSellButton(target),
    getCashButton(target),
    getLawButton(target),
    getBossButton(target),
  );
}

function getHomeEmbed(item) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Red")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle("Cog Suits")
    .setDescription(
      "View your current suits or select department for more information.",
    )
    .setThumbnail(gear)
    .addFields(
      { name: "Sellbot", value: getBasicSuitInfo(toon.cogsuits, "s") },
      { name: "Cashbot", value: getBasicSuitInfo(toon.cogsuits, "m") },
      { name: "Lawbot", value: getBasicSuitInfo(toon.cogsuits, "l") },
      { name: "Bossbot", value: getBasicSuitInfo(toon.cogsuits, "c") },
    )
    .setTimestamp(item.modified);
}

function getSellEmbed(item) {
  const embed = getSuitEmbed(item, "Sellbot", "s");
  return embed.setThumbnail(sellIcon);
}

function getCashEmbed(item) {
  const embed = getSuitEmbed(item, "Cashbot", "m");
  return embed.setThumbnail(cashIcon);
}

function getLawEmbed(item) {
  const embed = getSuitEmbed(item, "Lawbot", "l");
  return embed.setThumbnail(lawIcon);
}

function getBossEmbed(item) {
  const embed = getSuitEmbed(item, "Bossbot", "c");
  return embed.setThumbnail(bossIcon);
}

function getSuitEmbed(item, title, type) {
  const toon = item.data;
  const suit = toon.cogsuits;
  if (suit[type].hasDisguise) {
    if (suit[type].level == 50) {
      return new EmbedBuilder()
        .setColor("Red")
        .setAuthor({
          name: toon.toon.name,
          iconURL: getToonRendition(toon, "laffmeter"),
        })
        .setTitle(getBasicSuitInfo(suit, type))
        .setDescription(`Maxed!`)
        .setFooter({
          text: `Facility earnings are an estimate.`,
          iconURL: gear,
        })
        .setTimestamp(item.modified);
    }
    return new EmbedBuilder()
      .setColor("Red")
      .setAuthor({
        name: toon.toon.name,
        iconURL: getToonRendition(toon, "laffmeter"),
      })
      .setTitle(getBasicSuitInfo(suit, type))
      .setDescription(
        `${simplifyNeeded(suit, type)} to go!\nProgress: ${simplifyPromo(suit, type)}`,
      )
      .addFields(getSuitPath(suit, type))
      .setFooter({ text: `Facility earnings are an estimate.`, iconURL: gear })
      .setTimestamp(item.modified);
  } else {
    return new EmbedBuilder()
      .setColor("Red")
      .setAuthor({
        name: toon.toon.name,
        iconURL: getToonRendition(toon, "laffmeter"),
      })
      .setTitle(title)
      .setDescription(`This toon has no ${title} disguise.`)
      .setTimestamp(item.modified);
  }
}

function getHomeButton(target) {
  return new ButtonBuilder()
    .setCustomId(`suit-home:${target}`)
    .setLabel("Home")
    .setStyle("Primary");
}

function getRefreshButton(type, target) {
  return new ButtonBuilder()
    .setCustomId(`suit-refresh:${type}:${target}`)
    .setLabel("Refresh")
    .setStyle("Danger");
}

function getSellButton(target) {
  return new ButtonBuilder()
    .setCustomId(`suit-sell:${target}`)
    .setLabel("Sellbot")
    .setStyle("Secondary");
}

function getCashButton(target) {
  return new ButtonBuilder()
    .setCustomId(`suit-cash:${target}`)
    .setLabel("Cashbot")
    .setStyle("Secondary");
}

function getLawButton(target) {
  return new ButtonBuilder()
    .setCustomId(`suit-law:${target}`)
    .setLabel("Lawbot")
    .setStyle("Secondary");
}

function getBossButton(target) {
  return new ButtonBuilder()
    .setCustomId(`suit-boss:${target}`)
    .setLabel("Bossbot")
    .setStyle("Secondary");
}

function getSuitPath(toon, type) {
  const calc = new SuitsCalculator(JSON.stringify(toon));
  const { path, total } = calc.getBestPathWeighted(type);

  if (total == -2) {
    return {
      name: "Recommended Activities",
      value: "None.\n**You are ready for promotion!**",
    };
  }

  let weighted = {};
  path.forEach((item) => {
    weighted[item] = (weighted[item] || 0) + 1;
  });

  let result = "";
  for (const [item, count] of Object.entries(weighted)) {
    result += `(${count}) ${item}\n`;
  }
  return {
    name: "Recommended Activities",
    value: result + `**Estimated earnings:** ${total}`,
  };
}

function getBasicSuitInfo(toon, type) {
  const suitType = toon[type];
  if (suitType.hasDisguise) {
    const prestige = suitType.version == 2 ? " v2.0" : "";
    return `${suitType.suit.name}, Level ${suitType.level} / ${getLevel(toon, type)}${prestige}`;
  }
  return "No disguise!";
}

function simplifyPromo(toon, type) {
  const calc = new SuitsCalculator(JSON.stringify(toon));
  return `${calc.getCurrent(type)} / ${calc.getTarget(type)}`;
}

function simplifyNeeded(toon, type) {
  const calc = new SuitsCalculator(JSON.stringify(toon));
  return calc.getNeeded(type);
}

function getLevel(toon, type) {
  const { suit, version } = toon[type];
  if (version == 2) return 50;
  return levels[type][suit.name];
}
