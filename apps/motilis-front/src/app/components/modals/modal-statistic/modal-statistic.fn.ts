import { MotilisStatGame } from "../../../shared/models/statistic";

export const bestStreak = (arr: MotilisStatGame[]): number[] => {
  return arr.reduce(
    (res, n) => {
      if (n.won) {
        res[res.length - 1]++;
      } else {
        res.push(0);
      }
      return res;
    },
    [0]
  );
}

export const bestAttempts = (arr: MotilisStatGame[]): number[] => {
  return arr.reduce(
    (acc, curr) => {
      const nbAttempts =
        curr.nbAttempts === 6 && curr.won
          ? curr.nbAttempts - 1
          : curr.nbAttempts;
      acc[nbAttempts]++;
      return acc;
    },
    [0, 0, 0, 0, 0, 0, 0] as number[]
  );
}

export const currentStreak = (arr: MotilisStatGame[]): number => {
  let won = 0;
  for (const e of arr) {
    if (!e.won) {
      return won;
    }
    won += 1;
  }
  return won;
}

export const percentWin = (arr: MotilisStatGame[]): number => {
  const wonsLength = arr.filter(e => e.won).length;
  if (!wonsLength) {
    return wonsLength;
  }
  return (wonsLength / arr.length) * 100;
}