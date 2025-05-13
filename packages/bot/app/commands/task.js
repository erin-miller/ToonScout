import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition } from "../utils.js";
import { getScoutToken } from "../db/scoutData/scoutService.js";

const trooper = "https://i.imgur.com/eYjdODE.png";

export const data = new SlashCommandBuilder()
  .setName("tasks")
  .setDescription("Show an overview of one or all your tasks.")
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

  const tasks = getTasks(toon);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setThumbnail(trooper)
    .setTimestamp(item.modified);

  if (tasks.length > 0) {
    tasks.forEach((task) => {
      embed.addFields(task);
    });
  } else {
    embed.addFields({
      name: "Oops!",
      value: "This toon has no tasks right now!",
    });
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}

function getTasks(toon) {
  const toontasks = toon.tasks;
  if (toontasks.length == 0) {
    return [];
  }
  let taskList = [];
  for (const task of toontasks) {
    taskList.push(getTaskType(task));
  }
  return taskList;
}

function getForFun(task) {
  return task.deletable ? ` (Just For Fun)` : ``;
}

function getTaskType(task) {
  const progress = task.objective.progress.text;
  if (progress !== "Complete" && progress !== "") {
    // not a visit task, don't display npc values
    return {
      name: `${task.objective.text}${getForFun(task)}`,
      value: `Progress: ${progress}\nReward: ${task.reward}`,
    };
  } else {
    // display npc values for a visit task
    return {
      name: `Visit ${task.to.name} in ${task.to.building}`,
      value: `Location: ${task.to.zone}, ${task.to.neighborhood}\nReward: ${task.reward}`,
    };
  }
}
