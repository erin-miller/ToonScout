import { Task, Taskline } from '../types';

const STORAGE_KEY = 'toonscout_taskline_progress';

export interface TasklineProgress {
  tasklineId: string;
  completedSteps: number[];
  lastSeenStep: number;
  lastUpdated: number;
}

/**
 * Load all taskline progress from localStorage
 */
function loadProgress(): Map<string, TasklineProgress> {
  if (typeof window === 'undefined') return new Map();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Map();

    const data = JSON.parse(stored);
    return new Map(Object.entries(data));
  } catch (error) {
    console.error('[Taskline Progress] Failed to load:', error);
    return new Map();
  }
}

/**
 * Save all taskline progress to localStorage
 */
function saveProgress(progress: Map<string, TasklineProgress>): void {
  if (typeof window === 'undefined') return;

  try {
    const data = Object.fromEntries(progress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Taskline Progress] Failed to save:', error);
  }
}

/**
 * Get progress for a specific taskline
 */
export function getTasklineProgress(tasklineId: string): TasklineProgress | null {
  const allProgress = loadProgress();
  return allProgress.get(tasklineId) || null;
}

/**
 * Mark a step as completed
 * This helps track which "Visit Zari" steps have been done
 */
export function markStepCompleted(tasklineId: string, stepNumber: number): void {
  const allProgress = loadProgress();
  let progress = allProgress.get(tasklineId);

  if (!progress) {
    progress = {
      tasklineId,
      completedSteps: [],
      lastSeenStep: stepNumber,
      lastUpdated: Date.now(),
    };
  }

  if (!progress.completedSteps.includes(stepNumber)) {
    progress.completedSteps.push(stepNumber);
    progress.completedSteps.sort((a, b) => a - b);
  }

  progress.lastUpdated = Date.now();

  allProgress.set(tasklineId, progress);
  saveProgress(allProgress);

}

/**
 * Update which step user is currently on
 * Automatically marks previous steps as completed
 */
export function updateCurrentStep(
  tasklineId: string,
  currentStepNumber: number,
  autoMarkPrevious: boolean = true
): void {
  const allProgress = loadProgress();
  let progress = allProgress.get(tasklineId);

  if (!progress) {
    progress = {
      tasklineId,
      completedSteps: [],
      lastSeenStep: currentStepNumber,
      lastUpdated: Date.now(),
    };
  }

  if (autoMarkPrevious && currentStepNumber > progress.lastSeenStep) {
    for (let i = progress.lastSeenStep; i < currentStepNumber; i++) {
      if (!progress.completedSteps.includes(i)) {
        progress.completedSteps.push(i);
      }
    }
    progress.completedSteps.sort((a, b) => a - b);
  }

  progress.lastSeenStep = currentStepNumber;
  progress.lastUpdated = Date.now();

  allProgress.set(tasklineId, progress);
  saveProgress(allProgress);

}

/**
 * Find next uncompleted step that matches the task objective
 * This solves the "Visit Zari" problem by skipping completed steps
 */
export function findNextUncompletedStep(
  tasklineId: string,
  matchingStepNumbers: number[]
): number | null {
  const progress = getTasklineProgress(tasklineId);

  if (!progress) {
    return matchingStepNumbers[0] || null;
  }

  for (const stepNumber of matchingStepNumbers) {
    if (!progress.completedSteps.includes(stepNumber)) {
      return stepNumber;
    }
  }

  const lastStep = matchingStepNumbers[matchingStepNumbers.length - 1];
  return lastStep || null;
}

/**
 * Reset progress for a taskline (e.g., when starting over)
 */
export function resetTasklineProgress(tasklineId: string): void {
  const allProgress = loadProgress();

  if (allProgress.delete(tasklineId)) {
    saveProgress(allProgress);
  }
}

/**
 * Clear all progress (debugging/reset)
 */
export function clearAllProgress(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Taskline Progress] Failed to clear:', error);
  }
}

/**
 * Detect if user has progressed forward based on task list changes
 * Compares current tasks with previous snapshot
 */
export function detectProgressFromTaskChanges(
  tasklineId: string,
  previousTasks: Task[],
  currentTasks: Task[]
): { progressMade: boolean; completedSteps: number[] } {
  const previousObjectives = new Set(previousTasks.map(t => t.objective.text));
  const currentObjectives = new Set(currentTasks.map(t => t.objective.text));

  const completedObjectives = Array.from(previousObjectives).filter(
    obj => !currentObjectives.has(obj)
  );

  if (completedObjectives.length > 0) {
    return {
      progressMade: true,
      completedSteps: [],
    };
  }

  return { progressMade: false, completedSteps: [] };
}

/**
 * Get a smart recommendation for which step user is likely on
 * Combines: progress tracking, user override, auto-detection
 */
export function getRecommendedStep(
  tasklineId: string,
  autoDetectedStep: number,
  userOverrideStep?: number
): number {
  const progress = getTasklineProgress(tasklineId);

  if (userOverrideStep !== undefined) {
    return Math.max(userOverrideStep, autoDetectedStep);
  }

  if (progress && progress.lastSeenStep) {
    return Math.max(progress.lastSeenStep, autoDetectedStep);
  }

  return autoDetectedStep;
}
