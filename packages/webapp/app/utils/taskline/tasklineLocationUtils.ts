import { normalizePlace } from "../normalizationPatterns";

// All 17 streets in Toontown Rewritten (from building_maps.json)
const STREETS = new Set([
  "Alto Avenue",
  "Baritone Boulevard",
  "Barnacle Boulevard",
  "Elm Street",
  "Lighthouse Lane",
  "Loopy Lane",
  "Lullaby Lane",
  "Maple Street",
  "Oak Street",
  "Pajama Place",
  "Polar Place",
  "Punchline Place",
  "Seaweed Street",
  "Silly Street",
  "Sleet Street",
  "Tenor Terrace",
  "Walrus Way",
]);

const STF_ALIASES = [
  "sellbot task force",
  "sellbot task force hideout",
  "sellbot hq",
];

const PRIMARY_PLAYGROUNDS = new Set([
  "toontown central",
  "donalds dock",
  "daisy gardens",
  "minnies melodyland",
  "the brrrgh",
  "donalds dreamland",
  "sellbot task force",
]);

// Used in tasklineMatching.ts
export const COG_DISGUISE_MIN_PLAYGROUNDS = new Set([
  "donalds dreamland",
  "sellbot task force",
]);

export const getTaskStreet = (task: { to?: { zone?: string }; from?: { zone?: string }; objective?: { where?: string } }): string | null => {
  const candidates = [
    task.to?.zone,
    task.from?.zone,
    task.objective?.where,
  ];

  for (const value of candidates) {
    if (!value) continue;
    
    // Extract first part before comma, trim, and check against known streets
    const candidate = value.split(",")[0]?.trim();
    if (candidate && STREETS.has(candidate)) {
      return candidate;
    }
  }

  return null;
};

export function getPrimaryPlayground(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const normalized = normalizePlace(value);
  const hasStfAlias = STF_ALIASES.some((alias) => normalized.includes(alias));
  if (hasStfAlias) {
    return "sellbot task force";
  }
  return PRIMARY_PLAYGROUNDS.has(normalized) ? normalized : null;
}

export function locationsMatch(a: string, b: string): boolean {
  const normalizedA = normalizePlace(a);
  const normalizedB = normalizePlace(b);
  return normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA);
}