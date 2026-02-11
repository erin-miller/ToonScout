export type GagTrackKey = 'Toon-Up' | 'Trap' | 'Lure' | 'Sound' | 'Throw' | 'Squirt' | 'Drop'

/**
 * XP thresholds to unlock each gag level per track
 */
export const XP_THRESHOLDS: Record<GagTrackKey, number[]> = {
  'Toon-Up': [0, 20, 200, 800, 2000, 6000, 10000],
  Trap: [0, 20, 100, 500, 2000, 6000, 10000],
  Lure: [0, 20, 100, 800, 2000, 6000, 10000],
  Sound: [0, 20, 200, 800, 2000, 6000, 10000],
  Throw: [0, 10, 50, 400, 2000, 6000, 10000],
  Squirt: [0, 10, 50, 400, 2000, 6000, 10000],
  Drop: [0, 20, 100, 500, 2000, 6000, 10000]
}

const throwDamageRanges: Array<{ start: number; max: number }> = [
  { start: 4, max: 6 }, // Cupcake
  { start: 8, max: 10 }, // Fruit Pie Slice
  { start: 14, max: 17 }, // Cream Pie Slice
  { start: 24, max: 27 }, // Whole Fruit Pie
  { start: 36, max: 40 }, // Whole Cream Pie
  { start: 48, max: 100 }, // Birthday Cake
  { start: 120, max: 120 } // Wedding Cake
]

const squirtDamageRanges: Array<{ start: number; max: number }> = [
  { start: 3, max: 4 }, // Squirting Flower
  { start: 6, max: 8 }, // Glass of Water
  { start: 10, max: 12 }, // Squirt Gun
  { start: 18, max: 21 }, // Seltzer Bottle
  { start: 27, max: 30 }, // Fire Hose
  { start: 36, max: 80 }, // Storm Cloud
  { start: 105, max: 105 } // Geyser
]

const soundDamageRanges: Array<{ start: number; max: number }> = [
  { start: 3, max: 4 }, // Bike Horn
  { start: 5, max: 7 }, // Whistle
  { start: 9, max: 11 }, // Bugle
  { start: 14, max: 16 }, // Aoogah
  { start: 19, max: 21 }, // Elephant Trunk
  { start: 25, max: 50 }, // Fog Horn
  { start: 90, max: 90 } // Opera Singer
]

const dropDamageRanges: Array<{ start: number; max: number }> = [
  { start: 10, max: 10 }, // Flower Pot
  { start: 18, max: 18 }, // Sandbag
  { start: 30, max: 30 }, // Anvil
  { start: 45, max: 45 }, // Big Weight
  { start: 60, max: 70 }, // Safe
  { start: 85, max: 170 }, // Grand Piano
  { start: 180, max: 180 } // Toontanic
]

const trapDamageRanges: Array<{ start: number; max: number }> = [
  { start: 10, max: 12 }, // Banana Peel
  { start: 18, max: 20 }, // Rake
  { start: 30, max: 35 }, // Marbles
  { start: 45, max: 50 }, // Quicksand
  { start: 75, max: 85 }, // Trapdoor
  { start: 90, max: 180 }, // TNT
  { start: 200, max: 200 } // Railroad
]

const toonUpHealingRanges: Array<{ start: number; max: number }> = [
  { start: 8, max: 10 }, // Feather
  { start: 15, max: 18 }, // Megaphone
  { start: 27, max: 30 }, // Lipstick
  { start: 40, max: 45 }, // Bamboo Cane
  { start: 50, max: 60 }, // Pixie Dust
  { start: 75, max: 105 }, // Juggling Cubes
  { start: 210, max: 210 } // High Dive
]

// Source: https://toontownrewritten.wiki/Lure
export const LURE_ROUNDS: number[] = [2, 2, 3, 3, 4, 4, 8]

// Source: https://toontownrewritten.wiki/Accuracy
export const BASE_ACCURACY: Record<GagTrackKey, number | number[]> = {
  'Toon-Up': [70, 70, 70, 70, 70, 70, 95],
  Trap: 0,
  Lure: [60, 55, 70, 65, 80, 75, 90],
  Sound: 95,
  Throw: 75,
  Squirt: 95,
  Drop: 50
}

export type DamageInfo = {
  value: number
  start: number
  max: number
}

export type AccuracyInfo = {
  base: number
  organic?: number
}

export type GagTrackData = {
  gag: { level: number }
  experience: { current: number; next: number }
  organic?: { level: number }
}

export type GagTooltipData = {
  damageInfo: DamageInfo | null
  baseDamageInfo: DamageInfo | null
  accuracyInfo: AccuracyInfo | null
  isOrganic: boolean
}

const DAMAGE_RANGES: Record<string, Array<{ start: number; max: number }>> = {
  'Toon-Up': toonUpHealingRanges,
  Throw: throwDamageRanges,
  Squirt: squirtDamageRanges,
  Sound: soundDamageRanges,
  Drop: dropDamageRanges,
  Trap: trapDamageRanges
}

export function getGagDamage(
  track: GagTrackKey,
  level: number,
  currXP: number,
  nextXP: number | null | undefined,
  organic?: boolean
): DamageInfo | null {
  if (track === 'Lure') return null

  const ranges = DAMAGE_RANGES[track]
  if (!ranges) return null

  if (level < 1 || level > 7) return null

  const idx = level - 1
  const range = ranges[idx]
  if (!range) return null

  const trackThresholds = XP_THRESHOLDS[track]
  const y = trackThresholds[idx] ?? 0
  const x = nextXP ?? trackThresholds[Math.min(idx + 1, trackThresholds.length - 1)]

  const o = range.start
  const m = range.max

  let organicMultiplier = 1.1
  if (track === 'Toon-Up') {
    organicMultiplier = 1.2
  } else if (track === 'Squirt' || track === 'Drop') {
    organicMultiplier = 1.15
  }

  const deltaXP = Math.max(0, x - y)
  const earned = Math.max(0, currXP - y)
  if (deltaXP === 0) {
    const base = organic ? Math.ceil(Math.round(m * organicMultiplier * 100) / 100) : m
    return { value: base, start: o, max: m }
  }

  const xpPerPoint = deltaXP / (m - o + 1)
  const unrounded = o + earned / xpPerPoint
  let dmg = Math.floor(unrounded)
  dmg = Math.max(o, Math.min(dmg, m))
  if (organic) {
    const organicValue = dmg * organicMultiplier
    dmg = Math.ceil(Math.round(organicValue * 100) / 100)
  }
  return { value: dmg, start: o, max: m }
}

export function getGagAccuracy(track: GagTrackKey, level: number, organic?: boolean): AccuracyInfo | null {
  if (track === 'Trap') return null

  if (level < 1 || level > 7) return null

  const accuracyData = BASE_ACCURACY[track]
  const baseAccuracy = Array.isArray(accuracyData) ? accuracyData[level - 1] : accuracyData

  if (track === 'Lure' && organic) {
    const organicBonus = level === 7 ? 5 : 10
    return { base: baseAccuracy, organic: baseAccuracy + organicBonus }
  }

  return { base: baseAccuracy }
}

export function getGagTooltipData(
  track: GagTrackKey,
  gagLevel: number,
  maxLevel: number,
  trackData: GagTrackData | null | undefined
): GagTooltipData | null {
  if (!trackData || gagLevel > maxLevel) return null

  const organicLevel = trackData.organic?.level ?? 0
  const isOrganic = gagLevel <= organicLevel
  const exp = trackData.experience
  const trackThresholds = XP_THRESHOLDS[track]

  let damageInfo: DamageInfo | null
  let baseDamageInfo: DamageInfo | null = null

  if (gagLevel === maxLevel && exp) {
    damageInfo = getGagDamage(track, gagLevel, exp.current, exp.next, isOrganic)
    if (isOrganic) {
      baseDamageInfo = getGagDamage(track, gagLevel, exp.current, exp.next, false)
    }
  } else {
    const nextLevelXP = trackThresholds[gagLevel] ?? 10000
    damageInfo = getGagDamage(track, gagLevel, nextLevelXP - 1, nextLevelXP, isOrganic)
    if (isOrganic) {
      baseDamageInfo = getGagDamage(track, gagLevel, nextLevelXP - 1, nextLevelXP, false)
    }
  }

  const accuracyInfo = getGagAccuracy(track, gagLevel, isOrganic)

  return { damageInfo, baseDamageInfo, accuracyInfo, isOrganic }
}
