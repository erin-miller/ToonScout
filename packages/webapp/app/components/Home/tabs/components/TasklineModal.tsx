"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Task, Taskline, TasklineStep } from "@/app/types";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import MapImagePanel from "./MapImagePanel";
import { BuildingMapInfo } from "@/app/utils/buildingMaps";
import {
  setTasklineOverride,
  clearTasklineOverride,
  getTasklineOverride,
} from "@/app/utils/tasklineOverrides";
import { getTasklineProgress } from "@/app/utils/tasklineProgress";
import { buildTaskObjectiveText } from "@/app/utils/tasklineTextUtils";
import { getTaskStreet } from "@/app/utils/taskline/tasklineLocationUtils";
import { TasklineStepNavigation } from "./TasklineStepNavigation";
import { TasklineStepList } from "./TasklineStepList";

interface TasklineModalProps {
  task: Task;
  taskline: Taskline;
  currentStep?: TasklineStep;
  forceStepOrder?: number;
  matchedObjective?: {
    text: string;
    location?: string;
    building?: string;
    optionIndex?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (newStep: TasklineStep, isReset?: boolean) => void;
  toonId?: string | null;
}

const TasklineModal: React.FC<TasklineModalProps> = ({
  task,
  taskline,
  currentStep,
  forceStepOrder,
  matchedObjective,
  isOpen,
  onClose,
  onStepChange,
  toonId,
}) => {
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(
    forceStepOrder ?? currentStep?.order ?? 1
  );
  const [hasUserOverride, setHasUserOverride] = useState(false);
  const [modalView, setModalView] = useState<'steps' | 'map'>('steps');
  const [mapData, setMapData] = useState<{
    buildingName: string;
    mapInfo: BuildingMapInfo;
  } | null>(null);

  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const progress = getTasklineProgress(taskline.id, toonId);
  const completedSteps = progress?.completedSteps || [];
  const completedCount = completedSteps.length;
  const totalSteps = taskline.steps.length;
  const minStepFromProgress = useMemo(() => {
    if (!progress?.lastSeenStep) return null;
    return Math.min(progress.lastSeenStep, totalSteps);
  }, [progress?.lastSeenStep, totalSteps]);

  const isProgressComplete = useMemo(() => {
    const progressData = task.objective?.progress;
    if (!progressData) return false;
    if (
      typeof progressData.text === "string" &&
      progressData.text.toLowerCase().includes("complete")
    ) {
      return true;
    }
    const current = Number(progressData.current ?? 0);
    const target = Number(progressData.target ?? 0);
    return (
      Number.isFinite(current) &&
      Number.isFinite(target) &&
      target > 0 &&
      current >= target
    );
  }, [task.objective]);

  const effectiveStepNumber = useMemo(() => {
    if (Number.isFinite(forceStepOrder)) {
      return selectedStepNumber;
    }
    if (!currentStep) {
      return selectedStepNumber;
    }
    if (!hasUserOverride && isProgressComplete && currentStep.order < totalSteps) {
      return currentStep.order + 1;
    }
    return selectedStepNumber;
  }, [
    currentStep,
    forceStepOrder,
    hasUserOverride,
    isProgressComplete,
    selectedStepNumber,
    totalSteps,
  ]);

  const completionPercent =
    totalSteps > 0 ? Math.round((effectiveStepNumber / totalSteps) * 100) : 0;

  const fullObjectiveText = useMemo(() => buildTaskObjectiveText(task), [task]);

  const taskStreet = useMemo(() => getTaskStreet(task), [task]);
  const selectedStep = useMemo(
    () =>
      taskline.steps.find((s) => s.order === effectiveStepNumber) ??
      taskline.steps[0],
    [taskline.steps, effectiveStepNumber]
  );

  useEffect(() => {
    const override = getTasklineOverride(task, toonId);
    const hasOverride = !!override && override.tasklineId === taskline.id;
    setHasUserOverride(hasOverride);

    if (hasOverride && override) {
      setSelectedStepNumber(override.stepNumber);
      return;
    }

    if (Number.isFinite(forceStepOrder)) {
      setSelectedStepNumber(forceStepOrder as number);
      return;
    }

    if (currentStep) {
      setSelectedStepNumber(currentStep.order);
      return;
    }

    const recommendedStep = minStepFromProgress ?? 1;
    setSelectedStepNumber(recommendedStep);
  }, [
    currentStep?.order,
    forceStepOrder,
    minStepFromProgress,
    task,
    taskline.id,
    toonId,
    progress?.lastSeenStep,
  ]);

  useEffect(() => {
    if (isOpen && effectiveStepNumber) {
      setTimeout(() => {
        const stepElement = stepRefs.current.get(effectiveStepNumber);
        if (stepElement && scrollContainerRef.current) {
          stepElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, [effectiveStepNumber, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handlePreviousStep = () => {
    if (selectedStepNumber > 1) {
      const newStepNumber = selectedStepNumber - 1;
      setSelectedStepNumber(newStepNumber);
      setUserOverride(newStepNumber);
    }
  };

  const handleNextStep = () => {
    if (selectedStepNumber < taskline.steps.length) {
      const newStepNumber = selectedStepNumber + 1;
      setSelectedStepNumber(newStepNumber);
      setUserOverride(newStepNumber);
    }
  };

  const setUserOverride = (stepNumber: number) => {
    setTasklineOverride(task, taskline.id, stepNumber, toonId);
    setHasUserOverride(true);
    const newStep = taskline.steps.find((s) => s.order === stepNumber);
    if (newStep && onStepChange) {
      onStepChange(newStep);
    }
  };

  const handleResetOverride = () => {
    clearTasklineOverride(task, toonId);
    setHasUserOverride(false);
    if (onStepChange && currentStep) {
      onStepChange(currentStep, true);
    }
  };

  if (!isOpen) return null;
  if (!selectedStep) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
          />

          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
              style={{ maxHeight: "82vh" }}
            >
              {modalView === 'steps' ? (
                <div className="bg-gradient-to-r from-pink-900 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white px-6 pt-6 pb-3 relative flex-shrink-0">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    aria-label="Close modal"
                  >
                    <FaTimes size={24} />
                  </button>

                  <h2 className="text-xl sm:text-2xl font-bold pr-10">
                    {task.reward}
                  </h2>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {taskline.playground && (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm">
                        {taskline.playground}
                      </span>
                    )}
                    {hasUserOverride && (
                      <span className="px-3 py-1 bg-yellow-400/30 dark:bg-yellow-600/30 rounded-full text-xs sm:text-sm font-medium">
                        📍 Manual Step
                      </span>
                    )}
                  </div>

                  <TasklineStepNavigation
                    effectiveStepNumber={effectiveStepNumber}
                    totalSteps={totalSteps}
                    completedCount={completedCount}
                    completionPercent={completionPercent}
                    hasUserOverride={hasUserOverride}
                    onPreviousStep={handlePreviousStep}
                    onNextStep={handleNextStep}
                    onResetOverride={handleResetOverride}
                  />

                </div>
              ) : null}

              <div className="flex-1 overflow-hidden">
                {modalView === 'steps' ? (
                  <TasklineStepList
                    steps={taskline.steps}
                    effectiveStepNumber={effectiveStepNumber}
                    scrollContainerRef={scrollContainerRef}
                    stepRefs={stepRefs}
                    task={task}
                    fullObjectiveText={fullObjectiveText}
                    matchedObjective={matchedObjective || null}
                    currentStep={currentStep || null}
                    taskStreet={taskStreet}
                    tasklinePlayground={taskline.playground}
                    onStepClick={(stepNumber) => {
                      setSelectedStepNumber(stepNumber);
                      setUserOverride(stepNumber);
                    }}
                    onMapClick={(building, mapInfo) => {
                      setMapData({ buildingName: building, mapInfo });
                      setModalView('map');
                    }}
                  />
                ) : (
                  mapData && (
                    <MapImagePanel
                      mapImageUrl={mapData.mapInfo.mapImageUrl}
                      buildingName={mapData.buildingName}
                      wikiUrl={mapData.mapInfo.wikiUrl}
                      street={mapData.mapInfo.street}
                      markerPosition={mapData.mapInfo.markerPosition}
                      onBack={() => setModalView('steps')}
                    />
                  )
                )}
              </div>

              {modalView === 'steps' && (
                <div className="bg-blue-50 dark:bg-gray-900 px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between sm:items-center border-t dark:border-gray-700 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {taskline.wikiUrl && (
                      <a
                        href={taskline.wikiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        <Image
                          src="/images/wiki_eye.webp"
                          alt=""
                          width={18}
                          height={18}
                          className="object-contain opacity-80"
                        />
                        View on Wiki
                      </a>
                    )}

                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      {totalSteps} step{totalSteps !== 1 ? "s" : ""} total
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-md hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors font-medium"
                  >
                    Close
                  </button>
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

export default TasklineModal;
