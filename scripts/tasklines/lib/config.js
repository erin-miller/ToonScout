const path = require('path');

/**
 * @typedef {Object} TasklineConfig
 * @property {string} file
 * @property {string} playground
 * @property {string} category
 * @property {string} taskCategory
 */

/**
 * @typedef {Object} CogDisguisePageConfig
 * @property {string} file
 * @property {string} playground
 * @property {string} title
 */

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '..', 'packages', 'webapp', 'data', 'tasklines');
const METADATA_PATH = path.join(OUTPUT_DIR, 'metadata.json');

/** @type {TasklineConfig[]} */
const PLAYGROUND_CONFIGS = [
  {
    file: 'toontown_central.json',
    playground: 'Toontown Central',
    category: 'Toontown Central ToonTasks',
    taskCategory: 'playground',
  },
  {
    file: 'donalds_dock.json',
    playground: "Donald's Dock",
    category: "Donald's Dock ToonTasks",
    taskCategory: 'playground',
  },
  {
    file: 'daisy_gardens.json',
    playground: 'Daisy Gardens',
    category: 'Daisy Gardens ToonTasks',
    taskCategory: 'playground',
  },
  {
    file: 'minnies_melodyland.json',
    playground: "Minnie's Melodyland",
    category: "Minnie's Melodyland ToonTasks",
    taskCategory: 'playground',
  },
  {
    file: 'the_brrrgh.json',
    playground: 'The Brrrgh',
    category: 'The Brrrgh ToonTasks',
    taskCategory: 'playground',
  },
  {
    file: 'donalds_dreamland.json',
    playground: "Donald's Dreamland",
    category: "Donald's Dreamland ToonTasks",
    taskCategory: 'playground',
  },
];

/** @type {TasklineConfig[]} */
const SPECIAL_CONFIGS = [
  {
    file: 'sellbot_task_force.json',
    playground: 'Sellbot Task Force',
    category: 'Sellbot Task Force ToonTasks',
    taskCategory: 'task_force',
  },
];

// Single-page cog disguises (all tasks on one wiki page)
/** @type {CogDisguisePageConfig[]} */
const COG_DISGUISE_PAGES = [
  {
    file: 'lawbot_cog_disguise.json',
    playground: 'Lawbot Cog Disguise',
    title: 'Lawbot_Cog_Disguise',
  },
  {
    file: 'bossbot_cog_disguise.json',
    playground: 'Bossbot Cog Disguise',
    title: 'Bossbot_Cog_Disguise',
  },
];

// Cashbot is handled separately because its tasks are spread across multiple pages
// in the Donald's Dreamland ToonTasks category (8 wiki-documented parts).
// NOTE: 4 arm parts from random tasks are intentionally excluded - they have no
// dedicated wiki pages and will likely change in the upcoming task revamp.
const CASHBOT_DISGUISE_CONFIGS = {
  file: 'cashbot_cog_disguise.json',
  playground: 'Cashbot Cog Disguise',
  titleSubstring: 'Cashbot Cog Disguise',
};

module.exports = {
  OUTPUT_DIR,
  METADATA_PATH,
  PLAYGROUND_CONFIGS,
  SPECIAL_CONFIGS,
  COG_DISGUISE_PAGES,
  CASHBOT_DISGUISE_CONFIGS,
};
