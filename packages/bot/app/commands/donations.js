import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { carnivalEnums, carnivalStatus } from "../util/cmds.js";

export const data = new SlashCommandBuilder()
    .setName("donations")
    .setDescription("Check how many tokens have been donated to Riggy")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2])

export async function execute(req, res, target) {
    const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(await getFund())

    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
        },
    });
}

const getFund = async () => {
    const status = await carnivalStatus()
    if (status == null || status.paradeStatus == carnivalEnums.INACTIVE) {
        return "The Cartoonival isn't active right now!"
    }

    const response = await fetch('https://toontownrewritten.com/api/riggydonations');
    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }
    const data = await response.json();
    return `**${data.total}** tokens have been donated!`;
}