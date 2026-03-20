export type MotilisStat = {
  games: MotilisStatGame[];
};

export type MotilisStatGame = {
  date: number;
  won: boolean;
  nbAttempts: number;
};
  