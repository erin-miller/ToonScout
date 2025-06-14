import React, { useMemo } from "react";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "../../animations/AnimatedTab";
import { useInvasionContext } from "@/app/context/InvasionContext";
import { FaGlobe } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import { getRelevantInvasionsForTasks } from "@/app/utils/invasionUtils";
import { parseProgress, formatTimeLeft } from "@/app/utils/invasionsTabUtils";
import InvasionCard from "./InvasionCard";

const InvasionsTab: React.FC<TabProps> = ({ toon }) => {
  const { invasions, loading } = useInvasionContext();
  const prevTimeLeftRef = React.useRef<
    Record<string, number | null | undefined>
  >({});

  const debouncedInvasions = useMemo(() => {
    return invasions.map((inv) => {
      const key = `${inv.cog}|${inv.district}`;
      const prev = prevTimeLeftRef.current[key];
      const curr = inv.estimatedEndTime;
      let estimatedEndTime = curr;
      if (
        typeof prev === "number" &&
        typeof curr === "number" &&
        curr > prev &&
        curr - prev < 120
      ) {
        estimatedEndTime = prev;
      } else {
        prevTimeLeftRef.current[key] = curr;
      }
      return { ...inv, estimatedEndTime };
    });
  }, [invasions]);

  const relevantInvasions = useMemo(() => {
    if (!toon?.data?.data?.tasks) return [];
    return getRelevantInvasionsForTasks(
      toon.data.data.tasks,
      debouncedInvasions
    );
  }, [toon, debouncedInvasions]);

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

  return (
    <AnimatedTabContent>
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 fish-scrollbar">
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
              const isRelevant = relevantInvasions.some(
                (rel) =>
                  rel.cog === invasion.cog && rel.district === invasion.district
              );
              return (
                <InvasionCard
                  key={`${invasion.district}-${invasion.cog}-${invasion.startTimestamp}`}
                  invasion={invasion}
                  percent={percent}
                  isRelevant={isRelevant}
                  estimatedEndTime={invasion.estimatedEndTime}
                  formatTimeLeft={formatTimeLeft}
                />
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4">
              <FaGlobe
                size={48}
                className="mx-auto text-gray-300 dark:text-gray-400 drop-shadow-sm"
                style={{ filter: "drop-shadow(0 1px 4px #eab30888)" }}
              />
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-pink-900 dark:text-pink-200 font-bold mb-2 drop-shadow-sm">
              No Active Invasions
            </h3>
            <p className="text-lg md:text-xl font-semibold text-pink-900 dark:text-pink-200">
              Check back later for new invasions to appear!
            </p>
          </div>
        )}
      </div>
    </AnimatedTabContent>
  );
};

export default InvasionsTab;
