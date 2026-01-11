/** Silly Meter utilities - fetches from backend which caches TTR API */

const API_BASE = process.env.NEXT_PUBLIC_API_HTTP || "http://localhost:3000";

export interface SillyMeterData {
  state: "Active" | "Reward" | "Inactive";
  winner: string | null;
  rewards: string[];
  isOverjoyedActive: boolean;
  laffBoost: number;
  nextUpdateTimestamp: number;
  asOf: number;
}

let sillyMeterData: SillyMeterData | null = null;
let cacheExpiry = 0;

export async function fetchSillyMeter(): Promise<SillyMeterData | null> {
  if (sillyMeterData && Date.now() < cacheExpiry) return sillyMeterData;

  try {
    const response = await fetch(`${API_BASE}/utility/get-sillymeter`);
    if (!response.ok) return sillyMeterData;
    sillyMeterData = await response.json();
    cacheExpiry = sillyMeterData!.nextUpdateTimestamp * 1000;
    return sillyMeterData;
  } catch {
    return sillyMeterData;
  }
}

export function getOverjoyedLaffBoost(): number {
  return sillyMeterData?.laffBoost ?? 0;
}

export function getSillyMeter(): SillyMeterData | null {
  return sillyMeterData;
}
