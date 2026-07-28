import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SearchResultsSelectors } from '../selectors/SearchResultsSelectors';
import type { LotCardSummary } from '../shared/interfaces/lotDetails';
import { normalizeWhitespace } from '../shared/parsers/numberParser';
import { resolveVisualOrderIndex } from '../shared/helpers/locatorHelpers';

/** Search results live at /en/s?q=<query>. */
export const SEARCH_RESULTS_URL_PATTERN = /\/s\?.*\bq=/;

/** Cards within this many pixels of each other vertically are considered the same row. */
const ROW_TOLERANCE_PX = 40;

/**
 * The states a Catawiki results page can settle into.
 * - `results`      — lots matched the query
 * - `related-only` — nothing matched exactly; related objects are offered instead
 * - `empty`        — nothing matched and nothing is suggested
 * - `unknown`      — none of the above, which means the page failed to render properly
 */
export type SearchResultsState = 'results' | 'related-only' | 'empty' | 'unknown';

export class SearchResultsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** Every lot card rendered on the page, valid or not. */
  get allLotCards(): Locator {
    return this.page.locator(SearchResultsSelectors.lotCardContainerCss);
  }

  /**
   * Lot cards that are actually usable: visible and containing a lot link. Filtering
   * before indexing is what makes "the second lot" a meaningful concept — the assignment
   * explicitly forbids calling nth(1) on an unvalidated collection.
   */
  get validLotCards(): Locator {
    return this.allLotCards
      .filter({ has: this.page.locator(SearchResultsSelectors.lotLinkCss) })
      .locator('visible=true');
  }

  /** Shown when nothing matched at all, e.g. `No matches for “ ”`. No cards are rendered. */
  get noMatchesMessage(): Locator {
    return this.page.getByText(SearchResultsSelectors.noMatchesTextPattern).first();
  }

  /**
   * Shown when the query matched nothing but Catawiki still offers suggestions:
   * `No exact results. Check out these related objects.` Lot cards *are* rendered here, but
   * they are explicitly presented as related objects rather than as matches.
   */
  get noExactResultsMessage(): Locator {
    return this.page.getByText(SearchResultsSelectors.noExactResultsTextPattern).first();
  }

  /** Waits until the results grid has rendered at least one card. */
  async waitForResults(): Promise<void> {
    await this.page.waitForURL(SEARCH_RESULTS_URL_PATTERN);
    await this.allLotCards.first().waitFor({ state: 'visible' });
  }

  async getValidLotCount(): Promise<number> {
    return this.validLotCards.count();
  }

  /**
   * Reads identifying information from a card without navigating away from the results.
   *
   * Lot cards use unhashed BEM class names, so the title and price are read from dedicated
   * elements rather than from the card's combined text, which also contains the countdown
   * and the favourites count.
   */
  async getLotCardSummary(position: number): Promise<LotCardSummary> {
    const index = await resolveVisualOrderIndex(this.validLotCards, position, ROW_TOLERANCE_PX);
    const card = this.validLotCards.nth(index);
    await card.waitFor({ state: 'visible' });

    const testId = await card.getAttribute('data-testid');
    const lotId = testId?.replace(SearchResultsSelectors.lotCardTestIdPrefix, '') ?? '';
    if (!lotId) {
      throw new Error(`Lot card at visual position ${String(position)} has no resolvable lot id.`);
    }

    const href =
      (await card.locator(SearchResultsSelectors.lotLinkCss).first().getAttribute('href')) ?? '';
    const title = normalizeWhitespace(
      await card.locator(SearchResultsSelectors.cardTitleCss).first().innerText(),
    );

    const priceElement = card.locator(SearchResultsSelectors.cardPriceCss).first();
    const bidRaw = (await priceElement.count())
      ? normalizeWhitespace(await priceElement.innerText())
      : '';

    return { lotId, title, href, bidRaw };
  }

  /**
   * Opens the lot at the given visual position and proves the right one was opened.
   *
   * The card's lot id is read before clicking and the navigation is awaited against that
   * exact id, so a mis-targeted click fails here instead of silently continuing on the wrong
   * lot and producing a confusing assertion failure later.
   */
  async openLot(position: number): Promise<string> {
    const index = await resolveVisualOrderIndex(this.validLotCards, position, ROW_TOLERANCE_PX);
    const card = this.validLotCards.nth(index);
    const testId = await card.getAttribute('data-testid');
    const expectedLotId = testId?.replace(SearchResultsSelectors.lotCardTestIdPrefix, '') ?? '';

    if (!expectedLotId) {
      throw new Error(`Lot card at visual position ${String(position)} has no resolvable lot id.`);
    }

    const link = card.locator(SearchResultsSelectors.lotLinkCss).first();
    await link.scrollIntoViewIfNeeded();
    await link.click();

    await this.page.waitForURL(new RegExp(`/l/${expectedLotId}\\b`), { timeout: 45_000 });
    await this.acceptCookiesIfPresent();

    return expectedLotId;
  }

  /**
   * The state the results page settled into. Catawiki distinguishes a true empty result from
   * a "nothing matched, here are related objects" fallback, and conflating the two would let
   * a test treat unrelated suggestions as genuine search hits.
   */
  async getResultsState(): Promise<SearchResultsState> {
    if (await this.noMatchesMessage.isVisible().catch(() => false)) {
      return 'empty';
    }

    if (await this.noExactResultsMessage.isVisible().catch(() => false)) {
      return 'related-only';
    }

    return (await this.allLotCards.count()) > 0 ? 'results' : 'unknown';
  }

  /** True when the application declares that nothing matched the query exactly. */
  async isNoResultsStateShown(): Promise<boolean> {
    const state = await this.getResultsState();
    return state === 'empty' || state === 'related-only';
  }
}
