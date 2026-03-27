import { Task, TasklineStep, TasklineStepOption } from '../types'
import { jaccardSimilarity, tokenize } from './tasklineTextUtils'

export const formatOptionLabel = (option: TasklineStepOption): string => {
  const parts = [option.building, option.location].filter(Boolean)
  if (parts.length > 0) {
    return `${option.objective} (${parts.join(', ')})`
  }
  return option.objective
}

export const getStepOptionDisplay = (step: TasklineStep): { heading: string; options: string[] } | null => {
  if (!step.options || step.options.length === 0) {
    return null
  }
  const heading = step.objective.replace(/:\s*$/, '').trim() || 'One of the following'
  return {
    heading,
    options: step.options.map(formatOptionLabel)
  }
}

const isTokenSubset = (subset: Set<string>, superset: Set<string>): boolean => {
  for (const token of subset) {
    if (!superset.has(token)) {
      return false
    }
  }
  return subset.size > 0
}

const tokensMatch = (taskTokens: Set<string>, optionTokens: Set<string>): boolean => {
  if (taskTokens.size === 0 || optionTokens.size === 0) {
    return false
  }
  const similarity = jaccardSimilarity(taskTokens, optionTokens)
  return similarity >= 0.5 || isTokenSubset(optionTokens, taskTokens)
}

const getContextTokens = (option: TasklineStepOption): Set<string> => {
  const tokens = new Set<string>()
  if (option.building) {
    tokenize(option.building).forEach(token => tokens.add(token))
  }
  const location = option.location?.toLowerCase().trim()
  if (location && location !== 'anywhere') {
    tokenize(location).forEach(token => tokens.add(token))
  }
  return tokens
}

export const findActiveOption = (step: TasklineStep, taskObjective: string): TasklineStepOption | null => {
  if (!step.options || step.options.length === 0) {
    return null
  }
  const taskTokens = tokenize(taskObjective)
  const optionContexts = step.options.map(getContextTokens).filter(contextTokens => contextTokens.size > 0)
  const requiresContext =
    optionContexts.length > 0 && optionContexts.some(contextTokens => isTokenSubset(contextTokens, taskTokens))

  const matchingOptions = step.options.filter(option => tokensMatch(taskTokens, tokenize(option.objective)))

  if (matchingOptions.length === 0) {
    return null
  }

  if (requiresContext) {
    const contextualMatches = matchingOptions.filter(option => isTokenSubset(getContextTokens(option), taskTokens))

    return contextualMatches.length === 1 ? contextualMatches[0] : null
  }

  if (matchingOptions.length === 1) {
    return matchingOptions[0]
  }

  const contextFreeMatches = matchingOptions.filter(option => !option.location && !option.building)
  return contextFreeMatches.length === 1 ? contextFreeMatches[0] : null
}

export const findActiveOptionForTask = (
  step: TasklineStep,
  taskObjective: string,
  task?: Task
): TasklineStepOption | null => {
  const directMatch = findActiveOption(step, taskObjective)
  if (directMatch || !task || !step.options || step.options.length === 0) {
    return directMatch
  }

  const taskNames = [task.to?.name, task.from?.name].filter(Boolean)
  const taskBuildings = [task.to?.building, task.from?.building].filter(Boolean)

  for (const option of step.options) {
    if (option.building) {
      const optionBuilding = option.building.toLowerCase().trim()
      const buildingMatch = taskBuildings.some(building => building.toLowerCase().trim() === optionBuilding)
      if (buildingMatch) {
        return option
      }
    }

    const optionTokens = tokenize(option.objective)
    const nameMatch = taskNames.some(name => {
      const nameTokens = tokenize(name)
      return isTokenSubset(nameTokens, optionTokens)
    })
    if (nameMatch) {
      return option
    }
  }

  return null
}
