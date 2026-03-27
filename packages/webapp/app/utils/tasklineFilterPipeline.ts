import { Task } from '../types'
import { parseNumericRequirements, requirementsMatch } from './tasklineAnalysis'
import { normalizeTaskText } from './tasklineTextUtils'
import {
  extractLaffBoostValue,
  isTeleportAccessReward,
  isTrackFrameReward,
  isGagTrainingReward
} from './rewardPatterns'
import { isBossTask, findBossInText } from './bossPatterns'
import type { FilterCandidate, TasklineFilterStage, TasklineFilterStageName } from './tasklineMatchingTypes'

type PipelineInput = {
  task: Task
  objectiveText: string
  candidates: FilterCandidate[]
  allowedPlaygrounds: Set<string> | null
  allowCandidate?: (candidate: FilterCandidate) => boolean
  disabledStages?: Set<TasklineFilterStageName>
  inspectStage?: (stage: TasklineFilterStageName, remaining: FilterCandidate[], previous: FilterCandidate[]) => void
}

type PipelineResult = {
  totalCandidates: number
  stages: TasklineFilterStage[]
  candidates: FilterCandidate[]
}

/**
 * Simplified filter pipeline:
 * 1. playground - Filter by allowed playgrounds (based on gag tracks)
 * 2. npc_taskline - Keep tasklines where ANY step mentions the to NPC
 * 3. first_step - If from is empty, must be step 1; if present, not step 1
 * 4. reward - Match laff values exactly, handle teleport/gag
 * 5. numeric - Match count and level requirements
 */
export function runTasklineFilterPipeline({
  task,
  objectiveText,
  candidates,
  allowedPlaygrounds,
  allowCandidate,
  disabledStages,
  inspectStage
}: PipelineInput): PipelineResult {
  const stages: TasklineFilterStage[] = []
  const disabled = disabledStages ?? new Set<TasklineFilterStageName>()

  const recordStage = (stage: TasklineFilterStageName, previous: FilterCandidate[], remaining: FilterCandidate[]) => {
    stages.push({
      stage,
      remaining: remaining.length,
      dropped: Math.max(previous.length - remaining.length, 0)
    })
    inspectStage?.(stage, remaining, previous)
  }

  const eligibleCandidates = allowCandidate ? candidates.filter(allowCandidate) : candidates
  recordStage('all', eligibleCandidates, eligibleCandidates)

  let filtered = eligibleCandidates

  // Stage 1: Playground filter
  if (allowedPlaygrounds) {
    const next = disabled.has('playground')
      ? filtered
      : filtered.filter(candidate => {
          if (!candidate.tasklinePlayground) return true
          return allowedPlaygrounds.has(candidate.tasklinePlayground)
        })
    recordStage('playground', filtered, next)
    filtered = next
  } else {
    recordStage('playground', filtered, filtered)
  }

  // Stage 2: NPC taskline-level filter
  {
    const toNpc = task.to?.name?.trim()
    const next = disabled.has('npc_taskline') ? filtered : filterByNpcTaskline(filtered, toNpc)
    recordStage('npc_taskline', filtered, next)
    filtered = next
  }

  // Stage 3: First step filter
  {
    const fromNpc = task.from?.name?.trim()
    const next = disabled.has('first_step') ? filtered : filterByFirstStep(filtered, fromNpc, objectiveText)
    recordStage('first_step', filtered, next)
    filtered = next
  }

  // Stage 4: Reward filter (simplified)
  {
    const next = disabled.has('reward') ? filtered : filterByReward(filtered, task.reward)
    recordStage('reward', filtered, next)
    filtered = next
  }

  // Stage 5: Numeric filter
  {
    const next = disabled.has('numeric')
      ? filtered
      : filtered.filter(candidate => !isNumericMismatch(task, objectiveText, candidate.objective.text))
    recordStage('numeric', filtered, next)
    filtered = next
  }

  return {
    totalCandidates: eligibleCandidates.length,
    stages,
    candidates: filtered
  }
}

/**
 * NPC taskline-level filter: Keep candidates from tasklines where ANY step
 * mentions the destination NPC. This is the key innovation - it recognizes
 * that if an NPC appears anywhere in a taskline, the whole taskline is relevant.
 *
 * Exception: "HQ Officer" is a generic NPC that appears in many tasklines
 * across different playgrounds and should not be used to narrow down matches.
 */
function filterByNpcTaskline(candidates: FilterCandidate[], toNpc: string | null | undefined): FilterCandidate[] {
  if (!toNpc) return candidates

  const normalizedNpc = normalizeTaskText(toNpc)
  if (!normalizedNpc) return candidates

  // HQ Officer is too generic to use for filtering - appears in many tasklines
  if (normalizedNpc.includes('hq officer') || normalizedNpc === 'hq') {
    return candidates
  }

  // Find all tasklines that have ANY step mentioning this NPC
  const tasklinesWithNpc = new Set<string>()
  for (const candidate of candidates) {
    const normalizedObjective = normalizeTaskText(candidate.objective.text)
    if (normalizedObjective.includes(normalizedNpc)) {
      tasklinesWithNpc.add(candidate.taskline.id)
    }
  }

  // If no tasklines mention the NPC, keep all (fallback)
  if (tasklinesWithNpc.size === 0) return candidates

  // Keep all candidates from tasklines that mention the NPC
  return candidates.filter(c => tasklinesWithNpc.has(c.taskline.id))
}

/**
 * First step filter: Use the from NPC field to determine step position.
 * - Empty from = this must be step 1 of the taskline
 * - Non-empty from = this is NOT step 1
 * - "Choose ..." objectives skip this filter (gag choice steps have no fromNpc)
 */
function filterByFirstStep(
  candidates: FilterCandidate[],
  fromNpc: string | null | undefined,
  objectiveText: string
): FilterCandidate[] {
  // "Choose between X and Y" objectives are gag choice steps that have no fromNpc
  // but are not necessarily step 1, so skip filtering for these
  const normalizedObjective = normalizeTaskText(objectiveText)
  if (normalizedObjective.startsWith('choose ') || normalizedObjective.includes('choose between')) {
    return candidates
  }

  const isFirstStep = !fromNpc || fromNpc === ''
  return filterWithFallback(candidates, c => {
    if (!isFirstStep) {
      return c.step.order !== 1
    }
    if (c.step.order === 1) return true

    // Exception: If the objective text matches exactly (normalized), allow it even if not step 1
    // This handles cases where 'from' data is missing but the objective uniquely identifies a later step
    const candidateObj = normalizeTaskText(c.objective.text)
    return candidateObj === normalizedObjective
  })
}

/** Filter with fallback - returns matches if any, otherwise all candidates */
function filterWithFallback(
  candidates: FilterCandidate[],
  predicate: (c: FilterCandidate) => boolean
): FilterCandidate[] {
  const matches = candidates.filter(predicate)
  return matches.length > 0 ? matches : candidates
}

/** Get reward text from candidate (step reward or taskline name) */
function getCandidateReward(c: FilterCandidate): string {
  return c.step.reward ?? c.taskline.name ?? ''
}

/**
 * Reward filter: Match laff values, teleport access, gag training, or reward text.
 * Track frame rewards pass through (random/procedural tasks).
 */
function filterByReward(candidates: FilterCandidate[], taskReward: string | null | undefined): FilterCandidate[] {
  if (!taskReward || isTrackFrameReward(taskReward)) return candidates

  const taskLaff = extractLaffBoostValue(taskReward)
  if (taskLaff !== null) {
    // Laff boost values must match exactly - no fallback
    // If no taskline has this laff boost value, return empty (unmatched)
    return candidates.filter(c => extractLaffBoostValue(getCandidateReward(c)) === taskLaff)
  }

  if (isTeleportAccessReward(taskReward)) {
    return filterWithFallback(candidates, c => getCandidateReward(c).toLowerCase().includes('teleport access'))
  }

  if (isGagTrainingReward(taskReward)) {
    return filterWithFallback(candidates, c => isGagTrainingReward(getCandidateReward(c)))
  }

  // Match reward text to taskline name
  const normalizedTaskReward = normalizeTaskText(taskReward)
  if (normalizedTaskReward) {
    const matched = candidates.filter(c => {
      const candidateReward = normalizeTaskText(getCandidateReward(c))
      if (candidateReward.includes(normalizedTaskReward) || normalizedTaskReward.includes(candidateReward)) {
        return true
      }
      // "Carry X ToonTasks" → "Increased ToonTask capacity" fuzzy match
      if (normalizedTaskReward.includes('toontask') && candidateReward.includes('toontask')) {
        return true
      }
      return false
    })
    return matched.length > 0 ? matched : candidates
  }

  return candidates
}

/**
 * Check if numeric requirements (count, level, story) mismatch.
 * Boss tasks get special handling since they don't have traditional levels.
 */
function isNumericMismatch(task: Task, taskObjectiveText: string, stepObjective: string): boolean {
  // Boss tasks: only check count, skip level/story checks
  if (isBossTask(taskObjectiveText)) {
    const taskBoss = findBossInText(taskObjectiveText)
    const stepBoss = findBossInText(stepObjective)

    // If bosses don't match, it's a mismatch
    if (taskBoss && stepBoss && taskBoss !== stepBoss) {
      return true
    }

    // For boss tasks, only check count (e.g., "Defeat 5 Vice Presidents")
    const taskRequirements = parseNumericRequirements(taskObjectiveText)
    const stepRequirements = parseNumericRequirements(stepObjective)
    const taskCount = getTaskTargetCount(task, taskRequirements)
    const stepCount = stepRequirements.count

    return taskCount !== null && stepCount !== null && taskCount !== stepCount
  }

  const taskRequirements = parseNumericRequirements(taskObjectiveText)
  const stepRequirements = parseNumericRequirements(stepObjective)

  // Get count from task progress if available
  const taskCount = getTaskTargetCount(task, taskRequirements)
  const stepCount = stepRequirements.count

  const countMismatch = taskCount !== null && stepCount !== null && taskCount !== stepCount
  const levelMismatch = !requirementsMatch(taskRequirements.level, stepRequirements.level)
  const storyMismatch = !requirementsMatch(taskRequirements.story, stepRequirements.story)

  return countMismatch || levelMismatch || storyMismatch
}

function getTaskTargetCount(task: Task, requirements: ReturnType<typeof parseNumericRequirements>): number | null {
  const target = task.objective?.progress?.target
  if (Number.isFinite(target) && target > 0) {
    return target
  }
  return requirements.count
}
