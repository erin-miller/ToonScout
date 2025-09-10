import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { InteractionResponseType } from "discord-interactions";
import { carnivalEnums, carnivalStatus } from "../util/cmds.js";

const hoodIds = {
    2: "Toontown Central",
    1: "Donald's Dock",
    5: "Daisy's Gardens",
    4: "Minnie's Melodyland",
    3: "The Brrrgh",
    9: "Donald's Dreamland",
}

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
    const status = await carnivalStatus();
    if (status == null || status.paradeStatus == carnivalEnums.INACTIVE) {
        return "The Cartoonival isn't active right now!"
    }

    if (status.paradeStatus == carnivalEnums.RECHARGING) {
        return `The Cavalcade is currently recharging... come back at ${getNextTime(carnivalEnums.RECHARGING)} to find out the next location!`
    }

    if (status.paradeStatus == carnivalEnums.IN_TRANSIT) {
        const locIdx = String(status.paradeLocation).charAt(0)
        return `The Cavalcade will be at **${status.paradeLocationString},  ${hoodIds[locIdx]}**, starting at ${getNextTime(carnivalEnums.IN_TRANSIT)}!`
    }

    if (status.paradeStatus == carnivalEnums.ACTIVE) {
        const locIdx = String(status.paradeLocation).charAt(0)
        return `The Cavalcade is currently running in **${status.paradeLocationString},  ${hoodIds[locIdx]}**!`
    }

    return "Uh oh! An error occured. Please try again later."
}

const getNextTime = (status) => {
    const now = new Date();
    const nextTime = new Date();
    if (status === carnivalEnums.RECHARGING) {
        if (now.getMinutes() < 25) {
            nextTime.setMinutes(25, 0, 0);
        } else {
            nextTime.setHours(now.getHours() + 1, 25, 0, 0);
        }
    } else if (status === carnivalEnums.IN_TRANSIT) {
        if (now.getMinutes() < 30) {
            nextTime.setMinutes(30, 0, 0);
        } else {
            nextTime.setHours(now.getHours() + 1, 30, 0, 0);
        }
    }
    const timestamp = Math.floor(nextTime.getTime() / 1000);
    return `<t:${timestamp}:t>`;
}
