import { assertMinimumValidLots, expect, test } from '../fixtures';
import { LOT_DETAILS_URL_PATTERN } from '../../pages/LotDetailsPage';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

test.describe('Mobile search', () => {
  /**
   * Runs only in the `mobile-chrome` project. The desktop page objects are reused unchanged:
   * Catawiki renders the same search field and lot card markup on mobile, and the shared
   * `visible=true` filtering already resolves whichever search control the viewport exposes.
   */
  test('[Functional][Responsive] Verify the mandatory search and lot-details flow works on a mobile viewport', async ({
    page,
    homePage,
    searchResultsPage,
    lotDetailsPage,
  }) => {
    await test.step('Launch the homepage on the mobile viewport', async () => {
      await homePage.open();

      const viewport = page.viewportSize();
      expect(viewport, 'a mobile viewport must be configured').not.toBeNull();
      expect(viewport?.width ?? 0, 'viewport must be mobile sized').toBeLessThan(600);
    });

    await test.step('Verify the mobile search control is accessible', async () => {
      // The mobile header keeps the input behind a magnifier toggle, so it must be opened first.
      await expect(homePage.searchToggle, 'mobile search toggle must be reachable').toBeVisible();
      await homePage.openSearchIfCollapsed();

      await expect(homePage.searchInput, 'mobile search input must be reachable').toBeVisible();
      await expect(homePage.searchInput).toBeEnabled();
    });

    await test.step(`Enter "${PRIMARY_SEARCH_TERM}" and submit the search`, async () => {
      await homePage.fillSearchQuery(PRIMARY_SEARCH_TERM);
      await expect(homePage.searchInput).toHaveValue(PRIMARY_SEARCH_TERM);

      // Mobile submits from the on-screen keyboard rather than a separate magnifier button.
      await homePage.submitSearchWithKeyboard();
      await searchResultsPage.waitForResults();
      await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);
    });

    const secondCard =
      await test.step('Verify at least two valid lots and capture the second', async () => {
        await assertMinimumValidLots(searchResultsPage);
        return searchResultsPage.getLotCardSummary(1);
      });

    await test.step('Open the second valid lot and verify the details page', async () => {
      await searchResultsPage.openLot(1);
      await expect(page).toHaveURL(LOT_DETAILS_URL_PATTERN);
      await expect(lotDetailsPage.title).toBeVisible();
      expect(lotDetailsPage.getLotIdFromUrl(), 'the selected lot must be the one opened').toBe(
        secondCard.lotId,
      );
    });

    await test.step('Retrieve and print the lot details', async () => {
      const details = await lotDetailsPage.getLotDetails();

      expect(details.title).not.toBe('');
      expect(Number.isInteger(details.favorites)).toBe(true);
      expect(details.favorites).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(details.currentBid.amount)).toBe(true);
      expect(details.currentBid.currency).not.toBe('');

      const output = JSON.stringify(details, null, 2);
      console.log('\n--- Lot details (mobile viewport) ---');
      console.log(output);

      await test.info().attach('lot-details-mobile.json', {
        body: output,
        contentType: 'application/json',
      });
    });
  });
});
