/** Error raised whenever live UI text cannot be turned into trustworthy typed data. */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

/** Non-breaking, narrow and thin spaces are common in European currency rendering. */
const UNICODE_SPACES = /[\u00A0\u202F\u2009\u2007\u2060]/g;

export function normalizeWhitespace(value: string): string {
  return value.replace(UNICODE_SPACES, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Converts a locale-ambiguous numeric string to a number.
 *
 * Handles both the European (dot-thousands, comma-decimal) and Anglo (comma-thousands,
 * dot-decimal) formats, e.g. "1,200", "1.200", "1.200,50" and "1,200.50". When both
 * separators appear, the right-most one is the decimal separator. When only one appears, it
 * is treated as a decimal separator only if it is followed by one or two digits —
 * "1.200" is therefore 1200, not 1.2.
 *
 * `rawForError` is the original, unprocessed source string and is used only to make a
 * thrown `ParseError` message point back to what the caller actually read from the page.
 */
export function parseLocaleNumber(numericText: string, rawForError: string): number {
  const cleaned = numericText.replace(/\s/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let decimalSeparator = '';
  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparator = lastComma > lastDot ? ',' : '.';
  } else if (lastComma !== -1 || lastDot !== -1) {
    const separator = lastComma !== -1 ? ',' : '.';
    const position = lastComma !== -1 ? lastComma : lastDot;
    const decimalsAfter = cleaned.length - position - 1;
    const occurrences = cleaned.split(separator).length - 1;
    if (occurrences === 1 && decimalsAfter > 0 && decimalsAfter <= 2) {
      decimalSeparator = separator;
    }
  }

  const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
  let normalized = cleaned.split(thousandsSeparator).join('');
  if (decimalSeparator === ',') {
    normalized = normalized.replace(',', '.');
  } else if (decimalSeparator === '') {
    normalized = normalized.replace(/[.,]/g, '');
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new ParseError(
      `Value did not parse to a finite number. Raw value: "${rawForError}", normalized: "${normalized}"`,
    );
  }

  if (amount < 0) {
    throw new ParseError(
      `Value is negative. Raw value: "${rawForError}", parsed: ${String(amount)}`,
    );
  }

  return amount;
}
