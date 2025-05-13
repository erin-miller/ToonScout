import { InstallGlobalCommands } from "../util/discord.js";
import express from "express";

const router = express.Router();

router.post("/install-commands", async (req, res) => {
  const { appId, commands } = req.body;

  if (!appId || !commands) {
    return res.status(400).json({ error: "Missing appId or commands" });
  }

  try {
    await InstallGlobalCommands(appId, commands);
    return res.status(200).json({ message: "Commands installed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to install commands" });
  }
});

export default router;
