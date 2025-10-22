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
    console.log('[Taskline Overrides] Removing stale override:', taskKey);
    overrides.delete(taskKey);
    saveOverrides(overrides);
    return null;
  }
  
  return override;
}

/**
 * Set a user override for a specific task and taskline step
 * This acts as a "minimum step" - auto-detection can still progress beyond this
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
  
  console.log('[Taskline Overrides] Set override:', {
    taskKey,
    tasklineId,
    stepNumber,
  });
}

/**
 * Remove a user override for a specific task
 */
export function clearTasklineOverride(task: Task): void {
  const taskKey = getTaskKey(task);
  const overrides = loadOverrides();
  
  if (overrides.delete(taskKey)) {
    saveOverrides(overrides);
    console.log('[Taskline Overrides] Cleared override:', taskKey);
  }
}

/**
 * Clear all taskline overrides (useful for reset/debugging)
 */
export function clearAllOverrides(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[Taskline Overrides] Cleared all overrides');
  } catch (error) {
    console.error('[Taskline Overrides] Failed to clear:', error);
  }
}

/**
 * Apply user override to a taskline match
 * Uses the larger of: detected step or user override (user minimum concept)
 * Also considers previous/next step tolerance for small sync issues
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
    console.log('[Taskline Overrides] Override is for different taskline, ignoring');
    return detectedStepNumber;
  }
  
  // Use the larger step number (user minimum, but can progress beyond)
  const finalStep = Math.max(detectedStepNumber, override.stepNumber);
  
  if (finalStep !== detectedStepNumber) {
    console.log('[Taskline Overrides] Applied override:', {
      detected: detectedStepNumber,
      override: override.stepNumber,
      final: finalStep,
    });
  }
  
  return finalStep;
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
