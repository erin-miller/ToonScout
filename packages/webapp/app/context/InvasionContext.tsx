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
  estimatedEndTime?: number | null;
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
      estimatedEndTime?: number | null;
      rate?: number;
    };
  };
  lastUpdated: number;
}

// Intervals in milliseconds
const LIVE_DATA_INTERVAL = 30000; // 30 seconds for live data

const InvasionContext = createContext<InvasionContextType>({
  invasions: [],
  loading: true,
});

export const InvasionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [invasions, setInvasions] = useState<InvasionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const prevInvasions = useRef<InvasionData[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isFirstFetch = true;
    let nextInterval = LIVE_DATA_INTERVAL;

    const fetchInvasions = async () => {
      try {
        if (isFirstFetch) setLoading(true);

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
            estimatedEndTime: invasion.estimatedEndTime,
          }),
        );
        if (data.lastUpdated !== lastUpdated) {
          setInvasions(transformed);
          setLastUpdated(data.lastUpdated);
        }

        prevInvasions.current = transformed;

        // Dynamically adjust next poll interval based on TTR's lastUpdated
        const nowSec = Math.floor(Date.now() / 1000);
        const ttrDelay = Math.max(10, 65 - (nowSec - data.lastUpdated)); // poll at least every 10s, but try to sync with TTR (which updates about every 60-65s)
        nextInterval = ttrDelay * 1000;
        if (interval) clearInterval(interval);
        interval = setInterval(fetchInvasions, nextInterval);
      } catch (e) {
        console.error("Error fetching invasions:", e);
      } finally {
        if (isFirstFetch) setLoading(false);
        isFirstFetch = false;
      }
    };

    fetchInvasions();

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
