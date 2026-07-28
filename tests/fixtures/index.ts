import { test as base } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { SearchResultsPage } from '../../pages/SearchResultsPage';
import { LotDetailsPage } from '../../pages/LotDetailsPage';

interface CatawikiFixtures {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  lotDetailsPage: LotDetailsPage;
}

/**
 * Page objects are exposed as fixtures so specs declare only what they use and never
 * construct page objects by hand. All three share the same `page`, which keeps a single
 * navigation flow (home -> results -> lot details) working across them.
 */
export const test = base.extend<CatawikiFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  lotDetailsPage: async ({ page }, use) => {
    await use(new LotDetailsPage(page));
  },
});

export { expect } from '@playwright/test';

/** Reusable multi-page setup flows and assertions built on top of the fixtures above. */
export {
  performSearch,
  assertMinimumValidLots,
  assertLotOpened,
  assertPageUsable,
  assertSearchContextConsistent,
} from './searchFlows';
