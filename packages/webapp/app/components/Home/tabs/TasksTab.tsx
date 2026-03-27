'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { TabProps } from './components/TabComponent'
import AnimatedTabContent from '../../animations/AnimatedTab'
import { Task, TaskMatch, TasklineStep } from '@/app/types'

import TasklineModal from './components/TasklineModal'
import Image from 'next/image'
import { imageAssets } from '@/assets/images'
import { FaListOl, FaMapMarkerAlt } from 'react-icons/fa'
import MapImageModal from './components/MapImageModal'
import { getBuildingMapInfo, BuildingMapInfo } from '@/app/utils/buildingMaps'
import { findTasklineMatchWithToonData } from '@/app/utils/tasklineMatching'
import { applyOverrideToMatch, getTaskSignatureParts } from '@/app/utils/tasklineOverrides'
import {
  markStepCompleted,
  updateCurrentStep,
  updateChainContext,
  removeTasklineProgress
} from '@/app/utils/tasklineProgress'
import { getTasklineOverride } from '@/app/utils/tasklineOverrides'

const createTaskMatchKey = (task: Task, index: number): string =>
  [`task-${index}`, ...getTaskSignatureParts(task)].join('|')

const matchCache = new Map<string, Map<string, TaskMatch | null>>()

const TasksTab: React.FC<TabProps> = ({ toon: toons }) => {
  const [tasklineMatches, setTasklineMatches] = useState<Map<string, TaskMatch | null>>(new Map())
  const [selectedTaskMatch, setSelectedTaskMatch] = useState<{
    match: TaskMatch
    task: Task
    matchKey: string
    taskIndex: number | null
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mapModal, setMapModal] = useState<{
    buildingName: string
    mapInfo: BuildingMapInfo
  } | null>(null)
  const previousStepsRef = useRef<Map<string, { stepNumber: number; tasklineId: string }>>(new Map())
  const previousTasklineStepsRef = useRef<Map<string, number>>(new Map())
  const previousTaskCountRef = useRef<number>(toons.data.data.tasks.length)

  const toonTasks = toons.data.data.tasks

  const tasksSignature = useMemo(() => {
    return [`timestamp:${toons.timestamp}`, toonTasks.map((task, i) => createTaskMatchKey(task, i)).join('|')].join('|')
  }, [toonTasks, toons.timestamp])

  const computedMatches = useMemo(() => {
    const cached = matchCache.get(tasksSignature)
    if (cached) {
      return cached
    }

    const matches = new Map<string, TaskMatch | null>()

    toonTasks.forEach((task, index) => {
      const matchKey = createTaskMatchKey(task, index)

      const match = findTasklineMatchWithToonData(task, toons.data, toons.overjoyed)

      if (match) {
        const toonId = toons.data.data.toon.id
        const overriddenStepNumber = applyOverrideToMatch(task, match.step.order, match.taskline.id, toonId)
        const overriddenStep = match.taskline.steps.find(s => s.order === overriddenStepNumber)

        if (overriddenStep) {
          match.step = overriddenStep
        }
      }

      matches.set(matchKey, match)
    })

    matchCache.set(tasksSignature, matches)

    if (matchCache.size > 10) {
      const firstKey = matchCache.keys().next().value
      if (firstKey !== undefined) {
        matchCache.delete(firstKey)
      }
    }

    return matches
  }, [tasksSignature, toonTasks])

  useEffect(() => {
    setTasklineMatches(computedMatches)
  }, [computedMatches])

  useEffect(() => {
    const toonId = toons.data.data.toon.id
    const tasklineStepCandidates = new Map<string, { stepNumber: number; task: Task }>()

    toonTasks.forEach((task, index) => {
      const matchKey = createTaskMatchKey(task, index)
      const match = tasklineMatches.get(matchKey)

      if (match) {
        const currentStepNumber = match.step.order
        const tasklineId = match.taskline.id
        const previousData = previousStepsRef.current.get(matchKey)

        if (previousData && previousData.tasklineId === tasklineId && previousData.stepNumber !== currentStepNumber) {
          markStepCompleted(tasklineId, previousData.stepNumber, toonId)
          updateCurrentStep(tasklineId, currentStepNumber, false, toonId)
        }

        previousStepsRef.current.set(matchKey, {
          stepNumber: currentStepNumber,
          tasklineId: tasklineId
        })

        const existingCandidate = tasklineStepCandidates.get(tasklineId)
        if (!existingCandidate || currentStepNumber > existingCandidate.stepNumber) {
          tasklineStepCandidates.set(tasklineId, { stepNumber: currentStepNumber, task })
        }
      }
    })

    tasklineStepCandidates.forEach(({ stepNumber: currentStepNumber, task }, tasklineId) => {
      const previousStepNumber = previousTasklineStepsRef.current.get(tasklineId)
      if (previousStepNumber === undefined) {
        updateCurrentStep(tasklineId, currentStepNumber, false, toonId)
        // Update chain context: store where this step sends the toon
        updateChainContext(
          tasklineId,
          currentStepNumber,
          {
            toName: task.to?.name ?? null,
            toBuilding: task.to?.building ?? null,
            toNeighborhood: task.to?.neighborhood ?? null
          },
          toonId
        )
        previousTasklineStepsRef.current.set(tasklineId, currentStepNumber)
        return
      }
      if (currentStepNumber > previousStepNumber) {
        updateCurrentStep(tasklineId, currentStepNumber, true, toonId)
        // Update chain context: store where this step sends the toon
        updateChainContext(
          tasklineId,
          currentStepNumber,
          {
            toName: task.to?.name ?? null,
            toBuilding: task.to?.building ?? null,
            toNeighborhood: task.to?.neighborhood ?? null
          },
          toonId
        )
        previousTasklineStepsRef.current.set(tasklineId, currentStepNumber)
      }
    })

    // Cleanup: Remove progress for tasklines that are no longer active
    // This happens when a toon completes or abandons a taskline
    const currentTasklineIds = new Set(tasklineStepCandidates.keys())
    for (const tasklineId of previousTasklineStepsRef.current.keys()) {
      if (!currentTasklineIds.has(tasklineId)) {
        removeTasklineProgress(tasklineId, toonId)
        previousTasklineStepsRef.current.delete(tasklineId)
      }
    }
  }, [tasklineMatches, toonTasks])

  useEffect(() => {
    if (!isModalOpen || !selectedTaskMatch) {
      return
    }

    const selectedSignature = getTaskSignatureParts(selectedTaskMatch.task).join('|')
    const matchKeyIndex = (() => {
      const match = selectedTaskMatch.matchKey.match(/^task-(\d+)\|/)
      return match ? Number.parseInt(match[1], 10) : null
    })()

    const normalizeReward = (value?: string | null) => (value ?? '').toLowerCase().trim()
    const candidateIndexes = [matchKeyIndex, selectedTaskMatch.taskIndex].filter(
      (value): value is number => value !== null && value !== undefined
    )
    const signatureIndex = toonTasks.findIndex(task => {
      return getTaskSignatureParts(task).join('|') === selectedSignature
    })
    const getCandidate = (index: number | null | undefined) => {
      if (index === null || index === undefined || index < 0) return null
      const task = toonTasks[index]
      if (!task) return null
      const matchKey = createTaskMatchKey(task, index)
      const match = tasklineMatches.get(matchKey)
      return { task, match, matchKey, taskIndex: index }
    }
    const isSameTask = (candidate: ReturnType<typeof getCandidate>) => {
      if (!candidate) return false
      const signature = getTaskSignatureParts(candidate.task).join('|')
      if (signature === selectedSignature) return true
      if (!candidate.match) return false
      const tasklineMatchesSelected = candidate.match.taskline.id === selectedTaskMatch.match.taskline.id
      if (!tasklineMatchesSelected) return false
      return normalizeReward(candidate.task.reward) === normalizeReward(selectedTaskMatch.task.reward)
    }
    let candidate = candidateIndexes.map(getCandidate).find(value => isSameTask(value))
    if (!candidate && signatureIndex >= 0) {
      candidate = getCandidate(signatureIndex)
    }
    const freshTask = candidate?.task
    const freshTaskIndex = candidate?.taskIndex ?? selectedTaskMatch.taskIndex
    const taskCountDecreased = toonTasks.length < previousTaskCountRef.current
    if (!freshTask) {
      if (taskCountDecreased) {
        setIsModalOpen(false)
        setSelectedTaskMatch(null)
      }
      previousTaskCountRef.current = toonTasks.length
      return
    }
    const freshMatchKey = candidate?.matchKey ?? selectedTaskMatch.matchKey
    const freshMatch = candidate?.match ?? tasklineMatches.get(freshMatchKey)

    if (!freshMatch || !freshTask) {
      return
    }

    const freshSignature = getTaskSignatureParts(freshTask).join('|')
    const prevProgress = selectedTaskMatch.task.objective.progress
    const freshProgress = freshTask.objective.progress
    const prevProgressKey = [prevProgress?.text ?? '', prevProgress?.current ?? '', prevProgress?.target ?? '']
      .join('|')
      .toLowerCase()
    const freshProgressKey = [freshProgress?.text ?? '', freshProgress?.current ?? '', freshProgress?.target ?? '']
      .join('|')
      .toLowerCase()
    const progressChanged = prevProgressKey !== freshProgressKey

    const override = getTasklineOverride(freshTask, toons.data.data.toon.id)
    const hasOverride = !!override && override.tasklineId === freshMatch.taskline.id

    const taskRefChanged = freshTask !== selectedTaskMatch.task
    const matchRefChanged = freshMatch !== selectedTaskMatch.match
    const matchKeyChanged = freshMatchKey !== selectedTaskMatch.matchKey
    const taskIndexChanged = freshTaskIndex !== selectedTaskMatch.taskIndex
    const shouldRefreshSelection = taskRefChanged || matchRefChanged || matchKeyChanged || taskIndexChanged

    if (hasOverride) {
      const tasklineIdChanged = selectedTaskMatch.match.taskline.id !== freshMatch.taskline.id
      if (!tasklineIdChanged && freshSignature === selectedSignature && !progressChanged && !shouldRefreshSelection) {
        return
      }
      setSelectedTaskMatch(prev =>
        prev
          ? {
              ...prev,
              task: freshTask,
              match: freshMatch,
              matchKey: freshMatchKey,
              taskIndex: freshTaskIndex
            }
          : prev
      )
      return
    }

    if (
      freshMatch.step.order !== selectedTaskMatch.match.step.order ||
      freshSignature !== selectedSignature ||
      progressChanged ||
      shouldRefreshSelection
    ) {
      setSelectedTaskMatch(prev =>
        prev
          ? {
              ...prev,
              task: freshTask,
              match: freshMatch,
              matchKey: freshMatchKey,
              taskIndex: freshTaskIndex
            }
          : prev
      )
    }
    previousTaskCountRef.current = toonTasks.length
  }, [tasklineMatches, toonTasks, isModalOpen, selectedTaskMatch])

  const openTasklineModal = (task: Task, match: TaskMatch, matchKey: string, taskIndex: number | null = null) => {
    setSelectedTaskMatch({ match, task, matchKey, taskIndex })
    setIsModalOpen(true)
  }

  const handleTasklineClick = (matchKey: string, taskIndex: number) => {
    const match = tasklineMatches.get(matchKey)
    const task = toonTasks[taskIndex]

    if (match && task) {
      openTasklineModal(task, match, matchKey, taskIndex)
    }
  }

  const handleStepChange = (newStep: TasklineStep, isReset?: boolean) => {
    if (!selectedTaskMatch) return

    const task = selectedTaskMatch.task
    const matchKey = selectedTaskMatch.matchKey

    if (isReset) {
      // User explicitly clicked reset - recalculate match without override
      const freshMatch = findTasklineMatchWithToonData(task, toons.data, toons.overjoyed)

      if (freshMatch) {
        setSelectedTaskMatch({
          task,
          match: freshMatch,
          matchKey,
          taskIndex: selectedTaskMatch.taskIndex
        })

        setTasklineMatches(prev => {
          const newMap = new Map(prev)
          newMap.set(matchKey, freshMatch)
          return newMap
        })
      }
    } else {
      // User manually navigated - save as override (already saved by modal)
      // Update the selected match with new step
      setSelectedTaskMatch({
        ...selectedTaskMatch,
        match: { ...selectedTaskMatch.match, step: newStep }
      })

      setTasklineMatches(prev => {
        const newMap = new Map(prev)
        const currentMatch = newMap.get(matchKey)
        if (currentMatch) {
          newMap.set(matchKey, { ...currentMatch, step: newStep })
        }
        return newMap
      })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTaskMatch(null)
  }

  function getTaskType(task: Task, index: number) {
    const progress = task.objective.progress.text
    const obj = task.objective.text
    const matchKey = createTaskMatchKey(task, index)

    if (obj.includes('Visit') || progress.includes('Complete')) {
      // display visit target info for a visit task
      return {
        title: `Visit ${task.to.name} in ${task.to.building}`,
        progress: `${task.to.zone}, ${task.to.neighborhood}`,
        reward: task.reward,
        deletable: task.deletable,
        type: task.type,
        matchKey,
        taskIndex: index
      }
    } else {
      // not a visit task, don't display visit target info
      return {
        title: task.objective.text,
        progress: progress,
        location: task.objective.where,
        reward: task.reward,
        deletable: task.deletable,
        type: task.type,
        matchKey,
        taskIndex: index
      }
    }
  }

  function renderProgress(text: string) {
    const match = text.match(/^(\d+)\s+of\s+(\d+)/)
    let curr = 0
    let target = 1

    if (match) {
      curr = parseInt(match[1], 10)
      target = parseInt(match[2], 10)
    }

    const progress = Math.min((curr / target) * 100, 100)

    if (match) {
      return (
        <div className="task-progress relative z-5 overflow-hidden">
          <div className="bg-emerald-700 absolute inset-0 opacity-30 z-0" style={{ width: `${progress}%` }}></div>
          <div className="z-50">{text}</div>
        </div>
      )
    } else {
      return <div className="task-location">{text}</div>
    }
  }

  const displayTasks = useMemo(() => {
    const list = toonTasks.map((task, index) => getTaskType(task, index))
    if (list.length > 2) {
      const reordered = [...list]
      ;[reordered[1], reordered[2]] = [reordered[2], reordered[1]]
      return reordered
    }
    return list
  }, [toonTasks])

  const getIndex = (index: number) => {
    if (displayTasks.length > 2 && (index === 1 || index === 2)) {
      return index === 1 ? index + 2 : index
    }
    return index + 1
  }

  return (
    <AnimatedTabContent>
      {selectedTaskMatch && (
        <TasklineModal
          task={selectedTaskMatch.task}
          taskline={selectedTaskMatch.match.taskline}
          currentStep={selectedTaskMatch.match.step}
          matchedObjective={selectedTaskMatch.match.matchedObjective}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onStepChange={handleStepChange}
          toonId={toons.data.data.toon.id}
        />
      )}

      <MapImageModal
        isOpen={mapModal !== null}
        onClose={() => setMapModal(null)}
        mapImageUrl={mapModal?.mapInfo.mapImageUrl ?? ''}
        buildingName={mapModal?.buildingName ?? ''}
        wikiUrl={mapModal?.mapInfo.wikiUrl}
        street={mapModal?.mapInfo.street}
        markerPosition={mapModal?.mapInfo.markerPosition}
      />

      <div className="grid md:grid-rows-2 md:grid-cols-2 grid-rows-4 gap-4">
        {displayTasks.map((task, index) => {
          const tasklineMatch = tasklineMatches.get(task.matchKey)

          return (
            <div key={task.matchKey} className="task-container">
              <div className="relative">
                <Image src={imageAssets.task} className="task-size" alt="Task" width={320} height={320} />
                <span className="task-index-bubble">{getIndex(index)}</span>
              </div>
              <div className="flex flex-col absolute justify-center items-center text-center task-size px-6 pb-8 xl:pb-10">
                <span className="absolute inset-0 mt-2 2xl:mt-4 font-semibold font-minnie text-gray-1200 text-sm sm:text-xl 2xl:text-2xl">
                  TOONTASK
                </span>

                {task.deletable && (
                  <span className="hidden 2xl:flex absolute inset-0 font-semibold text-blue-900 -rotate-[25deg] translate-x-[70px] translate-y-[-40px]">
                    {task.type}
                  </span>
                )}

                <div className="absolute top-4 right-4 2xl:top-6 2xl:right-6 flex flex-col gap-2">
                  {tasklineMatch && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleTasklineClick(task.matchKey, task.taskIndex)
                      }}
                      className="flex items-center justify-center w-8 h-8 2xl:w-10 2xl:h-10
                      bg-purple-500 hover:bg-purple-600 border-2 border-purple-700
                      rounded-full shadow-lg transition-colors z-10"
                      title="View taskline details"
                    >
                      <FaListOl color="white" size={14} />
                    </button>
                  )}
                  {(() => {
                    const buildingName = tasklineMatch?.step?.building
                    if (!buildingName) return null
                    const mapInfo = getBuildingMapInfo(buildingName)
                    if (!mapInfo) return null
                    return (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setMapModal({ buildingName, mapInfo })
                        }}
                        className="flex items-center justify-center w-8 h-8 2xl:w-10 2xl:h-10
                        bg-blue-500 hover:bg-blue-600 border-2 border-blue-700
                        rounded-full shadow-lg transition-colors z-10"
                        title={`View ${buildingName} on map`}
                      >
                        <FaMapMarkerAlt color="white" size={14} />
                      </button>
                    )
                  })()}
                </div>

                <div className="md:grid gap-0 2xl:gap-12 w-full" style={{ gridTemplateRows: '130px 90px 30px' }}>
                  <h3 className="task-title">{task.title}</h3>
                  <div className="flex flex-col justify-center items-center">
                    {task.location && <p className="task-location">{task.location}</p>}
                    {task.progress && renderProgress(task.progress)}
                  </div>
                  <div className="mt-auto pb-4">{task.reward && <p className="task-reward">{task.reward}</p>}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AnimatedTabContent>
  )
}
export default TasksTab
