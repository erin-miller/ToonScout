function getInvasionCacheKey(invasion, district) {
  return `${district}:${invasion.type}:${invasion.startTimestamp}`
}

const invasionDataCache = new Map()
const MEGA_INVASION_COGS = 1_000_000
const MEGA_INVASION_DURATION = 10800 // 3 hours in seconds
const NORMAL_INVASION_MAX_RATE = 0.7 // seconds per cog maximum

function getMaxInvasionDuration(total) {
  return total === MEGA_INVASION_COGS ? MEGA_INVASION_DURATION : total * NORMAL_INVASION_MAX_RATE
}

function updateInvasionDataCache(invasion, district) {
  const cacheKey = getInvasionCacheKey(invasion, district)
  const now = invasion.asOf || Math.floor(Date.now() / 1000)
  if (!invasion.progress || !invasion.progress.includes('/')) return null
  const [current, total] = invasion.progress.split('/').map(Number)
  if (!current || !total) return null
  let cacheEntry = invasionDataCache.get(cacheKey)
  if (!cacheEntry) {
    cacheEntry = {
      startTimestamp: invasion.startTimestamp,
      total: total,
      maxDuration: getMaxInvasionDuration(total),
      dataPoints: [],
      lastUpdate: now,
      currentRate: null,
      avgRate: null,
      isRateReliable: false
    }
  }
  // Add new data point
  cacheEntry.dataPoints.push({
    timestamp: now,
    defeated: current,
    total: total
  })
  // Keep only relevant data points (last 10, or last hour worth)
  const oneHourAgo = now - 3600
  cacheEntry.dataPoints = cacheEntry.dataPoints.filter(point => point.timestamp > oneHourAgo).slice(-10)
  // Calculate rates
  const rates = calculateInvasionRates(cacheEntry.dataPoints, invasion.startTimestamp)
  cacheEntry.currentRate = rates.currentRate
  cacheEntry.avgRate = rates.avgRate
  cacheEntry.isRateReliable = rates.isReliable
  cacheEntry.lastUpdate = now
  invasionDataCache.set(cacheKey, cacheEntry)
  return cacheEntry
}

function calculateInvasionRates(dataPoints, startTimestamp) {
  if (dataPoints.length < 4) {
    return { currentRate: null, avgRate: null, isReliable: false }
  }
  // Current rate: last 5 data points for responsiveness
  const recentPoints = dataPoints.slice(-5)
  let currentRate = null
  if (recentPoints.length >= 4) {
    const first = recentPoints[0]
    const last = recentPoints[recentPoints.length - 1]
    const timeElapsed = last.timestamp - first.timestamp
    const cogsDefeated = last.defeated - first.defeated
    if (timeElapsed > 0 && cogsDefeated > 0) {
      currentRate = cogsDefeated / timeElapsed
    }
  }
  // Average rate: from start of invasion (more stable)
  let avgRate = null
  if (startTimestamp && dataPoints.length > 0) {
    const latest = dataPoints[dataPoints.length - 1]
    const totalTime = latest.timestamp - startTimestamp
    const totalDefeated = latest.defeated
    if (totalTime > 0 && totalDefeated > 0) {
      avgRate = totalDefeated / totalTime
    }
  }
  // Rate is reliable if we have enough data points and consistent rates
  const isReliable = dataPoints.length >= 5 && currentRate && avgRate && Math.abs(currentRate - avgRate) / avgRate < 0.5 // Within 50% of each other
  return { currentRate, avgRate, isReliable }
}

function estimateEndTimeByRate(now, current, total, rate, absoluteEndTime) {
  if (rate > 0) {
    const remaining = total - current
    const secondsLeft = Math.ceil(remaining / rate)
    return Math.min(now + secondsLeft, absoluteEndTime)
  }
  return null
}

function estimateEndTimeByProgress(now, current, total, startTimestamp, maxDuration) {
  const progressPercent = current / total
  const timeElapsed = now - startTimestamp
  if (timeElapsed > 0 && progressPercent > 0) {
    const projectedTotalTime = timeElapsed / progressPercent
    return startTimestamp + Math.min(projectedTotalTime, maxDuration)
  }
  return null
}

// Baseline defeat rate for fallback (cogs per minute)
const BASELINE_COGS_PER_MIN = 80
const BASELINE_COGS_PER_SEC = BASELINE_COGS_PER_MIN / 60

function isSkelecogInvasion(invasion) {
  return invasion.type && invasion.type.toLowerCase().includes('skelecog')
}

function calculateEstimatedEndTime(invasion, district) {
  const now = invasion.asOf || Math.floor(Date.now() / 1000)
  if (!invasion.progress || !invasion.progress.includes('/')) return null
  const [current, total] = invasion.progress.split('/').map(Number)

  // Skelecog mega invasion: always use fixed 3-hour duration
  if (isSkelecogInvasion(invasion) && invasion.startTimestamp && total) {
    const endTime = invasion.startTimestamp + MEGA_INVASION_DURATION
    return Math.max(now, Math.floor(endTime))
  }

  //  mega invasion: 0/1000000 progress, estimatedEndTime null, use 3-hour duration
  if (
    total === MEGA_INVASION_COGS &&
    invasion.startTimestamp &&
    current === 0 &&
    (!('estimatedEndTime' in invasion) || invasion.estimatedEndTime == null)
  ) {
    const endTime = invasion.startTimestamp + MEGA_INVASION_DURATION
    return Math.max(now, Math.floor(endTime))
  }

  if (!current || !total) return null
  const cacheKey = getInvasionCacheKey(invasion, district)
  // Clean up cache if invasion is complete
  if (current >= total && invasionDataCache.has(cacheKey)) {
    invasionDataCache.delete(cacheKey)
    return now
  }
  // Handle other mega invasions (with progress): always use fixed 3-hour duration
  if (total === MEGA_INVASION_COGS && invasion.startTimestamp) {
    const endTime = invasion.startTimestamp + MEGA_INVASION_DURATION
    return Math.max(now, Math.floor(endTime))
  }
  // Update cache with new data point
  const cacheEntry = updateInvasionDataCache(invasion, district)
  if (!cacheEntry) return null
  const maxDuration = cacheEntry.maxDuration
  const absoluteEndTime = invasion.startTimestamp + maxDuration
  // If very early in invasion (<5% progress or <5 data points), use baseline defeat rate
  const progressPercent = current / total
  if (progressPercent < 0.05 || (cacheEntry.dataPoints && cacheEntry.dataPoints.length < 5)) {
    const remaining = total - current
    const baselineSeconds = Math.ceil(remaining / BASELINE_COGS_PER_SEC)
    return Math.max(now, now + baselineSeconds)
  }
  // Strategy 1: Use actual defeat rate if reliable
  if (cacheEntry.isRateReliable) {
    const endTime = estimateEndTimeByRate(now, current, total, cacheEntry.currentRate, absoluteEndTime)
    if (endTime !== null) return Math.max(now, Math.floor(endTime))
  }
  // Strategy 2: Use average rate if available but not fully reliable
  if (cacheEntry.avgRate > 0) {
    const endTime = estimateEndTimeByRate(now, current, total, cacheEntry.avgRate, absoluteEndTime)
    if (endTime !== null) return Math.max(now, Math.floor(endTime))
  }
  // Strategy 3: Use progress scaling
  const progressEndTime = estimateEndTimeByProgress(now, current, total, invasion.startTimestamp, maxDuration)
  // If the progress-based estimate is in the past or too short, fallback to baseline defeat rate
  if (progressEndTime !== null) {
    if ((progressEndTime < now || progressEndTime - now < 60) && current < total) {
      const remaining = total - current
      const baselineSeconds = Math.ceil(remaining / BASELINE_COGS_PER_SEC)
      return Math.max(now, now + baselineSeconds)
    }
    return Math.max(now, Math.floor(progressEndTime))
  }
  // Fallback: baseline defeat rate
  const remaining = total - current
  const baselineSeconds = Math.ceil(remaining / BASELINE_COGS_PER_SEC)
  return Math.max(now, now + baselineSeconds)
}

async function getInvasions() {
  try {
    const response = await fetch('https://www.toontownrewritten.com/api/invasions', {
      headers: { 'User-Agent': process.env.USER_AGENT }
    })
    if (!response.ok) {
      return {
        error: 'Failed to fetch from TTR API',
        invasions: {},
        lastUpdated: Math.floor(Date.now() / 1000)
      }
    }
    const data = await response.json()
    if (data.invasions) {
      for (const [district, invasion] of Object.entries(data.invasions)) {
        invasion.estimatedEndTime = calculateEstimatedEndTime(invasion, district)
        // Add isMegaInvasion flag (true for 1,000,000 cogs, not skelecog)
        const isSkelecog = isSkelecogInvasion(invasion)
        const [, total] = (invasion.progress || '0/0').split('/').map(Number)
        invasion.isMegaInvasion = isSkelecog || total === MEGA_INVASION_COGS
      }
    }
    // Clean up cache for invasions that no longer exist in the latest API response
    const activeKeys = new Set(
      Object.entries(data.invasions || {}).map(([district, invasion]) => getInvasionCacheKey(invasion, district))
    )
    for (const key of invasionDataCache.keys()) {
      if (!activeKeys.has(key)) {
        invasionDataCache.delete(key)
      }
    }
    return {
      error: null,
      invasions: data.invasions || {},
      lastUpdated: data.lastUpdated || Math.floor(Date.now() / 1000)
    }
  } catch (e) {
    return {
      error: e.message || 'Unknown error',
      invasions: {},
      lastUpdated: Math.floor(Date.now() / 1000)
    }
  }
}

export { getInvasions, getMaxInvasionDuration, MEGA_INVASION_COGS, NORMAL_INVASION_MAX_RATE, calculateEstimatedEndTime }
