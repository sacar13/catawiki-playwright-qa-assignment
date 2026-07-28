import { assertMinimumValidLots, expect, performSearch, test } from '../fixtures';
import { LOT_DETAILS_URL_PATTERN } from '../../pages/LotDetailsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';
import { normalizeWhitespace } from '../../shared/parsers/numberParser';

/**
 * Card titles are clamped to two lines in the results grid, so a details-page title can be
 * longer than the captured card title. Correspondence is therefore checked with containment
 * in either direction rather than strict equality.
 */
function titlesCorrespond(cardTitle: string, detailsTitle: string): boolean {
  const card = normalizeWhitespace(cardTitle).toLowerCase();
  const details = normalizeWhitespace(detailsTitle).toLowerCase();
  return details.includes(card) || card.includes(details);
}

test.describe('Lot navigation', () => {
  test(
    '[Functional][Navigation] Verify the second valid search result opens the corresponding lot details page',
    { tag: '@critical' },
    async ({ page, homePage, searchResultsPage, lotDetailsPage }) => {
      await test.step('Search for the primary keyword', async () => {
        await performSearch(homePage, searchResultsPage, PRIMARY_SEARCH_TERM);
      });

      await test.step('Verify at least two valid lot cards are available', async () => {
        await assertMinimumValidLots(searchResultsPage);
      });

      const secondCard = await test.step('Capture the second valid lot identity', async () => {
        const summary = await searchResultsPage.getLotCardSummary(1);

        expect(summary.lotId, 'lot id must be resolvable').toMatch(/^\d+$/);
        expect(summary.title, 'card title must not be empty').not.toBe('');
        expect(summary.href, 'card must link to a lot details page').toContain(
          `/l/${summary.lotId}`,
        );

        return summary;
      });

      await test.step('Open the second valid lot', async () => {
        await searchResultsPage.openLot(1);
        await expect(page).toHaveURL(LOT_DETAILS_URL_PATTERN);
      });

      await test.step('Verify the opened page corresponds to the selected result', async () => {
        await expect(lotDetailsPage.title).toBeVisible();

        expect(
          lotDetailsPage.getLotIdFromUrl(),
          'the opened lot id must match the selected card lot id',
        ).toBe(secondCard.lotId);

        const detailsTitle = await lotDetailsPage.getTitleText();
        expect(
          titlesCorrespond(secondCard.title, detailsTitle),
          `card title "${secondCard.title}" does not correspond to details title "${detailsTitle}"`,
        ).toBe(true);
      });

      await test.step('Verify navigation integrity', async () => {
        await expect(page).toHaveURL(new RegExp(`/l/${secondCard.lotId}`));
        await expect(lotDetailsPage.bidStatusSection, 'lot content must be rendered').toBeVisible();
      });
    },
  );

  test('[Functional][Navigation] Verify a lot details page can be opened directly by URL and survives a reload', async ({
    page,
    homePage,
    searchResultsPage,
    lotDetailsPage,
  }) => {
    const lotUrl = await test.step('Obtain a valid lot URL from a live search', async () => {
      await performSearch(homePage, searchResultsPage, PRIMARY_SEARCH_TERM);

      // Deep-linking has no "second lot" requirement, so the first valid card is used here.
      // Only TC-CAT-01, 02, 04 and 16 assert the mandatory second-lot selection.
      const summary = await searchResultsPage.getLotCardSummary(0);
      expect(summary.href, 'a lot URL must be captured at runtime, never hardcoded').toContain(
        '/l/',
      );

      return summary.href;
    });

    await test.step('Open the captured URL directly', async () => {
      await lotDetailsPage.open(lotUrl);
      await expect(page).toHaveURL(LOT_DETAILS_URL_PATTERN);
      await expect(lotDetailsPage.title).toBeVisible();
      await expect(lotDetailsPage.bidStatusSection).toBeVisible();
    });

    const lotIdBeforeReload = lotDetailsPage.getLotIdFromUrl();

    await test.step('Reload the page and verify the same lot is still displayed', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await lotDetailsPage.acceptCookiesIfPresent();

      await expect(lotDetailsPage.title, 'lot content must survive a reload').toBeVisible();
      expect(lotDetailsPage.getLotIdFromUrl(), 'reload must not change the lot').toBe(
        lotIdBeforeReload,
      );
    });
  });
});
