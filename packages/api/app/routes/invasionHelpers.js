import fetch from "node-fetch";

/**
 * @typedef {Object} InvasionDetails
 * @property {number} asOf - Timestamp when invasion info was updated
 * @property {string} type - The cog type (e.g., "Ambulance Chaser", "Bottom Feeder")
 * @property {string} progress - Current invasion progress as "current/total" (e.g., "1498/3000")
 * @property {number} startTimestamp - Unix timestamp when the invasion started
 */

/**
 * @typedef {Object} InvasionStats
 * @property {number} rate - Estimated cogs defeated per minute
 * @property {number|null} estimatedTimeLeft - Unix timestamp (seconds) when invasion is expected to end, or null if unknown
 */

/**
 * @typedef {Object} ApiInvasionDetails
 * @property {number} asOf
 * @property {string} type
 * @property {string} progress
 * @property {number} startTimestamp
 * @property {number} rate
 * @property {number|null} estimatedTimeLeft
 */

/**
 * @typedef {Object} ApiTTRInvasionResponse
 * @property {null|string} error
 * @property {Object.<string, ApiInvasionDetails>} invasions
 * @property {number} lastUpdated
 */

// In-memory cache for invasions
let cachedInvasions = null;
let lastFetchTime = 0;
const INVASION_CACHE_MS = 60 * 1000; // 60 seconds

/**
 * Helper to parse progress string (e.g., "1498/3000") into [current, total]
 * @param {string} progress
 * @returns {[number, number]}
 */
function parseProgress(progress) {
  const [current, total] = progress.split("/").map(Number);
  return [current, total];
}

/**
 * Helper to estimate cogs/min rate and time left for an invasion
 * @param {string} district
 * @param {InvasionDetails} invasion
 * @param {Object.<string, InvasionDetails>} prevInvasions
 * @returns {InvasionStats}
 */
function estimateInvasionStats(district, invasion, prevInvasions) {
  const [current, total] = parseProgress(invasion.progress);
  const prev = prevInvasions[district];
  let rate = 100; // default cogs/min
  let estimatedTimeLeft = null;
  if (
    prev &&
    prev.type === invasion.type &&
    prev.startTimestamp === invasion.startTimestamp
  ) {
    const [prevCurrent] = parseProgress(prev.progress);
    const deltaCogs = current - prevCurrent;
    const deltaTime = (invasion.asOf - prev.asOf) / 60; // seconds to minutes
    if (deltaCogs > 0 && deltaTime > 0) {
      rate = deltaCogs / deltaTime;
    }
  }
  const cogsLeft = total - current;
  if (rate > 0) {
    const minsLeft = cogsLeft / rate;
    estimatedTimeLeft = Math.round(invasion.asOf + minsLeft * 60); // asOf is a timestamp in seconds
  }
  return { rate: Math.round(rate), estimatedTimeLeft };
}

/**
 * Formats the API response to include stats for each invasion
 * @param {Object} data - The raw TTR API data
 * @param {Object.<string, InvasionDetails>} prevInvasions - Previous invasions for rate calculation
 * @param {string|null} [error=null] - Error message if any
 * @returns {ApiTTRInvasionResponse}
 */
function formatApiInvasionResponse(data, prevInvasions, error = null) {
  const invasionsWithStats = {};
  for (const [district, invasion] of Object.entries(data.invasions || {})) {
    const stats = estimateInvasionStats(district, invasion, prevInvasions);
    invasionsWithStats[district] = { ...invasion, ...stats };
  }
  return {
    error: error || data.error || null,
    invasions: invasionsWithStats,
    lastUpdated: data.lastUpdated || Math.floor(Date.now() / 1000),
  };
}

/**
 * Fetches and returns cached or fresh invasion data, formatted for API response.
 * Handles in-memory caching and error formatting.
 * @returns {Promise<ApiTTRInvasionResponse>}
 */
async function getCachedInvasions() {
  const now = Date.now();
  if (!global.prevInvasions) global.prevInvasions = {};
  // Serve from cache if fresh
  if (cachedInvasions && now - lastFetchTime < INVASION_CACHE_MS) {
    global.prevInvasions = { ...cachedInvasions.invasions };
    return cachedInvasions;
  }
  try {
    const response = await fetch(
      "https://www.toontownrewritten.com/api/invasions",
      { headers: { "User-Agent": process.env.USER_AGENT } }
    );
    if (!response.ok) {
      return formatApiInvasionResponse(
        {},
        global.prevInvasions,
        "Failed to fetch from TTR API"
      );
    }
    /** @type {TTRInvasionResponse} */
    const data = await response.json();
    const apiResponse = formatApiInvasionResponse(data, global.prevInvasions);
    cachedInvasions = apiResponse;
    lastFetchTime = now;
    global.prevInvasions = { ...data.invasions };
    return apiResponse;
  } catch (error) {
    return formatApiInvasionResponse({}, global.prevInvasions, error.message);
  }
}

export {
  parseProgress,
  estimateInvasionStats,
  formatApiInvasionResponse,
  getCachedInvasions,
};
