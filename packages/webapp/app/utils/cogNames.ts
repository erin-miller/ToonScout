/**
 * Cog Name Utilities
 *
 * Centralized cog name handling extracted from invasionUtils.ts.
 * Provides normalized cog name matching with support for:
 * - Plural variants (Flunky → Flunkys)
 * - Full names (Yes man for Yesman)
 * - Special cases (Mover & Shaker → Movers & Shakers)
 * - Variant detection (Skelecog, Version 2.0)
 */

import cogsData from '../../data/cogs.json'

/**
 * Special case plurals for cog names that don't follow standard rules
 * Maps: full cog name -> plural form(s)
 */
export const COG_SPECIAL_PLURALS: Record<string, string | string[]> = {
  'Mover & Shaker': ['Movers & Shakers', 'Movers and Shakers'],
  'Yes man': 'Yes men',
  Yesman: 'Yesmen'
}

export const COG_NORMALIZATION = {
  // Characters to remove (control characters)
  CONTROL_CHARS: /[\u0000-\u001F\u007F-\u009F]/g,

  // Characters to keep (alphanumeric + space + ampersand)
  ALLOWED_CHARS: /[^a-z0-9 &]/g,

  // Variant detection patterns
  SKELECOG_PATTERN: /\s*\(Skelecog\)\s*$/i,
  VERSION_2_PATTERN: /^Version 2\.0\s*/i
} as const

/**
 * Sanitize cog name by removing control characters
 */
export function sanitizeCogName(name: string): string {
  return name.replace(COG_NORMALIZATION.CONTROL_CHARS, '')
}

/**
 * Normalize cog name for matching
 * - Converts to lowercase
 * - Removes punctuation (except ampersand)
 * - Trims whitespace
 */
export function normalizeCogName(str: string): string {
  return str.toLowerCase().replace(COG_NORMALIZATION.ALLOWED_CHARS, '').trim()
}

/**
 * Generate all variants of a cog name (singular, plural, full name)
 */
export function getCogNameVariants(cog: { name: string; fullname?: string }): string[] {
  const names = [cog.name]
  if (cog.fullname) names.push(cog.fullname)

  // Add plural forms
  const withPlurals: string[] = []
  names.forEach(n => {
    withPlurals.push(n)

    // Check special plurals first
    const special = COG_SPECIAL_PLURALS[n]
    if (special) {
      if (Array.isArray(special)) {
        withPlurals.push(...special)
      } else {
        withPlurals.push(special)
      }
    } else if (n.endsWith('y') && !n.endsWith('ey')) {
      // Words ending in consonant + y: add both forms to be safe
      // "Flunkies" (correct English) and "Flunkys" (possible game variant)
      withPlurals.push(n.slice(0, -1) + 'ies')
      withPlurals.push(n + 's')
    } else if (!n.endsWith('s')) {
      // Default: add 's'
      withPlurals.push(n + 's')
    }
  })

  return withPlurals.map(normalizeCogName)
}

/**
 * Pre-built map of all cog variants to canonical names
 * Examples:
 * - "flunky" → "Flunky"
 * - "flunkys" → "Flunky"
 * - "yes man" → "Yesman"
 * - "yes men" → "Yesman"
 * - "mover & shaker" → "Mover & Shaker"
 * - "movers & shakers" → "Mover & Shaker"
 */
export const cogNameMap: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const cog of cogsData) {
    for (const variant of getCogNameVariants(cog)) {
      map[variant] = cog.name
    }
  }
  return map
})()

/**
 * Get all canonical cog names
 */
export const allCogNames = [...new Set(Object.values(cogNameMap))]

/**
 * Find canonical cog name from text (supports partial matching)
 * Returns the canonical name if found, null otherwise
 */
export function findCogInText(text: string): string | null {
  const normalized = normalizeCogName(text)

  // Try exact match first
  if (cogNameMap[normalized]) {
    return cogNameMap[normalized]
  }

  // Try finding any cog variant within the text
  for (const [variant, canonical] of Object.entries(cogNameMap)) {
    if (normalized.includes(variant)) {
      return canonical
    }
  }

  return null
}

/**
 * Check if text contains a specific cog name (or any of its variants)
 */
export function containsCog(text: string, cogName: string): boolean {
  const normalized = normalizeCogName(text)
  const targetNormalized = normalizeCogName(cogName)

  // Check if target matches any variant of the specified cog
  for (const [variant, canonical] of Object.entries(cogNameMap)) {
    if (canonical === cogName || normalizeCogName(canonical) === targetNormalized) {
      if (normalized.includes(variant)) {
        return true
      }
    }
  }

  return false
}

/**
 * Strip special cog variants (Skelecog, V2.0) and return base name
 */
export function stripCogVariant(cogName: string): { base: string; variant: string | null } {
  let base = cogName
  let variant: string | null = null

  if (cogName.includes('(Skelecog)')) {
    base = cogName.replace(COG_NORMALIZATION.SKELECOG_PATTERN, '').trim()
    variant = 'skelecog'
    return { base, variant }
  }

  if (cogName.includes('Version 2.0')) {
    base = cogName.replace(COG_NORMALIZATION.VERSION_2_PATTERN, '').trim()
    variant = 'v2'
  }

  return { base, variant }
}

/**
 * Get all cog data (for compatibility)
 */
export function getAllCogs() {
  return cogsData
}
