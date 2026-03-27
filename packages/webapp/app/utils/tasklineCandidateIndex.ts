import { getAllTasklines, getTasklineSourceById } from '../../data/tasklines'
import type { Taskline } from '../types'
import { getPrimaryPlayground } from './taskline/tasklineLocationUtils'
import type { FilterCandidate } from './tasklineMatchingTypes'

let cachedCandidates: FilterCandidate[] | null = null

function buildCandidateIndex(tasklines: Taskline[]): FilterCandidate[] {
  const candidates: FilterCandidate[] = []

  for (const taskline of tasklines) {
    const tasklinePlayground = getPrimaryPlayground(taskline.playground)
    for (const step of taskline.steps) {
      const objectives = step.options?.length
        ? step.options.map((option, index) => ({
            text: option.objective,
            location: option.location ?? step.location,
            building: option.building ?? step.building,
            optionIndex: index
          }))
        : [
            {
              text: step.objective,
              location: step.location,
              building: step.building
            }
          ]

      for (const objective of objectives) {
        candidates.push({
          taskline,
          step,
          objective,
          tasklinePlayground,
          tasklineSource: getTasklineSourceById(taskline.id)
        })
      }
    }
  }

  return candidates
}

export function getTasklineCandidates(): FilterCandidate[] {
  if (!cachedCandidates) {
    cachedCandidates = buildCandidateIndex(getAllTasklines())
  }
  return cachedCandidates
}
