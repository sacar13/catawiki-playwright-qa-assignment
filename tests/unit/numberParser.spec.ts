import { expect, test } from '@playwright/test';
import { ParseError, normalizeWhitespace } from '../../shared/parsers/numberParser';
import { parseCurrentBid } from '../../shared/parsers/currencyParser';
import { parseFavoritesCount } from '../../shared/parsers/favoritesParser';

const NBSP = '\u00A0';
const THIN_SPACE = '\u2009';

test.describe('numberParser', () => {
  test('[TC-CAT-25][Unit][Data] Non-breaking and narrow spaces are normalized before parsing', () => {
    expect(normalizeWhitespace(`€${NBSP}1.200`)).toBe('€ 1.200');
    expect(normalizeWhitespace(`  €${THIN_SPACE}53  `)).toBe('€ 53');

    const raw = `€${NBSP}1.200,50`;
    const bid = parseCurrentBid(raw);

    expect(bid.amount).toBe(parseCurrentBid('€ 1.200,50').amount);
    expect(bid.currency).toBe('€');
    expect(bid.raw, 'raw must keep the original unicode spacing').toBe(raw);
  });

  test('[TC-CAT-26][Unit][Negative][Data] Unparseable values throw ParseError instead of returning zero or NaN', () => {
    for (const raw of ['', '—', 'abc', 'No bids']) {
      expect(() => parseFavoritesCount(raw), `favorites "${raw}" must throw`).toThrow(ParseError);
      expect(() => parseCurrentBid(raw), `bid "${raw}" must throw`).toThrow(ParseError);
    }

    expect(
      () => parseFavoritesCount('No bids'),
      'error message must contain the raw value for debugging',
    ).toThrow(/No bids/);
  });
});
