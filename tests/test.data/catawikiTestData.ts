export const PRIMARY_SEARCH_TERM = 'train';

/** Safe punctuation only — the assignment forbids penetration-testing payloads (TC-CAT-12). */
export const SPECIAL_CHARACTER_QUERY = 'train & co.';

export const WHITESPACE_ONLY_QUERY = '   ';

/** Minimum number of valid lot cards required before "the second lot" is meaningful. */
export const MINIMUM_VALID_LOTS = 2;

/**
 * Builds a query that is highly unlikely to match any lot. Generated per run rather than
 * hardcoded, so the test does not start passing or failing because of catalogue changes.
 */
export function buildNoResultsQuery(): string {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `zzq${randomSuffix}xnotalot`;
}
