export type GagTrack = 'toon-up' | 'throw' | 'squirt' | 'sound' | 'drop' | 'lure' | 'trap'

function getGagImages(track: GagTrack): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Array.from({ length: 7 }, (_, i) => require(`./${track}-${i + 1}.png`).default)
}

export const gagImages: Record<GagTrack, string[]> = {
  'toon-up': getGagImages('toon-up'),
  throw: getGagImages('throw'),
  squirt: getGagImages('squirt'),
  sound: getGagImages('sound'),
  drop: getGagImages('drop'),
  lure: getGagImages('lure'),
  trap: getGagImages('trap')
}
