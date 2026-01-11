
import { cogImages } from "@/assets/cog_images";
import type { StaticImageData } from "next/image";
import { 
  cogNameMap, 
  normalizeCogName, 
  findCogInText, 
  containsCog,
  stripCogVariant,
  getAllCogs,
} from "./cogNames";

// Re-export for backward compatibility
export { sanitizeCogName } from "./cogNames";
export { cogNameMap } from "./cogNames";

const cogsData = getAllCogs();

// Advanced: Find relevant invasions for user's tasks using cog dictionary
export function getRelevantInvasionsForTasks(
  tasks: import("@/app/types").Task[],
  invasions: { cog: string; [key: string]: any }[],
) {
  // Filter out completed tasks
  const incompleteTasks = tasks.filter((task) => {
    // Check if the task has progress tracking
    if (
      task.objective?.progress &&
      typeof task.objective.progress.current === "number" &&
      typeof task.objective.progress.target === "number"
    ) {
      // Only include tasks that aren't complete
      return task.objective.progress.current < task.objective.progress.target;
    }
    // If there's no progress tracking, include the task by default
    return true;
  });

  return invasions.filter((invasion) => {
    const invasionCog = findCogInText(invasion.cog);
    if (!invasionCog) return false;
    
    return incompleteTasks.some((task) => {
      return containsCog(task.objective.text || "", invasionCog);
    });
  });
}

// Helper: Get image path for a cog name
export function getCogImage(cogName: string): StaticImageData | undefined {
  const { base: baseCogName, variant } = stripCogVariant(cogName);
  
  // Return skelecog image if it's a skelecog variant
  if (variant === 'skelecog') {
    return cogImages.skelecog;
  }

  // For regular cogs and version 2.0 cogs, find the base cog image
  const norm = normalizeCogName(baseCogName);
  const canonical = cogNameMap[norm] || norm;
  const cog = cogsData.find(
    (c: any) => c.name === canonical || c.fullname === canonical,
  );
  if (!cog || !cog.image) return undefined;
  const match = cog.image.match(/cog_images\/(.*)\.webp$/);
  const key = match ? match[1] : undefined;
  return key ? cogImages[key as keyof typeof cogImages] : undefined;
}
