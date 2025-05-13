import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";

export const data = new SlashCommandBuilder()
  .setName("sillymeter")
  .setDescription("Get the silly meter status.")
  .setIntegrationTypes(1)
  .setContexts([0, 1, 2]);

export async function execute(req, res, target) {
  const meter = await getMeter();
  const status = meter.state;
  const METER_CAP = 5000000;
  const hp = METER_CAP - meter.hp;

  const embed = new EmbedBuilder()
    .setColor("DarkPurple")
    .setTimestamp(new Date(meter.asOf * 1000));

  if (meter) {
    let title = "";
    if (status === "Active") {
      title += "The Silly Meter is rising...";

      const rewards = meter.rewards.map((team, index) => ({
        name: team,
        value: meter.rewardDescriptions[index],
        inline: false,
      }));

      embed.setDescription(`**${hp.toLocaleString()}** points to go!`);
      embed.addFields(rewards);
      const hpPercent = ((meter.hp / METER_CAP) * 100).toFixed(0);
      embed.setFooter({ text: `${hpPercent}% full` });
    } else if (status === "Reward") {
      title += `ACTIVE: ${meter.winner}`;

      const totalPoints = meter.rewardPoints.reduce(
        (acc, points) => acc + points,
        0
      );

      const rewardPercentages = meter.rewardPoints.map((points) => {
        if (totalPoints === 0) return 0;
        return Math.round((points / totalPoints) * 100);
      });

      let teams = ``;
      let points = ``;
      meter.rewards.forEach((reward, index) => {
        teams += `${reward}\n`;
        points += `${rewardPercentages[index]}%\n`;
      });

      const end = formatTime(meter.nextUpdateTimestamp);
      embed.setFooter({ text: `Ends in ${end}` });
      embed.addFields(
        { name: "Team", value: teams, inline: true },
        { name: "Percentage", value: points, inline: true }
      );
    } else if (status === "Inactive") {
      title += "The Silly Meter is cooling down...";
      const start = formatTime(meter.nextUpdateTimestamp);
      embed.setDescription(`Next cycle begins in ${start}.`);
    }

    embed.setTitle(title);
  } else {
    embed.addFields({
      name: "Status",
      value: "The silly meter could not be found.",
    });
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}

async function getMeter() {
  const response = await fetch(
    "https://www.toontownrewritten.com/api/sillymeter",
    {
      headers: { "User-Agent": process.env.USER_AGENT },
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    console.error("Could not get silly meter data.");
    return null;
  }
}

function formatTime(timestamp) {
  const end = new Date(timestamp * 1000);
  const now = new Date();
  const diff = end - now;

  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60) % 60;
  const hr = Math.floor(sec / 3600) % 24;
  const days = Math.floor(sec / (3600 * 24));

  // Build the time string
  let time = "";
  if (days > 0) time += `${days} day${days > 1 ? "s" : ""} `;
  if (hr > 0) time += `${hr} hour${hr > 1 ? "s" : ""} `;
  if (min > 0 && days === 0) time += `${min} minute${min > 1 ? "s" : ""}`;

  return time.trim();
}
