const fs = require('fs');
const path = require('path');

const {
  OUTPUT_DIR,
  METADATA_PATH,
  PLAYGROUND_CONFIGS,
  SPECIAL_CONFIGS,
  COG_DISGUISE_PAGES,
  CASHBOT_DISGUISE_CONFIGS,
} = require('./lib/config');
const { fetchCategoryMembers, fetchPageContent } = require('./lib/wiki');
const {
  slugify,
  extractSection,
  splitSubsections,
  parseToonTaskSteps,
  parseCogDisguiseSteps,
  normalizeTasklineName,
  buildWikiUrl,
} = require('./lib/parser');
const { diffTasklines, getDiffSummary, writeReport } = require('./lib/report');
const { writeMetadata } = require('./lib/metadata');

function loadExisting(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function getTasklineKey(taskline) {
  return `${taskline.wikiUrl || 'no-wiki'}::${taskline.id}`;
}

function orderByExisting(items, existingItems) {
  const indexMap = new Map(
    existingItems.map((item, index) => [getTasklineKey(item), index])
  );
  return [...items].sort((a, b) => {
    const aKey = getTasklineKey(a);
    const bKey = getTasklineKey(b);
    const aIndex = indexMap.has(aKey) ? indexMap.get(aKey) : Number.POSITIVE_INFINITY;
    const bIndex = indexMap.has(bKey) ? indexMap.get(bKey) : Number.POSITIVE_INFINITY;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a.name.localeCompare(b.name);
  });
}

function mergeWithExisting(taskline, existing, { preferExisting }) {
  if (!existing) {
    return taskline;
  }
  if (preferExisting) {
    return existing;
  }
  const existingSteps = new Map(existing.steps.map(step => [step.order, step]));
  const mergedSteps = taskline.steps.map(step => {
    const existingStep = existingSteps.get(step.order);
    if (!existingStep) {
      return step;
    }
    return {
      ...step,
      npc: step.npc ?? existingStep.npc,
      building: step.building ?? existingStep.building,
      location: step.location ?? existingStep.location,
      reward: step.reward ?? existingStep.reward,
    };
  });

  return {
    ...taskline,
    prerequisites: taskline.prerequisites ?? existing.prerequisites,
    steps: mergedSteps,
  };
}

async function writeTasklines(fileName, tasklines, { preferExisting }) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  const existing = loadExisting(filePath);
  const existingMap = new Map(existing.map(item => [getTasklineKey(item), item]));
  const merged = tasklines.map(item =>
    mergeWithExisting(item, existingMap.get(getTasklineKey(item)), { preferExisting })
  );
  const ordered = orderByExisting(merged, existing);
  const nextContent = `${JSON.stringify(ordered, null, 2)}\n`;
  const diff = diffTasklines(existing, ordered, getTasklineKey);

  if (preferExisting && fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    if (existingContent.trim() === nextContent.trim()) {
      return { filePath, count: ordered.length, skipped: true, diff };
    }
  }

  fs.writeFileSync(filePath, nextContent);
  return { filePath, count: ordered.length, skipped: false, diff };
}

/**
 * @param {any} config
 * @param {Map<string, any>} existingByWikiUrl
 * @param {Array<{title: string, reason: string}>} failures
 * @returns {Promise<Array<any>>}
 */
async function buildToonTasksFromCategory(config, existingByWikiUrl, failures) {
  const members = await fetchCategoryMembers(config.category);
  const tasks = [];
  for (const member of members) {
    if (!member.title.includes('/')) {
      continue;
    }
    const titlePart = member.title.split('/')[1];
    const wikiUrl = buildWikiUrl(member.title);
    let page;
    try {
      page = await fetchPageContent(member.title);
    } catch (error) {
      failures.push({ title: member.title, reason: `Fetch failed: ${error.message}` });
      if (existingByWikiUrl.has(wikiUrl)) {
        tasks.push(existingByWikiUrl.get(wikiUrl));
      }
      continue;
    }
    const section = extractSection(page.wikitext);
    if (!section) {
      failures.push({ title: member.title, reason: 'Missing ToonTask section' });
      if (existingByWikiUrl.has(wikiUrl)) {
        tasks.push(existingByWikiUrl.get(wikiUrl));
      }
      continue;
    }

    const subsections = splitSubsections(section);
    for (const { subsectionName, content } of subsections) {
      let steps;
      try {
        steps = parseToonTaskSteps(content);
      } catch (error) {
        failures.push({ title: member.title, reason: `Parse failed: ${error.message}` });
        if (existingByWikiUrl.has(wikiUrl)) {
          tasks.push(existingByWikiUrl.get(wikiUrl));
        }
        continue;
      }
      if (!steps.length) {
        failures.push({ title: member.title, reason: 'No steps parsed' });
        if (existingByWikiUrl.has(wikiUrl)) {
          tasks.push(existingByWikiUrl.get(wikiUrl));
        }
        continue;
      }

      let name = normalizeTasklineName(titlePart);
      if (/Cashbot Cog Disguise/i.test(titlePart)) {
        const partMatch = titlePart.match(/\(([^)]+)\)$/);
        if (partMatch) {
          name = partMatch[1].replace(/_/g, ' ').trim();
        }
      }

      if (subsectionName) {
        name = `${name} (${subsectionName})`;
      }

      tasks.push({
        id: `${slugify(config.playground)}_${slugify(name)}`,
        name,
        playground: config.playground,
        category: config.taskCategory,
        steps,
        wikiUrl,
        lastUpdated: page.timestamp || undefined,
      });
    }
  }
  return tasks;
}

/**
 * @param {any} pageConfig
 * @param {Array<{title: string, reason: string}>} failures
 * @returns {Promise<Array<any>>}
 */
async function buildCogDisguiseFromPage(pageConfig, failures) {
  let page;
  try {
    page = await fetchPageContent(pageConfig.title);
  } catch (error) {
    failures.push({ title: pageConfig.title, reason: `Fetch failed: ${error.message}` });
    return [];
  }
  const section = extractSection(page.wikitext);
  if (!section) {
    failures.push({ title: pageConfig.title, reason: 'Missing ToonTasks section' });
    return [];
  }
  let tasklines;
  try {
    tasklines = parseCogDisguiseSteps(section);
  } catch (error) {
    failures.push({ title: pageConfig.title, reason: `Parse failed: ${error.message}` });
    return [];
  }
  return tasklines.map(taskline => ({
    id: `${slugify(pageConfig.playground)}_${slugify(taskline.name)}`,
    name: taskline.name,
    playground: pageConfig.playground,
    category: 'cog_disguise',
    steps: taskline.steps,
    wikiUrl: buildWikiUrl(pageConfig.title),
    lastUpdated: page.timestamp || undefined,
  }));
}

/**
 * @param {any} categoryConfig
 * @param {Map<string, any>} existingByWikiUrl
 * @param {Array<{title: string, reason: string}>} failures
 * @returns {Promise<Array<any>>}
 */
async function buildCashbotDisguiseFromCategory(categoryConfig, existingByWikiUrl, failures) {
  const members = await fetchCategoryMembers(categoryConfig.category);
  const tasks = [];
  for (const member of members) {
    if (!member.title.includes(categoryConfig.titleSubstring)) {
      continue;
    }
    const titlePart = member.title.split('/')[1] || member.title;
    const wikiUrl = buildWikiUrl(member.title);
    let page;
    try {
      page = await fetchPageContent(member.title);
    } catch (error) {
      failures.push({ title: member.title, reason: `Fetch failed: ${error.message}` });
      if (existingByWikiUrl.has(wikiUrl)) {
        tasks.push(existingByWikiUrl.get(wikiUrl));
      }
      continue;
    }
    const section = extractSection(page.wikitext);
    if (!section) {
      failures.push({ title: member.title, reason: 'Missing ToonTask section' });
      if (existingByWikiUrl.has(wikiUrl)) {
        tasks.push(existingByWikiUrl.get(wikiUrl));
      }
      continue;
    }

    const subsections = splitSubsections(section);
    for (const { subsectionName, content } of subsections) {
      let steps;
      try {
        steps = parseToonTaskSteps(content);
      } catch (error) {
        failures.push({ title: member.title, reason: `Parse failed: ${error.message}` });
        if (existingByWikiUrl.has(wikiUrl)) {
          tasks.push(existingByWikiUrl.get(wikiUrl));
        }
        continue;
      }
      if (!steps.length) {
        failures.push({ title: member.title, reason: 'No steps parsed' });
        if (existingByWikiUrl.has(wikiUrl)) {
          tasks.push(existingByWikiUrl.get(wikiUrl));
        }
        continue;
      }

      const match = titlePart.match(/\(([^)]+)\)$/);
      let name = match ? match[1].replace(/_/g, ' ').trim() : normalizeTasklineName(titlePart);

      if (subsectionName) {
        name = `${name} (${subsectionName})`;
      }

      tasks.push({
        id: `${slugify(categoryConfig.playground)}_${slugify(name)}`,
        name,
        playground: categoryConfig.playground,
        category: 'cog_disguise',
        steps,
        wikiUrl,
        lastUpdated: page.timestamp || undefined,
      });
    }
  }
  return tasks;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const preferExisting = !args.has('--refresh');
  const reportPathArgIndex = process.argv.indexOf('--report-path');
  const reportPath =
    reportPathArgIndex !== -1 ? process.argv[reportPathArgIndex + 1] : null;

  const outputs = [];
  const failures = [];
  for (const config of PLAYGROUND_CONFIGS) {
    const existing = loadExisting(path.join(OUTPUT_DIR, config.file));
    const existingByWikiUrl = new Map(existing.map(item => [item.wikiUrl, item]));
    let tasklines;
    try {
      tasklines = await buildToonTasksFromCategory(config, existingByWikiUrl, failures);
    } catch (error) {
      failures.push({ title: config.category, reason: error.message });
      tasklines = existing;
    }
    outputs.push(await writeTasklines(config.file, tasklines, { preferExisting }));
  }

  for (const config of SPECIAL_CONFIGS) {
    const existing = loadExisting(path.join(OUTPUT_DIR, config.file));
    const existingByWikiUrl = new Map(existing.map(item => [item.wikiUrl, item]));
    let tasklines;
    try {
      tasklines = await buildToonTasksFromCategory(config, existingByWikiUrl, failures);
    } catch (error) {
      failures.push({ title: config.category, reason: error.message });
      tasklines = existing;
    }
    outputs.push(await writeTasklines(config.file, tasklines, { preferExisting }));
  }

  {
    const existing = loadExisting(path.join(OUTPUT_DIR, CASHBOT_DISGUISE_CONFIGS.file));
    const existingByWikiUrl = new Map(existing.map(item => [item.wikiUrl, item]));
    let cashbotTasklines;
    try {
      cashbotTasklines = await buildCashbotDisguiseFromCategory(
        {
          ...CASHBOT_DISGUISE_CONFIGS,
          category: "Donald's Dreamland ToonTasks",
        },
        existingByWikiUrl,
        failures
      );
    } catch (error) {
      failures.push({ title: CASHBOT_DISGUISE_CONFIGS.file, reason: error.message });
      cashbotTasklines = existing;
    }
    outputs.push(
      await writeTasklines(CASHBOT_DISGUISE_CONFIGS.file, cashbotTasklines, {
        preferExisting,
      })
    );
  }

  for (const pageConfig of COG_DISGUISE_PAGES) {
    const existing = loadExisting(path.join(OUTPUT_DIR, pageConfig.file));
    let tasklines;
    try {
      tasklines = await buildCogDisguiseFromPage(pageConfig, failures);
      if (tasklines.length === 0) {
        failures.push({ title: pageConfig.title, reason: 'No tasklines parsed' });
        tasklines = existing;
      }
    } catch (error) {
      failures.push({ title: pageConfig.title, reason: error.message });
      tasklines = existing;
    }
    outputs.push(await writeTasklines(pageConfig.file, tasklines, { preferExisting }));
  }

  outputs.forEach(output => {
    const prefix = output.skipped ? 'Unchanged' : 'Wrote';
    console.log(`${prefix} ${output.count} tasklines -> ${output.filePath}`);
  });

  writeReport(reportPath, outputs, failures);
  writeMetadata(METADATA_PATH, outputs, failures, getDiffSummary);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
