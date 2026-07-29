# Catawiki — Playwright + TypeScript QA Assignment

End-to-end test automation for the Catawiki search and lot-details flow, built with Playwright
and TypeScript using the Page Object Model.

**27 automated tests across 4 layers · 13 spec files · type-checked, linted and formatted.**

---

## 1. Project overview

This repository automates the mandatory Catawiki scenario — search for `train`, open the second
valid lot, read its title, favourites counter and current bid — and extends it with a diverse
suite covering keyboard interaction, negative and edge-case searches, navigation state, data
contracts, cross-page consistency, network behaviour, accessibility and a mobile viewport.

The suite deliberately spans **four implementation layers** rather than driving the same search
box in twenty different ways:

| Layer         | What it exercises                        | Tests |
| ------------- | ---------------------------------------- | ----- |
| Unit          | Currency and counter parsing, no browser | 9     |
| API / Network | HTTP contract, console and server health | 2     |
| UI — desktop  | The full user-facing flow                | 15    |
| UI — mobile   | The mandatory flow on an emulated device | 1     |

Beyond the test suite itself, a handful of UX and accessibility observations surfaced
incidentally while building resilient locators and exploring edge cases — these are recorded
separately in [`docs/PRODUCT_OBSERVATIONS.md`](docs/PRODUCT_OBSERVATIONS.md) rather than mixed
into the test specification.

## 2. Assignment objective

1. Open the English Catawiki homepage.
2. Type `train` into the search field.
3. Submit using the magnifier button.
4. Verify the search results page is displayed.
5. Identify at least two valid lot cards and open **the second** one.
6. Retrieve the lot title, favourites counter and current bid.
7. Print the retrieved values to the console in a structured format.
8. Add diverse additional test cases that are not similar in implementation.

Example console output produced by TC-CAT-01:

```json
{
  "title": "Jouef H0 - Train unit (1) - Early TGV La Poste - SNCF",
  "favorites": 79,
  "currentBid": { "raw": "€ 320", "amount": 320, "currency": "€" }
}
```

Values are read live and will differ on every run.

## 3. Technology stack

| Tool                       | Version    | Purpose                                    |
| -------------------------- | ---------- | ------------------------------------------ |
| Node.js                    | 22+        | Runtime (developed on 24.18.0)             |
| TypeScript                 | 6.0        | Strict typing                              |
| Playwright Test            | 1.62       | Test runner, browser automation, reporting |
| ESLint + typescript-eslint | 10.8 / 8.x | Type-aware linting                         |
| eslint-plugin-playwright   | 2.x        | Playwright-specific rules                  |
| Prettier                   | 3.9        | Formatting                                 |
| GitHub Actions             | —          | CI                                         |

## 4. Prerequisites

- **Node.js 22 or newer** and npm — verify with `node --version` and `npm --version`
- **Git** — verify with `git --version`
- A code editor; the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
  extension is recommended for inline run/debug and the locator picker

## 5. Installation

```bash
git clone <repository-url>
cd catawiki-playwright-qa-assignment
npm ci
```

## 6. How to install Playwright browsers

Only Chromium is required: the desktop project and the mobile device profile both run on it.

```bash
npx playwright install chromium
```

In CI, install the OS dependencies too:

```bash
npx playwright install --with-deps chromium
```

## 7. How to run all tests

```bash
npm test
```

## 8. How to run one test file

```bash
npx playwright test search-e2e.spec.ts
```

## 9. How to run one test by title

```bash
npx playwright test -g "open the second valid lot"
```

## 10. How to run desktop tests

```bash
npm run test:desktop
```

Unit tests alone (no browser, ~2 seconds):

```bash
npm run test:unit
```

## 11. How to run mobile tests

```bash
npm run test:mobile
```

The two Critical-priority tests (the assignment's mandatory scenario and its identity check)
are tagged `@critical` for a fast "did I break the core flow" run:

```bash
npm run test:critical
```

## 12. How to run headed mode

```bash
npm run test:headed
```

Tests already run **headed by default locally** — see [Live-site limitations](#19-live-site-limitations).
For faster local feedback, disable video recording:

```bash
PW_VIDEO=off npm test
```

## 13. How to use Playwright UI mode

```bash
npm run test:ui
```

Gives a watch-mode runner with time-travel debugging, a DOM snapshot per step and a locator picker.

## 14. How to debug tests

```bash
npm run test:debug                                  # step through with Playwright Inspector
npx playwright test search-e2e.spec.ts --debug      # debug a single file
PWDEBUG=1 npx playwright test -g "second valid lot" # debug a single test
```

In VS Code, the Playwright extension adds run/debug icons in the editor gutter.

Trace is configured as `on-first-retry` (per the assignment's requirement), which means no
trace is captured locally unless a test actually retries — and locally `retries: 0` by design,
so nothing retries. To force a trace for a specific local debugging session:

```bash
npx playwright test search-e2e.spec.ts --trace on
```

## 15. How to open the HTML report

```bash
npm run test:report
```

The report includes per-step timings, the structured lot-details attachment, and the
`observed-behaviour` annotations recorded by the negative and navigation tests.

## 16. Project structure

```
catawiki-playwright-qa-assignment/
├── .github/workflows/playwright.yml   # CI pipeline
├── docs/
│   ├── TEST_CASES.md                  # Full specification of all 27 tests
│   └── PRODUCT_OBSERVATIONS.md        # UX/a11y findings on catawiki.com found while testing
├── pages/                             # Interactions and behaviour — no raw locator strings
│   ├── BasePage.ts                    # Search controls, consent handling
│   ├── HomePage.ts
│   ├── SearchResultsPage.ts           # Card filtering, visual ordering, result states
│   └── LotDetailsPage.ts              # Title, favourites, current bid
├── selectors/                         # Raw locator values only — one file per page that owns any
│   ├── BaseSelectors.ts               # (HomePage has none beyond the shared header controls)
│   ├── SearchResultsSelectors.ts
│   └── LotDetailsSelectors.ts
├── shared/                            # Reusable code that belongs to no single page
│   ├── helpers/
│   │   ├── environment.ts             # CI / local video-toggle detection
│   │   ├── locatorHelpers.ts          # Visual-reading-order sorting
│   │   └── platform.ts                # OS-specific keyboard shortcuts
│   ├── interfaces/
│   │   └── lotDetails.ts              # CurrentBid, LotDetails, LotCardSummary
│   └── parsers/
│       ├── numberParser.ts            # Locale-ambiguous number parsing, ParseError
│       ├── favoritesParser.ts
│       └── currencyParser.ts
├── tests/
│   ├── fixtures/
│   │   ├── index.ts                   # Page objects exposed as fixtures
│   │   └── searchFlows.ts             # performSearch and shared assertions across specs
│   ├── test.data/
│   │   └── catawikiTestData.ts
│   ├── search/
│   │   ├── search-e2e.spec.ts             # TC-CAT-01
│   │   ├── search-keyboard.spec.ts        # TC-CAT-06
│   │   ├── search-normalization.spec.ts   # TC-CAT-07, 08, 09
│   │   └── search-negative.spec.ts        # TC-CAT-10, 11, 12, 13
│   ├── navigation/
│   │   ├── lot-navigation.spec.ts         # TC-CAT-02, TC-CAT-05
│   │   └── search-state.spec.ts           # TC-CAT-14
│   ├── responsive/
│   │   └── mobile-search.spec.ts          # TC-CAT-16
│   ├── data-validation/
│   │   └── lot-data-contract.spec.ts      # TC-CAT-03, TC-CAT-04
│   ├── accessibility/
│   │   └── search-accessibility.spec.ts   # TC-CAT-15
│   ├── api/
│   │   └── search-api.spec.ts             # TC-CAT-17, TC-CAT-18
│   └── unit/
│       ├── favoritesParser.spec.ts        # TC-CAT-19, 20
│       ├── currencyParser.spec.ts         # TC-CAT-21–24, 27
│       └── numberParser.spec.ts           # TC-CAT-25, 26
├── eslint.config.mjs
├── playwright.config.ts
├── tsconfig.json
├── AI_USAGE.md
└── README.md
```

`docs/TEST_CASES.md` is the single source of truth: every test title in the code appears there
verbatim, with steps, expected results and traceability back to the assignment. Tests are
grouped into feature folders (`search/`, `navigation/`, `responsive/`, …) rather than kept flat,
so the folder a test lives in and the group it belongs to in `docs/TEST_CASES.md` are the same
thing.

## 17. Test coverage

IDs are sequential (TC-CAT-01 → TC-CAT-27), grouped by feature rather than by technical layer
or build order. Full step-by-step detail lives in [`docs/TEST_CASES.md`](docs/TEST_CASES.md).

| ID           | Title                                                            | Group                       |
| ------------ | ---------------------------------------------------------------- | --------------------------- |
| TC-CAT-01    | Mandatory E2E: search, open second valid lot, retrieve and print | Core Search & Lot Flow      |
| TC-CAT-02    | Second result opens the _corresponding_ lot page                 | Core Search & Lot Flow      |
| TC-CAT-03    | Lot details comply with the expected data contracts              | Core Search & Lot Flow      |
| TC-CAT-04    | Search card data matches the lot details page                    | Core Search & Lot Flow      |
| TC-CAT-05    | Lot page opens by direct URL and survives a reload               | Core Search & Lot Flow      |
| TC-CAT-06    | Keyboard entry, editing, selection replacement and submission    | Keyboard & Query Variations |
| TC-CAT-07–09 | Whitespace, uppercase and mixed-case queries                     | Keyboard & Query Variations |
| TC-CAT-10    | Empty search submission                                          | Negative & Edge Cases       |
| TC-CAT-11    | Whitespace-only search submission                                | Negative & Edge Cases       |
| TC-CAT-12    | Safe special-character query                                     | Negative & Edge Cases       |
| TC-CAT-13    | No-result search and recovery                                    | Negative & Edge Cases       |
| TC-CAT-14    | Back navigation and refresh consistency                          | Navigation State            |
| TC-CAT-15    | Search control reachable and identifiable without a mouse        | Accessibility               |
| TC-CAT-16    | Mandatory flow on a mobile viewport                              | Mobile                      |
| TC-CAT-17    | Search endpoint HTTP contract                                    | API & Health                |
| TC-CAT-18    | No uncaught JS errors, no 5xx during the mandatory flow          | API & Health                |
| TC-CAT-19–27 | Parser contracts: favorites, currency formats and normalization  | Unit — Data Parsing         |

## 18. Assumptions

- Anonymous browsing is sufficient; no test authenticates.
- English locale (`/en/`) with a `Europe/Amsterdam` timezone.
- At least two valid lots exist for `train` at any time. If fewer are found, tests fail with the
  observed count rather than silently selecting a different lot.
- Lot cards use unhashed BEM class names (`.c-lot-card__title`, `.c-lot-card__price`), while lot
  detail components use hashed CSS-module names and are matched by substring.
- Bids may legitimately rise between reading a search card and opening the lot; TC-CAT-04
  tolerates an increase but never a decrease or a currency change.

## 19. Live-site limitations

**Bot protection requires headed execution.** Catawiki is fronted by Akamai. Headless browsers
receive `HTTP 403 Access Denied` before any application markup is served — confirmed for both
bundled Chromium and real Chrome in headless mode, while a plain HTTP request from the same
machine returns `200`. The block therefore targets the headless browser signature, not the
network.

The configuration handles this by running **headed locally and headless in CI**:

```ts
headless: isCI,
```

No fingerprint spoofing, stealth plugin or bot-detection bypass is used anywhere in this
repository. That is a deliberate boundary: defeating a site's protections would be
inappropriate for a QA assignment. The consequence is documented in [CI execution](#25-ci-execution).

**Other live-site constraints:**

- Lot data changes continuously; lots also close and disappear, so no lot URL is ever hardcoded.
- The mobile lot page loads ~76 product images, which is the main reason the mobile test takes
  noticeably longer than the desktop tests and why the browser takes a moment to close.
- Result ordering, counts and relevance are controlled by Catawiki and are never asserted.

## 20. Dynamic-data strategy

No test asserts a fixed business value. Instead the suite asserts **structure, contracts and
relationships**:

- values exist, are non-empty and are not placeholders (`Loading`, `N/A`, …)
- values parse into the expected types, with ranges enforced (`favorites >= 0`)
- relationships hold — the opened lot is the selected lot; the card price matches the lot page
- parsing failures raise a descriptive `ParseError` containing the raw value; nothing silently
  degrades to `0` or `NaN`

The parsing rules themselves are pinned by browser-free unit tests, so a parser regression
surfaces in two seconds rather than as a confusing UI failure.

## 21. Locator strategy

### Selectors are separated from Pages

Every page object has a matching file in `selectors/` (`SearchResultsPage.ts` ↔
`SearchResultsSelectors.ts`, and so on). The split is a strict one:

- **`selectors/*.ts` owns raw locator values only** — test-id strings, CSS strings, accessible-
  name patterns — as a single `as const` object per page. No Playwright API call appears in
  these files, so they have no dependency on `Page` or `Locator` at all.
- **`pages/*.ts` owns building `Locator` objects from those values and every interaction
  method.** Chaining, `.filter()`, `.or()`, `visible=true` disambiguation, waiting and clicking
  all live here, because that behaviour belongs to how the page is used, not to what a selector
  is.

This means every locator value used anywhere in the suite is findable in exactly one small,
predictable file per page, and a selector can change (Catawiki ships a new class name) without
touching any interaction logic.

| Element              | Selector (in `selectors/`)                                    | Why this shape                                                                                 |
| -------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Search input         | `BaseSelectors.searchFieldTestId`                             | Three inputs exist in the DOM (desktop, mobile, overlay) — the page filters to the visible one |
| Search button        | `BaseSelectors.searchButtonAccessibleName`                    | Semantic — matched by role and accessible name                                                 |
| Lot card             | `SearchResultsSelectors.lotCardContainerCss`                  | Carries the lot id in its `data-testid`                                                        |
| Card title / price   | `SearchResultsSelectors.cardTitleCss` / `cardPriceCss`        | Unhashed BEM class names, stable across rebuilds                                               |
| Favourites counter   | `LotDetailsSelectors.favoritesChipGalleryCss` / `...TitleCss` | See finding 1 below                                                                            |
| Current bid          | `LotDetailsSelectors.bidAmountCss`                            | Desktop and mobile render it in different containers                                           |
| Mobile search toggle | `BaseSelectors.searchToggleCss`                               | The button exposes **no** accessible name — see finding 3                                      |

Preference order when choosing a selector value: **role and accessible name → test ids →
stable structural CSS → hashed CSS**.

Three findings drove the harder choices, all established by inspecting the live DOM rather
than guessing:

1. **The favourites chip is not unique.** The same component renders on every recommendation
   card further down the lot page. An unscoped `.first()` silently reads another lot's counter —
   a green test asserting the wrong number. `LotDetailsSelectors` therefore exposes two scoped
   variants (gallery / title container) rather than one generic chip selector.
2. **Hashed CSS-module names change per build** (`LotTitle_container__N76Ob`), so they are
   matched by substring. This is the only place CSS is preferred over a semantic locator,
   because no role or test id exists for these elements.
3. **The mobile search toggle has no accessible name**, so it is located structurally, by its
   relationship to the favourites link. This is a genuine accessibility defect in the product
   and is also covered by TC-CAT-15.

### Visual order, not DOM order

`nth()` is never called on an unfiltered collection. Valid cards are filtered first, then sorted
into **visual reading order** using their on-screen boxes (top to bottom, then left to right),
because DOM order and rendered order are not guaranteed to match. This sorting is generic
enough that it does not belong to any one page, so it lives in
`shared/helpers/locatorHelpers.ts#resolveVisualOrderIndex` and `SearchResultsPage` calls it
rather than owning the sorting logic itself. `openLot()` reads the target lot id _before_
clicking and waits for navigation to that exact id, so a mis-targeted click fails immediately
instead of corrupting later assertions.

### The `shared/` layer

Code that is genuinely independent of any single page lives in `shared/`, not duplicated across
page objects:

- **`shared/parsers/`** — `numberParser.ts` holds the locale-ambiguous number parsing and the
  `ParseError` type both other parsers build on; `favoritesParser.ts` and `currencyParser.ts`
  each own one narrow contract. Splitting the original single parsing file into three mirrors
  the same single-responsibility principle as the selector/page split.
- **`shared/interfaces/lotDetails.ts`** — the `CurrentBid`, `LotDetails` and `LotCardSummary`
  contracts, imported by both the parsers and the page objects that return them.
- **`shared/helpers/`** — `platform.ts` resolves the OS-specific select-all shortcut,
  `environment.ts` reads the two optional environment toggles (`CI`, `PW_VIDEO`), and
  `locatorHelpers.ts` holds the visual-order sorting described above.

## 22. Cookie-banner strategy

Catawiki serves two consent implementations, and both are handled conditionally:

- an inline `#modal-cookies` element that **stays in the DOM permanently**, even after consent —
  so presence is not a valid signal and visibility is checked explicitly;
- the Usercentrics platform (`#usercentrics-cmp-ui`), whose dialog exposes **no accessible name**
  and whose least intrusive option is rendered as plain text rather than a button. Both controls
  are therefore matched by visible text.

The **least intrusive option is preferred**: `Continue without accepting` is chosen over
`Accept All`, so the run does not opt into non-essential tracking.

Two subtleties were found the hard way and are worth noting:

- The consent script loads asynchronously and, under parallel execution, can appear _after_ an
  initial check. A page is therefore recorded as handled **only after an actual dismissal**, and
  consent is re-checked immediately before submitting a search.
- The consent root keeps intercepting pointer events until it is torn down, so the code waits
  for the root to disappear — not merely for the button to vanish.

When no banner is shown the handler is a no-op. Only the visibility check is suppressed, so an
unrelated broken page can never hide behind cookie handling.

## 23. Search-state and refresh behaviour observed in TC-CAT-14

The assignment does not mandate a refresh behaviour, so none was invented. The behaviour was
**measured** and recorded as a test annotation:

| Moment       | URL                                     | Search input | Results |
| ------------ | --------------------------------------- | ------------ | ------- |
| After Back   | `https://www.catawiki.com/en/s?q=train` | `"train"`    | 24 lots |
| After Reload | `https://www.catawiki.com/en/s?q=train` | `"train"`    | 24 lots |

**Observed:** Catawiki uses a **URL-based search state**. The query lives in the `q` parameter,
and both browser Back and a full page reload restore the complete search context — the URL, the
value in the search field and the rendered results all stay in agreement.

The test asserts this in three tiers so it stays meaningful without over-specifying the product:

1. **Invariants — always strict.** Back returns to the results (not the lot), the page is
   populated rather than an empty shell, the search control remains usable, and the user can
   search again with no recovery steps.
2. **Product behaviour — observed, never mandated.** The test does not require the query to
   survive. The observed values are attached to the report and printed to the console.
3. **Consistency — asserted conditionally.** If the URL carries a query, the rendered results
   must belong to that query; if the input holds a value, it must match the URL. A team that
   never implemented state restoration passes (consistently stateless); a half-implemented one
   showing `q=train` while rendering something else, or leaving a stale term in the input, fails.

## 24. Production safety and out-of-scope actions

This suite runs against a **live production marketplace** and is strictly read-only. It never:

- places a bid or touches `Place bid` / `Set max bid`
- adds or removes favourites — the counter is **read**, never clicked
- logs in, registers, or submits personal data
- completes a payment
- performs any destructive or state-changing action
- uses security or penetration-testing payloads

The generated no-results query (`zzq<random>xnotalot`) is deliberately benign: no script tags,
no injection patterns, no oversized input.

## 25. CI execution

`.github/workflows/playwright.yml` runs on pushes and pull requests to `main`, with
`permissions: contents: read`, explicit timeouts and **no secrets** — none are needed.

The pipeline is split into two jobs on purpose:

| Job               | Scope                                                | Gates the build?         |
| ----------------- | ---------------------------------------------------- | ------------------------ |
| `quality-gates`   | `typecheck`, `lint`, `format:check`, **unit tests**  | **Yes**                  |
| `live-site-tests` | The 18 browser tests, report uploaded as an artifact | No (`continue-on-error`) |

**Why the live tests do not gate the build:** as described in
[Live-site limitations](#19-live-site-limitations), Akamai answers headless browsers from
data-centre IP ranges with `403`. Hosted GitHub runners are exactly that. Rather than leaving CI
permanently red or hiding the problem, the deterministic checks gate the build while the
live-site job always publishes its report and writes an explanatory note to the job summary.

Running the browser suite reliably in CI would need a self-hosted runner on a residential
network, or an agreement with Catawiki to allow the runner's traffic.

## 26. Known risks and possible future improvements

**Risks**

- **Hashed CSS-module class names** on the lot page will change if Catawiki rebuilds its
  front end. Substring matching reduces but does not eliminate this exposure.
- **Bot protection** may tighten further and start blocking headed automation too.
- **Live-data dependency**: the suite assumes at least two `train` lots exist. This is a safe
  assumption for a marketplace with 75,000 weekly lots, but it is an external dependency.
- **Mobile runtime** is dominated by the site's own image payload, not by the test code.

**Improvements**

- Sorting, filtering and pagination on the results page — deliberately out of scope to keep the
  suite lightweight, but the most valuable next area of coverage.
- Full accessibility auditing with `@axe-core/playwright`; TC-CAT-15 covers only the search
  control.
- Visual regression, once a stable environment without live auction imagery is available.
- A self-hosted CI runner so the browser suite can gate the build.
- Contract tests against Catawiki's internal search API, if documentation or access were
  provided.
