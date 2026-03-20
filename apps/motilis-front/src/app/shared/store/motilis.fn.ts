import {
  Attempt,
  type Board,
  type Evaluations,
  type AttempType,
  GameStatusType,
} from '../models';

export const descryptSolution = (solution: string) => {
  return window.atob(solution);
};

export const isDateSuperiorThanToday = (date: Date) => {
  const today = new Date();
  return (
    date.getDay() > today.getDate() ||
    date.getMonth() + 1 > today.getMonth() + 1 ||
    date.getFullYear() > today.getFullYear()
  );
};

export const getEvaluations = (solution: string, evaluations: Evaluations) => {
  if (evaluations.length === 0) {
    const l = new Array(solution.length).fill('');
    return new Array(6).fill(l) as Evaluations;
  } else {
    return evaluations;
  }
};

export const checkWord = (boardState: Board, solution: string): Board => {
  const {
    attempts,
    evaluations,
    correctLetters,
    absentLetters,
    partialLetters,
  } = { ...boardState };
  const { rowIndex } = { ...boardState };

  const word = attempts[rowIndex];
  const newEval = [...evaluations];

  const arr = {
    correct: ([] as string[]).concat(correctLetters),
    absent: ([] as string[]).concat(absentLetters),
    partial: ([] as string[]).concat(partialLetters),
  };

  newEval[rowIndex] = [...computeColors(solution, word)];

  Array.from(word).forEach((e, i) => {
    const arrName = newEval[rowIndex][i];
    if (arr[arrName].indexOf(e) === -1) {
      arr[arrName].push(e);
    }
  });

  const { status, index } = checkGameStatus(
    rowIndex,
    attempts[rowIndex],
    solution
  );

  return {
    ...boardState,
    evaluations: newEval,
    gameStatus: status,
    rowIndex: index,
    absentLetters: arr.absent,
    correctLetters: arr.correct,
    partialLetters: arr.partial,
  };
};

const computeColors = (targetWord: string, guess: string): AttempType[] => {
  const colors = new Array(guess.length).fill('');
  const indicesOfIncorrectLettersInGuess = [];
  const targetLetters = {} as Record<string, number>;

  for (let i = 0; i < guess.length; ++i) {
    const targetLetter = targetWord[i];
    if (targetLetter in targetLetters) {
      targetLetters[targetLetter]++;
    } else {
      targetLetters[targetLetter] = 1;
    }

    if (guess[i] === targetLetter) {
      colors[i] = Attempt.correct;
      targetLetters[targetLetter]--;
    } else {
      indicesOfIncorrectLettersInGuess.push(i);
    }
  }

  for (const i of indicesOfIncorrectLettersInGuess) {
    const guessLetter = guess[i];

    if (guessLetter in targetLetters && targetLetters[guessLetter] > 0) {
      colors[i] = Attempt.partial;
      targetLetters[guessLetter]--;
    } else {
      colors[i] = Attempt.absent;
    }
  }
  return colors;
};

const checkGameStatus = (
  rowIndex: number,
  word: string,
  solution: string
): { status: GameStatusType; index: number } => {
  if (word === solution) {
    return { status: 'win', index: rowIndex };
  } else if (rowIndex < 5) {
    return { status: 'inProgress', index: rowIndex + 1 };
  } else {
    return { status: 'loose', index: rowIndex } as const;
  }
};
