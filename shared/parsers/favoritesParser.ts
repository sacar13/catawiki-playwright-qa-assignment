import { ParseError, normalizeWhitespace } from './numberParser';

/**
 * Parses a favourites counter such as "75", "1,234" or "1.234".
 * Thousands separators are stripped; the result must be a non-negative integer.
 */
export function parseFavoritesCount(raw: string): number {
  const normalized = normalizeWhitespace(raw);
  const match = /\d[\d.,\s]*/.exec(normalized);

  if (!match) {
    throw new ParseError(`Favorites counter contains no digits. Raw value: "${raw}"`);
  }

  const digitsOnly = match[0].replace(/[.,\s]/g, '');
  const parsed = Number(digitsOnly);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ParseError(
      `Favorites counter did not parse to a non-negative integer. Raw value: "${raw}", parsed: ${String(parsed)}`,
    );
  }

  return parsed;
}
