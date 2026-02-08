/**
 * Taskline access filtering utilities.
 * Determines which tasklines a toon can access based on their progress.
 */

import { Task, ToonData } from "../types";
import { countToonGagTracks } from "./laffProgressCalculator";
import {
  estimateCompletedTasklines,
  getPlaygroundByTaskLaffCandidates,
  getPossiblePlaygroundsByGagTracks,
} from "./tasklineCompletionEstimator";
import { COG_DISGUISE_MIN_PLAYGROUNDS } from "./taskline/tasklineLocationUtils";
import { isTaskForceReward } from "./rewardPatterns";
import { normalizePlace } from "./normalizationPatterns";

function getNormalizedPlaygroundCandidatesByTaskLaff(taskLaffFromTasks: number): string[] {
  return getPlaygroundByTaskLaffCandidates(taskLaffFromTasks).map((playground: string) =>
    normalizePlace(playground)
  );
}

function canAccessSellbotTaskForce(toonData?: ToonData): boolean {
  if (!toonData?.data) {
    return false;
  }

  const requiredDepartments = ["s", "m", "l", "c"];
  const cogsuits = toonData.data.cogsuits ?? {};
  const hasAllDisguises = requiredDepartments.every((dept) => {
    const suit = cogsuits[dept];
    if (!suit) return false;
    return Boolean(suit.hasDisguise || (typeof suit.level === "number" && suit.level > 0));
  });
  if (!hasAllDisguises) {
    return false;
  }

  const gagTracks = toonData.data.gags ?? {};
  const hasLevel7Gag = Object.values(gagTracks).some(
    (track) => track?.gag && typeof track.gag.level === "number" && track.gag.level >= 7
  );
  return hasLevel7Gag;
}

export function getAllowedPlaygrounds(task: Task, toonData?: ToonData, overjoyed?: boolean): Set<string> | null {
  if (!toonData?.data) {
    return null;
  }

  const gagTrackCount = countToonGagTracks(toonData);
  const estimation = estimateCompletedTasklines(toonData, overjoyed);
  const gagCandidates = getPossiblePlaygroundsByGagTracks(gagTrackCount).map((value) =>
    normalizePlace(value)
  );
  const laffCandidates = getNormalizedPlaygroundCandidatesByTaskLaff(
    estimation.taskLaffFromTasks
  );
  const canAccessStf =
    gagCandidates.includes("sellbot task force") && canAccessSellbotTaskForce(toonData);
  const taskForceReward = isTaskForceReward(task.reward);
  if (gagCandidates.length === 0) {
    return null;
  }

  let allowed = gagCandidates;
  if (laffCandidates.length > 0) {
    const overlap = gagCandidates.filter((candidate) =>
      laffCandidates.includes(candidate)
    );
    if (overlap.length > 0) {
      allowed = overlap;
    }
  }

  if (taskForceReward) {
    const hasStfCandidate = gagCandidates.includes("sellbot task force");
    const laffAllowsStf =
      laffCandidates.length === 0 ||
      laffCandidates.includes("donalds dreamland") ||
      laffCandidates.includes("sellbot task force");
    if (!hasStfCandidate || !laffAllowsStf || !canAccessStf) {
      allowed = [];
    } else {
      allowed = ["sellbot task force"];
    }
  } else if (canAccessStf && !allowed.includes("sellbot task force")) {
    allowed = [...allowed, "sellbot task force"];
  } else if (!canAccessStf) {
    allowed = allowed.filter((candidate) => candidate !== "sellbot task force");
  }

  return new Set<string>(allowed);
}

function canAccessCogDisguise(toonData?: ToonData, overjoyed?: boolean): boolean {
  if (!toonData?.data) {
    return true;
  }

  const gagTrackCount = countToonGagTracks(toonData);
  if (gagTrackCount < 6) {
    return false;
  }

  const estimation = estimateCompletedTasklines(toonData, overjoyed);
  if (!estimation.taskLaffFromTasks) {
    return false;
  }

  const laffCandidates = getNormalizedPlaygroundCandidatesByTaskLaff(
    estimation.taskLaffFromTasks
  );
  const laffPlayground = laffCandidates[0] ?? null;
  if (!laffPlayground) {
    return false;
  }

  return laffCandidates.some((candidate) => COG_DISGUISE_MIN_PLAYGROUNDS.has(candidate));
}

/**
 * Get the cog department code for a cog disguise taskline.
 *
 * Note: Sellbot cog disguise has NO taskline - it's obtained through
 * Sellbot HQ activities (Factory, VP) at any laff level.
 * Only Cashbot/Lawbot/Bossbot disguises have tasklines.
 */
function getCogDisguiseDepartment(tasklineId: string): string | null {
  // Sellbot has no taskline (sellbot_cog_disguise.json is empty)
  // but we keep this check for completeness
  if (tasklineId.startsWith("sellbot_cog_disguise")) return "s";
  if (tasklineId.startsWith("cashbot_cog_disguise")) return "m";
  if (tasklineId.startsWith("lawbot_cog_disguise")) return "l";
  if (tasklineId.startsWith("bossbot_cog_disguise")) return "c";
  return null;
}

function hasCompletedCogDisguise(tasklineId: string, toonData?: ToonData): boolean {
  if (!toonData?.data) {
    return false;
  }
  const dept = getCogDisguiseDepartment(tasklineId);
  if (!dept) {
    return false;
  }
  const suit = toonData.data.cogsuits?.[dept];
  if (!suit) {
    return false;
  }
  return Boolean(suit.hasDisguise || (typeof suit.level === "number" && suit.level > 0));
}

export function canConsiderCogDisguiseTaskline(tasklineId: string, toonData?: ToonData, overjoyed?: boolean): boolean {
  if (hasCompletedCogDisguise(tasklineId, toonData)) {
    return false;
  }
  return canAccessCogDisguise(toonData, overjoyed);
}
