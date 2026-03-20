
export const StorageKey = {
  BoardState: 'motilis-state',
  Stat: 'motilis-stat',
  Answer: 'motilis-answer',
  RemainingTime: 'motilis-remaining-time',
} as const

export type StorageValues = typeof StorageKey[keyof typeof StorageKey];
