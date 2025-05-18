import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "../../animations/AnimatedTab";
import { useInvasionContext } from "@/app/context/InvasionContext";
import { FaGlobe, FaClock, FaHourglassStart } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import {
  getCogImage,
  getRelevantInvasionsForTasks,
  sanitizeCogName,
} from "@/app/utils/invasionUtils";

const InvasionsTab: React.FC<TabProps> = ({ toon }) => {
  const { invasions, loading } = useInvasionContext();
  const [now, setNow] = useState(Date.now());
  const [displayedInvasions, setDisplayedInvasions] = useState(invasions);

  // Update every second for live elapsed time
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Only update displayedInvasions if the set of (cog+district) keys changes
  useEffect(() => {
    const getKeys = (arr: typeof invasions) =>
      arr
        .map((inv) => `${inv.cog}|${inv.district}`)
        .sort()
        .join(",");
    const prevKeys = getKeys(displayedInvasions);
    const newKeys = getKeys(invasions);
    if (prevKeys !== newKeys) {
      setDisplayedInvasions(invasions);
    }
  }, [invasions]);

  // Get relevant invasions for the current toon's tasks
  const relevantInvasions = useMemo(() => {
    if (!toon?.data?.data?.tasks) return [];
    return getRelevantInvasionsForTasks(
      toon.data.data.tasks,
      displayedInvasions
    );
  }, [toon, displayedInvasions]);

  // Resort invasions: relevant at the top
  const sortedInvasions = useMemo(() => {
    if (!relevantInvasions.length) return displayedInvasions;
    const relevantKeys = new Set(
      relevantInvasions.map((inv) => `${inv.cog}|${inv.district}`)
    );
    const relevant = displayedInvasions.filter((inv) =>
      relevantKeys.has(`${inv.cog}|${inv.district}`)
    );
    const others = displayedInvasions.filter(
      (inv) => !relevantKeys.has(`${inv.cog}|${inv.district}`)
    );
    return [...relevant, ...others];
  }, [displayedInvasions, relevantInvasions]);

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

  return (
    <AnimatedTabContent>
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : displayedInvasions.length > 0 ? (
          <AnimatePresence initial={false}>
            {sortedInvasions.map((invasion) => {
              const { current, total } = parseProgress(invasion.progress);
              const percent = Math.floor((current / total) * 100);
              const elapsedMs = now - invasion.startTimestamp * 1000;
              const isRelevant = relevantInvasions.some(
                (rel) =>
                  rel.cog === invasion.cog && rel.district === invasion.district
              );
              return (
                <motion.div
                  key={`${invasion.asOf}-${invasion.district}-${invasion.cog}`}
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  layout
                  className={`p-4 border-2 rounded-xl bg-white dark:bg-gray-1100 shadow-md space-y-2 ${
                    isRelevant
                      ? "border-yellow-400 border-2 dark:ring-yellow-500"
                      : ""
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
                    <div
                      className="flex items-center gap-2 text-blue-900 dark:text-blue-300"
                      style={{ alignSelf: "flex-start" }}
                    >
                      <FaGlobe className="inline-block mr-1" />
                      <span className="font-semibold">{invasion.district}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <div className="text-center text-base font-medium mb-1">
                      Progress: {invasion.progress} ({percent.toFixed(0)}%)
                    </div>
                    <div className="w-full max-w-xs h-4 bg-gray-200 dark:bg-gray-900 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-pink-600 dark:bg-pink-400 transition-all duration-500"
                        style={{ width: percent + "%" }}
                      ></div>
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
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div>No active invasions</div>
        )}
      </div>
    </AnimatedTabContent>
  );
};

export default InvasionsTab;
