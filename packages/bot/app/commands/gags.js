import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition } from "../utils.js";
import { getScoutToken } from "../db/scoutData/scoutService.js";

const HIGHEST_LVL = 7;
const organic = "<:organic:1292659435717787791>";
const organicLink = "https://i.imgur.com/N2hJ1wr.png";
const GAG_INDEX = {
  "Toon-Up": {
    1: "<:Feather_Icon:1292659211314139167>",
    2: "<:Megaphone_Icon:1292659198261334056>",
    3: "<:Lipstick_Icon:1292659176337571861>",
    4: "<:Bamboo_Cane_Icon:1292659167710023691>",
    5: "<:Pixie_Dust_Icon:1292659160911056919>",
    6: "<:Juggling_Cubes_Icon:1292659149129388184>",
    7: "<:High_Dive_Icon:1292659138899214356>",
  },
  Trap: {
    1: "<:Banana_Peel_Icon:1292659131957641247>",
    2: "<:Rake_Icon:1292659125431304282>",
    3: "<:Marbles_Icon:1292659118380814337>",
    4: "<:Quicksand_Icon:1292659111380516975>",
    5: "<:Trapdoor_Icon:1292659103956729969>",
    6: "<:TNT_Icon:1292659095257743500>",
    7: "<:Railroad_Icon:1292659087049359443>",
  },
  Lure: {
    1: "<:1_Bill_Icon:1292659624117407744>",
    2: "<:Small_Magnet_Icon:1292659630522241084>",
    3: "<:5_Bill_Icon:1292659638403334165>",
    4: "<:Big_Magnet_Icon:1292659079587823626>",
    5: "<:10_Bill_Icon:1292659072318967940>",
    6: "<:Hypnogoggles_Icon:1292659046779981846>",
    7: "<:Presentation_Icon:1292659021307842640>",
  },
  Sound: {
    1: "<:Bike_Horn_Icon:1292659009597472869>",
    2: "<:Whistle_Icon:1292659000965599232>",
    3: "<:Bugle_Icon:1292658986834727015>",
    4: "<:Aoogah_Icon:1292658975644454984>",
    5: "<:Elephant_Trunk_Icon:1292658968690298912>",
    6: "<:Foghorn_Icon:1292658962168287232>",
    7: "<:Opera_Singer_Icon:1292658953863303260>",
  },
  Throw: {
    1: "<:Cupcake_Icon:1292658942442340483>",
    2: "<:Fruit_Pie_Slice_Icon:1292658935077273642>",
    3: "<:Cream_Pie_Slice_Icon:1292658926667698266>",
    4: "<:Whole_Fruit_Pie_Icon:1292658917033115741>",
    5: "<:Whole_Cream_Pie_Icon:1292658910515298356>",
    6: "<:Birthday_Cake_Icon:1292658904051875902>",
    7: "<:Wedding_Cake_Icon:1292658783410978828>",
  },
  Squirt: {
    1: "<:Squirting_Flower_Icon:1292658625772261398>",
    2: "<:Glass_of_Water_Icon:1292658611029409886>",
    3: "<:Squirt_Gun_Icon:1292658601818722334>",
    4: "<:Seltzer_Bottle_Icon:1292658560815075390>",
    5: "<:Fire_Hose_Icon:1292658552447438848>",
    6: "<:Storm_Cloud_Icon:1292658542267990118>",
    7: "<:Geyser_Icon:1292658534256738380>",
  },
  Drop: {
    1: "<:Flower_Pot_Icon:1292658525872459776>",
    2: "<:Sandbag_Icon:1292658518012199004>",
    3: "<:Anvil_Icon:1292658510789607545>",
    4: "<:Big_Weight_Icon:1292658503634259968>",
    5: "<:Safe_Icon:1292658495790780477>",
    6: "<:Grand_Piano_Icon:1292658482729713674>",
    7: "<:Toontanic_Icon:1292658448068251762>",
  },
};

export const data = new SlashCommandBuilder()
  .setName("gags")
  .setDescription("Show an overview of one or all your gags.")
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

  const gagTracks = getGagInfo(toon);
  const gagProgress = getGagProgress(toon);

  const embed = new EmbedBuilder()
    .setColor("Purple")
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, "laffmeter"),
    })
    .setThumbnail(getToonRendition(toon, "cake-topper"))
    .setDescription(`${gagTracks}`)
    .setFooter({ text: `Leaf reflects organic.\n `, iconURL: organicLink })
    .setTimestamp(item.modified);

  if (gagProgress.length > 0) {
    gagProgress.forEach((gag) => {
      embed.addFields(gag);
    });
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  });
}

function getGagInfo(toon) {
  const tracks = toon.gags;
  let allGags = [];
  // locate all tracks
  for (let trackKey in tracks) {
    const track = tracks[trackKey];

    if (track) {
      // track exists, add info to allGags
      if (track.organic) {
        allGags.push(
          `${organic} ${getEmoji(trackKey, track.gag.level)} ${track.gag.name}`,
        );
      } else {
        allGags.push(
          `${getEmoji(trackKey, track.gag.level)} ${track.gag.name}`,
        );
      }
    }
  }
  return allGags.join("\n");
}

function getGagProgress(toon) {
  const tracks = toon.gags;
  let gagProgress = [];

  for (let trackKey in tracks) {
    const track = tracks[trackKey];
    if (track) {
      if (track.gag.level < HIGHEST_LVL) {
        gagProgress.push({
          name: `${getEmoji(trackKey, track.gag.level)} ${trackKey}`,
          value: `${track.experience.current}/${track.experience.next}`,
          inline: true,
        });
      }
    }
  }
  return gagProgress;
}

function getEmoji(track, level) {
  return GAG_INDEX[track][level];
}
