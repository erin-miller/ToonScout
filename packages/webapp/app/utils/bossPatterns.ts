/**
 * Boss Pattern Recognition Utility
 * Identifies boss cogs: 4 main bosses + 4 mini-bosses
 */

export enum BossType {
  VP = 'Vice President',
  CEO = 'Chief Executive Officer',
  CJ = 'Chief Justice',
  CFO = 'Chief Financial Officer',
  CLUB_PRESIDENT = 'Club President',
  FACTORY_FOREMAN = 'Factory Foreman',
  MINT_AUDITOR = 'Mint Auditor',
  OFFICE_CLERK = 'Office Clerk',
}

// Pattern map: lowercase pattern -> BossType
const BOSS_PATTERNS: Record<string, BossType> = {
  'vp': BossType.VP,
  'ceo': BossType.CEO,
  'cj': BossType.CJ,
  'cfo': BossType.CFO,
  'cp': BossType.CLUB_PRESIDENT,
  'vice president': BossType.VP,
  'chief executive officer': BossType.CEO,
  'chief justice': BossType.CJ,
  'chief financial officer': BossType.CFO,
  'club president': BossType.CLUB_PRESIDENT,
  'factory foreman': BossType.FACTORY_FOREMAN,
  'mint auditor': BossType.MINT_AUDITOR,
  'office clerk': BossType.OFFICE_CLERK,
};

/**
 * Find boss in text (handles abbreviations and full names)
 */
export function findBossInText(text: string): BossType | null {
  const lower = text.toLowerCase();
  
  for (const pattern in BOSS_PATTERNS) {
    if (new RegExp(`\\b${pattern}\\b`, 'i').test(lower)) {
      return BOSS_PATTERNS[pattern];
    }
  }
  
  return null;
}

/**
 * Extract boss from "Defeat [The] [Boss]" objectives
 */
export function extractBossFromObjective(text: string): BossType | null {
  const match = text.match(/defeat\s+(?:the\s+)?([a-z\s]+?)(?:\s*\(|$)/i);
  return match ? findBossInText(match[1].trim()) : null;
}

/**
 * Check if objective is a boss task
 */
export function isBossTask(objective: string): boolean {
  return extractBossFromObjective(objective) !== null;
}
