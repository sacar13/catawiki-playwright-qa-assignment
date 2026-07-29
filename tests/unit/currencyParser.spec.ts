import { expect, test } from '@playwright/test';
import { extractCurrency, parseCurrentBid } from '../../shared/parsers/currencyParser';
import { ParseError } from '../../shared/parsers/numberParser';

test.describe('currencyParser', () => {
  test('[TC-CAT-21][Unit][Data] Current bid with symbol prefix is parsed into amount and currency', () => {
    const bid = parseCurrentBid('€ 53');

    expect(bid.raw, 'raw value must be preserved exactly').toBe('€ 53');
    expect(bid.amount).toBe(53);
    expect(bid.currency).toBe('€');
    expect(Number.isFinite(bid.amount)).toBe(true);
    expect(bid.amount).toBeGreaterThanOrEqual(0);

    expect(parseCurrentBid('€ 320').amount).toBe(320);
    expect(parseCurrentBid('€112').amount, 'no space between symbol and digits').toBe(112);
  });

  test('[TC-CAT-22][Unit][Data] Dot thousands separator is not treated as a decimal separator', () => {
    const bid = parseCurrentBid('€ 1.200');

    expect(bid.amount, '"€ 1.200" is 1200, not 1.2 — a silent 1000x error otherwise').toBe(1200);
    expect(bid.currency).toBe('€');
  });

  test('[TC-CAT-23][Unit][Data] European format with dot thousands and comma decimals is parsed correctly', () => {
    const bid = parseCurrentBid('€ 1.200,50');

    expect(bid.amount).toBe(1200.5);
    expect(bid.currency).toBe('€');
    expect(Number.isInteger(bid.amount), 'decimal bids are valid and must not be rounded').toBe(
      false,
    );
  });

  test('[TC-CAT-24][Unit][Data] Anglo format with suffixed currency is parsed correctly', () => {
    const bid = parseCurrentBid('1,200.50 €');

    expect(bid.amount).toBe(1200.5);
    expect(bid.currency, 'currency must be detected in trailing position').toBe('€');
  });

  test('[TC-CAT-27][Unit][Negative][Data] Missing currency information throws a descriptive ParseError', () => {
    expect(() => parseCurrentBid('1200')).toThrow(ParseError);
    expect(() => parseCurrentBid('1200')).toThrow(/currency/i);

    const bid = parseCurrentBid('1200', 'Current bid € 1200');

    expect(bid.amount, 'currency hint resolves a sibling-rendered currency').toBe(1200);
    expect(bid.currency).toBe('€');
    expect(extractCurrency('no currency here')).toBe('');
  });
});
