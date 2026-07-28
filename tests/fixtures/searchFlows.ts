import { expect } from '@playwright/test';
import type { HomePage } from '../../pages/HomePage';
import type { SearchResultsPage } from '../../pages/SearchResultsPage';
import { MINIMUM_VALID_LOTS } from '../test.data/catawikiTestData';

/**
 * Opens the homepage, submits `query`, and waits for the results grid to render.
 *
 * Several specs need exactly this sequence purely as setup before the behaviour under test
 * begins. TC-CAT-01 (`search-e2e.spec.ts`) deliberately does **not** use this helper: the
 * assignment's mandatory scenario lists open/type/click/verify as separate numbered steps, and
 * collapsing them into one call would lose that step-by-step reporting for the one test where
 * it matters most.
 */
export async function performSearch(
  homePage: HomePage,
  searchResultsPage: SearchResultsPage,
  query: string,
): Promise<void> {
  await homePage.open();
  await homePage.fillSearchQuery(query);
  await homePage.submitSearchWithButton();
  await searchResultsPage.waitForResults();
}

/**
 * Asserts at least `MINIMUM_VALID_LOTS` valid lot cards are present and returns the count.
 * Centralising this also guarantees every call site gets the same descriptive failure message.
 */
export async function assertMinimumValidLots(
  searchResultsPage: SearchResultsPage,
): Promise<number> {
  const count = await searchResultsPage.getValidLotCount();

  expect(
    count,
    `at least ${String(MINIMUM_VALID_LOTS)} valid lot cards are required, found ${String(count)}`,
  ).toBeGreaterThanOrEqual(MINIMUM_VALID_LOTS);

  return count;
}
