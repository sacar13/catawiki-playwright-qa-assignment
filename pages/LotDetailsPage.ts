import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LotDetailsSelectors } from '../selectors/LotDetailsSelectors';
import type { LotDetails } from '../shared/interfaces/lotDetails';
import { normalizeWhitespace } from '../shared/parsers/numberParser';
import { parseFavoritesCount } from '../shared/parsers/favoritesParser';
import { parseCurrentBid } from '../shared/parsers/currencyParser';

export const LOT_DETAILS_URL_PATTERN = /\/l\/(\d+)/;

export class LotDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get title(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get favoritesCounter(): Locator {
    return this.page
      .locator(LotDetailsSelectors.favoritesChipGalleryCss)
      .or(this.page.locator(LotDetailsSelectors.favoritesChipTitleCss))
      .locator('visible=true')
      .first();
  }

  get bidStatusSection(): Locator {
    return this.page.getByTestId(LotDetailsSelectors.bidStatusSectionTestId);
  }

  get currentBidAmount(): Locator {
    return this.page.locator(LotDetailsSelectors.bidAmountCss).locator('visible=true').first();
  }

  async open(lotUrl: string): Promise<void> {
    await this.page.goto(lotUrl, { waitUntil: 'domcontentloaded' });
    await this.acceptCookiesIfPresent();
  }

  /** Lot id taken from the current URL, used to prove we opened the lot we selected. */
  getLotIdFromUrl(): string {
    const match = LOT_DETAILS_URL_PATTERN.exec(this.page.url());
    if (!match?.[1]) {
      throw new Error(`Current URL is not a lot details URL: ${this.page.url()}`);
    }
    return match[1];
  }

  async getTitleText(): Promise<string> {
    await this.title.waitFor({ state: 'visible' });
    return normalizeWhitespace(await this.title.innerText());
  }

  /**
   * Card titles are clamped to two lines in the results grid, so a details-page title can be
   * longer than the captured card title. Correspondence is therefore checked with containment
   * in either direction rather than strict equality.
   */
  titleCorrespondsTo(cardTitle: string, detailsTitle: string): boolean {
    const card = normalizeWhitespace(cardTitle).toLowerCase();
    const details = normalizeWhitespace(detailsTitle).toLowerCase();
    return details.includes(card) || card.includes(details);
  }

  async getFavoritesRawText(): Promise<string> {
    await this.favoritesCounter.waitFor({ state: 'visible' });
    return normalizeWhitespace(await this.favoritesCounter.innerText());
  }

  async getCurrentBidRawText(): Promise<string> {
    await this.currentBidAmount.waitFor({ state: 'visible' });
    return normalizeWhitespace(await this.currentBidAmount.innerText());
  }

  /**
   * Collects the three required values as typed data. Parsing errors propagate so that
   * unexpected live-site formatting fails the test loudly instead of degrading silently.
   */
  async getLotDetails(): Promise<LotDetails> {
    await this.acceptCookiesIfPresent();

    const title = await this.getTitleText();
    const favoritesRaw = await this.getFavoritesRawText();
    const bidRaw = await this.getCurrentBidRawText();

    // Only a fallback for layouts that render the currency outside the amount; the desktop
    // and mobile bid values both already carry it, so an absent section is not an error.
    const sectionText = await this.bidStatusSection
      .innerText()
      .then(normalizeWhitespace)
      .catch(() => '');

    return {
      title,
      favorites: parseFavoritesCount(favoritesRaw),
      currentBid: parseCurrentBid(bidRaw, sectionText),
    };
  }
}
