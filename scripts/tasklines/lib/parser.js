const slugifyLib = require('slugify');

function slugify(value) {
  const normalized = value.replace(/-/g, ' ');
  return slugifyLib(normalized, {
    lower: true,
    replacement: '_',
    remove: /['’+]/g,
  });
}

function stripWikiMarkup(text) {
  return text
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*ref[^>]*>[\s\S]*?<\s*\/\s*ref\s*>/gi, '')
    .replace(/<\s*ref[^>]*\/\s*>/gi, '')
    .replace(/<\s*\/?\s*[a-z][^>]*>/gi, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/''+/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateParsedText(text) {
  if (text.includes('{{') || text.includes('}}') || text.includes('[[') || text.includes(']]')) {
    throw new Error('Unexpected wiki markup after sanitization');
  }
}


/**
 * @param {string} wikitext
 * @returns {string}
 */
function extractSection(wikitext) {
  const lines = wikitext.split('\n');
  const sectionLines = [];
  let inSection = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const isHeading = /^==[^=].*==$/.test(line);
    if (!inSection) {
      if (/^==\s*ToonTasks?\s*==$/i.test(line)) {
        inSection = true;
      }
      continue;
    }
    if (isHeading) {
      break;
    }
    sectionLines.push(rawLine);
  }
  return sectionLines.join('\n');
}

/**
 * @param {string} rawText
 * @param {{ keepParenthetical: boolean }} options
 * @returns {{ objective: string, building?: string, location?: string }}
 */
function parseObjectiveDetails(rawText, { keepParenthetical }) {
  const cleaned = stripWikiMarkup(rawText);
  validateParsedText(cleaned);
  // Nested parentheticals are not fully supported; this captures the outermost group.
  const match = cleaned.match(/^(.*?)(?:\(([^)]*)\))?$/);
  const objectiveBase = match ? match[1].trim() : cleaned;
  const parenText = match && match[2] ? match[2].trim() : '';

  let objective = objectiveBase;
  if (keepParenthetical && parenText) {
    objective = `${objectiveBase} (${parenText})`;
  }

  let building;
  let location;
  if (parenText) {
    const parts = parenText.split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length === 1) {
      if (parts[0].toLowerCase() !== 'anywhere') {
        location = parts[0];
      } else {
        location = 'Anywhere';
      }
    } else if (parts.length >= 2) {
      building = parts[0];
      location = parts[parts.length - 1];
    }
  }

  if (parenText.toLowerCase() === 'anywhere') {
    location = 'Anywhere';
  }

  return {
    objective,
    building,
    location,
  };
}

/**
 * Splits a ToonTask section into subsections if they exist (===NPC Name===).
 * Returns array of {subsectionName, content} objects.
 * If no subsections exist, returns single entry with null subsectionName.
 */
function splitSubsections(sectionText) {
  const lines = sectionText.split('\n');
  const subsections = [];
  let currentSubsection = null;
  let currentLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const subsectionMatch = trimmed.match(/^===\s*(.+?)\s*===$/);

    if (subsectionMatch) {
      if (currentSubsection !== null || currentLines.length > 0) {
        subsections.push({
          subsectionName: currentSubsection,
          content: currentLines.join('\n'),
        });
      }
      currentSubsection = subsectionMatch[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentSubsection !== null || currentLines.length > 0) {
    subsections.push({
      subsectionName: currentSubsection,
      content: currentLines.join('\n'),
    });
  }

  return subsections.length > 0 ? subsections : [{ subsectionName: null, content: sectionText }];
}

/**
 * @param {string} sectionText
 * @returns {Array<{ order: number, objective: string, npc?: string, building?: string, location?: string }>}
 */
function parseToonTaskSteps(sectionText) {
  const lines = sectionText.split('\n');
  const rawSteps = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('#')) {
      continue;
    }
    if (trimmed.startsWith('#*')) {
      if (current) {
        current.subitems.push(trimmed.replace(/^#\*+/, '').trim());
      }
      continue;
    }
    if (current) {
      rawSteps.push(current);
    }
    current = {
      text: trimmed.replace(/^#+/, '').trim(),
      subitems: [],
    };
  }
  if (current) {
    rawSteps.push(current);
  }

  return rawSteps.map((step, index) => {
    if (step.subitems.length > 0 || /^One of the following/i.test(step.text)) {
      const subObjectives = step.subitems.map(item =>
        parseObjectiveDetails(item, { keepParenthetical: false }).objective
      );
      const objective = `One of the following: ${subObjectives.join(' ')}`.trim();
      const firstSub = step.subitems[0] || '';
      const parsedFirst = parseObjectiveDetails(firstSub, { keepParenthetical: false });
      const npc =
        subObjectives[0] && !/^Return to/i.test(subObjectives[0])
          ? `One of the following: ${subObjectives[0]}`
          : undefined;
      return {
        order: index + 1,
        objective,
        npc,
        building: parsedFirst.building,
        location: parsedFirst.location,
      };
    }

    const details = parseObjectiveDetails(step.text, { keepParenthetical: false });
    return {
      order: index + 1,
      objective: details.objective,
      building: details.building,
      location: details.location,
    };
  });
}

/**
 * @param {string} sectionText
 * @returns {Array<{ name: string, steps: Array<{ order: number, objective: string, building?: string, location?: string }> }>}
 */
function parseCogDisguiseSteps(sectionText) {
  const lines = sectionText.split('\n');
  const tasklines = [];
  let currentName = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(';')) {
      currentName = stripWikiMarkup(trimmed.replace(/^;+/, '').trim());
      continue;
    }
    if (trimmed.startsWith('*') && currentName) {
      const details = parseObjectiveDetails(trimmed.replace(/^\*+/, '').trim(), {
        keepParenthetical: true,
      });
      tasklines.push({
        name: currentName,
        steps: [
          {
            order: 1,
            objective: details.objective,
            building: details.building,
            location: details.location,
          },
        ],
      });
    }
  }
  return tasklines;
}

/**
 * @param {string} titlePart
 * @returns {string}
 */
function normalizeTasklineName(titlePart) {
  const cleaned = titlePart.replace(/_/g, ' ').trim();
  if (/^Gag pouch$/i.test(cleaned)) {
    return 'Upgraded gag pouch';
  }
  if (/^Jellybean pouch$/i.test(cleaned)) {
    return 'Upgraded jellybean pouch';
  }
  if (/^ToonTask capacity$/i.test(cleaned)) {
    return 'Increased ToonTask capacity';
  }
  const laffMatch = cleaned.match(/^\+?\d+ laff boost/i);
  if (laffMatch) {
    return laffMatch[0].replace(/^\+/, '+');
  }
  return cleaned.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * @param {string} title
 * @returns {string}
 */
function buildWikiUrl(title) {
  const encoded = title
    .split('/')
    .map(segment =>
      encodeURIComponent(segment.replace(/ /g, '_')).replace(/'/g, '%27')
    )
    .join('/');
  return `https://toontownrewritten.wiki/${encoded}`;
}

module.exports = {
  slugify,
  extractSection,
  splitSubsections,
  parseToonTaskSteps,
  parseCogDisguiseSteps,
  normalizeTasklineName,
  buildWikiUrl,
};
