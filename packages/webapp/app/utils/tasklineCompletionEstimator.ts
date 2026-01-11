/**
 * Taskline Completion Estimator
 * Determines playground progress using gag tracks (definitive) and laff (for disambiguation).
 * See playground_progression.json for laff values per playground.
 */

import { ToonData } from "../types";
import playgroundProgression from "../../data/playground_progression.json";
import { analyzeLaffSources, countToonGagTracks, type LaffSources } from "./laffProgressCalculator";

const PLAYGROUND_ORDER = playgroundProgression.playgrounds.map((entry) => entry.name);
const PLAYGROUND_THRESHOLDS = Object.fromEntries(
  playgroundProgression.playgrounds.map((entry) => [
    entry.name,
    { laff: entry.laffReward, cumulative: entry.cumulative },
  ])
) as Record<string, { laff: number; cumulative: number }>;
const GAG_TRACK_TO_PLAYGROUND = playgroundProgression.gagTrackToPlayground;

/**
 * Get the playground a toon has completed based on their task laff.
 * Uses cumulative laff thresholds to determine the highest completed playground.
 */
function getPlaygroundByTaskLaff(taskLaff: number): string | null {
  if (!Number.isFinite(taskLaff) || taskLaff <= 0) {
    return null;
  }

  // Work backwards from highest playground to find the last completed one
  for (const playground of [...PLAYGROUND_ORDER].reverse()) {
    const data = PLAYGROUND_THRESHOLDS[playground];
    if (data && taskLaff >= data.cumulative) {
      return playground;
    }
  }

  return "Toontown Central";
}

/**
 * Returns possible playgrounds based on laff.
 * If laff is exactly at a boundary, returns both the completed playground and the next one.
 */
export function getPlaygroundByTaskLaffCandidates(taskLaff: number): string[] {
  const completed = getPlaygroundByTaskLaff(taskLaff);
  if (!completed) {
    return [];
  }

  const data = PLAYGROUND_THRESHOLDS[completed];
  if (!data) {
    return [completed];
  }

  // At exact boundary - could be finishing this playground or starting next
  if (taskLaff === data.cumulative) {
    const idx = PLAYGROUND_ORDER.indexOf(completed);
    const next = idx >= 0 ? PLAYGROUND_ORDER[idx + 1] : null;
    return next ? [completed, next] : [completed];
  }

  return [completed];
}

/**
 * Get possible playgrounds based on gag track count.
 * Returns narrow list for ambiguous cases (DG/MML at 4 tracks, DDL/STF at 6 tracks).
 */
export function getPossiblePlaygroundsByGagTracks(gagTrackCount: number): string[] {
  const clampedCount = Math.max(2, Math.min(gagTrackCount, 6));
  const key = String(clampedCount) as keyof typeof GAG_TRACK_TO_PLAYGROUND;
  return GAG_TRACK_TO_PLAYGROUND[key] || ["Toontown Central"];
}

/**
 * Determine which playground a toon is currently in.
 *
 * Uses gag track count as primary signal, with laff to disambiguate:
 * - 4 tracks: Daisy Gardens (cumulative 43) vs Minnie's Melodyland (cumulative 52)
 * - 6 tracks: Donald's Dreamland (cumulative 100) vs Sellbot Task Force (cumulative 103)
 */
export function estimateCompletedTasklines(toonData: ToonData, overjoyed?: boolean): {
  currentPlayground: string;
  taskLaffFromTasks: number;
  laffBreakdown: LaffSources;
} {
  const gagTrackCount = countToonGagTracks(toonData);
  const laffSources = analyzeLaffSources(toonData, overjoyed);
  const taskLaff = laffSources.tasklines;

  // Determine current playground using gag tracks + laff disambiguation
  const gagCandidates = getPossiblePlaygroundsByGagTracks(gagTrackCount);
  let currentPlayground = gagCandidates[0] || "Toontown Central";

  // Use laff to disambiguate when gag tracks are ambiguous
  if (gagCandidates.length > 1 && taskLaff > 0) {
    const laffCandidates = getPlaygroundByTaskLaffCandidates(taskLaff);
    // Find overlap between gag and laff candidates
    const overlap = gagCandidates.filter((pg) =>
      laffCandidates.some((lc) => lc.toLowerCase().replace(/['']/g, "") === pg.toLowerCase().replace(/['']/g, ""))
    );
    if (overlap.length === 1) {
      currentPlayground = overlap[0];
    }
  }

  return {
    currentPlayground,
    taskLaffFromTasks: taskLaff,
    laffBreakdown: laffSources,
  };
}
