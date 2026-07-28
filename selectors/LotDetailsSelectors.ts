/** Locator building blocks for the lot details page. */
export const LotDetailsSelectors = {
  /**
   * The lot's own favourites chip. The identical component also renders on every
   * recommendation card further down the page, so an unscoped match silently reads another
   * lot's counter — both containers below are scoped to the primary lot only.
   *
   * Desktop and mobile place the chip in different wrappers: mobile keeps it in the gallery
   * actions bar, desktop nests that bar inside the title block.
   */
  favoritesChipGalleryCss: '[class*="GalleryActions"] [class*="FavoriteChip_wrapper"]',
  favoritesChipTitleCss: '[class*="LotTitle_container"] [class*="FavoriteChip_wrapper"]',

  bidStatusSectionTestId: 'lot-bid-status-section',

  /**
   * Desktop renders the bid inside `bidStatusSectionTestId`; mobile renders it in a sticky
   * bottom bar outside that section. The amount element carries this class in both layouts,
   * so it is matched page-wide — lot cards use a different class for their price.
   */
  bidAmountCss: '[class*="bid-amount"]',
} as const;
