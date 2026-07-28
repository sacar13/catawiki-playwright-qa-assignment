import { expect, type Locator, type Page } from '@playwright/test';
import { BaseSelectors } from '../selectors/BaseSelectors';

/**
 * Pages whose consent banner has actually been dismissed. Dismissing it stores consent, so the
 * banner cannot reappear in the same context and later calls can skip the appearance wait.
 *
 * A page is recorded here **only after a successful dismissal**. Marking it merely because the
 * banner had not appeared yet would be wrong: the consent platform loads asynchronously and,
 * under parallel execution, can render after the wait expires — then block every later click.
 */
const consentDismissed = new WeakSet<Page>();

/** Generous enough to cover the consent script loading slowly under parallel execution. */
const CONSENT_APPEARANCE_TIMEOUT_MS = 15_000;

/**
 * Shared behaviour for every page object: the header search control (which Catawiki renders
 * on all pages) and conditional consent handling.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /**
   * Catawiki renders several search inputs in the DOM (desktop header, mobile header,
   * overlay). Only one is visible at a time, so we always target the visible instance
   * rather than guessing an index.
   */
  get searchInput(): Locator {
    return this.page.getByTestId(BaseSelectors.searchFieldTestId).locator('visible=true').first();
  }

  get searchButton(): Locator {
    return this.page
      .getByRole('button', { name: BaseSelectors.searchButtonAccessibleName })
      .locator('visible=true')
      .first();
  }

  get searchToggle(): Locator {
    return this.page.locator(BaseSelectors.searchToggleCss).locator('visible=true').first();
  }

  /** Reveals the search input on viewports that keep it behind a toggle. No-op on desktop. */
  async openSearchIfCollapsed(): Promise<void> {
    if (await this.searchInput.isVisible().catch(() => false)) {
      return;
    }

    await this.searchToggle.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Dismisses the cookie consent dialog when one is actually shown.
   *
   * Catawiki serves two different consent implementations: an inline modal that stays in the
   * DOM permanently even after consent (so presence alone is not a reliable signal —
   * visibility is checked explicitly), and the Usercentrics platform. Both are handled.
   *
   * The least intrusive option is preferred: "Continue without accepting" is chosen over
   * "Accept All" whenever the dialog offers it, so the run does not opt into non-essential
   * tracking. When no dialog is shown this is a no-op, and the visibility check is the only
   * thing suppressed — an unrelated broken page cannot hide behind cookie handling.
   */
  async acceptCookiesIfPresent(): Promise<void> {
    const inlineModal = this.page.locator(BaseSelectors.consentInlineModalCss);
    if (await inlineModal.isVisible().catch(() => false)) {
      const accept = inlineModal
        .getByRole('button', { name: BaseSelectors.consentInlineAcceptNamePattern })
        .locator('visible=true')
        .first();

      if (await accept.isVisible().catch(() => false)) {
        await accept.click();
        await inlineModal.waitFor({ state: 'hidden' }).catch(() => undefined);
      }
    }

    /*
     * The consent dialog is exposed without an accessible name, and its least intrusive
     * option ("Continue without accepting") is rendered as plain text rather than a button.
     * Both controls are therefore matched by visible text instead of by role, and the
     * non-consenting option is preferred so the run does not opt into tracking cookies.
     */
    const declineControl = this.page
      .getByText(BaseSelectors.consentDeclineText, { exact: true })
      .first();
    const acceptAllButton = this.page
      .getByRole('button', { name: BaseSelectors.consentAcceptAllNamePattern })
      .first();

    /*
     * The consent script loads asynchronously, so an immediate visibility check races it. Until
     * the banner has actually been dismissed we wait for it to appear; afterwards the check is
     * instant, because consent is stored and the banner cannot return.
     */
    if (!consentDismissed.has(this.page)) {
      await declineControl
        .or(acceptAllButton)
        .waitFor({ state: 'visible', timeout: CONSENT_APPEARANCE_TIMEOUT_MS })
        .catch(() => undefined);
    }

    for (const control of [declineControl, acceptAllButton]) {
      if (await control.isVisible().catch(() => false)) {
        await control.click();

        // The consent root keeps intercepting pointer events until it is torn down, so waiting
        // for the button alone is not enough to know the page is interactive again.
        await this.page
          .locator(BaseSelectors.consentPlatformRootCss)
          .waitFor({ state: 'hidden', timeout: 10_000 })
          .catch(() => undefined);

        consentDismissed.add(this.page);
        return;
      }
    }
  }

  /** Types a query into the search field, opening the mobile search first when required. */
  async fillSearchQuery(query: string): Promise<void> {
    await this.openSearchIfCollapsed();

    const input = this.searchInput;
    await input.waitFor({ state: 'visible' });
    await input.fill(query);
  }

  /**
   * Submits the current query using the magnifier button.
   *
   * Consent is re-checked immediately before the click: the platform can finish loading after
   * the page was opened, and its overlay then swallows the click instead of the button.
   */
  async submitSearchWithButton(): Promise<void> {
    await this.acceptCookiesIfPresent();
    await this.searchButton.click();
  }

  /** Submits the current query using the Enter key. */
  async submitSearchWithKeyboard(): Promise<void> {
    await this.acceptCookiesIfPresent();
    await this.searchInput.press('Enter');
  }

  /**
   * Waits for the autocomplete to finish reacting to what was typed.
   *
   * Suggestions are fetched asynchronously and the combobox re-renders when they arrive. Editing
   * the query while that update is still in flight is a race: the re-render can land after the
   * edit and restore the previous value, which made the keyboard test flaky under parallel runs.
   *
   * Note that the listbox is deliberately *not* closed with Escape — on an `input[type=search]`
   * Escape is handled natively by the browser and clears the field entirely.
   */
  async waitForSuggestionsToSettle(): Promise<void> {
    await expect(this.searchInput)
      .toHaveAttribute('aria-expanded', 'true', { timeout: 5_000 })
      .catch(() => undefined);
  }

  async getSearchInputValue(): Promise<string> {
    return this.searchInput.inputValue();
  }
}
