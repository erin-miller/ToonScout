import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";

export const data = new SlashCommandBuilder()
  .setName("invasions")
  .setDescription("Show invasion status in all districts.")
  .setIntegrationTypes(1)
  .setContexts([0, 1, 2]);

export async function execute(req, res, target) {
  const inv = await getInvasions();

  const embed = new EmbedBuilder()
    .setColor("DarkBlue")
    .setTitle("Current Invasions")
    .setTimestamp(new Date(inv.lastUpdated * 1000));

  if (!inv.error) {
    let districtText = "";
    let cogText = "";
    let progText = "";

    for (const [district, invasion] of Object.entries(inv.invasions)) {
      districtText += `${district}\n`;
      cogText += `${invasion.type}\n`;
      const [curr, req] = invasion.progress.split("/");
      progText += `${((curr / req) * 100).toFixed(0)}%\n`;
    }

    embed.addFields(
      { name: "Cog", value: cogText, inline: true },
      { name: "District", value: districtText, inline: true },
      { name: "Progress", value: progText, inline: true }
    );
  } else {
    embed.addFields({
      name: "Status",
      value: "No active invasions at this time.",
    });
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}

async function getInvasions() {
  const response = await fetch(
    "https://www.toontownrewritten.com/api/invasions",
    {
      headers: { "User-Agent": process.env.USER_AGENT },
    }
  );

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    console.error("Could not get invasion data.");
    return null;
  }
}
