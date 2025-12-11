import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
} from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { getToonRendition, multiEmbedBuilder } from "../util/cmds.js";
import { getScoutToken, getRewardSums } from "../util/api.js";

const ids = {
    name: "rewards",
    home: "home",
    refresh: "refresh",
    sos: "sos",
    unite: "unite",
    summons: "summons",
    pinkslips: "pinkslips",
    remotes: "remotes",
};

export const data = new SlashCommandBuilder()
    .setName(ids.name)
    .setDescription("See how many SOS cards, Unites, Summons, Pinkslips, and Remotes you own.")
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
    const sums = await getRewardSums(item.data.rewards);

    const row = new ActionRowBuilder().addComponents(
        getSOSButton(target),
        getUniteButton(target),
        getSummonButton(target),
        getPinkslipsButton(target)
    );

    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [getHomeEmbed(item, sums)],
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
    const sums = await getRewardSums(item.data.rewards);
    const stateInfo = {
        [ids.home]: () => ({ embed: getHomeEmbed(item, sums), row: getRow(target, ids.home) }),
        [ids.sos]: () => ({ embed: getSOSEmbed(item), row: getRow(target, ids.sos) }),
        [ids.unite]: () => ({ embed: getUniteEmbed(item), row: getRow(target, ids.unite) }),
        [ids.summons]: () => ({ embed: getSummonsEmbed(item), row: getRow(target, ids.summons) }),
        [ids.remotes]: () => ({ embed: getRemotesEmbed(item), row: getRow(target, ids.remotes) }),
    };

    if (action === `${ids.name}-${ids.refresh}` && stateInfo[state]) {
        ({ embed, row } = stateInfo[state]());
    } else if (stateInfo[action.replace(`${ids.name}-`, "")]) {
        ({ embed, row } = stateInfo[action.replace(`${ids.name}-`, "")]());
    } else {
        return;
    }

    return { embed, row };
}

function getRow(target, id) {
    const buttons = [
        getRefreshButton(id, target),
        getHomeButton(target),
        getSOSButton(target),
        getUniteButton(target),
        getSummonButton(target),
        getPinkslipsButton(target),
    ];

    // filter out the button corresponding to the current row's id
    const filtered = buttons.filter(
        (button) => !button.data.custom_id.startsWith(`${ids.name}-${id}`)
    );

    return new ActionRowBuilder().addComponents(filtered);
}

function getHomeEmbed(item, sums) {
    const toon = item.data;
    return new EmbedBuilder()
        .setColor("LuminousVividPink")
        .setAuthor({
            name: toon.toon.name,
            iconURL: getToonRendition(toon, "laffmeter"),
        })
        .setTitle("Rewards")
        .setDescription(
            "See the total amount of all rewards you have below! To see more detailed information on a reward, click its button below."
        )
        .addFields(
            { name: "SOS Cards", value: `${sums.sumSos}` },
            { name: "Unites", value: `${sums.sumUnites}` },
            { name: "Summons", value: `${sums.sumSummons}` },
            { name: "Pinkslips", value: `${toon.rewards.pinkslips}` },
            { name: "Remotes", value: `${sums.sumRemotes}` },
            { name: "Total Reward Count", value: `${sums.totalRewards}` }
        )
        .setTimestamp(item.modified);
}

function getSOSEmbed(item) {
    const cards = item.data.rewards.sos;

    const fields = Object.entries(cards)
        .sort()
        .map(([name, quantity]) => ({
            name,
            value: String(quantity),
            inline: true
        }));

    return multiEmbedBuilder({
        title: "SOS Cards",
        fields,
        color: "Purple",
        author: {
            name: item.data.toon.name,
            iconURL: getToonRendition(item.data, "laffmeter"),
        },
        timestamp: item.modified,
    });
}


function getUniteEmbed(item) {
    const unites = item.data.rewards.unites;

    const fields = Object.entries(unites)
        .flatMap(([type, variants]) =>
            Object.entries(variants).sort().map(([variant, quantity]) => ({
                name: `${variant}`,
                value: `${quantity}`,
                inline: false,
            }))
        );

    return multiEmbedBuilder({
        title: "Unites",
        fields,
        color: "Blue",
        author: {
            name: item.data.toon.name,
            iconURL: getToonRendition(item.data, "laffmeter"),
        },
        timestamp: item.modified,
    });
}

function getSummonsEmbed(item) {
    const summons = item.data.rewards.summons;

    const fields = Object.entries(summons).map(([cogId, summon]) => ({
        name: summon.name,
        value:
            `Single: ${summon.single ? "✅" : "❌"}\n` +
            `Building: ${summon.building ? "✅" : "❌"}\n` +
            `Invasion: ${summon.invasion ? "❌" : "❌"}`,
        inline: true,
    }));

    return multiEmbedBuilder({
        title: "Summons",
        fields,
        color: "Green",
        author: {
            name: item.data.toon.name,
            iconURL: getToonRendition(item.data, "laffmeter"),
        },
        timestamp: item.modified,
    });
}


function getRemotesEmbed(item) {
    const remotes = item.data.rewards.remotes;

    const fields = Object.entries(remotes).map(([type, levels]) => ({
        name: type.replace("Remote", ""),
        value: Object.entries(levels)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([level, quantity]) => `${"⭐".repeat(level)}: ${quantity}`)
            .join("\n"),
        inline: false,
    }));

    return new EmbedBuilder()
        .setColor("Orange")
        .setAuthor({
            name: item.data.toon.name,
            iconURL: getToonRendition(item.data, "laffmeter"),
        })
        .setTitle("Remotes")
        .addFields(fields)
        .setTimestamp(item.modified);
}

function getHomeButton(target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.home}:${target}`)
        .setLabel("Home")
        .setStyle("Primary");
}

function getRefreshButton(type, target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.refresh}:${type}:${target}`)
        .setLabel("Refresh")
        .setStyle("Danger");
}

function getSOSButton(target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.sos}:${target}`)
        .setLabel("SOS")
        .setStyle("Secondary");
}

function getUniteButton(target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.unite}:${target}`)
        .setLabel("Unites")
        .setStyle("Secondary");
}

function getSummonButton(target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.summons}:${target}`)
        .setLabel("Summons")
        .setStyle("Secondary");
}

function getPinkslipsButton(target) {
    return new ButtonBuilder()
        .setCustomId(`${ids.name}-${ids.remotes}:${target}`)
        .setLabel("Remotes")
        .setStyle("Secondary");
}



