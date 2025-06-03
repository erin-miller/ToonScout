/**
 * @typedef {Object} ApiTTRInvasionResponse
 * @property {null|string} error
 * @property {Object} invasions
 * @property {number} lastUpdated
 */

/**
 * Fetches and returns invasion data from the TTR API.
 * @returns {Promise<ApiTTRInvasionResponse>}
 */

// In-memory cache for invasion end time estimates
const invasionEstimateCache = new Map();

function getInvasionCacheKey(invasion, district) {
  return `${district}:${invasion.type}:${invasion.startTimestamp}`;
}

function calculateEstimatedEndTime(invasion, district) {
  // Returns a unix timestamp (seconds) when the invasion is expected to end, or null if unknown
  const MEGA_INVASION_COGS = 1_000_000;
  if (!invasion.progress || !invasion.progress.includes("/")) return null;
  const [current, total] = invasion.progress.split("/").map(Number);
  if (!total) return null;

  const cacheKey = getInvasionCacheKey(invasion, district);
  // Clean up cache if invasion is over
  if (current >= total && invasionEstimateCache.has(cacheKey)) {
    invasionEstimateCache.delete(cacheKey);
    return invasion.asOf || null;
  }

  if (total === MEGA_INVASION_COGS) {
    // Mega invasion: always 3 hours from startTimestamp
    if (!invasion.startTimestamp) return null;
    return invasion.startTimestamp + 10800;
  }

  // Normal invasion: estimate based on max possible time scaled by progress
  if (!invasion.startTimestamp) return null;
  const maxPossibleTime = total * 0.7; // 0.7 * total cogs
  const progressPercent = current / total;
  const estimatedDuration = Math.round(maxPossibleTime * progressPercent);
  const estimatedEndTime = invasion.startTimestamp + estimatedDuration;
  invasionEstimateCache.set(cacheKey, estimatedEndTime);
  return estimatedEndTime;
}

async function getInvasions() {
  try {
    const response = await fetch(
      "https://www.toontownrewritten.com/api/invasions",
      { headers: { "User-Agent": process.env.USER_AGENT } }
    );
    if (!response.ok) {
      return {
        error: "Failed to fetch from TTR API",
        invasions: {},
        lastUpdated: Math.floor(Date.now() / 1000),
      };
    }
    const data = await response.json();
    // Attach estimatedEndTime to each invasion and use cache
    if (data.invasions) {
      for (const [district, invasion] of Object.entries(data.invasions)) {
        invasion.estimatedEndTime = calculateEstimatedEndTime(
          invasion,
          district
        );
      }
    }
    // Clean up cache for invasions that no longer exist
    const activeKeys = new Set(
      Object.entries(data.invasions || {}).map(([district, invasion]) =>
        getInvasionCacheKey(invasion, district)
      )
    );
    for (const key of invasionEstimateCache.keys()) {
      if (!activeKeys.has(key)) {
        invasionEstimateCache.delete(key);
      }
    }
    return {
      error: null,
      invasions: data.invasions || {},
      lastUpdated: data.lastUpdated || Math.floor(Date.now() / 1000),
    };
  } catch (e) {
    return {
      error: e.message || "Unknown error",
      invasions: {},
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  }
}

export { getInvasions };
