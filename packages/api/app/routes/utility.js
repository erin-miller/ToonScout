import express from "express";
import {
  FishCalculator,
  SuitsCalculator,
  FlowerCalculator,
} from "toonapi-calculator";
import { getInvasions } from "./invasionHelpers.js";

const router = express.Router();

router.post("/get-fish", async (req, res) => {
  const { toonData } = req.body;

  if (!toonData) {
    return res.status(400).json({ message: "Toon data is required" });
  }

  const calc = new FishCalculator(JSON.stringify(toonData.data.fish));

  try {
    const rarity = calc.sortBestRarity();
    const caught = calc.getCaught();
    const catchable = calc.getCatchable();
    const locations = calc.sortBestLocation();
    const fishData = { rarity, caught, catchable, locations };

    if (fishData) {
      return res.status(200).json(fishData);
    } else {
      return res
        .status(404)
        .json({ message: "Fish data not found for this toon" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.post("/get-promo", async (req, res) => {
  const { toonData, dept } = req.body;

  if (!toonData || !dept) {
    return res.status(400).json({ message: "Toon data and dept is required" });
  }

  const calc = new SuitsCalculator(JSON.stringify(toonData.data.cogsuits));

  try {
    const promoData = calc.getBestPathWeighted(dept);
    if (promoData) {
      return res.status(200).json(promoData);
    } else {
      return res
        .status(404)
        .json({ message: "Suit data not found for this toon" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.post("/get-garden", async (req, res) => {
  const { toonData } = req.body;

  const calc = new FlowerCalculator(JSON.stringify(toonData.data.flowers));

  try {
    const upgrade = calc.getDaysToUpgrade();
    const plantable = calc.getPlantableFlowers();
    const progress = calc.getProgressFlowers();
    const missing = calc.getMissingFlowers();
    const maxCombo = calc.getComboLevel();
    const flowers = { maxCombo, upgrade, plantable, progress, missing };

    if (flowers) {
      return res.status(200).json(flowers);
    } else {
      return res
        .status(404)
        .json({ message: "Flower data not found for this toon" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

let cachedInvasions = null;
let lastFetchTime = 0;
const INVASION_CACHE_MS = 30 * 1000; // 30 seconds

router.get("/get-invasions", async (req, res) => {
  res.set("Cache-Control", "public, max-age=30");
  if (cachedInvasions && Date.now() - lastFetchTime < INVASION_CACHE_MS) {
    return res.json(cachedInvasions);
  }
  const apiResponse = await getInvasions();
  if (apiResponse.error) return res.status(500).json(apiResponse);
  cachedInvasions = apiResponse;
  lastFetchTime = Date.now();
  res.json(apiResponse);
});

const carnivalEnums = {
  INACTIVE: "inactive",    // Holiday not running
  RECHARGING: "recharging", // Holiday is running, but the parade isn't scheduled/running
  IN_TRANSIT: "in-transit", // Parade is scheduled but not running
  ACTIVE: "active",        // Parade is running
};

const carnivalStatus = async () => {
  const response = await fetch("https://toontownrewritten.com/api/cavalcade");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

const hoodIds = {
  2: "Toontown Central",
  1: "Donald's Dock",
  5: "Daisy's Gardens",
  4: "Minnie's Melodyland",
  3: "The Brrrgh",
  9: "Donald's Dreamland",
}

router.get("/get-cavalcade", async (req, res) => {
  try {
    const status = await carnivalStatus();
    if (status == null || status.paradeStatus === carnivalEnums.INACTIVE) {
      return res.json({
        message: "The Cartoonival isn't active right now!",
        timestamp: null,
        status: null
      });
    }

    const getNextTime = () => {
      const now = new Date();
      const nextTime = new Date();
      if (now.getMinutes() < 27) {
        nextTime.setMinutes(25, 0, 0);
      } else if (now.getMinutes() < 31) {
        nextTime.setMinutes(30, 0, 0);
      } else {
        nextTime.setHours(now.getHours() + 1, 25, 0, 0);
      }
      return Math.floor(nextTime.getTime() / 1000);
    };

    let message = "";
    let timestamp = null;

    if (status.paradeStatus === carnivalEnums.RECHARGING) {
      timestamp = getNextTime();
      message = `The Cavalcade is currently recharging...`;
    } else if (status.paradeStatus === carnivalEnums.IN_TRANSIT) {
      const locIdx = String(status.paradeLocation).charAt(0);
      timestamp = getNextTime();
      message = `The Cavalcade will be at **${status.paradeLocationString}, ${hoodIds[locIdx]}**`;
    } else if (status.paradeStatus === carnivalEnums.ACTIVE) {
      const locIdx = String(status.paradeLocation).charAt(0);
      message = `The Cavalcade is currently running in **${status.paradeLocationString}, ${hoodIds[locIdx]}**!`;
    }

    res.json({ message, timestamp, status: status.paradeStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

export default router;