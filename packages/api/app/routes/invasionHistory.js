// Simple JSON-backed historical stats for invasions
// In production, replace with a real DB
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  storeInvasionRate,
  getInvasionHistoricalRate,
} from "../db/invasionHistoryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HIST_FILE = path.resolve(__dirname, "invasion_history.json");
let cache = {};

function loadHistory() {
  if (fs.existsSync(HIST_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(HIST_FILE, "utf8"));
    } catch (e) {
      cache = {};
    }
  }
}

function saveHistory() {
  fs.writeFileSync(HIST_FILE, JSON.stringify(cache));
}

// Helper to get a time bucket for [dayOfWeek, hour]
function getTimeBucket(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCDay()}-${d.getUTCHours()}`;
}

// Helper to get a time bucket for just hour
function getHourBucket(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCHours()}`;
}

// Helper to get a time bucket for just day
function getDayBucket(ts) {
  const d = new Date(ts * 1000);
  return `${d.getUTCDay()}`;
}

function getKey(district, cogType, cogAmount, timeBucket) {
  return `${district}:${cogType}:${cogAmount}:${timeBucket}`;
}

// Store all three granularities for each rate sample
async function recordRate(district, cogType, cogAmount, ts, rate) {
  const timeBucket = getTimeBucket(ts);
  const hourBucket = getHourBucket(ts);
  const dayBucket = getDayBucket(ts);
  // Most specific: District:CogType:CogAmount:DayOfWeek-Hour
  await storeInvasionRate(district, cogType, cogAmount, timeBucket, rate);
  // CogType:CogAmount:DayOfWeek-Hour (no district)
  await storeInvasionRate(null, cogType, cogAmount, timeBucket, rate);
  // CogType:CogAmount:Hour (no district, no day)
  await storeInvasionRate(null, cogType, cogAmount, hourBucket, rate);
  // CogType:CogAmount:Day (no district, no hour)
  await storeInvasionRate(null, cogType, cogAmount, dayBucket, rate);
}

// Try to get the most generic historical rate first, then more specific as data becomes available
async function getHistoricalRate(district, cogType, cogAmount, ts) {
  const timeBucket = getTimeBucket(ts);
  const hourBucket = getHourBucket(ts);
  const dayBucket = getDayBucket(ts);
  // Try most generic first
  let result = await getInvasionHistoricalRate(
    null,
    cogType,
    cogAmount,
    dayBucket
  );
  if (result.n >= 10 && result.avg !== null) return result;
  // Try CogType:CogAmount:Hour
  result = await getInvasionHistoricalRate(
    null,
    cogType,
    cogAmount,
    hourBucket
  );
  if (result.n >= 10 && result.avg !== null) return result;
  // Try CogType:CogAmount:DayOfWeek-Hour
  result = await getInvasionHistoricalRate(
    null,
    cogType,
    cogAmount,
    timeBucket
  );
  if (result.n >= 10 && result.avg !== null) return result;
  // Try most specific last
  result = await getInvasionHistoricalRate(
    district,
    cogType,
    cogAmount,
    timeBucket
  );
  return result;
}

export { recordRate, getHistoricalRate };
