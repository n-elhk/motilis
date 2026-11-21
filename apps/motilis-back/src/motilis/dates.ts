/**
 * Toutes les dates sont calculées dans le fuseau horaire du serveur (variable `TZ`),
 * via l'API `Temporal` native (Node >= 26).
 */
const now = (): Temporal.ZonedDateTime => Temporal.Now.zonedDateTimeISO();

/** Date du jour au format `YYYY-MM-DD`. */
export const todayIso = (): string => Temporal.Now.plainDateISO().toString();

/** Millisecondes restantes avant le prochain minuit (gère les changements d'heure). */
export const timeToMidnight = (from: Temporal.ZonedDateTime = now()): number =>
  from.until(from.add({ days: 1 }).startOfDay()).total('milliseconds');

/**
 * Date (`YYYY-MM-DD`) du minuit le plus proche de `from`. Le cron de minuit peut se
 * déclencher quelques millisecondes trop tôt : à 23:59:59.999, c'est bien le
 * lendemain qui commence.
 */
export const nearestMidnightDate = (from: Temporal.ZonedDateTime = now()): string =>
  from.add({ hours: 12 }).toPlainDate().toString();
