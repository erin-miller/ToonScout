import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaGlobe, FaClock } from "react-icons/fa";
import { getCogImage, sanitizeCogName } from "@/app/utils/invasionUtils";

interface InvasionCardProps {
  invasion: any;
  percent: number;
  isRelevant: boolean;
  estimatedEndTime?: number | null;
  formatTimeLeft: (secondsLeft: number) => string;
}

const InvasionCard: React.FC<InvasionCardProps> = ({
  invasion,
  percent,
  isRelevant,
  estimatedEndTime,
  formatTimeLeft,
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(
    typeof estimatedEndTime === "number"
      ? estimatedEndTime - Math.floor(Date.now() / 1000)
      : null
  );

  useEffect(() => {
    if (typeof estimatedEndTime !== "number") return;
    const update = () => {
      setTimeLeft(estimatedEndTime - Math.floor(Date.now() / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [estimatedEndTime]);

  return (
    <motion.div
      key={`${invasion.asOf}-${invasion.district}-${invasion.cog}`}
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      layout
      className={`p-4 border-2 rounded-xl bg-white dark:bg-gray-1100 shadow-md space-y-3 transition-all duration-300 hover:shadow-lg ${
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
            <span className="font-semibold">{invasion.district}</span>
          </div>
        </div>
      </div>
      {/* Progress and bar first, then Est. Time Left at bottom right, Start Time at bottom left */}
      <div className="flex flex-col items-center w-full gap-2 mt-2">
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
            Start: {new Date(invasion.startTimestamp * 1000).toLocaleString()}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1 sm:ml-auto sm:justify-end">
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
};

export default InvasionCard;
