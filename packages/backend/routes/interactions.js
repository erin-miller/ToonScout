import express from "express";
import {
  verifyKeyMiddleware,
  InteractionType,
  InteractionResponseType,
} from "discord-interactions";
import { getUserId, validateUser } from "../util/user.js";

const router = express.Router();
const PUBLIC_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.PUBLIC_KEY_PROD
    : process.env.PUBLIC_KEY_DEV;

router.post("/", verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const { type, data } = req.body;

  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  const targetUser = req.body.data.options?.find(
    (option) => option.name === "user"
  )?.value;
  const targetToon = await validateUser(targetUser, req, res);
  if (!targetToon && targetUser) {
    return;
  }
  const id = targetToon ? targetUser : getUserId(req);

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const cmd = req.app.commands.get(name);
    try {
      return await cmd.execute(req, res, id);
    } catch (error) {
      console.error("App command error:", error);
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "There was an error while executing this command!",
          flags: 64,
        },
      });
    }
  }

  if (type == InteractionType.MESSAGE_COMPONENT) {
    const customId = data.custom_id;
    const cmd = req.app.commands.get(customId.split(/[-:]/)[0]);

    if (cmd && cmd.handleButton) {
      try {
        const result = await cmd.handleButton(req, customId);
        return res.send({
          type: InteractionResponseType.UPDATE_MESSAGE,
          data: {
            embeds: [result.embed],
            components: [result.row],
          },
        });
      } catch (error) {
        console.error(error);
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Button interaction error. Try again in a few moments.",
            flags: 64,
          },
        });
      }
    }
  }
});

export default router;
