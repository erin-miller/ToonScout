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

let cachedSillyMeter = null;

const fetchSillyMeter = async () => {
  if (cachedSillyMeter && Date.now() / 1000 < cachedSillyMeter.nextUpdateTimestamp) {
    return cachedSillyMeter;
  }

  try {
    const response = await fetch("https://www.toontownrewritten.com/api/sillymeter");
    if (!response.ok) {
      console.error(`[SillyMeter] API returned ${response.status}`);
      return cachedSillyMeter;
    }
    cachedSillyMeter = await response.json();
    return cachedSillyMeter;
  } catch (error) {
    console.error("[SillyMeter] Failed to fetch:", error);
    return cachedSillyMeter;
  }
};

router.get("/get-sillymeter", async (req, res) => {
  try {
    const data = await fetchSillyMeter();
    if (!data) {
      return res.status(503).json({ message: "Silly Meter data unavailable" });
    }

    const secondsUntilUpdate = Math.max(0, data.nextUpdateTimestamp - Math.floor(Date.now() / 1000));
    res.set("Cache-Control", `public, max-age=${Math.min(secondsUntilUpdate, 3600)}`);

    const isOverjoyedActive = data.state === "Reward" && data.winner === "Overjoyed Laff Meters";
    
    res.json({
      state: data.state,
      winner: data.winner,
      rewards: data.rewards,
      isOverjoyedActive,
      laffBoost: isOverjoyedActive ? 8 : 0,
      nextUpdateTimestamp: data.nextUpdateTimestamp,
      asOf: data.asOf,
    });
  } catch (error) {
    console.error("[SillyMeter]", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
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
  5: "Daisy Gardens",
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

router.post("/get-reward-sums", async (req, res) => {
  const { rewards } = req.body;

  if (!rewards) {
    return res.status(400).json({ message: "Rewards data is required" });
  }

  try {
    const sumSos = rewards.sos
      ? Object.values(rewards.sos).reduce((sum, value) => sum + value, 0)
      : 0;

    const sumUnites = rewards.unites
      ? Object.values(rewards.unites).reduce((sum, category) => {
        return (
          sum +
          Object.values(category).reduce(
            (categorySum, value) => categorySum + value,
            0
          )
        );
      }, 0)
      : 0;

    const sumSummons = rewards.summons
      ? Object.values(rewards.summons).reduce((sum, summon) => {
        return (
          sum +
          (summon.single ? 1 : 0) +
          (summon.building ? 1 : 0) +
          (summon.invasion ? 1 : 0)
        );
      }, 0)
      : 0;

    const sumRemotes = rewards.remotes
      ? Object.values(rewards.remotes).reduce((sum, category) => {
        return (
          sum +
          Object.values(category).reduce(
            (categorySum, value) => categorySum + value,
            0
          )
        );
      }, 0)
      : 0;

    const totalRewards =
      sumSos + sumUnites + sumSummons + sumRemotes + (rewards.pinkslips || 0);

    return res.status(200).json({
      sumSos,
      sumUnites,
      sumSummons,
      sumRemotes,
      totalRewards,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

export default router;