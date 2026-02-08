"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExternalLinkAlt } from "react-icons/fa";
import { MarkerPosition, LOCATION_MARKER_URL } from "@/app/utils/buildingMaps";

interface MapImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapImageUrl: string;
  buildingName: string;
  wikiUrl?: string;
  street?: string | null;
  markerPosition?: MarkerPosition | null;
  headerColor?: "blue" | "pink";
}

const MapImageModal: React.FC<MapImageModalProps> = ({
  isOpen,
  onClose,
  mapImageUrl,
  buildingName,
  wikiUrl,
  street,
  markerPosition,
  headerColor = "blue",
}) => {
  const headerGradient = headerColor === "pink"
    ? "from-pink-900 to-pink-700 dark:from-pink-800 dark:to-pink-900"
    : "from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[9998] backdrop-blur-sm"
          />

          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden max-w-lg w-full max-h-[85vh]"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${headerGradient} px-4 py-3 flex items-center justify-between`}>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {buildingName}
                  </h3>
                  {street && (
                    <p className="text-blue-100 text-sm truncate">{street}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-3 text-white/80 hover:text-white transition-colors p-1"
                  aria-label="Close"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Map Image with Marker Overlay */}
              <div className="relative bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={mapImageUrl}
                    alt={`Map showing ${buildingName} location`}
                    className="rounded-lg max-w-full max-h-[60vh] w-auto h-auto"
                  />
                  {markerPosition && (
                    <img
                      src={LOCATION_MARKER_URL}
                      alt="Location marker"
                      className="absolute pointer-events-none"
                      style={{
                        // Use percentage positioning (marker coords are scaled to 512x512)
                        // Size as percentage so marker scales with image
                        top: `${(markerPosition.top / 512) * 100}%`,
                        left: `${(markerPosition.left / 512) * 100}%`,
                        width: "6%",
                        height: "auto",
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              {wikiUrl && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    <FaExternalLinkAlt size={12} />
                    View on Wiki
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
};

export default MapImageModal;
