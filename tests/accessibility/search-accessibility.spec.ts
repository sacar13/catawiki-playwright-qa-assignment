import { expect, test } from '../fixtures';
import type { Locator, Page } from '@playwright/test';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

const MAX_TAB_PRESSES = 25;

/**
 * Walks the tab order until the target receives focus. Returns the number of presses needed,
 * or null when the control could not be reached — which means a keyboard-only user cannot
 * start a search at all.
 */
async function tabUntilFocused(page: Page, target: Locator): Promise<number | null> {
  for (let presses = 1; presses <= MAX_TAB_PRESSES; presses += 1) {
    await page.keyboard.press('Tab');

    if (await target.evaluate((element) => element === document.activeElement)) {
      return presses;
    }
  }

  return null;
}

test.describe('Search accessibility', () => {
  test('[Accessibility][Keyboard] Verify the search control is reachable and identifiable without a mouse', async ({
    page,
    homePage,
    searchResultsPage,
  }) => {
    await test.step('Open the homepage', async () => {
      await homePage.open();
      await expect(homePage.searchInput).toBeVisible();
    });

    await test.step('Verify the search input exposes an accessible name', async () => {
      const accessibleName = await homePage.searchInput.evaluate((element) => {
        const input = element as HTMLInputElement;
        const labelledBy = input.getAttribute('aria-labelledby');
        const labelled = labelledBy ? document.getElementById(labelledBy)?.textContent : null;

        return (
          input.getAttribute('aria-label') ??
          labelled ??
          input.labels?.[0]?.textContent ??
          input.placeholder ??
          ''
        ).trim();
      });

      expect(
        accessibleName,
        'a screen reader user must be told what the search field is for',
      ).not.toBe('');
    });

    await test.step('Verify the search button exposes an accessible name', async () => {
      await expect(
        page
          .getByRole('button', { name: /search/i })
          .locator('visible=true')
          .first(),
        'the magnifier button must be identifiable by its accessible name',
      ).toBeVisible();
    });

    await test.step('Verify the search input can be reached with the keyboard alone', async () => {
      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await page.keyboard.press('Escape');

      const presses = await tabUntilFocused(page, homePage.searchInput);

      test.info().annotations.push({
        type: 'observed-behaviour',
        description: `search input reached after ${String(presses)} Tab presses`,
      });

      expect(
        presses,
        `the search field was not reachable within ${String(MAX_TAB_PRESSES)} Tab presses`,
      ).not.toBeNull();
    });

    await test.step('Verify a search can be completed using the keyboard alone', async () => {
      await page.keyboard.type(PRIMARY_SEARCH_TERM);
      await expect(homePage.searchInput).toHaveValue(PRIMARY_SEARCH_TERM);

      await page.keyboard.press('Enter');
      await searchResultsPage.waitForResults();

      await expect(page).toHaveURL(SEARCH_RESULTS_URL_PATTERN);
      expect(await searchResultsPage.getValidLotCount()).toBeGreaterThan(0);
    });
  });
});
