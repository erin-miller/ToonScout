'use client';

// Displays taskline details in a modal when user clicks on a task

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Task, Taskline, TasklineStep } from '@/app/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaExternalLinkAlt, FaChevronLeft, FaChevronRight, FaUndo, FaCheckCircle } from 'react-icons/fa';
import { setTasklineOverride, clearTasklineOverride, getTasklineOverride } from '@/app/utils/tasklineOverrides';
import { getTasklineProgress } from '@/app/utils/tasklineProgress';

interface TasklineModalProps {
  task: Task; // The actual task (for override tracking)
  taskline: Taskline;
  currentStep?: TasklineStep; // Auto-detected step
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (newStep: TasklineStep, isReset?: boolean) => void; // Callback when user changes step
}

const TasklineModal: React.FC<TasklineModalProps> = ({
  task,
  taskline,
  currentStep,
  isOpen,
  onClose,
  onStepChange,
}) => {
  const [selectedStepNumber, setSelectedStepNumber] = useState<number>(currentStep?.order || 1);
  const [hasUserOverride, setHasUserOverride] = useState(false);
  
  // Refs for scrolling to current step
  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Get progress data
  const progress = getTasklineProgress(taskline.id);
  const completedSteps = progress?.completedSteps || [];
  const completedCount = completedSteps.length;
  const totalSteps = taskline.steps.length;
  
  // Progress based on current step position
  // Step 1/18 = 0%, Step 18/18 = 100%
  const completionPercent = totalSteps > 0 ? Math.round((selectedStepNumber / totalSteps) * 100) : 0;

  // Update selected step when currentStep changes
  useEffect(() => {
    if (currentStep) {
      setSelectedStepNumber(currentStep.order);
      
      // Check if there's an existing override
      const override = getTasklineOverride(task);
      setHasUserOverride(!!override && override.tasklineId === taskline.id);
    }
  }, [currentStep?.order, task, taskline.id]);
  
  // Scroll to selected step when it changes or modal opens
  useEffect(() => {
    if (isOpen && selectedStepNumber) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const stepElement = stepRefs.current.get(selectedStepNumber);
        if (stepElement && scrollContainerRef.current) {
          stepElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    }
  }, [selectedStepNumber, isOpen]);

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
    setTasklineOverride(task, taskline.id, stepNumber);
    setHasUserOverride(true);
    
    // Notify parent component
    const newStep = taskline.steps.find(s => s.order === stepNumber);
    if (newStep && onStepChange) {
      onStepChange(newStep);
    }
  };

  const handleResetOverride = () => {
    clearTasklineOverride(task);
    setHasUserOverride(false);
    
    // Notify parent to trigger re-match with isReset flag
    if (onStepChange && currentStep) {
      onStepChange(currentStep, true); // Pass true to indicate this is a reset
    }
  };

  // Check if selected step matches the current task objective
  const isStepMismatched = (): boolean => {
    const selectedStep = taskline.steps.find(s => s.order === selectedStepNumber);
    if (!selectedStep) return false;
    
    // Construct current task objective (same logic as tasklineMatching.ts)
    let taskObjective = task.objective.text;
    if (taskObjective.toLowerCase().trim() === 'visit' && task.to?.name) {
      taskObjective = `Visit ${task.to.name}`;
    }
    
    const normalizeText = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '');
    const normalizedTask = normalizeText(taskObjective);
    const normalizedStep = normalizeText(selectedStep.objective);
    
    // Check if they match (either direction)
    const matches = normalizedTask.includes(normalizedStep) || normalizedStep.includes(normalizedTask);
    
    // Also check alternatives
    const altMatches = selectedStep.alternatives?.some(alt => {
      const normalizedAlt = normalizeText(alt);
      return normalizedTask.includes(normalizedAlt) || normalizedAlt.includes(normalizedTask);
    });
    
    return !matches && !altMatches;
  };

  // Get the full task objective text for display
  const getFullTaskObjective = (): string => {
    let taskObjective = task.objective.text;
    if (taskObjective.toLowerCase().trim() === 'visit' && task.to?.name) {
      taskObjective = `Visit ${task.to.name}`;
    } else if (taskObjective.toLowerCase().trim() === 'recover' && task.objective.text) {
      // For "Recover X items from Y cogs" format
      taskObjective = task.objective.text;
    } else if (taskObjective.toLowerCase().trim() === 'defeat' && task.objective.text) {
      // For "Defeat X cogs" format
      taskObjective = task.objective.text;
    }
    return taskObjective;
  };

  if (!isOpen) return null;

  const selectedStep = taskline.steps.find(s => s.order === selectedStepNumber);
  const showMismatchWarning = isStepMismatched();

  // Render modal using portal to bypass parent container constraints
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white dark:bg-gray-1100 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
              style={{ maxHeight: '75vh' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-900 to-pink-700 dark:from-pink-800 dark:to-pink-900 text-white p-6 relative flex-shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <FaTimes size={24} />
                </button>

                <h2 className="text-2xl font-bold pr-10">{task.reward}</h2>
                <div className="text-sm opacity-80 mt-1">{taskline.name}</div>

                <div className="flex gap-2 mt-2 flex-wrap">
                  {taskline.playground && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      {taskline.playground}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
                    {taskline.category.replace('_', ' ')}
                  </span>
                  {hasUserOverride && (
                    <span className="px-3 py-1 bg-yellow-400/30 dark:bg-yellow-600/30 rounded-full text-sm font-medium">
                      📍 Manual Step
                    </span>
                  )}
                </div>

                {/* Step Navigation Controls */}
                <div className="mt-4 flex items-center justify-between bg-white/10 rounded-lg p-3">
                  <button
                    onClick={handlePreviousStep}
                    disabled={selectedStepNumber <= 1}
                    className="p-2 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous step"
                  >
                    <FaChevronLeft size={16} />
                  </button>

                  <div className="text-center">
                    <div className="text-sm opacity-80">Current Step</div>
                    <div className="text-2xl font-bold">
                      {selectedStepNumber} / {taskline.steps.length}
                    </div>
                  </div>

                  <button
                    onClick={handleNextStep}
                    disabled={selectedStepNumber >= taskline.steps.length}
                    className="p-2 rounded-md bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Next step"
                  >
                    <FaChevronRight size={16} />
                  </button>
                </div>

                {/* Progress Bar */}
                {(completedCount > 0 || selectedStepNumber > 1) && (
                  <div className="mt-3 bg-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm opacity-90">Progress</span>
                      <span className="text-sm font-semibold">
                        Step {selectedStepNumber}/{totalSteps} ({completionPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-2">
                      <div
                        className="bg-green-400 dark:bg-pink-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Reset Button (if override exists) */}
                {hasUserOverride && (
                  <div className="mt-3">
                    <button
                      onClick={handleResetOverride}
                      className="w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FaUndo size={12} />
                      Reset to Auto-Detected Step
                    </button>
                  </div>
                )}

                {/* Mismatch Warning Banner - Fixed height to prevent layout shift */}
                <div className="mt-3 transition-all duration-200" style={{ minHeight: showMismatchWarning ? 'auto' : '0' }}>
                  {showMismatchWarning && (
                    <div className="bg-yellow-400/30 dark:bg-yellow-600/30 rounded-lg px-4 py-3 flex items-start gap-3">
                      <div className="text-xl">⚠️</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-white dark:text-gray-100">Step May Not Match Current Task</div>
                        <div className="text-xs opacity-90 mt-1 text-white dark:text-gray-200">
                          Your current task is &quot;{getFullTaskObjective()}&quot;, but this step is &quot;{selectedStep?.objective}&quot;.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Body - Scrollable Steps */}
              <div
                ref={scrollContainerRef}
                className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-1100"
                style={{ maxHeight: '45vh' }}
              >
                <div className="space-y-4">
                  {taskline.steps.map((step) => {
                    const isSelectedStep = selectedStepNumber === step.order;
                    const isAutoDetected = currentStep?.order === step.order;
                    // A step is "completed" if it's BEFORE the current selected step
                    const isCompleted = step.order < selectedStepNumber;

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
                        onClick={() => {
                          if (!isSelectedStep) {
                            setSelectedStepNumber(step.order);
                            setUserOverride(step.order);
                          }
                        }}
                        className={`border-l-4 pl-4 py-3 transition-all cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-900 rounded-r-lg ${
                          isSelectedStep
                            ? 'border-pink-600 dark:border-pink-400 bg-pink-50 dark:bg-gray-800/80'
                            : isCompleted
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                            : 'border-gray-300 dark:border-gray-600'
                        } ${isCompleted ? 'opacity-60' : ''}`}
                      >
                        {/* Step Number & Objective */}
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isSelectedStep
                                  ? 'bg-pink-600 dark:bg-pink-500 text-white'
                                  : isCompleted
                                  ? 'bg-blue-500 dark:bg-blue-400 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {isCompleted ? <FaCheckCircle size={16} /> : step.order}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800 dark:text-gray-100">
                                {step.objective}
                              </p>
                              {isAutoDetected && !isSelectedStep && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                                  Auto-detected
                                </span>
                              )}
                            </div>

                            {/* NPC Info */}
                            {step.npc && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                <span className="font-medium">NPC:</span> {step.npc}
                              </p>
                            )}

                            {/* Building */}
                            {step.building && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Building:</span> {step.building}
                              </p>
                            )}

                            {/* Location */}
                            {step.location && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-medium">Location:</span> {step.location}
                              </p>
                            )}

                            {/* Reward */}
                            {step.reward && (
                              <div className="mt-2 inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded-md text-sm font-medium">
                                🎁 {step.reward}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-blue-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-t dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {taskline.steps.length} step{taskline.steps.length !== 1 ? 's' : ''} total
                </div>

                <div className="flex gap-3">
                  {taskline.wikiUrl && (
                    <a
                      href={taskline.wikiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      View on Wiki <FaExternalLinkAlt size={12} />
                    </a>
                  )}

                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-pink-600 dark:bg-pink-700 text-white rounded-md hover:bg-pink-700 dark:hover:bg-pink-600 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal as portal to document.body to escape parent container constraints
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
};

export default TasklineModal;
