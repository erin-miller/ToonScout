// Taskline Override Management
// Stores user's manual step selections in localStorage

import { Task, TasklineOverride } from '../types';

const STORAGE_KEY = 'toonscout_taskline_overrides';

/**
 * Generate a unique key for a task
 * Uses task objective + location to identify the specific task
 */
function getTaskKey(task: Task): string {
  const location = task.objective.where || task.to?.neighborhood || '';
  return `${task.objective.text}_${location}`.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Load all taskline overrides from localStorage
 */
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

/**
 * Save all taskline overrides to localStorage
 */
function saveOverrides(overrides: Map<string, TasklineOverride>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data = Object.fromEntries(overrides);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Taskline Overrides] Failed to save:', error);
  }
}

/**
 * Get the user's override for a specific task
 */
export function getTasklineOverride(task: Task): TasklineOverride | null {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  const override = overrides.get(taskKey);
  if (!override) return null;
  
  // Clean up old overrides (older than 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (override.timestamp < thirtyDaysAgo) {
    overrides.delete(taskKey);
    saveOverrides(overrides);
    return null;
  }
  
  return override;
}

/**
 * Persist the user's selected step for a specific task/taskline combination.
 */
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

/**
 * Remove a user override for a specific task
 */
export function clearTasklineOverride(task: Task): void {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  if (overrides.delete(taskKey)) {
    saveOverrides(overrides);
  }
}

/**
 * Clear all taskline overrides (useful for reset/debugging)
 */
export function clearAllOverrides(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Taskline Overrides] Failed to clear:', error);
  }
}

/**
 * Apply user override to a taskline match
 * Honours the exact step the user selected when an override is present.
 */
export function applyOverrideToMatch(
  task: Task,
  detectedStepNumber: number,
  tasklineId: string
): number {
  const override = getTasklineOverride(task);
  
  // No override set for this task
  if (!override) return detectedStepNumber;
  
  // Override is for a different taskline - ignore it
  if (override.tasklineId !== tasklineId) {
    return detectedStepNumber;
  }

  return override.stepNumber;
}

/**
 * Get the last known step for a taskline (from override)
 * Returns null if no override exists
 */
export function getLastKnownStep(task: Task, tasklineId: string): number | null {
  const override = getTasklineOverride(task);
  
  if (!override || override.tasklineId !== tasklineId) {
    return null;
  }
  
  return override.stepNumber;
}
