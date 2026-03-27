import { tokenize } from './tasklineTextUtils'
import { normalizeObjective, normalizeForNumberParsing } from './normalizationPatterns'

import { cogNameMap, normalizeCogName } from './cogNames'

import type { NumericRequirement, ParsedNumericRequirements, ObjectiveMatchQuality } from './tasklineMatchingTypes'

export function parseNumericRequirements(text: string): ParsedNumericRequirements {
  const normalized = normalizeForNumberParsing(text)
  let remaining = normalized

  let level: NumericRequirement | null = null
  const levelPlusMatch = normalized.match(/\blevel\s+(\d+)\s*\+/)
  if (levelPlusMatch) {
    level = { value: Number(levelPlusMatch[1]), plus: true }
    remaining = remaining.replace(levelPlusMatch[0], ' ')
  } else {
    const levelExactMatch = normalized.match(/\blevel\s+(\d+)\b/)
    if (levelExactMatch) {
      level = { value: Number(levelExactMatch[1]), plus: false }
      remaining = remaining.replace(levelExactMatch[0], ' ')
    }
  }

  let story: NumericRequirement | null = null
  const storyPlusMatch = normalized.match(/\b(\d+)\s*\+?\s*story\b/)
  if (storyPlusMatch) {
    story = { value: Number(storyPlusMatch[1]), plus: storyPlusMatch[0].includes('+') }
    remaining = remaining.replace(storyPlusMatch[0], ' ')
  }

  // Remove qualifiers (star ratings, laff thresholds) - not counts
  remaining = remaining.replace(/\b\d+\s*\+?\s*star\b/gi, ' ')
  remaining = remaining.replace(/\b\d+\s+laff\b/gi, ' ')

  const countMatch = remaining.match(/\b(\d+)\b/)
  const count = countMatch ? Number(countMatch[1]) : null

  return { count, level, story }
}

export function requirementsMatch(
  taskRequirement: NumericRequirement | null,
  stepRequirement: NumericRequirement | null
): boolean {
  if (!taskRequirement && !stepRequirement) return true
  if (!taskRequirement || !stepRequirement) return false

  return taskRequirement.value === stepRequirement.value
}

function normalizeObjectiveForMatch(text: string): string {
  // Use centralized normalization which handles common patterns
  // Cog name variants (pinchers, mover & shaker, etc.) are handled by cogNameMap
  return normalizeObjective(text)
}

function normalizeObjectiveToken(token: string): string {
  if (token.length <= 3) return token

  // Check if this token is a cog name variant (handles plurals automatically)
  const cogVariant = normalizeCogName(token)
  if (cogNameMap[cogVariant]) {
    return cogVariant
  }

  // Fallback to simple plural handling for non-cog tokens
  if (token.endsWith('ss')) return token
  if (token.endsWith('s')) return token.slice(0, -1)
  return token
}

function normalizeObjectiveTokens(tokens: Set<string>): Set<string> {
  const normalized = new Set<string>()
  for (const token of tokens) {
    normalized.add(normalizeObjectiveToken(token))
  }
  return normalized
}

function isTokenSubset(subset: Set<string>, superset: Set<string>): boolean {
  if (subset.size === 0 || superset.size === 0) return false
  for (const token of subset) {
    if (!superset.has(token)) return false
  }
  return true
}

export function getObjectiveMatchQuality(taskObjective: string, stepObjective: string): ObjectiveMatchQuality {
  const normalizedTask = normalizeObjectiveForMatch(taskObjective)
  const normalizedStep = normalizeObjectiveForMatch(stepObjective)
  if (!normalizedTask || !normalizedStep) return 'none'
  if (normalizedTask === normalizedStep) return 'exact'
  if (normalizedTask.includes(normalizedStep) || normalizedStep.includes(normalizedTask)) {
    return 'contains'
  }
  const taskTokens = normalizeObjectiveTokens(tokenize(normalizedTask))
  const stepTokens = normalizeObjectiveTokens(tokenize(normalizedStep))
  if (isTokenSubset(taskTokens, stepTokens) || isTokenSubset(stepTokens, taskTokens)) {
    return 'contains'
  }
  return 'none'
}
