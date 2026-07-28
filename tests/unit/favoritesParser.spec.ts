import { expect, test } from '@playwright/test';
import { parseFavoritesCount } from '../../shared/parsers/favoritesParser';

test.describe('favoritesParser', () => {
  test('[Unit][Data] Favorites counter without separators is parsed as an integer', () => {
    for (const [raw, expected] of [
      ['39', 39],
      ['0', 0],
      ['7', 7],
    ] as const) {
      const parsed = parseFavoritesCount(raw);

      expect(parsed, `"${raw}" should parse to ${String(expected)}`).toBe(expected);
      expect(Number.isInteger(parsed), `"${raw}" should parse to an integer`).toBe(true);
      expect(parsed).toBeGreaterThanOrEqual(0);
    }
  });

  test('[Unit][Data] Favorites counter with thousands separators is parsed as an integer', () => {
    expect(parseFavoritesCount('1,234')).toBe(1234);
    expect(parseFavoritesCount('1.234')).toBe(1234);
    expect(parseFavoritesCount('12 345')).toBe(12345);

    for (const raw of ['1,234', '1.234', '12 345']) {
      const parsed = parseFavoritesCount(raw);
      expect(Number.isInteger(parsed), `"${raw}" must not be read as a decimal`).toBe(true);
      expect(parsed).toBeGreaterThanOrEqual(0);
    }
  });
});
