import { assertPageUsable, expect, test } from '../fixtures';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import {
  PRIMARY_SEARCH_TERM,
  SPECIAL_CHARACTER_QUERY,
  WHITESPACE_ONLY_QUERY,
  buildNoResultsQuery,
} from '../test.data/catawikiTestData';

test.describe('Search negative and edge cases', () => {
  test('[TC-CAT-10][Functional][Negative] Verify an empty search submission is handled safely', async ({
    page,
    homePage,
  }) => {
    await test.step('Open the homepage with an empty search field', async () => {
      await homePage.open();
      await expect(homePage.searchInput).toBeVisible();
      await expect(homePage.searchInput, 'no residual value may remain').toHaveValue('');
    });

    const urlBeforeSubmit = page.url();

    await test.step('Submit the empty search', async () => {
      await homePage.submitSearchWithButton();
    });

    /*
     * Observed behaviour, pinned deliberately: Catawiki blocks the submission entirely. The URL
     * does not change, no results page opens and no validation message is shown. This is
     * asserted rather than treated as "any outcome is fine", so a regression here is detected.
     * The behaviour is documented in the README.
     */
    await test.step('Verify the submission was blocked and the page stayed usable', async () => {
      test.info().annotations.push({
        type: 'observed-behaviour',
        description: 'Empty query: submission blocked, user stays on the current page, no message.',
      });

      await expect(page, 'an empty query must not navigate away').toHaveURL(urlBeforeSubmit);
      await expect(page, 'an empty query must not open a results page').not.toHaveURL(
        SEARCH_RESULTS_URL_PATTERN,
      );
      await assertPageUsable(page);
    });

    await test.step('Verify the user can still search normally', async () => {
      await homePage.fillSearchQuery(PRIMARY_SEARCH_TERM);
      await homePage.submitSearchWithButton();

      await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);
    });
  });

  test('[TC-CAT-11][Functional][Negative] Verify a whitespace-only search submission is handled safely', async ({
    page,
    homePage,
    searchResultsPage,
  }) => {
    await test.step('Enter a whitespace-only query', async () => {
      await homePage.open();
      await homePage.fillSearchQuery(WHITESPACE_ONLY_QUERY);

      await expect(homePage.searchInput).toHaveValue(WHITESPACE_ONLY_QUERY);
    });

    await test.step('Submit the whitespace-only query', async () => {
      await homePage.submitSearchWithButton();
      await page.waitForURL(SEARCH_RESULTS_URL_PATTERN);
    });

    /*
     * Observed behaviour, pinned deliberately: unlike an empty query, whitespace *is* submitted
     * and produces a valid empty-results page rather than being trimmed away or rejected.
     */
    await test.step('Verify a valid empty-results state is shown', async () => {
      test.info().annotations.push({
        type: 'observed-behaviour',
        description: 'Whitespace-only query: submitted as-is, renders the no-matches empty state.',
      });

      await expect(searchResultsPage.noMatchesMessage).toBeVisible();
      await expect(
        searchResultsPage.allLotCards,
        'a true empty state must not render lot cards',
      ).toHaveCount(0);
      await assertPageUsable(page);
    });

    await test.step('Verify the user can recover with a normal search', async () => {
      await homePage.fillSearchQuery(PRIMARY_SEARCH_TERM);
      await homePage.submitSearchWithButton();
      await searchResultsPage.waitForResults();

      expect(await searchResultsPage.getValidLotCount()).toBeGreaterThan(0);
    });
  });

  test('[TC-CAT-12][Functional][Negative] Verify a query containing safe special characters is handled safely', async ({
    page,
    homePage,
    searchResultsPage,
  }) => {
    await test.step(`Search for "${SPECIAL_CHARACTER_QUERY}"`, async () => {
      await homePage.open();
      await homePage.fillSearchQuery(SPECIAL_CHARACTER_QUERY);

      await expect(
        homePage.searchInput,
        'special characters must be accepted verbatim',
      ).toHaveValue(SPECIAL_CHARACTER_QUERY);

      await homePage.submitSearchWithButton();
      await page.waitForURL(SEARCH_RESULTS_URL_PATTERN);
    });

    /*
     * The page must end up in exactly one coherent state — results or a declared empty state.
     * Accepting "either, whatever happens" would make this test unable to fail; requiring
     * exactly one of the two catches a blank or half-rendered page.
     */
    await test.step('Verify the page reaches a declared state', async () => {
      const state = await searchResultsPage.getResultsState();

      test.info().annotations.push({ type: 'observed-state', description: state });

      expect(
        state,
        'a special-character query must not leave the page in an undeclared state',
      ).not.toBe('unknown');

      await assertPageUsable(page);
    });

    await test.step('Verify the search remains usable afterwards', async () => {
      await expect(homePage.searchInput).toBeVisible();
      await expect(homePage.searchInput).toBeEnabled();
    });
  });

  test('[TC-CAT-13][Functional][Negative] Verify a no-result search shows an empty state and the user can recover', async ({
    page,
    homePage,
    searchResultsPage,
  }) => {
    const noResultsQuery = buildNoResultsQuery();

    await test.step('Search for a generated query that cannot match a lot', async () => {
      test.info().annotations.push({ type: 'generated-query', description: noResultsQuery });

      await homePage.open();
      await homePage.fillSearchQuery(noResultsQuery);
      await expect(homePage.searchInput).toHaveValue(noResultsQuery);

      await homePage.submitSearchWithButton();
      await page.waitForURL(SEARCH_RESULTS_URL_PATTERN);
    });

    /*
     * Observed behaviour, pinned deliberately: Catawiki does not render a bare empty page for an
     * unmatchable query. It states "No exact results" and offers related objects instead. Lot
     * cards are therefore present, but the application explicitly declares they are not matches.
     * The contract asserted here is that no lot is ever presented as an exact hit for gibberish.
     */
    await test.step('Verify the application declares that nothing matched', async () => {
      const state = await searchResultsPage.getResultsState();

      test.info().annotations.push({ type: 'observed-state', description: state });

      expect(
        ['empty', 'related-only'],
        `an unmatchable query must not be answered with genuine results (state: ${state})`,
      ).toContain(state);

      await expect(
        searchResultsPage.noMatchesMessage.or(searchResultsPage.noExactResultsMessage),
        'the page must tell the user that nothing matched',
      ).toBeVisible();

      await assertPageUsable(page);
    });

    await test.step(`Replace the query with "${PRIMARY_SEARCH_TERM}" and submit again`, async () => {
      await homePage.fillSearchQuery(PRIMARY_SEARCH_TERM);
      await expect(homePage.searchInput, 'the previous query must be fully replaced').toHaveValue(
        PRIMARY_SEARCH_TERM,
      );

      await homePage.submitSearchWithButton();
      await searchResultsPage.waitForResults();
    });

    await test.step('Verify genuine results are displayed after recovery', async () => {
      expect(
        await searchResultsPage.getResultsState(),
        'recovery must produce real matches, not another related-objects fallback',
      ).toBe('results');

      expect(
        await searchResultsPage.getValidLotCount(),
        'the user must recover without reloading the application',
      ).toBeGreaterThan(0);
    });
  });
});
