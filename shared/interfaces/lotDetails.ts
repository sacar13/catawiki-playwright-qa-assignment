/** Currency amount exactly as rendered by the UI, plus its parsed representation. */
export interface CurrentBid {
  /** Untouched string captured from the page, useful for debugging live-data failures. */
  raw: string;
  amount: number;
  /** Currency symbol or ISO code as displayed, e.g. "€" or "EUR". */
  currency: string;
}

/** The three values the assignment requires us to retrieve from a lot details page. */
export interface LotDetails {
  title: string;
  favorites: number;
  currentBid: CurrentBid;
}

/** Identifying information captured from a search result card before navigating to it. */
export interface LotCardSummary {
  /** Numeric lot id extracted from the card's data-testid, e.g. "105497706". */
  lotId: string;
  title: string;
  href: string;
  /** Current bid exactly as rendered on the card, e.g. "€112". Empty when the card shows none. */
  bidRaw: string;
}
