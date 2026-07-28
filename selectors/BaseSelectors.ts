/**
 * Locator building blocks shared by every page: the header search control (rendered on every
 * Catawiki page) and both cookie-consent implementations the site serves.
 *
 * This file owns only the raw selector values (test ids, CSS, accessible-name patterns).
 * Turning them into Playwright `Locator` objects — including chaining, filtering and
 * `visible=true` disambiguation — is the page objects' responsibility, not this file's.
 */
export const BaseSelectors = {
  searchFieldTestId: 'search-field',
  searchButtonAccessibleName: 'Search',

  /**
   * On mobile viewports Catawiki does not render the search input at all until this toggle is
   * tapped. The button carries no accessible name, so it is located structurally: it is the
   * button sitting directly alongside the favourites link in the header.
   */
  searchToggleCss: 'header div:has(> a[href*="/veiling/favorites"]) > button',

  /** Stays in the DOM permanently, even after consent — visibility must be checked, not presence. */
  consentInlineModalCss: '#modal-cookies',
  consentInlineAcceptNamePattern: /accept|agree|ok\b/i,

  /** The Usercentrics platform. Its dialog exposes no accessible name. */
  consentPlatformRootCss: '#usercentrics-cmp-ui',
  consentDeclineText: 'Continue without accepting',
  consentAcceptAllNamePattern: /accept all/i,
} as const;
