import "dotenv/config";
import { getScoutToken } from "./db/scoutData/scoutService.js";
import { InteractionResponseType } from "discord-interactions";

export function getUser(req) {
  const { user: direct, member } = req.body;
  return direct ? direct.username : member.user.username;
}

export function getGlobalUser(req) {
  const { user: direct, member } = req.body;
  return direct ? direct.global_name : member.user.username;
}

export function getUserId(req) {
  const { user: direct, member } = req.body;
  return direct ? direct.id : member.user.id;
}

export async function validateUser(targetUser, req, res) {
  if (targetUser) {
    const targetToon = await getScoutToken(targetUser);
    const requestingUserId = getUserId(req);

    if (!targetToon || (targetToon.hidden && targetUser !== requestingUserId)) {
      await res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `That user has not connected to ToonScout.`,
          flags: 64,
        },
      });
      return null;
    }

    return targetToon;
  }

  return null;
}
