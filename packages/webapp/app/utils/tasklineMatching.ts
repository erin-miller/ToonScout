
import { Task, Taskline, TasklineStep, TaskMatch } from '../types';
import { getAllTasklines } from '../../data/tasklines';
import { findNextUncompletedStep } from './tasklineProgress';

/**
 * Normalizes text for comparison by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing extra spaces
 * - Removing punctuation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '');
}

/**
 * Extracts location information from task objective text
 * e.g., "Visit Zari in House of Zzzzzs Pajama Place, Donald's Dreamland"
 * Returns: { building: "House of Zzzzzs", street: "Pajama Place", location: "Donald's Dreamland" }
 */
function extractLocationFromObjective(objective: string): { building?: string; street?: string; location?: string } {
  const normalized = objective.toLowerCase();
  
  // Common playground names
  const playgrounds = [
    "toontown central",
    "donald's dreamland",
    "donalds dreamland",
    "daisy gardens",
    "minnie's melodyland",
    "minnies melodyland",
    "the brrrgh",
    "donald's dock",
    "donalds dock"
  ];
  
  let location: string | undefined;
  for (const pg of playgrounds) {
    if (normalized.includes(pg)) {
      location = pg;
      break;
    }
  }
  
  return { location };
}

/**
 * Checks if task objective matches a taskline step with location awareness
 */
function isLocationAwareMatch(taskObjective: string, step: TasklineStep): boolean {
  const normalizedTask = normalizeText(taskObjective);
  const normalizedStep = normalizeText(step.objective);
  
  // Extract location info from task
  const taskLocation = extractLocationFromObjective(taskObjective);
  
  // Check if the core objective matches
  const coreMatch = normalizedTask.includes(normalizedStep) || normalizedStep.includes(normalizedTask);
  
  if (!coreMatch) return false;
  
  // If we have location info in both, verify they match
  if (taskLocation.location && step.location) {
    const stepLocation = normalizeText(step.location);
    const taskLoc = normalizeText(taskLocation.location);
    
    // Allow partial location matches (e.g., "donald's dreamland" matches "donalds dreamland")
    if (!stepLocation.includes(taskLoc) && !taskLoc.includes(stepLocation)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Finds the best matching taskline for a given task
 * Returns null if no match found
 */
export function findTasklineMatch(task: Task): TaskMatch | null {
  // Construct full objective text from task data
  let objectiveText = task.objective.text;
  
  // For "Visit" tasks, append the NPC name
  if (objectiveText.toLowerCase().trim() === 'visit' && task.to?.name) {
    objectiveText = `Visit ${task.to.name}`;
  }
  
  // Append location information if available
  if (task.objective.where) {
    objectiveText = `${objectiveText} in ${task.objective.where}`;
  } else if (task.to?.building && task.to?.neighborhood) {
    objectiveText = `${objectiveText} in ${task.to.building} ${task.to.neighborhood}`;
  }
  
  const normalizedObjective = normalizeText(objectiveText);
  const allTasklines = getAllTasklines();

  // Track matching steps for progress-aware selection
  const matchingSteps: Array<{ taskline: Taskline; step: TasklineStep; matchType: 'exact' | 'alternative' }> = [];

  // 1. Try exact match first (with location awareness)
  for (const taskline of allTasklines) {
    for (const step of taskline.steps) {
      if (normalizeText(step.objective) === normalizedObjective) {
        // Verify location if available
        if (isLocationAwareMatch(objectiveText, step)) {
          matchingSteps.push({ taskline, step, matchType: 'exact' });
        }
      }
    }
  }

  // 2. Try alternative text matches (with location awareness)
  if (matchingSteps.length === 0) {
    for (const taskline of allTasklines) {
      for (const step of taskline.steps) {
        if (step.alternatives) {
          const matchedAlt = step.alternatives.find(
            alt => normalizeText(alt) === normalizedObjective
          );
          if (matchedAlt && isLocationAwareMatch(objectiveText, step)) {
            matchingSteps.push({ taskline, step, matchType: 'alternative' });
          }
        }
      }
    }
  }

  // If we have multiple exact/alternative matches (like "Visit Zari"), use progress tracking to filter
  if (matchingSteps.length > 1) {
    // Group by taskline
    const matchesByTaskline = new Map<
      string,
      { taskline: Taskline; matches: Array<{ step: TasklineStep; matchType: 'exact' | 'alternative' }> }
    >();

    matchingSteps.forEach(({ taskline, step, matchType }) => {
      if (!matchesByTaskline.has(taskline.id)) {
        matchesByTaskline.set(taskline.id, { taskline, matches: [] });
      }
      matchesByTaskline.get(taskline.id)!.matches.push({ step, matchType });
    });
    
    // For each taskline, find the next uncompleted step using progress tracking
    for (const [tasklineId, data] of matchesByTaskline.entries()) {
      const { taskline, matches } = data;
      // Sort matches by step order
      const sortedMatches = [...matches].sort((a, b) => a.step.order - b.step.order);
      const matchingStepNumbers = sortedMatches.map(m => m.step.order);
      
      // Use progress tracking to find next uncompleted step
      const selectedStepNumber = findNextUncompletedStep(tasklineId, matchingStepNumbers);
      
      if (selectedStepNumber !== null) {
        const selectedMatch = sortedMatches.find(m => m.step.order === selectedStepNumber);

        if (selectedMatch) {
          return {
            taskline,
            step: selectedMatch.step,
            confidence: 'high',
            matchedOn: selectedMatch.matchType,
          };
        }
      }
      
      // Fallback: use first match if progress tracking didn't help
      const fallbackMatch = sortedMatches[0];
      
      return {
        taskline,
        step: fallbackMatch.step,
        confidence: 'high',
        matchedOn: fallbackMatch.matchType,
      };
    }
  }

  // Single exact/alternative match - return it
  if (matchingSteps.length === 1) {
    const match = matchingSteps[0];
    return {
      taskline: match.taskline,
      step: match.step,
      confidence: 'high',
      matchedOn: match.matchType,
    };
  }

  // 3. Try location-aware partial match
  let bestMatch: { taskline: Taskline; step: TasklineStep; score: number } | null = null;
  
  for (const taskline of allTasklines) {
    for (const step of taskline.steps) {
      if (isLocationAwareMatch(objectiveText, step)) {
        // Calculate match score based on text similarity
        const normalizedStep = normalizeText(step.objective);
        let score = 0;
        
        // Longer matches are better
        if (normalizedObjective.includes(normalizedStep)) {
          score = normalizedStep.length;
        } else if (normalizedStep.includes(normalizedObjective)) {
          score = normalizedObjective.length;
        }
        
        // Bonus for location match
        if (step.location && objectiveText.toLowerCase().includes(step.location.toLowerCase())) {
          score += 10;
        }
        
        // Bonus for building match
        if (step.building && objectiveText.toLowerCase().includes(step.building.toLowerCase())) {
          score += 10;
        }
        
        // Bonus for reward match (optional but helpful)
        if (task.reward && step.reward && normalizeText(task.reward) === normalizeText(step.reward)) {
          score += 15;
        }
        
        if (score > 0) {
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { taskline, step, score };
          }
        }
      }
    }
  }
  
  if (bestMatch) {
    return {
      taskline: bestMatch.taskline,
      step: bestMatch.step,
      confidence: 'medium',
      matchedOn: 'partial',
    };
  }

  // Log unmatched tasks for data improvement (development only)
  return null; // No match found
}

/**
 * Batch match multiple tasks at once
 */
export function matchAllTasks(tasks: Task[]): Map<Task, TaskMatch | null> {
  const matches = new Map<Task, TaskMatch | null>();

  for (const task of tasks) {
    matches.set(task, findTasklineMatch(task));
  }

  return matches;
}

/**
 * Get statistics about match quality
 */
export function getMatchStats(matches: Map<Task, TaskMatch | null>) {
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let noMatch = 0;

  matches.forEach(match => {
    if (!match) {
      noMatch++;
    } else if (match.confidence === 'high') {
      highConfidence++;
    } else if (match.confidence === 'medium') {
      mediumConfidence++;
    } else {
      lowConfidence++;
    }
  });

  return { highConfidence, mediumConfidence, lowConfidence, noMatch };
}
