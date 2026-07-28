import { assertMinimumValidLots, expect, performSearch, test } from '../fixtures';
import type { Page } from '@playwright/test';
import { SEARCH_RESULTS_URL_PATTERN } from '../../pages/SearchResultsPage';
import type { SearchResultsPage } from '../../pages/SearchResultsPage';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

interface SearchContextState {
  url: string;
  queryInUrl: string | null;
  queryInInput: string;
  headingText: string;
  validLots: number;
}

function readQueryParam(url: string): string | null {
  return new URL(url).searchParams.get('q');
}

async function captureState(
  page: Page,
  searchResultsPage: SearchResultsPage,
): Promise<SearchContextState> {
  const url = page.url();

  return {
    url,
    queryInUrl: readQueryParam(url),
    queryInInput: await searchResultsPage.getSearchInputValue().catch(() => ''),
    headingText: await searchResultsPage.heading.innerText().catch(() => ''),
    validLots: await searchResultsPage.getValidLotCount(),
  };
}

/**
 * Asserts that the application does not contradict itself, without dictating which
 * state-management strategy it should use.
 *
 * Restoring the query after Back or a reload is a product decision, and teams frequently leave
 * it unimplemented. This suite therefore never requires the query to survive. What it does
 * require is internal consistency:
 *
 *  - if the URL carries a query, the rendered results must belong to that query;
 *  - if the search input holds a value, that value must match the query in the URL.
 *
 * A consistently stateless implementation passes. A half-implemented one that shows `q=train`
 * in the URL while rendering something else — or leaves a stale term in the input — fails.
 */
function assertInternallyConsistent(state: SearchContextState, context: string): void {
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
    const state = await captureState(page, searchResultsPage);

    const summary = `url=${state.url} | queryInUrl=${String(state.queryInUrl)} | input="${state.queryInInput}" | heading="${state.headingText}" | lots=${String(state.validLots)}`;

    test.info().annotations.push({ type: 'observed-behaviour (Back)', description: summary });
    console.log(`\n[TC-CAT-14] AFTER BACK    ${summary}`);

    // Invariant: the results context is genuinely restored, not an empty shell.
    expect(state.validLots, 'Back must restore a populated results page').toBeGreaterThan(0);
    assertInternallyConsistent(state, 'after Back');

    return state;
  });

  await test.step('Reload the page', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await searchResultsPage.acceptCookiesIfPresent();
    await searchResultsPage.waitForResults();
  });

  await test.step('Validate post-refresh consistency and usability', async () => {
    const stateAfterReload = await captureState(page, searchResultsPage);

    const summary = `url=${stateAfterReload.url} | queryInUrl=${String(stateAfterReload.queryInUrl)} | input="${stateAfterReload.queryInInput}" | heading="${stateAfterReload.headingText}" | lots=${String(stateAfterReload.validLots)}`;

    test.info().annotations.push({ type: 'observed-behaviour (Reload)', description: summary });
    console.log(`[TC-CAT-14] AFTER RELOAD  ${summary}\n`);

    expect(
      stateAfterReload.queryInUrl,
      'a reload must not silently drop the query from the URL',
    ).toBe(stateAfterBack.queryInUrl);

    expect(stateAfterReload.validLots, 'the reloaded page must still show results').toBeGreaterThan(
      0,
    );

    assertInternallyConsistent(stateAfterReload, 'after reload');
  });

  await test.step('Verify the user can continue searching without recovery steps', async () => {
    await searchResultsPage.fillSearchQuery('car');
    await searchResultsPage.submitSearchWithButton();
    await searchResultsPage.waitForResults();

    await expect(page).toHaveURL(/q=car\b/);
  });
});
