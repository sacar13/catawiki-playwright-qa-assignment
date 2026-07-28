import { assertLotOpened, assertMinimumValidLots, expect, test } from '../fixtures';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { LOT_DETAILS_URL_PATTERN } from '../../pages/LotDetailsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

test.describe('Search end-to-end', () => {
  test(
    '[Functional][Positive][E2E] Verify user can search for "train", open the second valid lot and retrieve lot details',
    { tag: '@critical' },
    async ({ page, homePage, searchResultsPage, lotDetailsPage }) => {
      await test.step('Open the English Catawiki homepage', async () => {
        await homePage.open();
        await expect(page).toHaveURL(/catawiki\.com\/en/);
      });

      await test.step('Verify the search input and search button are available', async () => {
        await expect(homePage.searchInput, 'search input must be available').toBeVisible();
        await expect(homePage.searchInput).toBeEnabled();
        await expect(homePage.searchButton, 'magnifier button must be available').toBeVisible();
      });

      await test.step(`Enter "${PRIMARY_SEARCH_TERM}" into the search field`, async () => {
        await homePage.fillSearchQuery(PRIMARY_SEARCH_TERM);
        await expect(homePage.searchInput).toHaveValue(PRIMARY_SEARCH_TERM);
      });

      await test.step('Submit the search using the magnifier button', async () => {
        await homePage.submitSearchWithButton();
        await searchResultsPage.waitForResults();
      });

      await test.step('Verify the search results page is displayed', async () => {
        await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);
        await expect(searchResultsPage.heading).toContainText(new RegExp(PRIMARY_SEARCH_TERM, 'i'));
      });

      const validLotCount = await test.step('Verify at least two valid lot cards exist', () =>
        assertMinimumValidLots(searchResultsPage));

      const secondCard =
        await test.step('Capture identifying information from the second valid lot card', async () => {
          const summary = await searchResultsPage.getLotCardSummary(1);
          expect(summary.lotId, 'second lot card must expose a lot id').not.toBe('');
          expect(
            summary.title.length,
            'second lot card must expose a non-empty title',
          ).toBeGreaterThan(0);
          return summary;
        });

      await test.step('Open the second valid lot', async () => {
        const openedLotId = await searchResultsPage.openLot(1);

        expect(openedLotId, 'the lot opened must be the second card that was inspected').toBe(
          secondCard.lotId,
        );
        await expect(page).toHaveURL(LOT_DETAILS_URL_PATTERN);
      });

      await test.step('Verify the corresponding lot details page is displayed', () =>
        assertLotOpened(
          lotDetailsPage,
          secondCard.lotId,
          'the opened lot must be the lot that was selected in the results',
        ));

      const details =
        await test.step('Retrieve the lot title, favorites counter and current bid', async () => {
          const lotDetails = await lotDetailsPage.getLotDetails();

          expect(lotDetails.title.length, 'lot title must not be empty').toBeGreaterThan(0);
          expect(Number.isInteger(lotDetails.favorites), 'favorites must be an integer').toBe(true);
          expect(Number.isFinite(lotDetails.currentBid.amount), 'bid amount must be numeric').toBe(
            true,
          );

          return lotDetails;
        });

      await test.step('Print the retrieved values to the console in a structured format', async () => {
        const output = JSON.stringify(details, null, 2);

        console.log(
          `\n--- Lot details (searched "${PRIMARY_SEARCH_TERM}", valid lots: ${String(validLotCount)}) ---`,
        );
        console.log(output);

        await test.info().attach('lot-details.json', {
          body: output,
          contentType: 'application/json',
        });
      });
    },
  );
});
