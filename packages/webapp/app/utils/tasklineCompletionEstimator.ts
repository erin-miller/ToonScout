/**
 * Taskline Completion Estimator
 * Uses laff-based calculations to estimate which tasklines are completed.
 * See playground_progression.json for laff values per playground.
 */

import { ToonData, Taskline } from "../types";
import { tasklinesByPlayground } from "../../data/tasklines";
import playgroundProgression from "../../data/playground_progression.json";
import { analyzeLaffSources, countToonGagTracks, type LaffSources } from "./laffProgressCalculator";


const PLAYGROUND_ORDER = playgroundProgression.playgrounds.map((entry) => entry.name);
const PLAYGROUND_LAFF_REWARDS = Object.fromEntries(
  playgroundProgression.playgrounds.map((entry) => [
    entry.name,
    { laff: entry.laffReward, cumulative: entry.cumulative },
  ])
) as Record<string, { laff: number; cumulative: number }>;
const STARTING_LAFF = playgroundProgression.startingLaff;
const LAFF_BOOST_PLAYGROUNDS = playgroundProgression.laffBoostPlaygrounds;
const GAG_TRACK_PROGRESSION = playgroundProgression.gagTrackProgression;
const GAG_TRACK_TO_PLAYGROUND = playgroundProgression.gagTrackToPlayground;

/** Tolerance for laff estimation comparisons to account for minor variations */
const LAFF_ESTIMATION_TOLERANCE = 2;

/**
 * Determines the most advanced playground a toon has likely completed based on laff from tasks.
 * Uses the cumulative laff thresholds to find the last completed playground (not the next one).
 */
function getPlaygroundByTaskLaff(taskLaff: number): string | null {
  if (!Number.isFinite(taskLaff) || taskLaff < 0) {
    return null;
  }

  // TaskLaff now includes starting laff (15)
  // The cumulative values represent the max laff after completing all tasks in that playground
  const effectiveLaff = taskLaff;

  // Work backwards from highest playground to find the last completed playground
  const playgrounds = [...PLAYGROUND_ORDER].reverse();

  for (const playground of playgrounds) {
    const data = PLAYGROUND_LAFF_REWARDS[playground];
    if (data && effectiveLaff + LAFF_ESTIMATION_TOLERANCE >= data.cumulative) {
      // Toon has enough laff to have completed this playground
      return playground;
    }
  }

  return "Toontown Central"; // Default to starting playground
}

/**
 * Returns possible playgrounds based on laff alone.
 * If laff is exactly at a playground cap, the toon could be finishing that
 * playground or have just moved to the next one.
 */
export function getPlaygroundByTaskLaffCandidates(taskLaff: number): string[] {
  const completed = getPlaygroundByTaskLaff(taskLaff);
  if (!completed) {
    return [];
  }

  const data = PLAYGROUND_LAFF_REWARDS[completed];
  const effectiveLaff = taskLaff;
  if (!data) {
    return [completed];
  }

  if (effectiveLaff === data.cumulative) {
    const idx = PLAYGROUND_ORDER.indexOf(completed);
    const next = idx >= 0 ? PLAYGROUND_ORDER[idx + 1] : null;
    return next ? [completed, next] : [completed];
  }

  return [completed];
}

function getLaffRewardFromTaskline(taskline: Taskline): number {
  const name = taskline.name.toLowerCase();
  const match = name.match(/\+(\d+)\s*laff/);
  if (match) {
    return parseInt(match[1], 10);
  }

  if (taskline.category === "laff_boost") {
    const idMatch = taskline.id.match(/_(\d+)_laff/);
    if (idMatch) {
      return parseInt(idMatch[1], 10);
    }
  }

  return 0;
}

function getLaffBoostTasklinesByProgression(): Taskline[] {
  const laffTasklines: Taskline[] = [];

  for (const playground of LAFF_BOOST_PLAYGROUNDS) {
    const tasklines = tasklinesByPlayground[playground] || [];
    const laffBoosts = tasklines.filter((tl) => getLaffRewardFromTaskline(tl) > 0);
    laffTasklines.push(...laffBoosts);
  }

  return laffTasklines;
}

/**
 * Get playgrounds that the toon has definitely completed based on gag track count.
 * A playground is completed when the toon has MORE gag tracks than the playground's
 * startTracks value (meaning they've moved past that playground).
 *
 * Examples:
 * - 3 tracks → TTC completed (3 > 2)
 * - 4 tracks → TTC, DD completed (4 > 2, 4 > 3)
 * - 5 tracks → TTC, DD, DG, MML completed (5 > 2, 5 > 3, 5 > 4, 5 > 4)
 * - 6 tracks → TTC, DD, DG, MML, TB completed (6 > all except DDL/STF)
 */
function getCompletedPlaygroundsByGagTracks(gagTrackCount: number): string[] {
  const completed: string[] = [];
  for (const entry of GAG_TRACK_PROGRESSION) {
    // If toon has more tracks than this playground's start, they've passed it
    if (gagTrackCount > entry.startTracks) {
      completed.push(entry.playground);
    }
  }
  return completed;
}

/**
 * Get possible playgrounds a toon could be in based on gag track count.
 * This list is intentionally narrow (Daisy vs Minnie, and DDL vs STF).
 */
export function getPossiblePlaygroundsByGagTracks(gagTrackCount: number): string[] {
  const clampedCount = Math.max(2, Math.min(gagTrackCount, 6));
  const key = String(clampedCount) as keyof typeof GAG_TRACK_TO_PLAYGROUND;
  return GAG_TRACK_TO_PLAYGROUND[key] || ["Toontown Central"];
}

/** Get current playground based on gag track count. */
function getCurrentPlaygroundByGagTracks(gagTrackCount: number): string {
  // Return the FIRST (earliest) playground from the possible list
  const possible = getPossiblePlaygroundsByGagTracks(gagTrackCount);
  return possible[0] || "Toontown Central";
}

export function estimateCompletedTasklines(toonData: ToonData, overjoyed?: boolean): {
  definitelyCompleted: string[];
  likelyCompleted: string[];
  possiblyCompleted: string[];
  taskLaffFromTasks: number;
  confidence: "high" | "medium" | "low";
  laffBreakdown: LaffSources;
} {
  const gagTrackCount = countToonGagTracks(toonData);
  const laffSources = analyzeLaffSources(toonData, overjoyed);
  const taskLaff = laffSources.tasklines;

  const definitelyCompleted: string[] = [];
  const likelyCompleted: string[] = [];
  const possiblyCompleted: string[] = [];

  const completedPlaygrounds = getCompletedPlaygroundsByGagTracks(gagTrackCount);
  const currentPlayground = getCurrentPlaygroundByGagTracks(gagTrackCount);

  // Gag track training completion based on track count
  // Note: This ONLY applies to gag training tasklines, NOT other tasks like teleport access
  // Teleport access can be earned before or during gag training - they are independent
  //
  // TTC: start 2, finish 3 - so if you have 3+, you completed TTC training
  if (gagTrackCount >= 3) definitelyCompleted.push("toontown_central_gag_track_training");
  // DD: start 3, finish 4
  if (gagTrackCount >= 4) definitelyCompleted.push("donalds_dock_gag_track_training");
  // MML: start 4, finish 5 (DG has no gag training)
  if (gagTrackCount >= 5) definitelyCompleted.push("minnies_melodyland_gag_track_training");
  // TB: start 5, finish 6
  if (gagTrackCount >= 6) {
    definitelyCompleted.push("the_brrrgh_gag_track_training");
    definitelyCompleted.push("the_brrrgh_final_gag_track_training");
  }

  // Note: We do NOT add teleport access to definitelyCompleted based on gag tracks
  // Teleport access is a separate task that can be completed at different points
  // Gag track count only determines which playground JSONs are relevant for filtering

  let remainingLaff = taskLaff - STARTING_LAFF; // Work with earned rewards only for iteration
  const laffTasklines = getLaffBoostTasklinesByProgression();

  for (const taskline of laffTasklines) {
    const laffReward = getLaffRewardFromTaskline(taskline);
    const tasklinePlayground = taskline.playground || "";

    if (laffReward === 0) continue;

    if (completedPlaygrounds.includes(tasklinePlayground)) {
      if (remainingLaff >= laffReward) {
        likelyCompleted.push(taskline.id);
        remainingLaff -= laffReward;
      } else {
        possiblyCompleted.push(taskline.id);
      }
    } else if (tasklinePlayground === currentPlayground) {
      if (remainingLaff >= laffReward) {
        possiblyCompleted.push(taskline.id);
        remainingLaff -= laffReward;
      }
    }
  }

  let confidence: "high" | "medium" | "low";
  if (remainingLaff >= -2 && remainingLaff <= 2) {
    confidence = "high";
  } else if (remainingLaff >= -5 && remainingLaff <= 5) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    definitelyCompleted,
    likelyCompleted,
    possiblyCompleted,
    taskLaffFromTasks: taskLaff,
    confidence,
    laffBreakdown: laffSources,
  };
}
