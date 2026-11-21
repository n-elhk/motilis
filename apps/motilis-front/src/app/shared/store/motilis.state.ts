import { Board, GameplayType } from "../models";

export type BoardState = {
  boardState: Board;
  solution: string;
  remainingTime: number;
  selectedDate: Temporal.PlainDate;
  gameplay: GameplayType;
  status: RequestStatusType;
  error: string;
};

export const RequestStatus = {
  INITIAL: 'initial',
  LOADED: 'loaded',
  LOADING: 'loading',
  ERROR: 'error',
} as const

export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus]
 
