// Taskline Data Index
// This file aggregates all taskline data from JSON files

import toontownCentralData from './toontown_central.json';
import donaldsDockData from './donalds_dock.json';
import daisyGardensData from './daisy_gardens.json';
import minniesmelodyland from './minnies_melodyland.json';
import theBrrghData from './the_brrrgh.json';
import donaldsDreamlandData from './donalds_dreamland.json';
import sellbotTaskForceData from './sellbot_task_force.json';
import cashbotCogDisguiseData from './cashbot_cog_disguise.json';
import lawbotCogDisguiseData from './lawbot_cog_disguise.json';
import bossbotCogDisguiseData from './bossbot_cog_disguise.json';

import { Taskline } from '../../app/types';

// Type assertions for JSON imports (all are now flat arrays)
const toontownCentral = toontownCentralData as unknown as Taskline[];
const donaldsDock = donaldsDockData as unknown as Taskline[];
const daisyGardens = daisyGardensData as unknown as Taskline[];
const minnies = minniesmelodyland as unknown as Taskline[];
const theBrrgh = theBrrghData as unknown as Taskline[];
const donaldsDreamland = donaldsDreamlandData as unknown as Taskline[];
const sellbotTaskForce = sellbotTaskForceData as unknown as Taskline[];
const cashbotCogDisguise = cashbotCogDisguiseData as unknown as Taskline[];
const lawbotCogDisguise = lawbotCogDisguiseData as unknown as Taskline[];
const bossbotCogDisguise = bossbotCogDisguiseData as unknown as Taskline[];

// Organize tasklines by playground
export const tasklinesByPlayground: Record<string, Taskline[]> = {
  'Toontown Central': toontownCentral,
  "Donald's Dock": donaldsDock,
  'Daisy Gardens': daisyGardens,
  "Minnie's Melodyland": minnies,
  'The Brrrgh': theBrrgh,
  "Donald's Dreamland": donaldsDreamland,
};

// Special tasklines (not tied to specific playground)
// Note: Cashbot suit parts also remain in DDL tasklines since they're obtained during DDL progression
export const specialTasklines: Record<string, Taskline[]> = {
  'Sellbot Task Force': sellbotTaskForce,
  'Cashbot Cog Disguise': cashbotCogDisguise, // 8 of 12 parts (4 arm parts are from random tasks with no wiki pages)
  'Lawbot Cog Disguise': lawbotCogDisguise,
  'Bossbot Cog Disguise': bossbotCogDisguise,
};

// Helper to get all tasklines as flat array
export function getAllTasklines(): Taskline[] {
  const playgroundTasks = Object.values(tasklinesByPlayground).flat();
  const specialTasks = Object.values(specialTasklines).flat();
  return [...playgroundTasks, ...specialTasks];
}

// Helper to find taskline by ID
export function getTasklineById(id: string): Taskline | undefined {
  return getAllTasklines().find(tl => tl.id === id);
}

// Helper to get tasklines by playground name
export function getTasklinesByPlayground(playgroundName: string): Taskline[] {
  return tasklinesByPlayground[playgroundName] || [];
}

// Helper to get tasklines by category
export function getTasklinesByCategory(category: string): Taskline[] {
  return getAllTasklines().filter(tl => tl.category === category);
}
