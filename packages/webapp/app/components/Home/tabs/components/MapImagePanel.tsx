"use client";

import React from "react";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import { MarkerPosition, LOCATION_MARKER_URL } from "@/app/utils/buildingMaps";
import { motion } from "framer-motion";

interface MapImagePanelProps {
  mapImageUrl: string;
  buildingName: string;
  wikiUrl?: string;
  street?: string | null;
  markerPosition?: MarkerPosition | null;
  onBack: () => void;
}

const MapImagePanel: React.FC<MapImagePanelProps> = ({
  mapImageUrl,
  buildingName,
  wikiUrl,
  street,
  markerPosition,
  onBack,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-900 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white px-4 sm:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back to steps"
        >
          <FaArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-base sm:text-lg truncate">
            📍 {buildingName}
          </h3>
          {street && <p className="text-pink-100 text-xs sm:text-sm truncate">{street}</p>}
        </div>
      </div>

      {/* Map Image with Marker */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 overflow-auto flex items-center justify-center p-2 sm:p-4">
        <motion.div 
          className="relative inline-block cursor-zoom-in"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <img
            src={mapImageUrl}
            alt={`Map showing ${buildingName} location`}
            className="h-auto rounded-lg"
            style={{ maxHeight: "100%", maxWidth: "100%" }}
          />
          {markerPosition && (
            <motion.img
              src={LOCATION_MARKER_URL}
              alt="Location marker"
              className="absolute pointer-events-none"
              style={{
                top: `${markerPosition.top}px`,
                left: `${markerPosition.left}px`,
                width: "24px",
                height: "24px",
              }}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4, delay: 0.2 }}
            />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      {wikiUrl && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-sm font-medium transition-colors"
          >
            <FaExternalLinkAlt size={12} />
            View on Wiki
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default MapImagePanel;
