/**
 * Type definitions for taskline matching system.
 * Extracted for better modularity and reuse.
 */

import { Taskline, TasklineStep } from "../types";

/**
 * Categories for task classification
 */
export type TaskCategory =
  | "matchable"
  | "stf_grinding"
  | "just_for_fun"
  | "deletable"
  | "toontorial"
  | "random_reward";

/**
 * Deterministic match quality for a candidate
 */
export type MatchQuality = "exact" | "strong" | "partial" | "none";

export type ObjectiveMatchQuality = "exact" | "contains" | "none";

/**
 * Numeric requirement with optional plus modifier (e.g., "level 3+")
 */
export type NumericRequirement = {
  value: number;
  plus: boolean;
};

/**
 * Parsed numeric requirements from task text
 */
export type ParsedNumericRequirements = {
  count: number | null;
  level: NumericRequirement | null;
  story: NumericRequirement | null;
};

/**
 * Filter candidate for pipeline processing
 */
export type FilterCandidate = {
  taskline: Taskline;
  step: TasklineStep;
  objective: {
    text: string;
    location?: string;
    building?: string;
    optionIndex?: number;
  };
  tasklinePlayground: string | null;
  tasklineSource: string | null;
};

// Re-export as public API types
export type MatchCategory = TaskCategory;

export type MatchUnmatchedReason =
  | "stf_grinding"
  | "just_for_fun"
  | "deletable"
  | "toontorial"
  | "random_reward"
  | "no_candidates"
  | "no_match";

export type MatchDebugInfo = {
  category: MatchCategory;
  unmatchedReason?: MatchUnmatchedReason;
  matchQuality?: MatchQuality;
  objectiveMatch?: ObjectiveMatchQuality;
  matchSignals?: {
    npcMatch: boolean;
    buildingMatch: boolean;
    locationMatch: boolean;
    chainMatch?: boolean;
    objectiveMatch: ObjectiveMatchQuality;
  };
  matchedObjective?: {
    text: string;
    location?: string;
    building?: string;
    optionIndex?: number;
  };
  usedDeterministic?: boolean;
  bestCandidate?: {
    tasklineId: string;
    stepOrder: number;
    matchQuality: MatchQuality;
    objectiveMatch?: ObjectiveMatchQuality;
    objective: {
      text: string;
      location?: string;
      building?: string;
      optionIndex?: number;
    };
  };
};

export type TasklineFilterStageName =
  | "all"
  | "playground"
  | "npc_taskline"
  | "first_step"
  | "reward"
  | "numeric";

export type TasklineFilterStage = {
  stage: TasklineFilterStageName;
  remaining: number;
  dropped: number;
};

export type TasklineFilterPipeline = {
  totalCandidates: number;
  stages: TasklineFilterStage[];
  allowedPlaygrounds: string[] | null;
  candidates?: FilterCandidate[];
};
