import { describe, expect, it } from 'vitest';
import { nearestMidnightDate, timeToMidnight } from './dates.ts';

const at = (iso: string) => Temporal.ZonedDateTime.from(iso);

describe('timeToMidnight', () => {
  it('compte le temps restant avant minuit', () => {
    expect(timeToMidnight(at('2026-11-21T23:00:00[Europe/Paris]'))).toBe(3_600_000);
  });

  it("tient compte du passage à l'heure d'été (journée de 23 h)", () => {
    expect(timeToMidnight(at('2026-03-29T00:00:00[Europe/Paris]'))).toBe(23 * 3_600_000);
  });
});

describe('nearestMidnightDate', () => {
  it('renvoie le lendemain quand le cron se déclenche juste avant minuit', () => {
    expect(nearestMidnightDate(at('2026-11-21T23:59:59.999[Europe/Paris]'))).toBe('2026-11-22');
  });

  it('renvoie le jour même juste après minuit', () => {
    expect(nearestMidnightDate(at('2026-11-22T00:00:00.001[Europe/Paris]'))).toBe('2026-11-22');
  });
});
