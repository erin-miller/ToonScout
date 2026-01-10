/** Laff Progress Calculator - deduces laff contributions from activity and suit data */

import { ToonData } from "../types";
import { golf_trophies } from "../../data/golf_trophies";
import { race_trophies } from "../../data/race_trophies";
import { getOverjoyedLaffBoost } from "./sillyMeter";

const MAX_FISHING_LAFF = 7;
const MAX_RACING_LAFF = 3;
const MAX_GOLF_LAFF = 3;
const MAX_GARDENING_LAFF = 4;
const TROPHIES_PER_LAFF = 10;

export interface LaffSources {
  activities: {
    fishing: number;
    racing: number;
    golfing: number;
    gardening: number;
  };
  bossSuits: {
    vp: number;
    cfo: number;
    cj: number;
    ceo: number;
  };
  tasklines: number;
  total: number;
}

const BOSS_SUIT_LAFF_MILESTONES = [15, 20, 30, 40, 50];

// Trophy counting adapted for ToonData (uses .data instead of .data.data)
function countFishTrophies(toonData: ToonData): number {
  const fish = toonData.data?.fish?.collection;
  if (!fish) return 0;
  let count = 0;
  for (const key in fish) {
    const album = fish[key]?.album;
    // album is an object with numeric keys (e.g., {"0": {...}, "1": {...}}), not an array
    if (album && typeof album === 'object') {
      count += Object.keys(album).length;
    }
  }
  return count;
}

function countGolfTrophies(toonData: ToonData): number {
  const golf = toonData.data?.golf;
  if (!golf || !Array.isArray(golf)) return 0;
  let count = 0;
  for (const trophy of golf_trophies) {
    const earned = golf.find((item) => item.name === trophy.description)?.num || 0;
    for (const val of trophy.values) {
      if (earned >= val) count += 1;
    }
  }
  return count;
}

function countRaceTrophies(toonData: ToonData): number {
  const racing = toonData.data?.racing;
  if (!racing || !Array.isArray(racing)) return 0;
  let count = 0;
  for (const trophy of race_trophies) {
    const earned = racing.find((item) => item.name === trophy.description)?.num || 0;
    for (const val of trophy.values) {
      if (earned >= val) count += 1;
    }
  }
  return count;
}

function countGardeningSkill(toonData: ToonData): number {
  const flowers = toonData.data?.flowers;
  if (!flowers) return 0;
  const shovelSkill = flowers.shovel?.curSkill || 0;
  const wateringCanSkill = flowers.wateringCan?.curSkill || 0;
  return shovelSkill + wateringCanSkill;
}

const getLaffForSuit = (level: number): number => {
  return BOSS_SUIT_LAFF_MILESTONES.filter((milestone) => level >= milestone).length;
};

function getSuitDepartment(suit: unknown): string {
  if (!suit || typeof suit !== "object") return "";
  const candidate = suit as { department?: string; suit?: { name?: string } };
  return String(candidate.department || candidate.suit?.name || "").toLowerCase();
}

function calculateBossSuitLaff(cogsuits: ToonData["data"]["cogsuits"]): LaffSources["bossSuits"] {
  const suitLaffs = { sellbot: 0, cashbot: 0, lawbot: 0, bossbot: 0 };

  if (cogsuits) {
    for (const [key, suit] of Object.entries(cogsuits)) {
      if (!suit) continue;
      let department = getSuitDepartment(suit);
      
      // Fallback: Infer department from key if property is missing
      if (!department || (department.length === 1 && department === key)) {
        if (key === 's') department = 'sellbot';
        else if (key === 'm') department = 'cashbot';
        else if (key === 'l') department = 'lawbot';
        else if (key === 'c') department = 'bossbot';
      }

      const level = Number(suit.level);
      const version = Number(suit.version);
      const safeLevel = Number.isFinite(level) ? level : 0;
      const safeVersion = Number.isFinite(version) ? version : 0;
      const laff = safeVersion > 1 ? 5 : getLaffForSuit(safeLevel);

      if (department.includes("sellbot")) suitLaffs.sellbot = Math.max(suitLaffs.sellbot, laff);
      else if (department.includes("cashbot")) suitLaffs.cashbot = Math.max(suitLaffs.cashbot, laff);
      else if (department.includes("lawbot")) suitLaffs.lawbot = Math.max(suitLaffs.lawbot, laff);
      else if (department.includes("bossbot")) suitLaffs.bossbot = Math.max(suitLaffs.bossbot, laff);
    }
  }

  return { vp: suitLaffs.sellbot, cfo: suitLaffs.cashbot, cj: suitLaffs.lawbot, ceo: suitLaffs.bossbot };
}

export function analyzeLaffSources(toonData: ToonData, overjoyed?: boolean): LaffSources {
  if (!toonData?.data) {
    return {
      activities: { fishing: 0, racing: 0, golfing: 0, gardening: 0 },
      bossSuits: { vp: 0, cfo: 0, cj: 0, ceo: 0 },
      tasklines: 0,
      total: 0,
    };
  }

  const maxLaff = toonData.data.laff?.max;
  const currentLaffValue = toonData.data.laff?.current;
  const rawLaff = Number.isFinite(maxLaff) && maxLaff > 0 ? maxLaff 
    : Number.isFinite(currentLaffValue) ? currentLaffValue : 0;
  
  const laffBoost = (overjoyed ?? getOverjoyedLaffBoost() > 0) ? 8 : 0;
  const currentLaff = Math.max(0, rawLaff - laffBoost);

  // Calculate activity laff using trophy counts
  const fishing = Math.min(MAX_FISHING_LAFF, Math.floor(countFishTrophies(toonData) / TROPHIES_PER_LAFF));
  const racing = Math.min(MAX_RACING_LAFF, Math.floor(countRaceTrophies(toonData) / TROPHIES_PER_LAFF));
  const golfing = Math.min(MAX_GOLF_LAFF, Math.floor(countGolfTrophies(toonData) / TROPHIES_PER_LAFF));
  const gardening = Math.min(MAX_GARDENING_LAFF, Math.floor(countGardeningSkill(toonData) / TROPHIES_PER_LAFF));

  const activities = { fishing, racing, golfing, gardening };
  const activityLaff = fishing + racing + golfing + gardening;

  const bossSuits = calculateBossSuitLaff(toonData.data.cogsuits);
  const bossSuitLaff = bossSuits.vp + bossSuits.cfo + bossSuits.cj + bossSuits.ceo;

  const tasklines = Math.max(0, currentLaff - activityLaff - bossSuitLaff);

  return { activities, bossSuits, tasklines, total: currentLaff };
}

export function countToonGagTracks(toonData: ToonData): number {
  const gags = toonData?.data?.gags;
  if (!gags) return 0;
  return Object.values(gags).filter(g => g !== null).length;
}
