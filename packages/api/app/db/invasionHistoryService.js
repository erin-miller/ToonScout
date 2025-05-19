import { connectToInvasionHistoryDB } from "./invasionHistoryDB.js";

/**
 * invasionHistoryService.js
 *
 * This service stores and retrieves historical invasion rate data in MongoDB, using multiple collections for different levels of data granularity.
 *
 * Collections:
 * 1. invasion_rates_district
 *    - Stores rates for a specific District, CogType, CogAmount, and [DayOfWeek-Hour] (e.g., "Boingbury:Name Dropper:3646:1-5").
 *    - Most specific: used when you want to know the rate for a particular district at a specific day/hour.
 *
 * 2. invasion_rates_cogtype_time
 *    - Stores rates for any district, but specific CogType, CogAmount, and [DayOfWeek-Hour] (e.g., "null:Name Dropper:3646:1-5").
 *    - Useful for aggregating data across all districts for a given cog and time.
 *
 * 3. invasion_rates_hour
 *    - Stores rates for any district and any day, but specific CogType, CogAmount, and hour (e.g., "null:Name Dropper:3646:5").
 *    - Useful for seeing general hourly trends for a cog type and amount.
 *
 * 4. invasion_rates_day
 *    - Stores rates for any district and any hour, but specific CogType, CogAmount, and day of week (e.g., "null:Name Dropper:3646:1").
 *    - Useful for seeing general day-of-week trends for a cog type and amount.
 *
 * 5. invasion_rates_generic
 *    - Fallback collection for any other cases or for future expansion.
 *
 * How it works:
 * - When storing a rate, the service determines the appropriate collection based on the specificity of the data (district, time granularity).
 * - When retrieving a historical rate, the service tries the most generic collection first (broadest data), and only uses more specific collections if enough data (at least 10 samples) is available for reliability.
 * - This approach ensures that rare combinations (e.g., a specific district/cog/time) don’t skew results with too little data, while still allowing for highly specific trends as more data is collected.
 *
 * Each document in a collection contains:
 *   - key: a string uniquely identifying the bucket (e.g., "Boingbury:Name Dropper:3646:1-5")
 *   - district, cogType, cogAmount, timeBucket: for easy querying and filtering
 *   - rates: an array of the last 100 recorded rates for that bucket
 */

// Store a rate sample for a given invasion bucket
export async function storeInvasionRate(
  district,
  cogType,
  cogAmount,
  timeBucket,
  rate
) {
  // Choose collection based on granularity
  let collectionName = "invasion_rates_generic";
  if (district && timeBucket.includes("-")) {
    collectionName = "invasion_rates_district";
  } else if (!district && timeBucket.includes("-")) {
    collectionName = "invasion_rates_cogtype_time";
  } else if (!district && timeBucket.length <= 2) {
    collectionName = "invasion_rates_hour";
  } else if (!district && timeBucket.length === 1) {
    collectionName = "invasion_rates_day";
  }
  const collection = await connectToInvasionHistoryDB(collectionName);
  const key = `${district}:${cogType}:${cogAmount}:${timeBucket}`;
  try {
    await collection.updateOne(
      { key },
      {
        $push: { rates: { $each: [rate], $slice: -100 } },
        $setOnInsert: { district, cogType, cogAmount, timeBucket },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("Error storing invasion rate:", error.message);
    throw error;
  }
}

// Get historical average and sample size for a bucket
export async function getInvasionHistoricalRate(
  district,
  cogType,
  cogAmount,
  timeBucket
) {
  // Choose collection based on granularity
  let collectionName = "invasion_rates_generic";
  if (district && timeBucket.includes("-")) {
    collectionName = "invasion_rates_district";
  } else if (!district && timeBucket.includes("-")) {
    collectionName = "invasion_rates_cogtype_time";
  } else if (!district && timeBucket.length <= 2) {
    collectionName = "invasion_rates_hour";
  } else if (!district && timeBucket.length === 1) {
    collectionName = "invasion_rates_day";
  }
  const collection = await connectToInvasionHistoryDB(collectionName);
  const key = `${district}:${cogType}:${cogAmount}:${timeBucket}`;
  try {
    const doc = await collection.findOne({ key });
    if (!doc || !doc.rates || doc.rates.length === 0)
      return { avg: null, n: 0 };
    const avg = doc.rates.reduce((a, b) => a + b, 0) / doc.rates.length;
    return { avg, n: doc.rates.length };
  } catch (error) {
    console.error("Error getting invasion historical rate:", error.message);
    throw error;
  }
}
