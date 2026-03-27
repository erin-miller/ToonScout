import wordsToNumbers from '@insomnia-dev/words-to-numbers'
import { Task } from '../types'

const SYNONYMS: Record<string, string[]> = {
  gear: ['cog'],
  cog: ['gear']
}
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'of',
  'from',
  'to',
  'in',
  'on',
  'at',
  'for',
  'any',
  'anywhere',
  'some',
  'between'
])

const isNumericToken = (token: string): boolean => /^\d+$/.test(token)

export const normalizeTaskText = (text: string): string => {
  const converted = wordsToNumbers(text, { fuzzy: false })
  const normalizedInput = typeof converted === 'number' ? String(converted) : converted || text

  return normalizedInput
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'+/()-]/g, '')
    .replace(/\s+/g, ' ')
}

export const tokenize = (text: string): Set<string> => {
  const converted = wordsToNumbers(text, { fuzzy: false })
  const normalizedInput = typeof converted === 'number' ? String(converted) : converted || text

  const tokens = normalizedInput
    .toLowerCase()
    .replace(/[.,!?;:'+\/()-]/g, ' ')
    .split(/\s+/)
    .filter(t => (t.length > 1 || isNumericToken(t)) && !STOPWORDS.has(t))

  // Expand with synonyms
  return new Set(tokens.flatMap(t => [t, ...(SYNONYMS[t] ?? [])]))
}

/** Measures overlap between two token sets (0-1). Used to fuzzy-match task text against taskline steps. */
export const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 && b.size === 0) return 1
  if (a.size === 0 || b.size === 0) return 0

  let intersection = 0
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1
    }
  }

  const union = a.size + b.size - intersection
  return intersection / union
}

const isGenericLocation = (loc?: string): boolean =>
  !loc || loc.toLowerCase() === 'anywhere' || loc.toLowerCase().startsWith('any ')

export const buildTaskObjectiveText = (task: Task, includeLocation: boolean = true): string => {
  let text = task.objective.text
  const textLower = text.toLowerCase().trim()

  // Expand bare "Visit" with destination name
  if (textLower === 'visit' && task.to?.name) {
    text = `Visit ${task.to.name}`
  }

  // Append recipient to "Deliver" tasks if not already included
  if (textLower.startsWith('deliver') && task.to?.name) {
    if (!normalizeTaskText(text).includes(normalizeTaskText(task.to.name))) {
      text = `${text} to ${task.to.name}`
    }
  }

  // Append location if requested and available
  if (includeLocation) {
    const where = task.objective.where?.trim()
    if (!isGenericLocation(where)) {
      text = `${text} in ${where}`
    } else if (!isGenericLocation(task.to?.building) && !isGenericLocation(task.to?.neighborhood)) {
      text = `${text} in ${task.to?.building} ${task.to?.neighborhood}`
    }
  }

  return text
}
