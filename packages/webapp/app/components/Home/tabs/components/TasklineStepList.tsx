import React, { RefObject } from "react";
import { FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";
import { Task, TasklineStep } from "@/app/types";
import { getBuildingMapInfo } from "@/app/utils/buildingMaps";
import {
  findActiveOptionForTask,
  getStepOptionDisplay,
  formatOptionLabel,
} from "@/app/utils/tasklineDisplayUtils";

interface MatchedObjective {
  text: string;
  location?: string;
  building?: string;
  optionIndex?: number;
}

interface TasklineStepListProps {
  steps: TasklineStep[];
  effectiveStepNumber: number;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  stepRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  task: Task;
  fullObjectiveText: string;
  matchedObjective: MatchedObjective | null;
  currentStep: TasklineStep | null;
  taskStreet: string | null;
  tasklinePlayground?: string;
  onStepClick: (stepNumber: number) => void;
  onMapClick: (building: string, mapInfo: any) => void;
}

export const TasklineStepList: React.FC<TasklineStepListProps> = ({
  steps,
  effectiveStepNumber,
  scrollContainerRef,
  stepRefs,
  task,
  fullObjectiveText,
  matchedObjective,
  currentStep,
  taskStreet,
  tasklinePlayground,
  onStepClick,
  onMapClick,
}) => {
  const getLocationLabel = (step: TasklineStep): string | null => {
    if (!step.location) return null;

    const normalized = step.location.toLowerCase();
    if (normalized === "anywhere" || normalized.startsWith("any ")) {
      return step.location;
    }

    // Helper to format building locations with street
    const formatBuildingLocation = () => {
      if (!step.building) return null;
      const mapInfo = getBuildingMapInfo(step.building);
      const street = mapInfo?.street;
      if (street && !normalized.includes(street.toLowerCase())) {
        return `${street}, ${step.location}`;
      }
      return null;
    };

    // Case 1: Not the active step or no street context
    if (!taskStreet || step.order !== effectiveStepNumber) {
      return formatBuildingLocation() ?? step.location;
    }

    // Case 2: Active step
    const formattedBuilding = formatBuildingLocation();
    if (formattedBuilding) return formattedBuilding;

    // Filter out playground name if it's the current street context
    if (
      taskStreet &&
      tasklinePlayground &&
      normalized.includes(tasklinePlayground.toLowerCase()) &&
      !normalized.includes(taskStreet.toLowerCase())
    ) {
      return `${taskStreet}, ${step.location}`;
    }

    return step.location;
  };

  const renderStepObjective = (step: TasklineStep) => {
    const parsed = getStepOptionDisplay(step);
    if (parsed && parsed.options.length > 0) {
      const matchedOption =
        matchedObjective &&
        matchedObjective.optionIndex !== undefined &&
        currentStep &&
        step.order === currentStep.order
          ? step.options?.[matchedObjective.optionIndex] ?? null
          : null;
      const activeOption =
        matchedOption ?? findActiveOptionForTask(step, fullObjectiveText, task);

      return (
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-100">
            {parsed.heading}
          </p>
          <ul className="mt-1 space-y-1">
            {step.options?.map((option, idx) => {
              const label = formatOptionLabel(option);
              const isActive =
                !!activeOption &&
                option.objective === activeOption.objective &&
                option.building === activeOption.building &&
                option.location === activeOption.location;
              return (
                <li
                  key={idx}
                  className={`text-sm flex items-start gap-2 ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? "bg-emerald-500 dark:bg-emerald-300"
                        : "bg-gray-400 dark:bg-gray-500"
                    }`}
                  />
                  <span className={isActive ? "font-semibold flex-1" : "flex-1"}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <p className="font-semibold text-gray-800 dark:text-gray-100">
        {step.objective}
      </p>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-1100"
      style={{ maxHeight: "45vh" }}
    >
      <div className="space-y-3 sm:space-y-4">
        {steps.map((step) => {
          const isSelectedStep = effectiveStepNumber === step.order;
          const isCompleted = step.order < effectiveStepNumber;
          const mapInfo = step.building ? getBuildingMapInfo(step.building) : null;

          return (
            <div
              key={step.order}
              ref={(el) => {
                if (el) {
                  stepRefs.current.set(step.order, el);
                } else {
                  stepRefs.current.delete(step.order);
                }
              }}
              className="flex items-stretch gap-2"
            >
              {/* Clickable step content */}
              <div
                onClick={() => {
                  if (!isSelectedStep) {
                    onStepClick(step.order);
                  }
                }}
                className={`flex-1 border-l-4 pl-3 sm:pl-4 py-3 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-900 rounded-r-lg ${
                  isSelectedStep
                    ? "border-pink-600 dark:border-pink-400 bg-pink-50 dark:bg-gray-800/80"
                    : isCompleted
                    ? "border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-gray-300 dark:border-gray-600"
                } ${isCompleted ? "opacity-60" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0 items-start">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isSelectedStep
                          ? "bg-pink-600 dark:bg-pink-500 text-white"
                          : isCompleted
                          ? "bg-blue-500 dark:bg-blue-400 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <FaCheckCircle size={16} />
                      ) : (
                        step.order
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {renderStepObjective(step)}
                    </div>

                    {step.building && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Building:</span> {step.building}
                      </p>
                    )}

                    {step.details && step.details.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Details:
                        </p>
                        <ul className="mt-1 space-y-1">
                          {step.details.map((detail, idx) => (
                            <li
                              key={idx}
                              className="text-sm flex items-start gap-2 text-gray-700 dark:text-gray-200"
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-gray-400 dark:bg-gray-500" />
                              <span className="flex-1">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {getLocationLabel(step) && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Location:</span> {getLocationLabel(step)}
                      </p>
                    )}

                    {step.reward && (
                      <div className="mt-2 inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-md text-sm font-medium">
                        🎁 {step.reward}
                      </div>
                    )}
                  </div>

                  {mapInfo && (
                  <div className="flex items-center pr-4">
                    <button
                      onClick={() => {
                        onMapClick(step.building!, mapInfo);
                      }}
                      className="flex items-center justify-center w-10 h-10
                        bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-400
                        text-white rounded-lg shadow-md transition-colors"
                      title={`View ${step.building} on map`}
                    >
                      <FaMapMarkerAlt size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>              
          </div>
          );
        })}
      </div>
    </div>
  );
};
