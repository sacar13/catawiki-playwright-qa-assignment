import {
  assertMinimumValidLots,
  assertSearchContextConsistent,
  expect,
  performSearch,
  test,
} from '../fixtures';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

test.describe('Search state persistence', () => {
  test('[Functional][Navigation] Verify search state is preserved after browser Back navigation and refresh behavior is consistent', async ({
    page,
    homePage,
    searchResultsPage,
    lotDetailsPage,
  }) => {
    await test.step(`Search for "${PRIMARY_SEARCH_TERM}"`, async () => {
      await performSearch(homePage, searchResultsPage, PRIMARY_SEARCH_TERM);
      await assertMinimumValidLots(searchResultsPage);
    });

    const openedLotId = await test.step('Open the second valid lot', async () => {
      const lotId = await searchResultsPage.openLot(1);
      await expect(lotDetailsPage.title).toBeVisible();
      return lotId;
    });

    await test.step('Navigate back to the search context', async () => {
      await page.goBack();
      await page.waitForURL(SEARCH_RESULTS_URL_PATTERN);

      await expect(page, 'Back must return to the search results, not the lot').not.toHaveURL(
        new RegExp(`/l/${openedLotId}`),
      );
      await expect(
        searchResultsPage.searchInput,
        'the search control must remain usable after Back',
      ).toBeVisible();
    });

    const stateAfterBack = await test.step('Capture and validate the restored state', async () => {
      await searchResultsPage.waitForResults();
      const state = await searchResultsPage.captureSearchContextState();

      const summary = `url=${state.url} | queryInUrl=${String(state.queryInUrl)} | input="${state.queryInInput}" | heading="${state.headingText}" | lots=${String(state.validLots)}`;

      test.info().annotations.push({ type: 'observed-behaviour (Back)', description: summary });
      console.log(`\n[TC-CAT-14] AFTER BACK    ${summary}`);

      // Invariant: the results context is genuinely restored, not an empty shell.
      expect(state.validLots, 'Back must restore a populated results page').toBeGreaterThan(0);
      assertSearchContextConsistent(state, 'after Back');

      return state;
    });

    await test.step('Reload the page', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await searchResultsPage.acceptCookiesIfPresent();
      await searchResultsPage.waitForResults();
    });

    await test.step('Validate post-refresh consistency and usability', async () => {
      const stateAfterReload = await searchResultsPage.captureSearchContextState();

      const summary = `url=${stateAfterReload.url} | queryInUrl=${String(stateAfterReload.queryInUrl)} | input="${stateAfterReload.queryInInput}" | heading="${stateAfterReload.headingText}" | lots=${String(stateAfterReload.validLots)}`;

      test.info().annotations.push({ type: 'observed-behaviour (Reload)', description: summary });
      console.log(`[TC-CAT-14] AFTER RELOAD  ${summary}\n`);

      expect(
        stateAfterReload.queryInUrl,
        'a reload must not silently drop the query from the URL',
      ).toBe(stateAfterBack.queryInUrl);

      expect(
        stateAfterReload.validLots,
        'the reloaded page must still show results',
      ).toBeGreaterThan(0);

      assertSearchContextConsistent(stateAfterReload, 'after reload');
    });

    await test.step('Verify the user can continue searching without recovery steps', async () => {
      await searchResultsPage.fillSearchQuery('car');
      await searchResultsPage.submitSearchWithButton();
      await searchResultsPage.waitForResults();

      await expect(page).toHaveURL(/q=car\b/);
    });
  });
});
