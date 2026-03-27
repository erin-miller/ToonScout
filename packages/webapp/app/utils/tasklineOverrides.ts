import { Task, TasklineOverride } from '../types'

const STORAGE_KEY = 'toonscout_taskline_overrides'

export function getTaskSignatureParts(task: Task): string[] {
  return [
    task.objective.text,
    task.objective.where,
    task.reward,
    task.type,
    task.to?.name,
    task.to?.building,
    task.to?.neighborhood,
    task.from?.name,
    task.from?.building
  ]
    .filter((part): part is string => Boolean(part))
    .map(part => part.toLowerCase().trim().replace(/\s+/g, '_'))
}

function getTaskKey(task: Task): string {
  return getTaskSignatureParts(task).join('|')
}

function getOverrideKey(task: Task, toonId?: string | null): string {
  if (!toonId) return getTaskKey(task)
  return `${toonId}::${getTaskKey(task)}`
}

function loadOverrides(): Map<string, TasklineOverride> {
  if (typeof window === 'undefined') return new Map()

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Map()

    const data = JSON.parse(stored)
    return new Map(Object.entries(data))
  } catch (error) {
    console.error('[Taskline Overrides] Failed to load:', error)
    return new Map()
  }
}

function saveOverrides(overrides: Map<string, TasklineOverride>): void {
  if (typeof window === 'undefined') return

  try {
    const data = Object.fromEntries(overrides)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[Taskline Overrides] Failed to save:', error)
  }
}

export function getTasklineOverride(task: Task, toonId?: string | null): TasklineOverride | null {
  const scopedKey = getOverrideKey(task, toonId)
  const overrides = loadOverrides()

  const override = overrides.get(scopedKey)
  const overrideKey = scopedKey

  if (!override) return null

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  if (override.timestamp < thirtyDaysAgo) {
    overrides.delete(overrideKey)
    saveOverrides(overrides)
    return null
  }

  return override
}

export function setTasklineOverride(task: Task, tasklineId: string, stepNumber: number, toonId?: string | null): void {
  const taskKey = getOverrideKey(task, toonId)
  const overrides = loadOverrides()

  const override: TasklineOverride = {
    tasklineId,
    stepNumber,
    timestamp: Date.now()
  }

  overrides.set(taskKey, override)
  saveOverrides(overrides)
}

export function clearTasklineOverride(task: Task, toonId?: string | null): void {
  const taskKey = getOverrideKey(task, toonId)
  const overrides = loadOverrides()

  const removed = overrides.delete(taskKey)

  if (removed) {
    saveOverrides(overrides)
  }
}

export function applyOverrideToMatch(
  task: Task,
  detectedStepNumber: number,
  tasklineId: string,
  toonId?: string | null
): number {
  const override = getTasklineOverride(task, toonId)

  if (!override) return detectedStepNumber

  if (override.tasklineId !== tasklineId) {
    return detectedStepNumber
  }

  return override.stepNumber
}
