/**
 * Step-level signal matching utilities.
 * Uses deterministic priority-based selection (no arbitrary scores).
 */

import { Task } from "../types";
import { ChainContext } from "./tasklineProgress";
import { normalizeTaskText } from "./tasklineTextUtils";
import { getObjectiveMatchQuality } from "./tasklineAnalysis";
import { locationsMatch } from "./taskline/tasklineLocationUtils";
import { isTeleportAccessReward } from "./rewardPatterns";
import { normalizeBuildingName } from "./normalizationPatterns";
import {
  FilterCandidate,
  MatchQuality,
  ObjectiveMatchQuality,
} from "./tasklineMatchingTypes";

export type ChainContextWrapper = {
  tasklineId: string;
  stepOrder: number;
  context: ChainContext;
} | null;

export type MatchSignals = {
  npcMatch: boolean;
  buildingMatch: boolean;
  locationMatch: boolean;
  objectiveMatch: ObjectiveMatchQuality;
  chainMatch: boolean;
  npcConflict: boolean;
};

export type MatchCandidate = FilterCandidate & {
  quality: MatchQuality;
  signals: MatchSignals;
};

function getNpcMatch(task: Task, objectiveText: string): boolean {
  const normalizedNpc = task.to?.name ? normalizeTaskText(task.to.name) : "";
  return normalizedNpc !== "" && normalizeTaskText(objectiveText).includes(normalizedNpc);
}

/** Check if step says "to [NPC]" but task.to.name is different */
function hasNpcConflict(task: Task, stepObjective: string): boolean {
  const taskNpc = task.to?.name?.trim();
  if (!taskNpc) return false;
  const normalizedStep = normalizeTaskText(stepObjective);
  const toNpcMatch = normalizedStep.match(/\bto\s+([a-z]+(?:\s+[a-z]+)*)\s*$/i);
  if (!toNpcMatch) return false;
  const stepNpc = toNpcMatch[1].toLowerCase().trim();
  return stepNpc !== normalizeTaskText(taskNpc) && !stepNpc.includes("hq officer");
}

function getBuildingMatch(task: Task, stepBuilding?: string): boolean {
  const taskBuilding = task.to?.building?.trim() ?? "";
  if (!taskBuilding || !stepBuilding || taskBuilding.toLowerCase().startsWith("any ")) return false;
  const [a, b] = [normalizeBuildingName(taskBuilding), normalizeBuildingName(stepBuilding)];
  return a.includes(b) || b.includes(a);
}

/** Determine match quality from signals (deterministic rules) */
function getMatchQuality(signals: MatchSignals): MatchQuality {
  if (signals.chainMatch) return "exact";
  if (signals.npcMatch && signals.buildingMatch) return "partial"; // Valid fallback
  if (signals.objectiveMatch === "none") return "none";
  if (signals.npcMatch && signals.locationMatch) return "strong";
  return "partial";
}

export function getConfidence(quality: MatchQuality): "high" | "medium" | "low" {
  return quality === "exact" ? "high" : quality === "strong" ? "medium" : "low";
}

/** Calculate match signals for a candidate */
function calculateSignals(
  task: Task,
  candidate: FilterCandidate,
  taskLocation: string | null,
  objectiveText: string,
  chainContext: ChainContextWrapper,
  hasChainEvidence: boolean
): MatchSignals {
  const npcMatch = getNpcMatch(task, candidate.objective.text);
  const buildingMatch = getBuildingMatch(task, candidate.objective.building);
  const locationMatch = taskLocation && candidate.objective.location
    ? locationsMatch(taskLocation, candidate.objective.location)
    : false;

  let objectiveMatch = getObjectiveMatchQuality(objectiveText, candidate.objective.text);

  // Special case: teleport HQ officer tasks
  if (
    objectiveMatch === "none" &&
    isTeleportAccessReward(task.reward ?? null) &&
    npcMatch &&
    candidate.objective.text.toLowerCase().includes("hq officer")
  ) {
    objectiveMatch = "contains";
  }

  const chainMatch = Boolean(
    hasChainEvidence &&
    chainContext &&
    candidate.taskline.id === chainContext.tasklineId &&
    candidate.step.order === chainContext.stepOrder + 1
  );

  const npcConflict = hasNpcConflict(task, candidate.objective.text);

  return { npcMatch, buildingMatch, locationMatch, objectiveMatch, chainMatch, npcConflict };
}

/**
 * Priority-based step matching (deterministic, no scoring).
 * Filters candidates through priority stages, returning when unique match found.
 *
 * Priority order:
 * 1. chainMatch (history-based, highest confidence)
 * 2. npcMatch + buildingMatch (exact deterministic)
 * 3. npcMatch + locationMatch (strong deterministic)
 * 4. Any remaining valid matches (partial)
 */
export function rankMatchCandidates(
  candidates: FilterCandidate[],
  task: Task,
  taskLocation: string | null,
  objectiveText: string,
  chainContext: ChainContextWrapper,
  hasChainEvidence: boolean
): MatchCandidate[] {
  // Calculate signals for all candidates, filter out invalid matches
  const withSignals = candidates.map((candidate) => {
    const signals = calculateSignals(task, candidate, taskLocation, objectiveText, chainContext, hasChainEvidence);
    return { ...candidate, quality: getMatchQuality(signals), signals };
  }).filter((c) => c.quality !== "none" && !c.signals.npcConflict);

  if (withSignals.length === 0) return [];

  // Priority 1: Chain match (deterministic from history)
  const chainMatches = withSignals.filter((c) => c.signals.chainMatch);
  if (chainMatches.length > 0) return chainMatches;

  // Priority 2: Objective match (prefer those with NPC + building)
  const objectiveMatches = withSignals.filter((c) => c.signals.objectiveMatch !== "none");
  if (objectiveMatches.length > 0) {
    const withNpcBuilding = objectiveMatches.filter((c) => c.signals.npcMatch && c.signals.buildingMatch);
    if (withNpcBuilding.length > 0) return withNpcBuilding;
    const withNpcLocation = objectiveMatches.filter((c) => c.signals.npcMatch && c.signals.locationMatch);
    if (withNpcLocation.length > 0) return withNpcLocation;
    return objectiveMatches;
  }

  // Priority 3: NPC + Building (fallback when no objective match)
  const npcBuildingMatches = withSignals.filter((c) => c.signals.npcMatch && c.signals.buildingMatch);
  if (npcBuildingMatches.length > 0) return npcBuildingMatches;

  // Priority 4: NPC + Location
  const npcLocationMatches = withSignals.filter((c) => c.signals.npcMatch && c.signals.locationMatch);
  if (npcLocationMatches.length > 0) return npcLocationMatches;

  // Priority 5: Any remaining partial matches
  return withSignals;
}
