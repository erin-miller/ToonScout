import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { carnivalStatus } from "../util/api.js";
import { carnivalEnums } from "../util/cmds.js"

export const data = new SlashCommandBuilder()
    .setName("cavalcade")
    .setDescription("Check the status of the Cavalcade.")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2])

export async function execute(req, res, target) {
    const embed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(await cavalcadeStatus())

    return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            embeds: [embed],
        },
    });
}

const cavalcadeStatus = async () => {
    const res = await carnivalStatus();
    const status = res.status
    if (status == null || status.paradeStatus == carnivalEnums.INACTIVE) {
        return res.message
    }

    if (status.paradeStatus == carnivalEnums.RECHARGING) {
        return res.message + ` come back at ${res.timestamp} to find out the next location!`
    }

    if (status.paradeStatus == carnivalEnums.IN_TRANSIT) {
        return res.message + ` starting at ${res.timestamp}!`
    }

    if (status.paradeStatus == carnivalEnums.ACTIVE) {
        return res.message
    }

    return "Uh oh! An error occured. Please try again later."
}