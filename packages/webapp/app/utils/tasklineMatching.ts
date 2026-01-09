import { Task, TaskMatch, ToonData } from "../types";
import {
  getTasklineProgress,
  findNextUncompletedStep,
  getToonChainContext,
  fromMatchesChainContext,
} from "./tasklineProgress";
import {
  getAllowedPlaygrounds,
  canConsiderCogDisguiseTaskline,
} from "./tasklineAccessFilters";
import {
  ChainContextWrapper,
  MatchCandidate,
  rankMatchCandidates,
  getConfidence,
} from "./tasklineStepSignals";
import { buildTaskObjectiveText } from "./tasklineTextUtils";
import { getTasklineCandidates } from "./tasklineCandidateIndex";
import { runTasklineFilterPipeline } from "./tasklineFilterPipeline";
import {
  TaskCategory,
  MatchDebugInfo,
  TasklineFilterPipeline,
  TasklineFilterStageName,
} from "./tasklineMatchingTypes";

function categorizeTask(task: Task): TaskCategory {
  // Tutorial tasks have "Tutorial Terrace" in neighborhood
  if (task.from?.neighborhood?.toLowerCase().includes("tutorial")) {
    return "toontorial";
  }

  const reward = task.reward?.toLowerCase() ?? "";
  
  // Track frame rewards are random/procedural (e.g., "toon-up track animation frame 7")
  if (/track\s+(animation\s+)?frame\s+\d/i.test(reward)) {
    return "random_reward";
  }

  // Deletable task categorization
  if (task.deletable) {
    if (reward.includes("skill points")) return "stf_grinding";
    if (task.type?.toLowerCase().includes("just for fun")) return "just_for_fun";
    return "deletable";
  }

  return "matchable";
}

function extractLocation(task: Task): string | null {
  const where = task.objective.where?.trim().toLowerCase();
  if (where && where !== "anywhere") {
    return where;
  }

  const neighborhood = task.to?.neighborhood?.trim().toLowerCase();
  if (neighborhood && !neighborhood.startsWith("any ")) {
    return neighborhood;
  }

  return null;
}

/**
 * Resolve tiebreakers using toon progress data.
 * If multiple candidates have identical objectives, pick the next uncompleted step.
 */
function resolveProgressTiebreaker(
  topGroup: MatchCandidate[],
  toonId: string | null
): MatchCandidate {
  const topCandidate = topGroup[0];
  if (!toonId || topGroup.length === 1) {
    return topCandidate;
  }

  const progress = getTasklineProgress(topCandidate.taskline.id, toonId);
  if (!progress) {
    return topCandidate;
  }

  const objectiveKey = `${topCandidate.objective.text}|${
    topCandidate.objective.location ?? ""
  }|${topCandidate.objective.building ?? ""}`.toLowerCase();
  
  const similarCandidates = topGroup.filter((candidate) => {
    if (candidate.taskline.id !== topCandidate.taskline.id) return false;
    const candidateKey = `${candidate.objective.text}|${
      candidate.objective.location ?? ""
    }|${candidate.objective.building ?? ""}`.toLowerCase();
    return candidateKey === objectiveKey;
  });

  if (similarCandidates.length <= 1) {
    return topCandidate;
  }

  const stepNumbers = Array.from(
    new Set(similarCandidates.map((candidate) => candidate.step.order))
  ).sort((a, b) => a - b);
  
  const preferredStep = findNextUncompletedStep(
    topCandidate.taskline.id,
    stepNumbers,
    toonId
  );

  if (preferredStep !== null) {
    const preferredCandidate = similarCandidates.find(
      (candidate) => candidate.step.order === preferredStep
    );
    if (preferredCandidate) {
      return preferredCandidate;
    }
  }

  return topCandidate;
}

/**
 * Build the final match result and debug info from the best candidate.
 */
function buildMatchResult(
  best: MatchCandidate,
  category: TaskCategory
): { match: TaskMatch; debug: MatchDebugInfo } {
  const confidence = getConfidence(best.quality);
  const usedDeterministic =
    best.signals.npcMatch &&
    (best.signals.buildingMatch || best.signals.locationMatch);

  return {
    match: {
      taskline: best.taskline,
      step: best.step,
      confidence,
      matchedOn: best.signals.objectiveMatch === "exact" ? "exact" : "partial",
      matchedObjective: best.objective,
    },
    debug: {
      category,
      usedDeterministic,
      matchQuality: best.quality,
      objectiveMatch: best.signals.objectiveMatch,
      matchSignals: best.signals,
      matchedObjective: best.objective,
      bestCandidate: {
        tasklineId: best.taskline.id,
        stepOrder: best.step.order,
        matchQuality: best.quality,
        objectiveMatch: best.signals.objectiveMatch,
        objective: best.objective,
      },
    },
  };
}

/**
 * Debug/test helper: Get pipeline filtering results.
 * @internal For debugging and test scripts only
 */
export function getTasklineFilterPipeline(
  task: Task,
  toonData?: ToonData,
  options?: { includeCandidates?: boolean; disabledStages?: TasklineFilterStageName[] }
): TasklineFilterPipeline {
  const objectiveText = buildTaskObjectiveText(task, false);
  const allowedPlaygrounds = getAllowedPlaygrounds(task, toonData, undefined);
  const { stages, totalCandidates, candidates } = runTasklineFilterPipeline({
    task,
    objectiveText,
    candidates: getTasklineCandidates(),
    allowedPlaygrounds,
    disabledStages: options?.disabledStages?.length ? new Set(options.disabledStages) : undefined,
    allowCandidate: (c) => c.taskline.category !== "cog_disguise" || canConsiderCogDisguiseTaskline(c.taskline.id, toonData),
  });
  return {
    totalCandidates,
    stages,
    allowedPlaygrounds: allowedPlaygrounds ? Array.from(allowedPlaygrounds.values()) : null,
    candidates: options?.includeCandidates ? candidates : undefined,
  };
}

export function findTasklineMatchWithToonDataDetailed(
  task: Task,
  toonData?: ToonData,
  overjoyed?: boolean
): { match: TaskMatch | null; debug: MatchDebugInfo } {
  // Early exit for non-matchable tasks
  const category = categorizeTask(task);
  if (category !== "matchable") {
    return {
      match: null,
      debug: {
        category,
        unmatchedReason: category,
      },
    };
  }

  // Extract task information
  const objectiveText = buildTaskObjectiveText(task, false);
  const toonId = toonData?.data?.toon?.id ?? null;
  const taskLocation = extractLocation(task);
  const allowedPlaygrounds = getAllowedPlaygrounds(task, toonData, overjoyed);
  const allCandidates = getTasklineCandidates();

  // Get chain context for sequential task matching
  const chainContext = toonId ? getToonChainContext(toonId) : null;
  const hasChainEvidence = Boolean(chainContext && fromMatchesChainContext(task.from, chainContext.context));

  // Run pipeline to filter candidates
  const pipeline = runTasklineFilterPipeline({
    task,
    objectiveText,
    candidates: allCandidates,
    allowedPlaygrounds,
    allowCandidate: (candidate) =>
      candidate.taskline.category !== "cog_disguise" ||
      canConsiderCogDisguiseTaskline(candidate.taskline.id, toonData, overjoyed),
  });

  const candidates = pipeline.candidates;

  // Calculate signals and rank candidates
  const matchCandidates = rankMatchCandidates(
    candidates,
    task,
    taskLocation,
    objectiveText,
    chainContext,
    hasChainEvidence
  );

  // Handle no matches
  if (matchCandidates.length === 0) {
    return {
      match: null,
      debug: {
        category,
        unmatchedReason: candidates.length ? "no_match" : "no_candidates",
      },
    };
  }

  // All returned candidates are in the same priority tier (deterministic)
  // When multiple tasklines match equally (e.g., DDL and Cashbot Cog Disguise
  // both have "Visit Nat"), just pick the first one - they're equivalent content

  // Resolve tiebreakers using progress data
  const best = resolveProgressTiebreaker(matchCandidates, toonId);

  // Build and return final result
  return buildMatchResult(best, category);
}

export function findTasklineMatchWithToonData(
  task: Task,
  toonData?: ToonData,
  overjoyed?: boolean
): TaskMatch | null {
  return findTasklineMatchWithToonDataDetailed(task, toonData, overjoyed).match;
}
