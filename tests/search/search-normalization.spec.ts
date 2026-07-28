import { expect, test } from '../fixtures';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

interface QueryVariation {
  id: string;
  title: string;
  query: string;
}

/**
 * Each variation runs as its own test rather than as steps of one long test, so a failure in
 * one casing does not hide the behaviour of the others.
 *
 * Result order, titles and counts are deliberately not compared across variations: on a live
 * auction site those differ legitimately from one request to the next. What is asserted is
 * that harmless whitespace and letter-case differences never block the search.
 */
const VARIATIONS: QueryVariation[] = [
  {
    id: 'TC-CAT-07',
    title:
      '[Functional][Positive] Verify search handles a query with leading and trailing whitespace',
    query: ` ${PRIMARY_SEARCH_TERM} `,
  },
  {
    id: 'TC-CAT-08',
    title: '[Functional][Positive] Verify search handles an uppercase query',
    query: PRIMARY_SEARCH_TERM.toUpperCase(),
  },
  {
    id: 'TC-CAT-09',
    title: '[Functional][Positive] Verify search handles a mixed-case query',
    query: 'TrAiN',
  },
];

test.describe('Search query normalization', () => {
  // Every variation starts from the same freshly opened, verified search control; only the
  // query entered afterward differs, which is the thing each test actually exercises.
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.searchInput).toBeEnabled();
    await expect(homePage.searchButton).toBeVisible();
  });

  for (const variation of VARIATIONS) {
    test(variation.title, async ({ page, homePage, searchResultsPage }) => {
      test.info().annotations.push({ type: 'test-case', description: variation.id });

      await test.step(`Enter the query "${variation.query}"`, async () => {
        await homePage.fillSearchQuery(variation.query);

        await expect(
          homePage.searchInput,
          'the field must accept the value exactly as entered',
        ).toHaveValue(variation.query);
      });

      await test.step('Submit the search', async () => {
        await homePage.submitSearchWithButton();
        await searchResultsPage.waitForResults();
      });

      await test.step('Verify results are displayed and the page is usable', async () => {
        await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);

        // The application may normalize or trim the query; either behaviour is acceptable as
        // long as the search is actually performed and relevant results come back.
        await expect(
          searchResultsPage.heading,
          'the results heading must reflect the searched term',
        ).toContainText(new RegExp(PRIMARY_SEARCH_TERM, 'i'));

        const validLots = await searchResultsPage.getValidLotCount();
        expect(
          validLots,
          `"${variation.query}" returned no valid lots — harmless formatting must not block the search`,
        ).toBeGreaterThan(0);

        await expect(
          homePage.searchInput,
          'the search control must remain available for a new query',
        ).toBeVisible();
      });
    });
  }
});
