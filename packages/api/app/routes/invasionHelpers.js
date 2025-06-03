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

  // Normal invasion: max duration is total cogs * 0.7 seconds
  if (!invasion.startTimestamp || !invasion.asOf) return null;
  const elapsed = invasion.asOf - invasion.startTimestamp;
  if (elapsed <= 0) return null;
  // Use a minimum time window to avoid overestimating rate at the start
  const minElapsed = Math.max(elapsed, 120); // at least 2 minutes
  const rate = current / minElapsed; // cogs per second
  if (rate <= 0) return null;
  const remaining = total - current;
  const secondsLeftByRate = Math.round(remaining / rate);
  const maxPossibleTime = Math.round(total * 0.7); // 0.7 * total cogs
  const secondsLeftByMax = maxPossibleTime - elapsed;
  const bestEstimate = Math.max(
    0,
    Math.min(secondsLeftByRate, secondsLeftByMax)
  );
  const estimatedEndTime = invasion.asOf + bestEstimate;
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
