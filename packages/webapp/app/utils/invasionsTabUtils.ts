// Utility functions for InvasionsTab

export function parseProgress(progress: string) {
  const match = progress.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return { current: 0, total: 1 }
  return { current: parseInt(match[1]), total: parseInt(match[2]) }
}

export function formatTimeLeft(secondsLeft: number) {
  if (secondsLeft <= 0) return 'Invasion ending soon...'
  const hr = Math.floor(secondsLeft / 3600)
  const min = Math.floor((secondsLeft % 3600) / 60)
  const sec = Math.floor(secondsLeft % 60)
  if (hr > 0) {
    return `${hr}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}`
  return `${sec}s`
}
