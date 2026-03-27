const STORAGE_KEY = 'toonscout_taskline_progress'

type ProgressStore = Record<string, Record<string, TasklineProgress>>

/**
 * Chain context captures the destination of the last matched step.
 * This enables chain validation: if task.from matches lastStepTo,
 * we can strongly prefer the next step in this taskline.
 */
export interface ChainContext {
  toName: string | null
  toBuilding: string | null
  toNeighborhood: string | null
}

export interface TasklineProgress {
  tasklineId: string
  completedSteps: number[]
  lastSeenStep: number
  lastUpdated: number
  chainContext?: ChainContext
}

function loadProgressStore(): ProgressStore {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}

    const data = JSON.parse(stored)
    if (!data || typeof data !== 'object') return {}

    return data as ProgressStore
  } catch (error) {
    console.error('[Taskline Progress] Failed to load:', error)
    return {}
  }
}

function saveProgress(store: ProgressStore): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('[Taskline Progress] Failed to save:', error)
  }
}

function getToonProgress(store: ProgressStore, toonId?: string | null) {
  if (!toonId) return null
  return store[toonId] ?? null
}

export function getTasklineProgress(tasklineId: string, toonId?: string | null): TasklineProgress | null {
  const store = loadProgressStore()
  const toonProgress = getToonProgress(store, toonId)
  if (!toonProgress) return null
  return toonProgress[tasklineId] || null
}

export function markStepCompleted(tasklineId: string, stepNumber: number, toonId?: string | null): void {
  if (!toonId) return
  const store = loadProgressStore()
  const toonProgress = store[toonId] ?? {}
  let progress = toonProgress[tasklineId]

  if (!progress) {
    progress = {
      tasklineId,
      completedSteps: [],
      lastSeenStep: stepNumber,
      lastUpdated: Date.now()
    }
  }

  if (!progress.completedSteps.includes(stepNumber)) {
    progress.completedSteps.push(stepNumber)
    progress.completedSteps.sort((a, b) => a - b)
  }

  progress.lastUpdated = Date.now()

  toonProgress[tasklineId] = progress
  store[toonId] = toonProgress
  saveProgress(store)
}

export function updateCurrentStep(
  tasklineId: string,
  currentStepNumber: number,
  autoMarkPrevious: boolean = true,
  toonId?: string | null,
  allowRegression: boolean = false
): void {
  if (!toonId) return
  const store = loadProgressStore()
  const toonProgress = store[toonId] ?? {}
  let progress = toonProgress[tasklineId]

  if (!progress) {
    progress = {
      tasklineId,
      completedSteps: [],
      lastSeenStep: currentStepNumber,
      lastUpdated: Date.now()
    }
  }

  const nextStepNumber = allowRegression ? currentStepNumber : Math.max(currentStepNumber, progress.lastSeenStep)

  if (autoMarkPrevious && nextStepNumber > progress.lastSeenStep) {
    for (let i = progress.lastSeenStep; i < nextStepNumber; i++) {
      if (!progress.completedSteps.includes(i)) {
        progress.completedSteps.push(i)
      }
    }
    progress.completedSteps.sort((a, b) => a - b)
  }

  progress.lastSeenStep = nextStepNumber
  progress.lastUpdated = Date.now()

  toonProgress[tasklineId] = progress
  store[toonId] = toonProgress
  saveProgress(store)
}

/**
 * Remove progress data for a specific taskline.
 * Called automatically when a taskline is no longer active for a toon
 * (i.e., when they complete or abandon tasks related to that taskline).
 */
export function removeTasklineProgress(tasklineId: string, toonId?: string | null): void {
  if (!toonId) return
  const store = loadProgressStore()
  if (!store[toonId]?.[tasklineId]) return

  delete store[toonId][tasklineId]
  saveProgress(store)
}

/**
 * Remove all progress data for a toon.
 * Useful for cleaning up when a toon is deleted or for storage management.
 * @internal Reserved for future storage cleanup automation
 */
export function removeToonProgress(toonId: string): void {
  const store = loadProgressStore()
  if (store[toonId]) {
    delete store[toonId]
    saveProgress(store)
  }
}

/**
 * Find next uncompleted step that matches the task objective
 * This solves the "Visit Zari" problem by skipping completed steps
 */
export function findNextUncompletedStep(
  tasklineId: string,
  matchingStepNumbers: number[],
  toonId?: string | null
): number | null {
  const progress = getTasklineProgress(tasklineId, toonId)

  if (!progress) {
    return matchingStepNumbers[0] || null
  }

  for (const stepNumber of matchingStepNumbers) {
    if (!progress.completedSteps.includes(stepNumber)) {
      return stepNumber
    }
  }

  const lastStep = matchingStepNumbers[matchingStepNumbers.length - 1]
  return lastStep || null
}

/**
 * Get the chain context from a toon's most recently matched step.
 * Returns null if no chain context exists or if the toon has no progress.
 */
export function getToonChainContext(
  toonId?: string | null
): { tasklineId: string; stepOrder: number; context: ChainContext } | null {
  const store = loadProgressStore()
  const toonProgress = getToonProgress(store, toonId)
  if (!toonProgress) return null

  // Find the most recently updated taskline with chain context
  let mostRecent: {
    tasklineId: string
    stepOrder: number
    context: ChainContext
    lastUpdated: number
  } | null = null

  for (const [tasklineId, progress] of Object.entries(toonProgress)) {
    if (progress.chainContext && progress.lastUpdated) {
      if (!mostRecent || progress.lastUpdated > mostRecent.lastUpdated) {
        mostRecent = {
          tasklineId,
          stepOrder: progress.lastSeenStep,
          context: progress.chainContext,
          lastUpdated: progress.lastUpdated
        }
      }
    }
  }

  if (!mostRecent) return null

  return {
    tasklineId: mostRecent.tasklineId,
    stepOrder: mostRecent.stepOrder,
    context: mostRecent.context
  }
}

/**
 * Update the chain context after a successful match.
 * Called when we match a task to a taskline step - stores the task.to info
 * so subsequent matching can validate from→to chains.
 */
export function updateChainContext(
  tasklineId: string,
  stepOrder: number,
  chainContext: ChainContext,
  toonId?: string | null
): void {
  if (!toonId) return
  const store = loadProgressStore()
  const toonProgress = store[toonId] ?? {}
  let progress = toonProgress[tasklineId]

  if (!progress) {
    progress = {
      tasklineId,
      completedSteps: [],
      lastSeenStep: stepOrder,
      lastUpdated: Date.now(),
      chainContext
    }
  } else {
    progress.chainContext = chainContext
    progress.lastUpdated = Date.now()
  }

  toonProgress[tasklineId] = progress
  store[toonId] = toonProgress
  saveProgress(store)
}

/**
 * Check if a task's "from" context matches a chain context's "to".
 * Used to validate that step N's from matches step N-1's to.
 */
export function fromMatchesChainContext(
  taskFrom: { name?: string; building?: string; neighborhood?: string } | null | undefined,
  chainContext: ChainContext
): boolean {
  if (!taskFrom) return false

  const fromName = taskFrom.name?.trim().toLowerCase() ?? ''
  const toName = chainContext.toName?.trim().toLowerCase() ?? ''

  // Primary match: NPC name
  if (fromName && toName && fromName === toName) {
    return true
  }

  const fromBuilding = taskFrom.building?.trim().toLowerCase() ?? ''
  const toBuilding = chainContext.toBuilding?.trim().toLowerCase() ?? ''

  // Secondary match: building
  if (fromBuilding && toBuilding && fromBuilding === toBuilding) {
    return true
  }

  return false
}
