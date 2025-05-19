import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "../../animations/AnimatedTab";
import { useInvasionContext } from "@/app/context/InvasionContext";
import {
  FaGlobe,
  FaClock,
  FaHourglassStart,
  FaTachometerAlt,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import {
  getCogImage,
  getRelevantInvasionsForTasks,
  sanitizeCogName,
} from "@/app/utils/invasionUtils";

const InvasionsTab: React.FC<TabProps> = ({ toon }) => {
  const { invasions, loading } = useInvasionContext();
  const [now, setNow] = useState(Date.now());
  // Track previous estimatedTimeLeft for each invasion
  const prevTimeLeftRef = React.useRef<
    Record<string, number | null | undefined>
  >({});

  // Update every second for live elapsed time
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounce small increases in estimatedTimeLeft, but do not mutate the invasions list
  const debouncedInvasions = useMemo(() => {
    return invasions.map((inv) => {
      const key = `${inv.cog}|${inv.district}`;
      const prev = prevTimeLeftRef.current[key];
      const curr = inv.estimatedTimeLeft;
      let estimatedTimeLeft = curr;
      if (
        typeof prev === "number" &&
        typeof curr === "number" &&
        curr > prev &&
        curr - prev < 120 // less than 2 minutes increase
      ) {
        estimatedTimeLeft = prev;
      } else {
        prevTimeLeftRef.current[key] = curr;
      }
      return { ...inv, estimatedTimeLeft };
    });
  }, [invasions]);

  // Get relevant invasions for the current toon's tasks
  const relevantInvasions = useMemo(() => {
    if (!toon?.data?.data?.tasks) return [];
    return getRelevantInvasionsForTasks(
      toon.data.data.tasks,
      debouncedInvasions
    );
  }, [toon, debouncedInvasions]);

  // Resort invasions: relevant at the top
  const sortedInvasions = useMemo(() => {
    if (!relevantInvasions.length) return debouncedInvasions;
    const relevantKeys = new Set(
      relevantInvasions.map((inv) => `${inv.cog}|${inv.district}`)
    );
    const relevant = debouncedInvasions.filter((inv) =>
      relevantKeys.has(`${inv.cog}|${inv.district}`)
    );
    const others = debouncedInvasions.filter(
      (inv) => !relevantKeys.has(`${inv.cog}|${inv.district}`)
    );
    return [...relevant, ...others];
  }, [debouncedInvasions, relevantInvasions]);

  // Helper to parse progress string like "123/500"
  function parseProgress(progress: string) {
    const match = progress.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return { current: 0, total: 1 };
    return { current: parseInt(match[1]), total: parseInt(match[2]) };
  }

  // Helper to format elapsed time
  function formatElapsed(ms: number) {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / 60000) % 60;
    const hr = Math.floor(ms / 3600000);
    return `${hr > 0 ? hr + ":" : ""}${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  // Helper to format time left as HH:MM:SS, MM:SS, or SS
  function formatTimeLeft(secondsLeft: number) {
    if (secondsLeft <= 0) return "Invasion ending soon...";
    const hr = Math.floor(secondsLeft / 3600);
    const min = Math.floor((secondsLeft % 3600) / 60);
    const sec = Math.floor(secondsLeft % 60);
    if (hr > 0)
      return `${hr}:${min.toString().padStart(2, "0")}:${sec
        .toString()
        .padStart(2, "0")}`;
    if (min > 0) return `${min}:${sec.toString().padStart(2, "0")}`;
    return `${sec}s`;
  }

  return (
    <AnimatedTabContent>
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading invasions...
            </span>
          </div>
        ) : sortedInvasions.length > 0 ? (
          <AnimatePresence initial={false}>
            {sortedInvasions.map((invasion) => {
              const { current, total } = parseProgress(invasion.progress);
              const percent = Math.floor((current / total) * 100);
              const elapsedMs = now - invasion.startTimestamp * 1000;
              const isRelevant = relevantInvasions.some(
                (rel) =>
                  rel.cog === invasion.cog && rel.district === invasion.district
              );
              // Calculate time left if available
              let timeLeft = null;
              if (
                typeof invasion.estimatedTimeLeft === "number" &&
                invasion.estimatedTimeLeft > Math.floor(now / 1000)
              ) {
                timeLeft = invasion.estimatedTimeLeft - Math.floor(now / 1000);
              }
              return (
                <motion.div
                  key={`${invasion.asOf}-${invasion.district}-${invasion.cog}`}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  layout
                  className={`p-4 border-2 rounded-xl bg-white dark:bg-gray-800 shadow-md space-y-3 transition-all duration-300 hover:shadow-lg ${
                    isRelevant
                      ? "border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-600"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const img = getCogImage(invasion.cog);
                        return img ? (
                          <Image
                            src={img}
                            alt={invasion.cog}
                            width={48}
                            height={48}
                            className="inline-block w-12 h-12 rounded-full border-2 border-pink-200 bg-white shadow-md"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null;
                      })()}
                      <h3 className="font-bold text-xl md:text-2xl text-pink-700 dark:text-pink-300 flex items-center gap-2 mt-0">
                        {sanitizeCogName(invasion.cog)}
                        {isRelevant && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-yellow-900 text-xs font-semibold">
                            Relevant
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                        <FaGlobe className="inline-block mr-1" />
                        <span className="font-semibold">
                          {invasion.district}
                        </span>
                      </div>
                      {/* Speed indicator */}
                      {typeof invasion.speedStatus === "string" && (
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            invasion.speedStatus === "Faster than Usual"
                              ? "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700"
                              : invasion.speedStatus === "Slower than Usual"
                              ? "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700"
                              : "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          }`}
                          title={invasion.speedStatus}
                        >
                          <span className="text-lg">
                            {invasion.speedStatus === "Faster than Usual" &&
                              "⚡"}
                            {invasion.speedStatus === "Slower than Usual" &&
                              "🐢"}
                            {invasion.speedStatus === "About Average" && "🙂"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Speed:
                          </span>
                          <span className="font-semibold">
                            {invasion.speedStatus === "Faster than Usual" &&
                              "Fast"}
                            {invasion.speedStatus === "Slower than Usual" &&
                              "Slow"}
                            {invasion.speedStatus === "About Average" &&
                              "Normal"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <div className="text-center text-base font-medium mb-1">
                      Progress: {invasion.progress} ({percent.toFixed(0)}%)
                    </div>
                    <div className="w-full max-w-xs h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                      <motion.div
                        className="h-full bg-pink-600 dark:bg-pink-400 transition-all duration-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-gray-700 dark:text-gray-200 text-sm mt-2">
                    <div className="flex items-center gap-1">
                      <FaClock className="inline-block" />
                      <span>
                        Start:{" "}
                        {new Date(
                          invasion.startTimestamp * 1000
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaHourglassStart className="inline-block" />
                      <span>
                        Active For:{" "}
                        <span className="font-mono">
                          {formatElapsed(elapsedMs)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block font-bold text-blue-700 dark:text-blue-300">
                        Est. Time Left:
                      </span>
                      <span className="font-mono">
                        {typeof timeLeft === "number"
                          ? formatTimeLeft(timeLeft)
                          : "Invasion ending soon..."}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <FaGlobe size={48} className="mx-auto text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              No Active Invasions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for new invasions to appear!
            </p>
          </div>
        )}
      </div>
    </AnimatedTabContent>
  );
};

export default InvasionsTab;
