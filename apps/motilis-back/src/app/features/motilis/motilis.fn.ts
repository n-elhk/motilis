export const convertDate = (date: Date | string | number = new Date()) => {
  const toConvert = new Date(date);
  return `${toConvert.getFullYear()}-${padStart(toConvert.getMonth() + 1, '0')}-${padStart(toConvert.getDate(), '0')}`
}

export const padStart = (num: number, char: string, places = 2) => {
  return String(num).padStart(places, char);
}

export const getPastDate = (daysAgo: number) => {
  // Obtenir la date actuelle
  const date = new Date();

  // Soustraire le nombre de jours
  date.setDate(date.getDate() - daysAgo);

  return date
}

export const increaseDate = (value: Date | string | number = new Date()) => {
  const date = new Date(value);
  date.setDate(date.getDate() + 1);
  return date;
}

const decreaseDate = (value: Date | string | number = new Date()) => {
  const date = new Date(value);
  date.setDate(date.getDate() - 1);
  return date;
}

export const timeToMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Définit l'heure à 00:00:00.000 du lendemain

  return midnight.getTime() - now.getTime(); // Temps restant en millisecondes
}