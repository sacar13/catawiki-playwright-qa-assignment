import { expect, performSearch, test } from '../fixtures';
import { PRIMARY_SEARCH_TERM } from '../test.data/catawikiTestData';

/** Third-party analytics and advertising noise must not be reported as application failures. */
const THIRD_PARTY_HOST =
  /doubleclick|googletagmanager|google-analytics|facebook|hotjar|sentry|adjust|trustpilot|onetrust|cookielaw/i;

function isCatawikiRequest(url: string): boolean {
  return url.includes('catawiki.com') && !THIRD_PARTY_HOST.test(url);
}

test.describe('Search API and health', () => {
  test('[API][Contract] Verify the search request succeeds and returns a valid results payload', async ({
    page,
    homePage,
  }) => {
    await test.step('Establish a browser session', async () => {
      // The request is issued through the page's context so it carries the same cookies and
      // session as a real user; a bare HTTP client would not represent the same request path.
      await homePage.open();
    });

    const response = await test.step('Request the search endpoint directly', () =>
      page.request.get(`/s?q=${PRIMARY_SEARCH_TERM}`));

    await test.step('Verify the HTTP contract', () => {
      expect(response.status(), 'the search endpoint must answer successfully').toBe(200);
      expect(response.ok(), 'the response must be in the 2xx range').toBe(true);
      expect(
        response.headers()['content-type'],
        'the search endpoint must return an HTML document',
      ).toContain('text/html');
    });

    await test.step('Verify the payload structure', async () => {
      const body = await response.text();

      expect(body.length, 'the response body must not be empty').toBeGreaterThan(0);
      expect(body, 'the payload must echo the submitted query').toContain(PRIMARY_SEARCH_TERM);
      expect(body, 'the payload must carry a results collection rendered as lot cards').toContain(
        'lot-card-container',
      );
    });
  });

  test('[Health][Monitoring] Verify the mandatory flow produces no uncaught errors and no server failures', async ({
    page,
    homePage,
    searchResultsPage,
    lotDetailsPage,
  }) => {
    const pageErrors: string[] = [];
    const serverFailures: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    page.on('response', (response) => {
      const url = response.url();
      if (response.status() >= 500 && isCatawikiRequest(url)) {
        serverFailures.push(`${String(response.status())} ${url}`);
      }
    });

    await test.step('Execute the mandatory flow while listening', async () => {
      await performSearch(homePage, searchResultsPage, PRIMARY_SEARCH_TERM);

      await searchResultsPage.openLot(1);
      await expect(lotDetailsPage.title).toBeVisible();
    });

    await test.step('Verify no uncaught JavaScript errors occurred', () => {
      expect(
        pageErrors,
        `uncaught page errors during the mandatory flow:\n${pageErrors.join('\n')}`,
      ).toHaveLength(0);
    });

    await test.step('Verify no server failures occurred', () => {
      expect(
        serverFailures,
        `5xx responses from Catawiki during the mandatory flow:\n${serverFailures.join('\n')}`,
      ).toHaveLength(0);
    });
  });
});
