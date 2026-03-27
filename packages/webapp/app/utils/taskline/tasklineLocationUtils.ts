import { normalizePlace } from '../normalizationPatterns'

// All 17 streets in Toontown Rewritten (from building_maps.json)
const STREETS = new Set([
  'Alto Avenue',
  'Baritone Boulevard',
  'Barnacle Boulevard',
  'Elm Street',
  'Lighthouse Lane',
  'Loopy Lane',
  'Lullaby Lane',
  'Maple Street',
  'Oak Street',
  'Pajama Place',
  'Polar Place',
  'Punchline Place',
  'Seaweed Street',
  'Silly Street',
  'Sleet Street',
  'Tenor Terrace',
  'Walrus Way'
])

// All valid taskline categories/groups (normalized - apostrophes removed, lowercase)
// Note: These include both playgrounds (TTC, DD, etc.) and taskline categories (cog disguises)
const TASKLINE_CATEGORIES = new Set([
  // Story playgrounds (in progression order)
  'toontown central',
  'donalds dock',
  'daisy gardens',
  'minnies melodyland',
  'the brrrgh',
  'donalds dreamland',
  'sellbot task force',
  'bossbot cog disguise',
  'cashbot cog disguise',
  'lawbot cog disguise',
  'sellbot cog disguise'
])

// Used in tasklineMatching.ts
export const COG_DISGUISE_MIN_PLAYGROUNDS = new Set(['donalds dreamland', 'sellbot task force'])

export const getTaskStreet = (task: {
  to?: { zone?: string }
  from?: { zone?: string }
  objective?: { where?: string }
}): string | null => {
  const candidates = [task.to?.zone, task.from?.zone, task.objective?.where]

  for (const value of candidates) {
    if (!value) continue

    // Extract first part before comma, trim, and check against known streets
    const candidate = value.split(',')[0]?.trim()
    if (candidate && STREETS.has(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Normalize and validate a taskline category (playground or cog disguise group).
 * Returns the normalized category if valid, null otherwise.
 */
export function getPrimaryPlayground(value?: string | null): string | null {
  if (!value) {
    return null
  }
  const normalized = normalizePlace(value)
  return TASKLINE_CATEGORIES.has(normalized) ? normalized : null
}

export function locationsMatch(a: string, b: string): boolean {
  const normalizedA = normalizePlace(a)
  const normalizedB = normalizePlace(b)
  return normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)
}
