import React from "react";
import { FaChevronLeft, FaChevronRight, FaUndo } from "react-icons/fa";

interface TasklineStepNavigationProps {
  effectiveStepNumber: number;
  totalSteps: number;
  completedCount: number;
  completionPercent: number;
  hasUserOverride: boolean;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onResetOverride: () => void;
}

export const TasklineStepNavigation: React.FC<TasklineStepNavigationProps> = ({
  effectiveStepNumber,
  totalSteps,
  completedCount,
  completionPercent,
  hasUserOverride,
  onPreviousStep,
  onNextStep,
  onResetOverride,
}) => {
  return (
    <>
      <div className="mt-3 bg-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onPreviousStep}
            disabled={effectiveStepNumber <= 1}
            className="p-2 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous step"
          >
            <FaChevronLeft size={16} />
          </button>

          <div className="text-center">
            <div className="text-sm opacity-80">Current Step</div>
            <div className="text-xl sm:text-2xl font-bold">
              {effectiveStepNumber} / {totalSteps}
            </div>
          </div>

          <button
            onClick={onNextStep}
            disabled={effectiveStepNumber >= totalSteps}
            className="p-2 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next step"
          >
            <FaChevronRight size={16} />
          </button>
        </div>

        {(completedCount > 0 || effectiveStepNumber > 1) && (
          <div className="flex w-full bg-white/20 dark:bg-black/20 rounded-full my-1">
            <div
              className="bg-green-400 dark:bg-pink-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </div>

      {hasUserOverride && (
        <div className="mt-3">
          <button
            onClick={onResetOverride}
            className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FaUndo size={12} />
            Reset to Auto-Detected Step
          </button>
        </div>
      )}
    </>
  );
};
