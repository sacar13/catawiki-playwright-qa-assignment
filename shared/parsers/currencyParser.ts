import type { CurrentBid } from '../interfaces/lotDetails';
import { ParseError, normalizeWhitespace, parseLocaleNumber } from './numberParser';

/**
 * Extracts the currency symbol or ISO code. Returns an empty string when the value
 * carries no currency information, so the caller can decide whether that is acceptable.
 */
export function extractCurrency(raw: string): string {
  const normalized = normalizeWhitespace(raw);
  const symbol = /[€$£¥₤₽]/.exec(normalized);
  if (symbol) {
    return symbol[0];
  }

  const isoCode = /\b(EUR|USD|GBP|CHF|JPY|SEK|NOK|DKK|PLN)\b/i.exec(normalized);
  return isoCode ? isoCode[0].toUpperCase() : '';
}

/**
 * Parses a current-bid string such as "€ 320", "€ 1.200,50" or "1,200.50 €" into typed data.
 * The raw value is always preserved. Unparseable input throws rather than defaulting to zero.
 *
 * `currencyHint` covers layouts where the currency sits in a sibling element rather than
 * inside the amount itself.
 */
export function parseCurrentBid(raw: string, currencyHint = ''): CurrentBid {
  const normalized = normalizeWhitespace(raw);
  const numericMatch = /\d[\d.,\s]*\d|\d/.exec(normalized);

  if (!numericMatch) {
    throw new ParseError(`Current bid contains no numeric amount. Raw value: "${raw}"`);
  }

  const amount = parseLocaleNumber(numericMatch[0], raw);
  const currency = extractCurrency(normalized) || extractCurrency(currencyHint);

  if (!currency) {
    throw new ParseError(
      `Current bid carries no recognizable currency information. Raw value: "${raw}"`,
    );
  }

  return { raw, amount, currency };
}
