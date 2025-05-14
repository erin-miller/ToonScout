import express from "express";
import {
  getScoutToken,
  updateHidden,
  storeScoutToken,
} from "../db/scoutData/scoutService.js";

const router = express.Router();

router.post("/get-scout-token", async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: "Missing target" });
  }

  try {
    const token = await getScoutToken(target);
    return res.status(200).json(token);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get scout token" });
  }
});

router.post("/store-scout-token", async (req, res) => {
  const { userId, data } = req.body;

  if (!userId || !data) {
    return res.status(400).json({ error: "Missing userId or data" });
  }

  try {
    const count = await storeScoutToken(userId, data);
    return res.status(200).json(count);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to store scout token" });
  }
});

router.post("/update-hidden", async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: "Missing target" });
  }

  try {
    const hidden = await updateHidden(target);
    const status = hidden ? "Hidden" : "Visible";
    return res.status(200).json({ status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update visibility" });
  }
});

export default router;
