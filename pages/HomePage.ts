import type { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Opens the English homepage (resolved against the configured baseURL). */
  async open(): Promise<void> {
    await this.page.goto('./', { waitUntil: 'domcontentloaded' });
    await this.acceptCookiesIfPresent();
  }
}
