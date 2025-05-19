"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { useInvasionNotifications } from "../components/Home/tabs/components/useInvasionNotifications";
const API_LINK = process.env.NEXT_PUBLIC_API_HTTP;

/**
 * @typedef {Object} InvasionDetails
 * @property {number} asOf - Timestamp when invasion info was updated
 * @property {string} type - The cog type (e.g., "Ambulance Chaser", "Bottom Feeder")
 * @property {string} progress - Current invasion progress as "current/total" (e.g., "1498/3000")
 * @property {number} startTimestamp - Unix timestamp when the invasion started
 * @property {number|null} estimatedTimeLeft - Estimated time left for the invasion to end
 * @property {number} rate - Rate of progress for the invasion
 * @property {string} speedStatus - Speed status of the invasion
 * @property {number|null} historicalRate - Historical rate of progress
 * @property {number} historicalSampleSize - Sample size for historical data
 * @property {boolean} usedHistorical - Whether historical data was used
 */

/**
 * @typedef {Object} TTRInvasionResponse
 * @property {null|string} error - Error message if any, null if successful
 * @property {Object.<string, InvasionDetails>} invasions - Map of district names to invasion details
 * @property {number} lastUpdated - Unix timestamp of when the data was last updated
 */

interface InvasionContextType {
  invasions: InvasionData[];
  loading: boolean;
}

interface InvasionData {
  asOf: number;
  cog: string;
  progress: string;
  startTimestamp: number;
  district: string;
  estimatedTimeLeft?: number | null;
  rate?: number;
  speedStatus?: string;
  historicalRate?: number | null;
  historicalSampleSize?: number;
  usedHistorical?: boolean;
}

// TypeScript interface for the API response
interface TTRInvasionResponse {
  error: null | string;
  invasions: {
    [district: string]: {
      asOf: number;
      type: string;
      progress: string;
      startTimestamp: number;
      estimatedTimeLeft?: number | null;
      rate?: number;
      speedStatus?: string;
      historicalRate?: number | null;
      historicalSampleSize?: number;
      usedHistorical?: boolean;
    };
  };
  lastUpdated: number;
}

// Intervals in milliseconds
const LIVE_DATA_INTERVAL = 60000; // 60 seconds for live data

const InvasionContext = createContext<InvasionContextType>({
  invasions: [],
  loading: true,
});

export const InvasionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [invasions, setInvasions] = useState<InvasionData[]>([]);
  const [loading, setLoading] = useState(true);
  const prevInvasions = useRef<InvasionData[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isFirstFetch = true;

    const fetchInvasions = async () => {
      try {
        if (isFirstFetch) setLoading(true);

        // Always use live endpoint now
        const endpoint = `${API_LINK}/utility/get-invasions`;

        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = (await response.json()) as TTRInvasionResponse;
        if (data.error) return;

        const transformed = Object.entries(data.invasions).map(
          ([district, invasion]) => ({
            asOf: invasion.asOf,
            cog: invasion.type,
            progress: invasion.progress,
            startTimestamp: invasion.startTimestamp,
            district,
            estimatedTimeLeft: invasion.estimatedTimeLeft,
            rate: invasion.rate,
            speedStatus: invasion.speedStatus,
            historicalRate: invasion.historicalRate,
            historicalSampleSize: invasion.historicalSampleSize,
            usedHistorical: invasion.usedHistorical,
          })
        );

        // Set the invasions state
        setInvasions(transformed);

        prevInvasions.current = transformed;
      } catch (e) {
        // Optionally handle error
        console.error("Error fetching invasions:", e);
      } finally {
        if (isFirstFetch) setLoading(false);
        isFirstFetch = false;
      }
    };

    // Initial fetch
    fetchInvasions();

    // Set interval for live data
    interval = setInterval(fetchInvasions, LIVE_DATA_INTERVAL);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <InvasionContext.Provider
      value={{
        invasions,
        loading,
      }}
    >
      {children}
    </InvasionContext.Provider>
  );
};

export const useInvasionContext = () => useContext(InvasionContext);
export function NotificationToastWrapper({
  notifSettings,
  children,
}: {
  notifSettings: any;
  children: ReactNode;
}) {
  const { toast } = useInvasionNotifications(notifSettings);
  return (
    <>
      {children}
      {toast}
    </>
  );
}
