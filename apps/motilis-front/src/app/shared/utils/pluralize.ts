type PluralPhrases = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

const rulesCache = new Map<string, Intl.PluralRules>();

const pluralRules = (locale: string): Intl.PluralRules => {
  let rules = rulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    rulesCache.set(locale, rules);
  }
  return rules;
};

/**
 * Picks the phrase matching the plural category of `count` for `locale`,
 * then replaces `{count}` and every `{key}` from `vars`.
 *
 * pluralize(3, { one: '{count} partie', other: '{count} parties' }) → '3 parties'
 * In French, 0 and 1 both select `one`.
 */
export const pluralize = (
  count: number,
  phrases: PluralPhrases,
  vars: Record<string, string | number> = {},
  locale = 'fr-FR',
): string => {
  const phrase = phrases[pluralRules(locale).select(count)] ?? phrases.other;

  return Object.entries({ count, ...vars }).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    phrase,
  );
};
