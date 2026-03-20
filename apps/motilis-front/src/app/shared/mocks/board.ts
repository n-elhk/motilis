import { Board } from "../models";
import { StorageKey } from "../models/storage";

export const BOARD: Board = {
  attempts: ['', '', '', '', '', ''], // night 1
  evaluations: [], //['absent', 'absent', 'absent', 'absent', 'absent']
  gameStatus: 'inProgress',
  partialLetters: [],
  absentLetters: [],
  correctLetters: [],
  rowIndex: 0,
} as const;

export const getMotilisMock = () => ({
  [StorageKey.BoardState]: BOARD,
  [StorageKey.Stat]: { games: [] },
  [StorageKey.Answer]: '',
  [StorageKey.RemainingTime]: new Date().getTime(),
});