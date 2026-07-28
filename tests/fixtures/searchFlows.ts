import { expect, type Page } from '@playwright/test';
import type { HomePage } from '../../pages/HomePage';
import type { SearchContextState, SearchResultsPage } from '../../pages/SearchResultsPage';
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

/** Fails if the page has collapsed into an error or blank state rather than a usable view. */
export async function assertPageUsable(page: Page): Promise<void> {
  await expect(page.locator('body')).not.toContainText(/access denied|something went wrong/i);
  await expect(page.getByRole('banner')).toBeVisible();
}

/**
 * Asserts that the application does not contradict itself, without dictating which
 * state-management strategy it should use.
 *
 * Restoring the query after Back or a reload is a product decision, and teams frequently leave
 * it unimplemented. This never requires the query to survive. What it does require is internal
 * consistency:
 *
 *  - if the URL carries a query, the rendered results must belong to that query;
 *  - if the search input holds a value, that value must match the query in the URL.
 *
 * A consistently stateless implementation passes. A half-implemented one that shows `q=train`
 * in the URL while rendering something else — or leaves a stale term in the input — fails.
 */
export function assertSearchContextConsistent(state: SearchContextState, context: string): void {
  if (state.queryInUrl !== null && state.queryInUrl.trim() !== '') {
    expect(
      state.headingText.toLowerCase(),
      `${context}: URL claims q="${state.queryInUrl}" but the heading reads "${state.headingText}"`,
    ).toContain(state.queryInUrl.trim().toLowerCase());
  }

  if (state.queryInInput.trim() !== '') {
    expect(
      state.queryInInput.trim().toLowerCase(),
      `${context}: the search input shows "${state.queryInInput}" which disagrees with the URL query "${String(state.queryInUrl)}"`,
    ).toBe((state.queryInUrl ?? '').trim().toLowerCase());
  }
}
