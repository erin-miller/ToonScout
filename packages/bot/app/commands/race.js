import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition } from "../utils.js";
import { getScoutToken } from "../db/scoutData/scoutService.js";
import { RacingCalculator } from "toonapi-calculator";

const trophyEmoji = "<:trophy:1301971567575699498>";

const car = "https://scouttoon.info/images/racing_tickets.png";
const trophyIcon = "https://i.imgur.com/Sl1ep8e.png";
const order = [
  "Speedway Wins",
  "Speedway Qualify Count",
  "Rural Wins",
  "Rural Qualify Count",
  "Urban Wins",
  "Urban Qualify Count",
  "Total Wins",
  "Total Qualify Count",
  "Tournament Race Wins",
  "Tournament Race Qualify Count",
  "Unique race tracks completed",
];

export const data = new SlashCommandBuilder()
  .setName("race")
  .setDescription("Get advising on what trophies to go for next.")
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
    getRefreshButton("home", target),
    getAdviceButton(target),
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
    case "race-refresh":
      switch (state) {
        case "home":
          embed = getHomeEmbed(item);
          row = getHomeRow(target);
          break;
        case "advice":
          embed = getAdviceEmbed(item);
          row = getAdviceRow(target);
          break;
        default:
          return;
      }
      break;
    case "race-home":
      embed = getHomeEmbed(item);
      row = getHomeRow(target);
      break;
    case "race-advice":
      embed = getAdviceEmbed(item);
      row = getAdviceRow(target);
      break;
    default:
      return;
  }

  return { embed, row };
}

function getHomeButton(target) {
  return new ButtonBuilder()
    .setCustomId(`race-home:${target}`)
    .setLabel("Home")
    .setStyle("Secondary");
}

function getAdviceButton(target) {
  return new ButtonBuilder()
    .setCustomId(`race-advice:${target}`)
    .setLabel("Advice")
    .setStyle("Secondary");
}

function getRefreshButton(type, target) {
  return new ButtonBuilder()
    .setCustomId(`race-refresh:${type}:${target}`)
    .setLabel("Refresh")
    .setStyle("Danger");
}

function getHomeRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("home", target),
    getAdviceButton(target),
  );
}

function getAdviceRow(target) {
  return new ActionRowBuilder().addComponents(
    getRefreshButton("advice", target),
    getHomeButton(target),
  );
}

function getHomeEmbed(item) {
  const toon = item.data;
  const trophies = getAllTrophies(toon.racing);
  const embed = new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle(`Racing Trophies (${getTotalEarned(toon.racing)}/30)`)
    .setThumbnail(car)
    .setFooter({ text: getLaff(toon.racing), iconURL: trophyIcon })
    .setTimestamp(item.modified);

  if (getTotalEarned(toon.racing) !== 30 && trophies) {
    let trophyNames = ``;
    let progNames = ``;
    const earned = getSpecificEarned(toon.racing);

    trophies.forEach((trophy) => {
      const completed = earned.find((item) => item[0] === trophy.name)[1];

      const progress = `${trophy.progress.current}/${trophy.progress.required} ${trophyEmoji.repeat(completed)}\n`;
      trophyNames += `${trophy.name}\n`;
      progNames += progress;
    });

    embed.addFields(
      { name: "Trophies", value: trophyNames, inline: true },
      { name: "Progress", value: progNames, inline: true },
    );
  } else {
    embed.setDescription("You have maxed racing! Congratulations!");
  }

  return embed;
}

function getAdviceEmbed(item) {
  const toon = item.data;
  return new EmbedBuilder()
    .setColor("Gold")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setTitle(`Racing Trophies (${getTotalEarned(toon.racing)}/30)`)
    .setDescription(getTopTrophies(toon.racing))
    .setThumbnail(car)
    .setFooter({ text: getLaff(toon.racing), iconURL: trophyIcon })
    .setTimestamp(item.modified);
}

function getLaff(toon) {
  const calc = new RacingCalculator(JSON.stringify(toon));
  const pts = calc.getCurrentProgress();
  return `${pts}/3 laff points earned.`;
}

function getTopTrophies(toon) {
  const calc = new RacingCalculator(JSON.stringify(toon));
  let trophies = calc.getBestTrophy().slice(0, 5);
  trophies = trophies
    .map(
      (t, index) =>
        `**${index + 1}. ${t.name}**Progress: ${t.progress.current}/${t.progress.required}\n${t.progress.difference} more to go!\n`,
    )
    .join("\n");
  return trophies !== "" ? trophies : "You have maxed racing! Congratulations!";
}

function getAllTrophies(toon) {
  const calc = new RacingCalculator(JSON.stringify(toon));
  const trophies = calc.getBestTrophy().sort((a, b) => {
    return order.indexOf(a.name) - order.indexOf(b.name);
  });
  return trophies !== "" ? trophies : null;
}

function getTotalEarned(toon) {
  const calc = new RacingCalculator(JSON.stringify(toon));
  return calc.getTotalEarned();
}

function getSpecificEarned(toon) {
  const calc = new RacingCalculator(JSON.stringify(toon));
  return calc.getCompletedTrophies();
}
