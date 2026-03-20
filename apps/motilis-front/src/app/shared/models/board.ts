
export type Board = {
  attempts: string[];
  evaluations: AttempType[][];
  gameStatus: GameStatusType;
  correctLetters: string[];
  absentLetters: string[];
  partialLetters: string[];
  rowIndex: number;
};

export type Evaluations = AttempType[][];

export const GameStatus = {
  inProgress: 'inProgress',
  win: 'win',
  loose: 'loose',
} as const;

export type GameStatusType = keyof typeof GameStatus;

export const Attempt = {
  correct: 'correct',
  partial: 'partial',
  absent: 'absent',
} as const;

export type AttempType = keyof typeof Attempt;

export const SquareAttempt = {
  [Attempt.correct]: '🟩',
  [Attempt.partial]: '🟧',
  [Attempt.absent]: '🟥',
} as const;

export const Gameplay = {
  local: 'local',
  today: 'today',
  date: 'date',
} as const;

export type GameplayType = keyof typeof Gameplay;
