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
  fromMatch: boolean; // task.from matches previous step's destination NPC
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

/**
 * Extract destination NPC from objective text.
 * Patterns: "Return to Master Mike", "Visit Zari", "Deliver X to Professor Wiggle"
 */
function extractDestinationNpc(objectiveText: string): string | null {
  const normalized = normalizeTaskText(objectiveText);

  // "Return to X" or "Visit X" - NPC is at the end
  const visitMatch = normalized.match(/^(?:return to|visit)\s+(.+)$/i);
  if (visitMatch) return visitMatch[1].trim();

  // "Deliver X to Y" - NPC is after "to"
  const deliverMatch = normalized.match(/\bto\s+([a-z]+(?:\s+[a-z]+)*)$/i);
  if (deliverMatch) return deliverMatch[1].trim();

  return null;
}

/**
 * Check if task.from matches the previous step's destination NPC.
 * This provides strong evidence for which step we're on when the same
 * NPC appears at multiple steps (e.g., "Visit Zari" at steps 3, 7, 11...).
 */
function getFromMatch(task: Task, candidate: FilterCandidate): boolean {
  const taskFromName = task.from?.name?.trim();
  if (!taskFromName) return false;

  // Find the previous step in the taskline
  const prevStepOrder = candidate.step.order - 1;
  if (prevStepOrder < 1) return false;

  const prevStep = candidate.taskline.steps.find(s => s.order === prevStepOrder);
  if (!prevStep) return false;

  // Extract the destination NPC from the previous step's objective
  const prevDestNpc = extractDestinationNpc(prevStep.objective);
  if (!prevDestNpc) return false;

  // Compare normalized names
  const normalizedFrom = normalizeTaskText(taskFromName);
  const normalizedPrevDest = normalizeTaskText(prevDestNpc);

  // Check for match (either exact or contains)
  return normalizedFrom === normalizedPrevDest ||
         normalizedFrom.includes(normalizedPrevDest) ||
         normalizedPrevDest.includes(normalizedFrom);
}

/** Determine match quality from signals (deterministic rules) */
function getMatchQuality(signals: MatchSignals): MatchQuality {
  if (signals.chainMatch) return "exact";
  // fromMatch is very strong evidence - task.from matches previous step's destination
  if (signals.fromMatch && signals.npcMatch) return "exact";
  // When objective doesn't match, npc+building is a valid fallback
  if (signals.objectiveMatch === "none") {
    return signals.npcMatch && signals.buildingMatch ? "partial" : "none";
  }
  // Have objective match - check for strong signals
  if (signals.npcMatch && signals.locationMatch) return "strong";
  if (signals.npcMatch && signals.objectiveMatch === "exact") return "strong";
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

  // Check if task.from matches the previous step's destination NPC
  // This disambiguates cases where same NPC appears at multiple steps
  const fromMatch = getFromMatch(task, candidate);

  return { npcMatch, buildingMatch, locationMatch, objectiveMatch, chainMatch, npcConflict, fromMatch };
}

/**
 * Priority-based step matching (deterministic, no scoring).
 * Filters candidates through priority stages, returning when unique match found.
 *
 * Priority order:
 * 1. chainMatch (history-based, highest confidence)
 * 2. fromMatch + npcMatch (task.from matches previous step's destination)
 * 3. npcMatch + buildingMatch + objectiveMatch (exact deterministic)
 * 4. npcMatch + locationMatch + objectiveMatch (strong deterministic)
 * 5. Any remaining valid matches (partial)
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

  // Priority 2: fromMatch + npcMatch (task.from matches previous step's destination)
  // This disambiguates cases like "Visit Zari" appearing at multiple steps
  const fromMatches = withSignals.filter((c) => c.signals.fromMatch && c.signals.npcMatch);
  if (fromMatches.length > 0) return fromMatches;

  // Priority 3: Objective match (prefer those with NPC + building)
  const objectiveMatches = withSignals.filter((c) => c.signals.objectiveMatch !== "none");
  if (objectiveMatches.length > 0) {
    const withNpcBuilding = objectiveMatches.filter((c) => c.signals.npcMatch && c.signals.buildingMatch);
    if (withNpcBuilding.length > 0) return withNpcBuilding;
    const withNpcLocation = objectiveMatches.filter((c) => c.signals.npcMatch && c.signals.locationMatch);
    if (withNpcLocation.length > 0) return withNpcLocation;
    return objectiveMatches;
  }

  // Priority 4: NPC + Building (fallback when no objective match)
  const npcBuildingMatches = withSignals.filter((c) => c.signals.npcMatch && c.signals.buildingMatch);
  if (npcBuildingMatches.length > 0) return npcBuildingMatches;

  // Priority 5: NPC + Location
  const npcLocationMatches = withSignals.filter((c) => c.signals.npcMatch && c.signals.locationMatch);
  if (npcLocationMatches.length > 0) return npcLocationMatches;

  // Priority 6: Any remaining partial matches
  return withSignals;
}
