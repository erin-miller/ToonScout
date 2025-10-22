import { Task, TasklineOverride } from '../types';

const STORAGE_KEY = 'toonscout_taskline_overrides';

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
    task.from?.building,
  ]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.toLowerCase().trim().replace(/\s+/g, "_"));
}

function getTaskKey(task: Task): string {
  return getTaskSignatureParts(task).join("|");
}

function loadOverrides(): Map<string, TasklineOverride> {
  if (typeof window === 'undefined') return new Map();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();
    
    const data = JSON.parse(stored);
    return new Map(Object.entries(data));
  } catch (error) {
    console.error('[Taskline Overrides] Failed to load:', error);
    return new Map();
  }
}

function saveOverrides(overrides: Map<string, TasklineOverride>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(overrides);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Taskline Overrides] Failed to save:', error);
  }
}

export function getTasklineOverride(task: Task): TasklineOverride | null {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  const override = overrides.get(taskKey);
  if (!override) return null;
  
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (override.timestamp < thirtyDaysAgo) {
    overrides.delete(taskKey);
    saveOverrides(overrides);
    return null;
  }
  
  return override;
}

export function setTasklineOverride(
  task: Task,
  tasklineId: string,
  stepNumber: number
): void {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  const override: TasklineOverride = {
    tasklineId,
    stepNumber,
    timestamp: Date.now(),
  };
  
  overrides.set(taskKey, override);
  saveOverrides(overrides);
}

export function clearTasklineOverride(task: Task): void {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  if (overrides.delete(taskKey)) {
    saveOverrides(overrides);
  }
}

export function clearAllOverrides(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Taskline Overrides] Failed to clear:', error);
  }
}

export function applyOverrideToMatch(
  task: Task,
  detectedStepNumber: number,
  tasklineId: string
): number {
  const override = getTasklineOverride(task);
  
  if (!override) return detectedStepNumber;
  
  if (override.tasklineId !== tasklineId) {
    return detectedStepNumber;
  }

  return override.stepNumber;
}

export function getLastKnownStep(task: Task, tasklineId: string): number | null {
  const override = getTasklineOverride(task);
  
  if (!override || override.tasklineId !== tasklineId) {
    return null;
  }
  
  return override.stepNumber;
}
