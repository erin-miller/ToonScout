'use client';

import React, { useState, useEffect, useRef } from "react";
import { TabProps } from "./components/TabComponent";
import AnimatedTabContent from "../../animations/AnimatedTab";
import { Task, StoredToonData, TaskMatch, TasklineStep } from "@/app/types";
import TaskTabNotifications from "./components/TaskTabNotifications";
import TasklineModal from "./components/TasklineModal";
import Image from "next/image";
import { imageAssets } from "@/assets/images";
import { FaListOl } from "react-icons/fa";
import { findTasklineMatch } from "@/app/utils/tasklineMatching";
import { applyOverrideToMatch, getTaskSignatureParts } from "@/app/utils/tasklineOverrides";
import { markStepCompleted, updateCurrentStep } from "@/app/utils/tasklineProgress";

const createTaskMatchKey = (task: Task, index: number): string =>
  [`task-${index}`, ...getTaskSignatureParts(task)].join("|");

const TasksTab: React.FC<TabProps> = ({ toon: toons }) => {
  const [tasklineMatches, setTasklineMatches] = useState<Map<string, TaskMatch | null>>(new Map());
  const [selectedTaskMatch, setSelectedTaskMatch] = useState<{ match: TaskMatch; task: Task; matchKey: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previousStepsRef = useRef<Map<string, { stepNumber: number; tasklineId: string }>>(new Map());

  useEffect(() => {
    const tasks = toons.data.data.tasks;
    const matches = new Map<string, TaskMatch | null>();

    tasks.forEach((task, index) => {
      const matchKey = createTaskMatchKey(task, index);

      const match = findTasklineMatch(task);

      if (match) {
        const overriddenStepNumber = applyOverrideToMatch(task, match.step.order, match.taskline.id);
        const overriddenStep = match.taskline.steps.find((s) => s.order === overriddenStepNumber);

        if (overriddenStep) {
          match.step = overriddenStep;
        }
      }

      matches.set(matchKey, match);
    });

    setTasklineMatches(matches);
  }, [toons]);
  
  useEffect(() => {
    toons.data.data.tasks.forEach((task, index) => {
      const matchKey = createTaskMatchKey(task, index);
      const match = tasklineMatches.get(matchKey);

      if (match) {
        const currentStepNumber = match.step.order;
        const tasklineId = match.taskline.id;
        const previousData = previousStepsRef.current.get(matchKey);

        if (
          previousData &&
          previousData.tasklineId === tasklineId &&
          previousData.stepNumber !== currentStepNumber
        ) {
          markStepCompleted(tasklineId, previousData.stepNumber);

          updateCurrentStep(tasklineId, currentStepNumber, false);
        }

        previousStepsRef.current.set(matchKey, {
          stepNumber: currentStepNumber,
          tasklineId: tasklineId,
        });
      }
    });
  }, [tasklineMatches, toons.data.data.tasks]);

  const openTasklineModal = (task: Task, match: TaskMatch, matchKey: string) => {
    setSelectedTaskMatch({ match, task, matchKey });
    setIsModalOpen(true);
  };

  const handleTasklineClick = (matchKey: string, taskIndex: number) => {
    const match = tasklineMatches.get(matchKey);
    const task = toons.data.data.tasks[taskIndex];

    if (match && task) {
      openTasklineModal(task, match, matchKey);
    }
  };

  const handleStepChange = (newStep: TasklineStep, isReset?: boolean) => {
    if (!selectedTaskMatch) return;
    
    const task = selectedTaskMatch.task;
    const tasklineId = selectedTaskMatch.match.taskline.id;
    const matchKey = selectedTaskMatch.matchKey;
    
    if (isReset) {
      // User explicitly clicked reset - recalculate match without override
      const freshMatch = findTasklineMatch(task);
      
      if (freshMatch) {
        setSelectedTaskMatch({
          task,
          match: freshMatch,
          matchKey,
        });
        
        setTasklineMatches(prev => {
          const newMap = new Map(prev);
          newMap.set(matchKey, freshMatch);
          return newMap;
        });
      }
    } else {
      // User manually navigated - save as override (already saved by modal)
      // Update the selected match with new step
      setSelectedTaskMatch({
        ...selectedTaskMatch,
        match: { ...selectedTaskMatch.match, step: newStep }
      });
      
      setTasklineMatches(prev => {
        const newMap = new Map(prev);
        const currentMatch = newMap.get(matchKey);
        if (currentMatch) {
          newMap.set(matchKey, { ...currentMatch, step: newStep });
        }
        return newMap;
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTaskMatch(null);
  };

  // pulled from ToonScout bot
  function getTasks(toons: StoredToonData) {
    const toontasks = toons.data.data.tasks;
    return toontasks.map((task, index) => getTaskType(task, index));
  }

  function getTaskType(task: Task, index: number) {
    const progress = task.objective.progress.text;
    const obj = task.objective.text;
    const matchKey = createTaskMatchKey(task, index);

    if (obj.includes("Visit") || progress.includes("Complete")) {
      // display npc values for a visit task
      return {
        title: `Visit ${task.to.name} in ${task.to.building}`,
        progress: `${task.to.zone}, ${task.to.neighborhood}`,
        reward: task.reward,
        deletable: task.deletable,
        type: task.type,
        matchKey,
        taskIndex: index,
      };
    } else {
      // not a visit task, don't display npc values
      return {
        title: task.objective.text,
        progress: progress,
        location: task.objective.where,
        reward: task.reward,
        deletable: task.deletable,
        type: task.type,
        matchKey,
        taskIndex: index,
      };
    }
  }

  function renderProgress(text: string) {
    const match = text.match(/^(\d+)\s+of\s+(\d+)/);
    let curr = 0;
    let target = 1;

    if (match) {
      curr = parseInt(match[1], 10);
      target = parseInt(match[2], 10);
    }

    const progress = Math.min((curr / target) * 100, 100);

    if (match) {
      return (
        <div className="task-progress relative z-5 overflow-hidden min-w-64">
          <div
            className="bg-emerald-700 absolute inset-0 opacity-30 z-0"
            style={{ width: `${progress}%` }}
          ></div>
          <div className="w-full z-50">{text}</div>
        </div>
      );
    } else {
      return <div className="task-location">{text}</div>;
    }
  }

  const getIndex = (index: number) => {
    if (tasks.length > 2 && (index === 1 || index === 2)) {
      return index === 1 ? index + 2 : index;
    }
    return index + 1;
  };

  const tasks = getTasks(toons);

  // match game format
  if (tasks.length > 2) {
    [tasks[1], tasks[2]] = [tasks[2], tasks[1]];
  }

  return (
    <AnimatedTabContent>
      <TaskTabNotifications />

      {selectedTaskMatch && (
        <TasklineModal
          task={selectedTaskMatch.task}
          taskline={selectedTaskMatch.match.taskline}
          currentStep={selectedTaskMatch.match.step}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStepChange={handleStepChange}
        />
      )}

      <div className="grid md:grid-rows-2 md:grid-cols-2 grid-rows-4">
        {tasks.map((task, index) => {
          const tasklineMatch = tasklineMatches.get(task.matchKey);

          return (
            <div key={task.matchKey} className="task-container">
              <Image
                src={imageAssets.task}
                className="task-size"
                alt="Task"
                width={320}
                height={320}
              />
              <div className="flex flex-col absolute justify-center items-center text-center task-size px-6 pb-8 xl:pb-10">
              <span className="absolute inset-0 mt-2 2xl:mt-4 font-semibold font-minnie text-gray-1200 text-sm sm:text-xl 2xl:text-2xl">
                TOONTASK
              </span>

              {task.deletable && (
                <span className="hidden 2xl:flex absolute inset-0 font-semibold text-blue-900 -rotate-[25deg] translate-x-[70px] translate-y-[-40px]">
                  {task.type}
                </span>
              )}
              {/* red index bubble */}
              <div className="flex absolute top-4 left-4 justify-center items-center">
                <span
                  className="hidden 2xl:flex items-center justify-center w-8 h-8 border-4 shadow-lg
                bg-red-500 border-red-600 rounded-full text-gray-100
                xl:text-lg mt-12 mx-6"
                >
                  {getIndex(index)}
                </span>
              </div>

              {tasklineMatch && (
                <div className="absolute top-16 left-4 2xl:top-4 2xl:left-16">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTasklineClick(task.matchKey, task.taskIndex);
                    }}
                    className="flex items-center justify-center w-8 h-8 2xl:w-10 2xl:h-10
                      bg-purple-500 hover:bg-purple-600 border-2 border-purple-700
                      rounded-full shadow-lg transition-colors z-10"
                    title="View taskline details"
                  >
                    <FaListOl color="white" size={14} />
                  </button>
                </div>
              )}

                <div
                  className="md:grid gap-0 2xl:gap-12"
                  style={{ gridTemplateRows: "130px 90px 30px" }}
                >
                  <h3 className="task-title">{task.title}</h3>
                  <div className="flex flex-col justify-center items-center">
                    {task.location && (
                      <p className="task-location">{task.location}</p>
                    )}
                    {task.progress && renderProgress(task.progress)}
                  </div>
                  <div className="mt-auto pb-4">
                    {task.reward && <p className="task-reward">{task.reward}</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AnimatedTabContent>
  );
};
export default TasksTab;
