/** Locator building blocks for the search results page. */
export const SearchResultsSelectors = {
  /** Every lot card, valid or not: `[data-testid^="lot-card-container-<lotId>"]`. */
  lotCardContainerCss: '[data-testid^="lot-card-container-"]',
  lotCardTestIdPrefix: 'lot-card-container-',

  lotLinkCss: 'a[href*="/l/"]',

  /** Unhashed BEM class names — stable across Catawiki front-end rebuilds. */
  cardTitleCss: '.c-lot-card__title',
  cardPriceCss: '.c-lot-card__price',

  /** True empty state, e.g. `No matches for " "`. No lot cards are rendered alongside it. */
  noMatchesTextPattern: /no matches for/i,

  /** "Nothing matched exactly" fallback that still renders related lot cards. */
  noExactResultsTextPattern: /no exact results/i,
} as const;
