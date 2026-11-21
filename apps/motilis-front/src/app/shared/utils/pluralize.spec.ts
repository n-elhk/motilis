import { pluralize } from './pluralize';

describe('pluralize', () => {
  const parties = { one: '{count} partie', other: '{count} parties' };

  it('uses the singular for 0 and 1 in French', () => {
    expect(pluralize(0, parties)).toBe('0 partie');
    expect(pluralize(1, parties)).toBe('1 partie');
  });

  it('uses the plural from 2 in French', () => {
    expect(pluralize(2, parties)).toBe('2 parties');
  });

  it('follows the locale rules', () => {
    expect(pluralize(0, { one: '{count} game', other: '{count} games' }, {}, 'en-US')).toBe('0 games');
  });

  it('falls back to `other` when the category has no phrase', () => {
    expect(pluralize(1, { other: '{count} x' })).toBe('1 x');
  });

  it('replaces extra variables, including regex special characters in keys', () => {
    expect(pluralize(2, { other: '{count} {mot.clé}' }, { 'mot.clé': 'essais' })).toBe('2 essais');
  });
});
