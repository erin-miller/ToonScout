/** Reward pattern matching utilities - simplified */

export function extractLaffBoostValue(text?: string | null): number | null {
  if (!text || !text.toLowerCase().includes('laff')) return null
  const match = text.match(/\d+/)
  return match ? Number(match[0]) : null
}

export function isTaskForceReward(reward?: string | null): boolean {
  if (!reward) return false
  const lower = reward.toLowerCase()
  return lower.includes('badge') || lower.includes('task force') || lower.includes('toon resistance')
}

export function isTeleportAccessReward(reward?: string | null): boolean {
  return reward?.toLowerCase().includes('teleport access') ?? false
}

export function isTrackFrameReward(reward?: string | null): boolean {
  return /\btrack\b.*\bframe\b/i.test(reward ?? '')
}

export function isGagTrainingReward(reward?: string | null): boolean {
  if (!reward) return false
  const lower = reward.toLowerCase()
  return lower.includes('gag') || lower.includes('track training')
}
