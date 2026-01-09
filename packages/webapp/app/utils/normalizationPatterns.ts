/**
 * Text Normalization Patterns
 * 
 * Centralized text normalization patterns and utilities to eliminate
 * duplicate regex patterns across the codebase.
 */

import wordsToNumbers from "@insomnia-dev/words-to-numbers";

const PUNCTUATION_PATTERNS = {
  // Most permissive - removes all punctuation
  ALL: /[.,!?;:'+\/()[\]{}<>"-]/g,
  
  // For text comparison (used in most matching)
  COMPARISON: /[.,!?;:'+\/()-]/g,
  
  // For place names (only smart quotes)
  PLACE: /['']/g,
  
  // For building names (quotes and periods/commas)
  BUILDING: /[''.,]/g,
} as const;

const WHITESPACE_PATTERN = /\s+/g;

const ABBREVIATION_MAP = {
  'headquarters': 'hq',
  'hq': 'hq',
} as const;

/**
 * Common objective text normalizations
 * Applied in order to standardize task/step objectives
 */
const OBJECTIVE_NORMALIZATIONS: Array<{
  pattern: RegExp;
  replacement: string;
  description: string;
}> = [
  {
    pattern: /\brecover some\s+/g,
    replacement: 'recover ',
    description: 'Normalize "recover some" to "recover"',
  },
  {
    pattern: /\bgo fishing for\s+/g,
    replacement: 'recover ',
    description: 'Normalize fishing objectives to recovery',
  },
  {
    pattern: /\s+from fishing\b/g,
    replacement: '',
    description: 'Remove fishing context',
  },
  {
    pattern: /\bchoose between\s+(\w+)\s+and\s+(\w+)/g,
    replacement: 'choose $1 or $2',
    description: 'Normalize choice format',
  },
  {
    pattern: /\s+&\s+/g,
    replacement: ' and ',
    description: 'Normalize ampersand to "and"',
  },
];

/**
 * Normalize text with configurable options
 */
function normalizeText(
  text: string,
  options: {
    removePunctuation?: keyof typeof PUNCTUATION_PATTERNS | RegExp;
    normalizeWhitespace?: boolean;
    applyAbbreviations?: boolean;
    toLowerCase?: boolean;
    convertNumbers?: boolean;
  } = {}
): string {
  const {
    removePunctuation = 'COMPARISON',
    normalizeWhitespace = true,
    applyAbbreviations = false,
    toLowerCase = true,
    convertNumbers = false,
  } = options;

  let result = text;

  // Convert words to numbers if requested
  if (convertNumbers) {
    const converted = wordsToNumbers(result, { fuzzy: false });
    result = typeof converted === "number" ? String(converted) : converted || result;
  }

  // Convert to lowercase
  if (toLowerCase) {
    result = result.toLowerCase();
  }

  // Apply punctuation removal
  if (removePunctuation) {
    const pattern = typeof removePunctuation === 'string'
      ? PUNCTUATION_PATTERNS[removePunctuation]
      : removePunctuation;
    result = result.replace(pattern, '');
  }

  // Apply abbreviations
  if (applyAbbreviations) {
    for (const [full, abbrev] of Object.entries(ABBREVIATION_MAP)) {
      result = result.replace(new RegExp(`\\b${full}\\b`, 'g'), abbrev);
    }
  }

  // Normalize whitespace
  if (normalizeWhitespace) {
    result = result.replace(WHITESPACE_PATTERN, ' ');
  }

  return result.trim();
}

/**
 * Normalize place/playground name
 */
export function normalizePlace(value: string): string {
  return normalizeText(value, {
    removePunctuation: 'PLACE',
    normalizeWhitespace: true,
    toLowerCase: true,
  });
}

/**
 * Normalize building name (with abbreviations)
 */
export function normalizeBuildingName(value: string): string {
  return normalizeText(value, {
    removePunctuation: 'BUILDING',
    normalizeWhitespace: true,
    applyAbbreviations: true,
    toLowerCase: true,
  });
}

/**
 * Internal: Normalize task text (standard comparison normalization)
 */
function normalizeTaskText(text: string): string {
  return normalizeText(text, {
    removePunctuation: 'COMPARISON',
    normalizeWhitespace: true,
    toLowerCase: true,
    convertNumbers: true,
  });
}

/**
 * Normalize objective text with special objective-specific patterns
 */
export function normalizeObjective(text: string): string {
  let result = normalizeTaskText(text);

  // Apply objective-specific normalizations
  for (const { pattern, replacement } of OBJECTIVE_NORMALIZATIONS) {
    result = result.replace(pattern, replacement);
  }

  // Special case: remove delivery destinations
  if (result.startsWith('deliver ')) {
    result = result.replace(/\s+to\s+.+$/g, '');
  }

  return normalizeText(result, { normalizeWhitespace: true });
}

/**
 * Normalize text for number parsing (converts words to numbers)
 */
export function normalizeForNumberParsing(text: string): string {
  return normalizeText(text, {
    convertNumbers: true,
    toLowerCase: true,
  });
}
