import { assertLotOpened, assertMinimumValidLots, expect, performSearch, test } from '../fixtures';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';
import { parseCurrentBid } from '../../shared/parsers/currencyParser';

const PLACEHOLDER_TITLES = ['loading', 'undefined', 'null', 'n/a', '-', '...'];

test.describe('Lot data contract and consistency', () => {
  // Both tests need the same populated search before they diverge into different assertions.
  test.beforeEach(async ({ homePage, searchResultsPage }) => {
    await performSearch(homePage, searchResultsPage, PRIMARY_SEARCH_TERM);
    await assertMinimumValidLots(searchResultsPage);
  });

  test('[Functional][Data Validation] Verify retrieved lot details comply with expected data contracts', async ({
    searchResultsPage,
    lotDetailsPage,
  }) => {
    await test.step('Open the second valid lot', async () => {
      await searchResultsPage.openLot(1);
      await expect(lotDetailsPage.title).toBeVisible();
    });

    const rawTitle = await test.step('Retrieve and validate the lot title', async () => {
      const title = await lotDetailsPage.getTitleText();

      expect(typeof title, 'title must be a string').toBe('string');
      expect(title, 'title must not be empty').not.toBe('');
      expect(title, 'title must already be trimmed').toBe(title.trim());
      expect(
        PLACEHOLDER_TITLES.includes(title.toLowerCase()),
        `title must not be a placeholder, received "${title}"`,
      ).toBe(false);

      return title;
    });

    await test.step('Retrieve and validate the favorites counter', async () => {
      const rawFavorites = await lotDetailsPage.getFavoritesRawText();

      expect(typeof rawFavorites, 'raw favorites value must be captured as a string').toBe(
        'string',
      );
      expect(rawFavorites, 'raw favorites value must not be empty').not.toBe('');

      const { favorites } = await lotDetailsPage.getLotDetails();

      expect(Number.isInteger(favorites), 'favorites must parse to an integer').toBe(true);
      expect(favorites, 'favorites must be zero or greater').toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(favorites), 'favorites must never be NaN').toBe(false);
    });

    await test.step('Retrieve and validate the current bid', async () => {
      const rawBid = await lotDetailsPage.getCurrentBidRawText();

      expect(typeof rawBid, 'raw bid value must be captured as a string').toBe('string');
      expect(rawBid, 'raw bid value must not be empty').not.toBe('');
      expect(rawBid, 'raw bid must contain a recognizable numeric amount').toMatch(/\d/);

      const { currentBid } = await lotDetailsPage.getLotDetails();

      expect(currentBid.raw, 'the raw UI value must be preserved').toBe(rawBid);
      expect(Number.isFinite(currentBid.amount), 'bid amount must be a finite number').toBe(true);
      expect(currentBid.amount, 'bid amount must be zero or greater').toBeGreaterThanOrEqual(0);
      expect(currentBid.currency, 'currency information must be identified').not.toBe('');
    });

    await test.step('Validate the overall data contract', async () => {
      const details = await lotDetailsPage.getLotDetails();

      expect(details.title).toBe(rawTitle);
      expect(Object.keys(details.currentBid).sort()).toEqual(['amount', 'currency', 'raw']);
    });
  });

  test('[Functional][Data Consistency] Verify lot data shown on the search card matches the lot details page', async ({
    searchResultsPage,
    lotDetailsPage,
  }) => {
    const card = await test.step('Read the second valid card title and current bid', async () => {
      const summary = await searchResultsPage.getLotCardSummary(1);

      expect(summary.title, 'card title must be readable').not.toBe('');
      expect(summary.bidRaw, 'card must display a current bid').not.toBe('');

      return summary;
    });

    const cardBid = parseCurrentBid(card.bidRaw);

    await test.step('Open the second valid lot', async () => {
      await searchResultsPage.openLot(1);
      await assertLotOpened(lotDetailsPage, card.lotId);
    });

    await test.step('Compare the card title with the details page title', async () => {
      const detailsTitle = await lotDetailsPage.getTitleText();

      expect(
        lotDetailsPage.titleCorrespondsTo(card.title, detailsTitle),
        `card title "${card.title}" must correspond to details title "${detailsTitle}"`,
      ).toBe(true);
    });

    await test.step('Compare the card bid with the details page bid', async () => {
      const details = await lotDetailsPage.getLotDetails();

      expect(
        details.currentBid.currency,
        `currency must not change between card (${cardBid.raw}) and details page (${details.currentBid.raw})`,
      ).toBe(cardBid.currency);

      // A new bid may legitimately arrive between the two reads, so the amount may rise.
      // It must never fall — that would mean the two views disagree.
      expect(
        details.currentBid.amount,
        `details bid ${String(details.currentBid.amount)} must not be lower than card bid ${String(cardBid.amount)}`,
      ).toBeGreaterThanOrEqual(cardBid.amount);
    });
  });
});
