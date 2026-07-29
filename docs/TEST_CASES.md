# Test Cases — Catawiki Playwright QA Assignment

This document is the single source of truth for the automated test suite. Every **Title**
below is used verbatim as the Playwright `test()` name, so a test result can always be traced
back to its specification without reading the code.

Test cases are numbered **TC-CAT-01 through TC-CAT-27**, sequentially, grouped by feature —
not by technical layer or build order. The number alone tells you where to find a case.

- **Total test blocks:** 27
- **Spec files:** 13
- **Target site:** https://www.catawiki.com/en/ (live production — read-only automation)

## Contents

- [1. Production safety statement](#1-production-safety-statement)
- [2. Common preconditions](#2-common-preconditions)
- [3. Definition — "valid lot card"](#3-definition--valid-lot-card)
- [4. Dynamic-data strategy](#4-dynamic-data-strategy)
- [5. Test case index](#5-test-case-index) — jump table to every test case
- [Core Search & Lot Flow — TC-CAT-01 – 05](#core-search--lot-flow)
- [Keyboard & Query Variations — TC-CAT-06 – 09](#keyboard--query-variations)
- [Negative & Edge Cases — TC-CAT-10 – 13](#negative--edge-cases)
- [Navigation State — TC-CAT-14](#navigation-state)
- [Accessibility — TC-CAT-15](#accessibility)
- [Mobile — TC-CAT-16](#mobile)
- [API & Health — TC-CAT-17 – 18](#api--health)
- [Unit — Data Parsing — TC-CAT-19 – 27](#unit--data-parsing)
- [6. Traceability](#6-traceability)
- [7. Out of scope](#7-out-of-scope)

---

## 1. Production safety statement

This suite runs against a live production marketplace. Every test is strictly **read-only**.
The automation never:

- places a bid or interacts with `Place bid` / `Set max bid` controls
- adds or removes favourites (the favourites chip is **read** only, never clicked)
- logs in, registers, or submits personal data
- completes payments
- performs any destructive or state-changing action
- uses security or penetration-testing payloads

Only navigation, search input, and reading of displayed values are performed.

**[⬆ Back to Contents](#contents)**

---

## 2. Common preconditions

The following apply to every UI test unless a test states otherwise. They are listed once here
rather than repeated per test; this is normalisation, not a reduction in scope.

- The user can access https://www.catawiki.com/en/.
- The Catawiki English homepage is available and the website is responsive.
- Search functionality is operational.
- JavaScript is enabled.
- The user is **not** required to be authenticated.
- The cookie consent dialog is handled conditionally: accepted if visible, ignored if not.
- No application error is displayed on initial load.

Tests that require live data state their own additional preconditions (for example "at least
two valid lot cards are available for `train`").

**[⬆ Back to Contents](#contents)**

---

## 3. Definition — "valid lot card"

Several tests depend on selecting the _second valid lot_. A lot card is considered valid only
when it is:

- visible in the viewport tree (not hidden or collapsed)
- linked to a lot-details destination (`a[href*="/l/"]`)
- not a placeholder, skeleton, or loading shell
- not an advertisement or unrelated promotional card
- not a hidden duplicate

The suite builds a **filtered collection** first and only then indexes into it. Indexing into
raw DOM matches (`nth(1)` on unfiltered results) is explicitly forbidden. If fewer than two
valid cards exist, the test fails with a message containing the observed count — it never
silently selects a different index or skips the requirement.

**[⬆ Back to Contents](#contents)**

---

## 4. Dynamic-data strategy

Catawiki is a live auction site: titles, favourites counters, bid values, currencies and result
ordering all change continuously. Therefore no test asserts a fixed business value. Tests
assert **structure and contracts**:

- values exist and are non-empty
- values parse into the expected types
- parsed values satisfy range rules (for example `favorites >= 0`)
- relationships hold (for example the opened lot matches the selected card)

**[⬆ Back to Contents](#contents)**

---

## 5. Test case index

| ID               | Group                       | Priority     | Spec file                                          | Project            |
| ---------------- | --------------------------- | ------------ | -------------------------------------------------- | ------------------ |
| TC-CAT-01        | Core Search & Lot Flow      | **Critical** | `tests/search/search-e2e.spec.ts`                  | `desktop-chromium` |
| TC-CAT-02        | Core Search & Lot Flow      | **Critical** | `tests/navigation/lot-navigation.spec.ts`          | `desktop-chromium` |
| TC-CAT-03        | Core Search & Lot Flow      | High         | `tests/data-validation/lot-data-contract.spec.ts`  | `desktop-chromium` |
| TC-CAT-04        | Core Search & Lot Flow      | High         | `tests/data-validation/lot-data-contract.spec.ts`  | `desktop-chromium` |
| TC-CAT-05        | Core Search & Lot Flow      | Low          | `tests/navigation/lot-navigation.spec.ts`          | `desktop-chromium` |
| TC-CAT-06        | Keyboard & Query Variations | Medium       | `tests/search/search-keyboard.spec.ts`             | `desktop-chromium` |
| TC-CAT-07        | Keyboard & Query Variations | Medium       | `tests/search/search-normalization.spec.ts`        | `desktop-chromium` |
| TC-CAT-08        | Keyboard & Query Variations | Medium       | `tests/search/search-normalization.spec.ts`        | `desktop-chromium` |
| TC-CAT-09        | Keyboard & Query Variations | Medium       | `tests/search/search-normalization.spec.ts`        | `desktop-chromium` |
| TC-CAT-10        | Negative & Edge Cases       | Medium       | `tests/search/search-negative.spec.ts`             | `desktop-chromium` |
| TC-CAT-11        | Negative & Edge Cases       | Medium       | `tests/search/search-negative.spec.ts`             | `desktop-chromium` |
| TC-CAT-12        | Negative & Edge Cases       | Medium       | `tests/search/search-negative.spec.ts`             | `desktop-chromium` |
| TC-CAT-13        | Negative & Edge Cases       | Medium       | `tests/search/search-negative.spec.ts`             | `desktop-chromium` |
| TC-CAT-14        | Navigation State            | Medium       | `tests/navigation/search-state.spec.ts`            | `desktop-chromium` |
| TC-CAT-15        | Accessibility               | Low          | `tests/accessibility/search-accessibility.spec.ts` | `desktop-chromium` |
| TC-CAT-16        | Mobile                      | High         | `tests/responsive/mobile-search.spec.ts`           | `mobile-chrome`    |
| TC-CAT-17        | API & Health                | Medium       | `tests/api/search-api.spec.ts`                     | `desktop-chromium` |
| TC-CAT-18        | API & Health                | Medium       | `tests/api/search-api.spec.ts`                     | `desktop-chromium` |
| TC-CAT-19, 20    | Unit — Data Parsing         | High         | `tests/unit/favoritesParser.spec.ts`               | `unit`             |
| TC-CAT-21–24, 27 | Unit — Data Parsing         | High         | `tests/unit/currencyParser.spec.ts`                | `unit`             |
| TC-CAT-25, 26    | Unit — Data Parsing         | High         | `tests/unit/numberParser.spec.ts`                  | `unit`             |

**[⬆ Back to Contents](#contents)**

---

# Core Search & Lot Flow

**TC-CAT-01 – TC-CAT-05.** The assignment's mandatory scenario and everything that verifies it
was done correctly: identity, data contracts, cross-page consistency, and deep-linking.
Project: `desktop-chromium`.

### TC-CAT-01

**Title:** `[TC-CAT-01][Functional][Positive][E2E] Verify user can search for "train", open the second valid lot and retrieve lot details`
**Priority:** Critical — this is the assignment's mandatory scenario. Tagged `@critical`
(`npm run test:critical`).
**Additional preconditions:** at least two valid search results are available for `train`.
**Test data:** search keyword `train`

**Description:** Verify that a user can search for `train`, navigate to the search results,
open the second valid lot, retrieve the lot title, favorites counter and current bid, and
print the retrieved information to the console in a structured format.

**Steps:**

1. Open the Catawiki English homepage.
   - **Expected:** homepage loads successfully; search input is visible and enabled.
2. Verify the search input and search button are available.
   - **Expected:** both controls are visible and ready for interaction.
3. Enter `train` into the search field.
   - **Expected:** the entered text is displayed correctly; no unexpected validation message.
4. Click the search (magnifier) button.
   - **Expected:** search executes; the results page is displayed; results related to `train`
     are listed.
5. Verify the search results page is displayed.
   - **Expected:** URL matches the search results pattern; the results heading reflects the
     query.
6. Verify at least two valid lot cards exist.
   - **Expected:** the filtered valid-card collection contains at least two entries; each
     represents a real auction lot.
7. Capture identifying information from the second valid lot card.
   - **Expected:** lot id, title and href are captured; values are non-empty and not
     placeholders.
8. Open the second valid lot.
   - **Expected:** the user is navigated to the corresponding lot details page; the page loads
     successfully.
9. Verify the lot details page is displayed.
   - **Expected:** the lot title is visible; the page is not blank and shows no application
     error.
10. Retrieve the lot title, favorites counter and current bid.
    - **Expected:** all three values are retrieved successfully.
11. Print the retrieved values to the console in a structured format.
    - **Expected:** console output contains all retrieved values, is clearly structured and
      readable; no runtime error occurs.

**Console output format:**

```json
{
  "title": "Kato N - 10-1716 - Train unit - Four-part train set ET 425 - DB Regio",
  "favorites": 39,
  "currentBid": {
    "raw": "€ 53",
    "amount": 53,
    "currency": "€"
  }
}
```

The values above are an illustration only and are **never** used as fixed test data.

---

### TC-CAT-02

**Title:** `[TC-CAT-02][Functional][Navigation] Verify the second valid search result opens the corresponding lot details page`
**Priority:** Critical. Tagged `@critical` (`npm run test:critical`).
**Additional preconditions:** at least two valid, visible and actionable lot cards are
available for `train`.
**Test data:** search query `train`; target result — second valid lot

**Description:** Verify that after searching for `train`, the second valid, visible and
actionable lot card can be identified, its identifying information captured, opened, and that
the displayed lot-details page **corresponds to the selected result**. It is not sufficient to
verify that _some_ lot page opened.

**Steps:**

1. Open the homepage.
   - **Expected:** homepage loads; search controls are visible and enabled.
2. Enter `train` into the search field.
   - **Expected:** the field value is exactly `train`; no validation message appears.
3. Submit the search.
   - **Expected:** search executes; results page is displayed; no broken or blank page.
4. Collect lot cards and filter to valid results.
   - **Expected:** a filtered collection is created; invalid, hidden, promotional and
     non-actionable elements are excluded; the second raw DOM match is not used.
5. Verify at least two valid lot cards are available.
   - **Expected:** valid count is `>= 2`; if fewer, the test fails with a message containing
     the observed count.
6. Capture identifying information from the second valid card.
   - **Expected:** lot id, normalized title and href captured; values are non-empty and not
     placeholders; nothing is hardcoded.
7. Open the second valid lot.
   - **Expected:** the intended card is activated; navigation begins; no other card or
     unrelated link is activated.
8. Verify the lot-details page loads.
   - **Expected:** a valid lot-details page is displayed; primary lot content is visible; the
     page is not blank; not an unrelated search or category page.
9. Compare the opened lot with the captured information.
   - **Expected:** the lot id in the URL matches the captured lot id **and** the page title
     matches the captured card title; passing solely because the URL changed, or because any
     heading is visible, is not accepted.
10. Verify navigation integrity.
    - **Expected:** the user remains on the selected lot page; no unexpected redirect; no
      different lot displayed; no runtime or navigation error.

---

### TC-CAT-03

**Title:** `[TC-CAT-03][Functional][Data Validation] Verify retrieved lot details comply with expected data contracts`
**Priority:** High
**Additional preconditions:** at least two valid search results exist for `train`; the second
valid lot can be opened successfully.
**Test data:** search query `train`; target result — second valid lot

**Description:** Verify that the retrieved lot title, favorites counter and current bid comply
with the expected data contracts. Validation relies on reusable parser functions and strong
TypeScript typing rather than hardcoded values.

**Steps:**

1. Navigate to the lot-details page by completing the mandatory search flow.
   - **Expected:** the second valid lot-details page is displayed; required information is
     available.
2. Retrieve the displayed lot title.
   - **Expected:** title captured successfully; raw value preserved; no placeholder returned.
3. Validate the lot title.
   - **Expected:** type is `string`; value is not empty; value equals its trimmed version;
     value is not a placeholder such as `Loading`, `Undefined`, `Null` or `N/A`.
4. Retrieve the displayed favorites counter.
   - **Expected:** raw UI value captured as a string; original formatting preserved; value
     available for parsing.
5. Validate the favorites counter.
   - **Expected:** raw value normalizes successfully; parses to an integer; parsed value is
     `>= 0`; no parsing error occurs; invalid data is **not** silently converted to zero.
6. Retrieve the displayed current bid.
   - **Expected:** raw bid value captured as a string; currency information available when
     displayed; original formatting preserved.
7. Validate the current bid.
   - **Expected:** numeric amount extracted; currency identified; parsed amount is finite and
     `>= 0`; decimal values supported (integer **not** required); parsing failures produce
     descriptive errors containing the original raw value.
8. Validate the overall data contract.
   - **Expected:** retrieved data conforms to the `LotDetails` and `CurrentBid` TypeScript
     interfaces; no invalid value silently accepted; no unexpected parsing exception.

---

### TC-CAT-04

**Title:** `[TC-CAT-04][Functional][Data Consistency] Verify lot data shown on the search card matches the lot details page`
**Priority:** High
**Additional preconditions:** at least two valid lot cards are available for `train`; the
second valid card displays a current bid.
**Test data:** search query `train`; target result — second valid lot

**Description:** Verify that the information advertised on a search result card is consistent
with the information on the corresponding lot details page. This is a genuine business rule: a
user must not see one price in the results list and a different price after opening the lot.

**Steps:**

1. Search for `train` and build the filtered valid-card collection.
   - **Expected:** at least two valid cards available.
2. Read the second valid card's title and current bid text.
   - **Expected:** both values captured; bid text parses into a typed amount and currency.
3. Open the second valid lot.
   - **Expected:** the corresponding lot details page opens.
4. Read the lot title from the details page.
   - **Expected:** title captured and normalized.
5. Compare titles.
   - **Expected:** the details-page title corresponds to the card title (normalized
     comparison, tolerating card-level truncation).
6. Read the current bid from the details page.
   - **Expected:** bid captured and parsed into amount and currency.
7. Compare currencies.
   - **Expected:** card currency and details-page currency are identical.
8. Compare amounts.
   - **Expected:** amounts are equal, or the details-page amount is higher when a new bid
     arrived between the two reads; a **lower** amount on the details page fails the test.

**Note on live-data tolerance:** bids can legitimately increase in the seconds between reading
the card and opening the lot. The assertion therefore permits an increase but never a decrease
or a currency change — this keeps the test meaningful without making it flaky.

---

### TC-CAT-05

**Title:** `[TC-CAT-05][Functional][Navigation] Verify a lot details page can be opened directly by URL and survives a reload`
**Priority:** Low
**Additional preconditions:** a valid lot URL is obtained during the test from a live search
(never hardcoded, because lots close and are removed).
**Test data:** search query `train`; lot URL captured at runtime

**Description:** Verify that a lot details page renders correctly when reached by direct deep
link rather than through the search flow, and that a reload does not break it.

**Steps:**

1. Obtain a valid lot URL from a live search.
   - **Expected:** a non-empty lot URL matching the lot pattern is captured.
2. Open the captured URL directly in a fresh navigation.
   - **Expected:** the lot details page loads without going through search.
3. Verify the primary lot content.
   - **Expected:** lot title is visible; the bid section is present; the page is not blank.
4. Reload the page.
   - **Expected:** reload completes successfully; no broken page or application error.
5. Verify content after reload.
   - **Expected:** the same lot is displayed; the lot id in the URL is unchanged; content
     remains readable.

**[⬆ Back to Contents](#contents)**

---

# Keyboard & Query Variations

**TC-CAT-06 – TC-CAT-09.** How the search field behaves under real keyboard use and under
harmless formatting differences in the query. Project: `desktop-chromium`.

### TC-CAT-06

**Title:** `[TC-CAT-06][Functional][Keyboard] Verify search field supports keyboard entry, editing, selection replacement and submission`
**Priority:** Medium
**Additional preconditions:** search field is visible and enabled; keyboard input is
supported.
**Test data:** initial query `train`; replacement query `car`

**Traceability:** consolidates the original assignment's TC-CAT-02 and TC-CAT-04. They are
merged because roughly 70% of their steps were identical, and the assignment explicitly asks
for test cases that are _not similar in implementation_. No step or assertion from either
original case has been dropped.

**Why this is a product test, not a browser test:** the Catawiki search field is a
React-controlled component with an autocomplete dropdown. Every keystroke passes through
application code, so incorrect `onChange` / `onKeyDown` handling can genuinely break caret
position, swallow Delete, or desynchronise the visible value from the component state. These
assertions are intentionally strict and **must fail** if that happens.

**Assertion strictness:** the actual input value is verified after **every** meaningful edit. A
test that only presses keys without checking the resulting value is not acceptable.

**Steps:**

1. Open the homepage.
   - **Expected:** homepage loads; search input visible and enabled; search button available.
2. Focus the search field using the keyboard.
   - **Expected:** the field receives focus; it is the active element.
3. Type `train`.
   - **Expected:** input value is exactly `train`; all characters appear in the correct order.
4. Press ArrowLeft, then ArrowRight.
   - **Expected:** caret moves within the text; the input value remains exactly `train`.
5. Position the caret and press Backspace.
   - **Expected:** exactly one character **before** the caret is removed (`tran`).
6. Restore the deleted character by typing it.
   - **Expected:** the value returns to exactly `train`.
7. Position the caret and press Delete.
   - **Expected:** exactly one character **after** the caret is removed (`trai`).
8. Restore the deleted character.
   - **Expected:** the value returns to exactly `train`.
9. Select the entire query with the platform-appropriate shortcut (`Control+A` on
   Windows/Linux, `Meta+A` on macOS).
   - **Expected:** the whole value is selected; no browser-level action interrupts the test.
10. Type `car` to replace the selection.
    - **Expected:** the previous value is fully replaced; input value is exactly `car`; the
      replacement is **not** appended to the old value.
11. Move the caret with arrow keys, then edit with Delete and Backspace.
    - **Expected:** each edit removes exactly the intended character; the value after each
      edit matches expectation.
12. Restore the final value.
    - **Expected:** input value is exactly `car`; no extra whitespace, no missing or
      duplicated characters.
13. Press Enter to submit.
    - **Expected:** search executes; results page is displayed; results correspond to `car`;
      the earlier query `train` is **not** submitted.

**Platform modifier:** resolved at runtime from `process.platform` so the test is correct on
Windows, Linux and macOS without branching in the test body.

**Implementation note — autocomplete race condition:** Catawiki's search field fetches
suggestions asynchronously and re-renders the combobox when they arrive. Editing the query
while that update is still in flight is a genuine race: the re-render can land after the edit
and silently restore the previous value. This only surfaced under parallel test execution,
where the extra load made the race easy to lose. The fix waits for `aria-expanded` to reflect
the settled suggestion state before editing — not a fixed sleep, but an observable condition.
An earlier attempt to dismiss the suggestion list with `Escape` was tried and rejected: on an
`input[type=search]`, `Escape` is handled natively by the browser and clears the field
entirely, which the test itself caught immediately.

---

### TC-CAT-07

**Title:** `[TC-CAT-07][Functional][Positive] Verify search handles a query with leading and trailing whitespace`
**Priority:** Medium
**Test data:** `" train "`

**Steps:**

1. Open the homepage.
   - **Expected:** search input and search button visible and enabled.
2. Enter the query including leading and trailing spaces.
   - **Expected:** the field accepts the value; no unexpected error; page remains responsive.
3. Submit the search.
   - **Expected:** search is handled successfully; no navigation to a broken or blank page;
     results are displayed; whitespace does not prevent completion.
4. Verify the resulting state.
   - **Expected:** the application may trim or normalize the value; results are relevant to
     `train`; search controls remain accessible for a new query.

---

### TC-CAT-08

**Title:** `[TC-CAT-08][Functional][Positive] Verify search handles an uppercase query`
**Priority:** Medium
**Test data:** `"TRAIN"`

**Steps:**

1. Open the homepage.
   - **Expected:** search input visible and enabled.
2. Enter the uppercase value.
   - **Expected:** the value is displayed correctly; no unexpected validation error.
3. Submit the search.
   - **Expected:** search completes; results are displayed; uppercase letters do not prevent
     results.
4. Verify the resulting state.
   - **Expected:** search remains usable; the query can be replaced.

---

### TC-CAT-09

**Title:** `[TC-CAT-09][Functional][Positive] Verify search handles a mixed-case query`
**Priority:** Medium
**Test data:** `"TrAiN"`

**Steps:**

1. Open the homepage.
   - **Expected:** search input visible and enabled.
2. Enter the mixed-case value.
   - **Expected:** the value is displayed correctly; the field accepts the query.
3. Submit the search.
   - **Expected:** search completes; results are displayed; mixed casing does not prevent the
     search.
4. Verify the resulting state.
   - **Expected:** the application remains responsive and usable.

**Shared rule for TC-CAT-07/08/09:** the three variations are implemented as independent
parameterized tests rather than one long sequential test, so that a failure in one variation
does not hide the others. Across variations, **identical result order, result titles, or
result counts are not required**, and no fixed search result is asserted. What is verified is
that harmless whitespace and letter-case differences never block the search functionality.

**[⬆ Back to Contents](#contents)**

---

# Negative & Edge Cases

**TC-CAT-10 – TC-CAT-13.** Empty input, whitespace-only input, safe special characters, and an
unmatchable query with recovery. Project: `desktop-chromium`.

### TC-CAT-10

**Title:** `[TC-CAT-10][Functional][Negative] Verify an empty search submission is handled safely`
**Priority:** Medium
**Test data:** empty value

**Description:** Verify that submitting an empty search does not cause a broken page, invalid
navigation, uncaught application error, or an unusable application state.

**Steps:**

1. Open the homepage.
   - **Expected:** homepage loads; search input visible; no application error visible.
2. Ensure the search input contains no value.
   - **Expected:** input is empty; no residual value from an earlier search.
3. Attempt to submit the empty search.
   - **Expected:** handled safely; no broken or blank page; no invalid lot-details page is
     opened; no uncaught application error.
4. Verify the application state afterwards.
   - **Expected:** the application remains usable; a valid search control is still available.
5. Record the observed behaviour.
   - **Expected:** the observed handling is captured as a test annotation for documentation.

**Observed behaviour (established by exploration, not assumed):** Catawiki blocks the
submission entirely. The URL does not change, no results page opens, and no validation message
is shown — the user is simply left on the homepage with the empty field. This exact behaviour
is pinned by the test rather than treated as one of several acceptable outcomes, so a
regression (for example, the empty query starting to navigate somewhere) is caught.

---

### TC-CAT-11

**Title:** `[TC-CAT-11][Functional][Negative] Verify a whitespace-only search submission is handled safely`
**Priority:** Medium
**Test data:** three space characters `"   "`

**Steps:**

1. Open the homepage and focus the search field.
   - **Expected:** search input is visible and enabled.
2. Enter three whitespace characters.
   - **Expected:** the input accepts the whitespace or normalizes it; page responsive.
3. Attempt to submit the whitespace-only search.
   - **Expected:** handled safely; no broken or blank page; no invalid lot-details page
     opened; no uncaught application error.
4. Verify the application state afterwards.
   - **Expected:** search functionality remains accessible; no broken navigation state.
5. Enter `train` and submit a normal search.
   - **Expected:** the valid query is accepted; search executes; results are displayed; the
     earlier invalid attempt does not prevent recovery.

**Observed behaviour (established by exploration, not assumed):** unlike an empty query,
whitespace **is** submitted verbatim — it reaches `/s?q=%20%20%20` and renders the same
`No matches for` empty state used elsewhere in the suite (zero lot cards). Catawiki does not
trim it client-side before submission. This is pinned as the expected outcome rather than one
of several acceptable behaviours.

---

### TC-CAT-12

**Title:** `[TC-CAT-12][Functional][Negative] Verify a query containing safe special characters is handled safely`
**Priority:** Medium
**Test data:** `"train & rail"`

**Description:** Verify that a query containing non-malicious special characters is handled
safely. This validates functional robustness only.

**Explicit restriction:** no security or penetration-testing payloads are used — no script
tags, SQL injection patterns, XSS payloads, destructive content, or excessively long input.

**Steps:**

1. Open the homepage.
   - **Expected:** search input visible and enabled; no application error.
2. Enter the special-character query.
   - **Expected:** the field accepts the value; the text is displayed correctly; no unexpected
     validation error.
3. Submit the query.
   - **Expected:** handled safely; no navigation to a broken or blank page; the application
     displays either search results or a valid empty/no-results state; no uncaught error.
4. Verify the application remains usable.
   - **Expected:** search controls remain accessible; the query can be replaced; page
     responsive.

---

### TC-CAT-13

**Title:** `[TC-CAT-13][Functional][Negative] Verify a no-result search shows an empty state and the user can recover`
**Priority:** Medium
**Test data:** dynamically generated unique query; recovery query `train`

**Description:** Verify that a dynamically generated query which is highly unlikely to match
any lot produces the intended no-results state, and that the user can recover by searching for
`train` again.

Generated query format: `zzq<random-suffix>xnotalot`. The generated value must be safe, unique
enough to avoid accidental matches, contain no malicious payload, and be logged or attached to
the test report for debugging.

**Observed behaviour (established by exploration, not assumed):** Catawiki distinguishes two
different "nothing matched" states, and the suite models both:

| State          | Trigger observed          | Message                                              | Lot cards |
| -------------- | ------------------------- | ---------------------------------------------------- | --------- |
| `empty`        | whitespace-only query     | `No matches for “ ”`                                 | none      |
| `related-only` | unmatchable random string | `No exact results. Check out these related objects.` | shown     |

An unmatchable query therefore does **not** produce a bare empty page — related objects are
offered. The contract asserted is that the application explicitly declares nothing matched, so
no lot is ever presented as a genuine hit for gibberish. Treating the related objects as search
results would be a false pass.

**Steps:**

1. Generate a unique query unlikely to match any lot.
   - **Expected:** a non-empty, safe, unique value is generated and attached to the report.
2. Enter the generated query into the search field.
   - **Expected:** the previous query is fully replaced; the field displays the generated
     query exactly.
3. Submit the generated query.
   - **Expected:** search is processed; no broken or blank page; no uncaught application
     error; no unrelated lot-details page is opened.
4. Verify the no-results state.
   - **Expected:** the page indicates no matching lots, or an equivalent valid empty-results
     experience; no valid lot card is incorrectly treated as a match.
5. Replace the query with `train`.
   - **Expected:** the no-results query is fully replaced; the input value is exactly `train`.
6. Submit the recovery query.
   - **Expected:** search executes successfully; normal results are displayed; prior searches
     do not block further use.
7. Verify successful recovery.
   - **Expected:** the application returns to a valid search-results state; no full
     application reload was required.

**[⬆ Back to Contents](#contents)**

---

# Navigation State

**TC-CAT-14.** Browser Back and page refresh consistency. Project: `desktop-chromium`.

### TC-CAT-14

**Title:** `[TC-CAT-14][Functional][Navigation] Verify search state is preserved after browser Back navigation and refresh behavior is consistent`
**Priority:** Medium
**Additional preconditions:** at least two valid search results are available for `train`.
**Test data:** search query `train`; target result — second valid lot

**Description:** Verify that after opening a lot-details page the user can navigate back to
the search context, and that refreshing produces behaviour internally consistent with the
application's implemented state-management strategy. The purpose is to validate navigation
**consistency**, not to enforce a specific refresh implementation.

**Steps:**

1. Search for `train`.
   - **Expected:** search executes; results page displayed; at least two valid lot cards
     available.
2. Open the second valid lot.
   - **Expected:** the correct lot-details page is displayed and corresponds to the chosen
     result.
3. Use the browser Back action.
   - **Expected:** navigation returns to the search context; no broken or blank page.
4. Verify the restored search context.
   - **Expected:** the application restores the search experience; the page remains fully
     functional; no uncaught runtime error.
5. Capture the observed state (URL, query in the input, presence of results).
   - **Expected:** observed state captured successfully and attached to the test report; no
     assumption is made about mandatory state persistence.
6. Assert **conditional consistency** after Back.
   - **Expected:** if the URL carries a query parameter, the search input reflects the same
     query; if the application cleared the query, the URL carries no stale query.
7. Refresh the page.
   - **Expected:** refresh completes; no broken page or unexpected application error.
8. Verify the post-refresh state.
   - **Expected:** behaviour is internally consistent with the implemented strategy; no
     invalid navigation or inconsistent UI state.
9. Assert **conditional consistency** after refresh.
   - **Expected:** the same URL ↔ UI agreement rule as step 6 is applied.
10. Verify continued usability.
    - **Expected:** search functionality remains operational; no manual recovery or full
      application restart is required.
11. Document the observed refresh behaviour.
    - **Expected:** the observed behaviour is recorded as a test annotation and described in
      the project README.

**Assertion design — why this test tolerates undefined product behaviour:** state restoration
after Back and refresh is frequently left unimplemented or only partially implemented by
development teams. This test therefore separates three categories:

- **Invariants — always asserted strictly:** the page is not broken or blank, no uncaught
  error occurs, the search control is present and usable, the URL is valid.
- **Product behaviour — observed, never mandated:** whether the query survives Back or refresh
  is recorded, not required. The test does **not** invent a requirement that the query must
  always remain.
- **Consistency — asserted conditionally:** the application must agree with itself. A URL
  claiming `q=train` while the input is empty is a real defect and fails the test.

The result: a team that never implemented state restoration still passes (consistently
stateless), while a half-implemented, desynchronised state fails.

**Observed on this run:** Catawiki uses a fully URL-based search state — both Back and reload
restore the exact query in the URL, the search input, and the results. See
[README §23](../README.md#23-search-state-and-refresh-behaviour-observed-in-tc-cat-14) for the
recorded values.

**[⬆ Back to Contents](#contents)**

---

# Accessibility

**TC-CAT-15.** Keyboard-only reachability of the search control. Project: `desktop-chromium`.

### TC-CAT-15

**Title:** `[TC-CAT-15][Accessibility][Keyboard] Verify the search control is reachable and identifiable without a mouse`
**Priority:** Low

**Description:** Verify that the primary search control exposes a usable accessible name and
can be reached and operated using the keyboard alone.

**Steps:**

1. Open the homepage.
   - **Expected:** homepage loads successfully.
2. Inspect the search input's accessible name.
   - **Expected:** the input exposes a non-empty accessible name (label, `aria-label`, or
     placeholder).
3. Inspect the search button's accessible name.
   - **Expected:** the button exposes a non-empty accessible name identifying it as search.
4. Reach the search input using keyboard navigation only.
   - **Expected:** the input can receive focus without any mouse interaction.
5. Type a query and submit using the keyboard only.
   - **Expected:** the query is entered and submitted; the results page is displayed.

**[⬆ Back to Contents](#contents)**

---

# Mobile

**TC-CAT-16.** The mandatory flow re-verified on an emulated device. Project: `mobile-chrome`
(Playwright `Pixel 5` profile).

### TC-CAT-16

**Title:** `[TC-CAT-16][Functional][Responsive] Verify the mandatory search and lot-details flow works on a mobile viewport`
**Priority:** High
**Additional preconditions:** a supported Playwright mobile device profile is configured; at
least two valid search results are available for `train`.
**Test data:** device — configured mobile project (`Pixel 5`); search query `train`; target
result — second valid lot

**Description:** Verify that the mandatory Catawiki search flow works correctly on a supported
mobile viewport: search for `train`, identify at least two valid lot cards, open the second
valid lot, and retrieve the lot title, favorites counter and current bid.

**Implementation rule:** reuse existing Page Object methods wherever the desktop and mobile DOM
structures are shared; introduce mobile-specific selectors or methods **only** when required.
The same read-only restrictions as desktop apply.

**Steps:**

1. Launch the application using the configured mobile project.
   - **Expected:** mobile viewport applied; homepage loads correctly; no rendering issues or
     application errors.
2. Verify the mobile search control is accessible.
   - **Expected:** the search input or mobile search control is visible or can be opened; it
     is enabled.
3. Enter `train` into the mobile search field.
   - **Expected:** the query is entered successfully; the value is displayed correctly.
4. Submit the search.
   - **Expected:** search executes; results page is displayed; no broken page or application
     error.
5. Verify at least two valid lot cards are available.
   - **Expected:** at least two valid, visible, actionable cards; the requirement is satisfied
     **before** selecting the second lot.
6. Open the second valid lot.
   - **Expected:** navigation starts; the intended second valid lot is opened; no incorrect
     navigation.
7. Verify the lot-details page loads.
   - **Expected:** lot-details page displayed; primary lot content visible; no unexpected
     error page.
8. Retrieve the lot title, favorites counter and current bid.
   - **Expected:** all required values available; values parse successfully; retrieved values
     satisfy the expected data contracts.
9. Print the retrieved information.
   - **Expected:** values printed in the agreed structured format; no parsing error; the test
     completes successfully on the mobile viewport.

**[⬆ Back to Contents](#contents)**

---

# API & Health

**TC-CAT-17 – TC-CAT-18.** A different implementation layer from the UI tests — no browser
interface is driven — addressing the assignment's explicit request for test cases that are
_"not similar in implementation"_. Project: `desktop-chromium`.

### TC-CAT-17

**Title:** `[TC-CAT-17][API][Contract] Verify the search request succeeds and returns a valid results payload`
**Priority:** Medium
**Additional preconditions:** search results are available for `train`.
**Test data:** search query `train`

**Steps:**

1. Register a network listener before triggering the search.
   - **Expected:** the listener is attached before any request is issued.
2. Trigger the search for `train`.
   - **Expected:** the search request is observed.
3. Inspect the HTTP status.
   - **Expected:** status is in the 2xx range.
4. Inspect the response.
   - **Expected:** the response body is non-empty.
5. Validate the payload structure.
   - **Expected:** contains a results collection consistent with the rendered page.
6. Confirm no failing requests.
   - **Expected:** no 4xx or 5xx response occurs for the search operation.

**Note:** validation targets structure and status only. No fixed lot data, count, or ordering
is asserted, because the catalogue changes continuously.

---

### TC-CAT-18

**Title:** `[TC-CAT-18][Health][Monitoring] Verify the mandatory flow produces no uncaught errors and no server failures`
**Priority:** Medium
**Test data:** search query `train`

**Steps:**

1. Attach console and response listeners before navigation.
   - **Expected:** listeners capture the entire session.
2. Execute the mandatory flow: homepage → search `train` → open second valid lot.
   - **Expected:** the flow completes successfully.
3. Inspect captured console messages.
   - **Expected:** no uncaught JavaScript errors (`pageerror`) occurred.
4. Inspect captured responses.
   - **Expected:** no 5xx server responses occurred for document or API requests.
5. Report findings on failure.
   - **Expected:** the failing message or URL is included in the assertion output.

**Note:** third-party analytics and advertising noise is filtered out so the test reports
Catawiki application failures rather than unrelated vendor errors.

**[⬆ Back to Contents](#contents)**

---

# Unit — Data Parsing

**TC-CAT-19 – TC-CAT-27.** No browser is launched. These tests are deterministic, run in
milliseconds, and prove the parsing logic that TC-CAT-03 and TC-CAT-04 depend on. They exist
because a parser bug would otherwise surface as a confusing UI test failure. Project: `unit`.

**Shared preconditions:** none (pure functions, no environment dependency).

**Shared rule:** the parser must preserve the raw value, return normalized typed data, throw a
descriptive error when parsing is impossible, never silently produce `NaN`, and never silently
default an invalid value to zero.

### TC-CAT-19

**Title:** `[TC-CAT-19][Unit][Data] Favorites counter without separators is parsed as an integer`
**Test data:** `"39"`, `"0"`, `"7"`

**Steps:**

1. Call `parseFavoritesCount` with a plain digit string.
   - **Expected:** returns the matching integer.
2. Inspect the returned value.
   - **Expected:** `Number.isInteger()` is `true`.
3. Inspect the returned value.
   - **Expected:** value is `>= 0`.

---

### TC-CAT-20

**Title:** `[TC-CAT-20][Unit][Data] Favorites counter with thousands separators is parsed as an integer`
**Test data:** `"1,234"`, `"1.234"`, `"12 345"`

**Steps:**

1. Call `parseFavoritesCount` with a comma-separated value.
   - **Expected:** returns `1234`.
2. Call it with a dot-separated value.
   - **Expected:** returns `1234`.
3. Call it with a space-separated value.
   - **Expected:** returns `12345`.
4. Inspect all three results.
   - **Expected:** each is an integer `>= 0`; separators are never interpreted as decimals.

---

### TC-CAT-21

**Title:** `[TC-CAT-21][Unit][Data] Current bid with symbol prefix is parsed into amount and currency`
**Test data:** `"€ 53"`, `"€ 320"`, `"€112"`

**Steps:**

1. Call `parseCurrentBid("€ 53")`.
   - **Expected:** returns an object matching the `CurrentBid` interface.
2. Inspect `raw`.
   - **Expected:** exactly the original input string, unmodified.
3. Inspect `amount`.
   - **Expected:** `53`, a finite number `>= 0`.
4. Inspect `currency`.
   - **Expected:** `"€"`.
5. Repeat with no space between symbol and digits (`"€112"`).
   - **Expected:** parsed identically (`amount: 112`).

---

### TC-CAT-22

**Title:** `[TC-CAT-22][Unit][Data] Dot thousands separator is not treated as a decimal separator`
**Test data:** `"€ 1.200"`

**Steps:**

1. Call `parseCurrentBid("€ 1.200")`.
   - **Expected:** parsing succeeds.
2. Inspect `amount`.
   - **Expected:** equals `1200`, **not** `1.2`.
3. Inspect `currency`.
   - **Expected:** `"€"`.

**Rationale:** a single separator followed by three digits is a grouping separator. This is the
most common European formatting trap and a silent 1000x error if handled incorrectly.

---

### TC-CAT-23

**Title:** `[TC-CAT-23][Unit][Data] European format with dot thousands and comma decimals is parsed correctly`
**Test data:** `"€ 1.200,50"`

**Steps:**

1. Call `parseCurrentBid("€ 1.200,50")`.
   - **Expected:** parsing succeeds.
2. Inspect `amount`.
   - **Expected:** equals `1200.50`.
3. Inspect the value type.
   - **Expected:** decimal values are supported; an integer is not required.
4. Inspect `currency`.
   - **Expected:** `"€"`.

---

### TC-CAT-24

**Title:** `[TC-CAT-24][Unit][Data] Anglo format with suffixed currency is parsed correctly`
**Test data:** `"1,200.50 €"`

**Steps:**

1. Call `parseCurrentBid("1,200.50 €")`.
   - **Expected:** parsing succeeds.
2. Inspect `amount`.
   - **Expected:** equals `1200.50`.
3. Inspect `currency`.
   - **Expected:** `"€"`, correctly detected despite its trailing position.

---

### TC-CAT-25

**Title:** `[TC-CAT-25][Unit][Data] Non-breaking and narrow spaces are normalized before parsing`
**Test data:** values containing U+00A0, U+202F, U+2009, U+2007, U+2060

**Steps:**

1. Call `normalizeWhitespace` with a non-breaking-space value.
   - **Expected:** special spaces become regular spaces; the value is trimmed.
2. Call `parseCurrentBid` with such a value.
   - **Expected:** parsing succeeds.
3. Inspect `amount`.
   - **Expected:** matches the equivalent regular-space value.
4. Inspect `raw`.
   - **Expected:** still contains the **original**, unmodified string.

---

### TC-CAT-26

**Title:** `[TC-CAT-26][Unit][Negative][Data] Unparseable values throw ParseError instead of returning zero or NaN`
**Test data:** `""`, `"—"`, `"abc"`, `"No bids"`

**Steps:**

1. Call `parseFavoritesCount` with each non-numeric value.
   - **Expected:** every call throws `ParseError`.
2. Call `parseCurrentBid` with each non-numeric value.
   - **Expected:** every call throws `ParseError`.
3. Inspect the error message.
   - **Expected:** contains the original raw value, for debugging.
4. Confirm the failure mode.
   - **Expected:** no `0` is returned, no `NaN` is returned — the failure is loud.

---

### TC-CAT-27

**Title:** `[TC-CAT-27][Unit][Negative][Data] Missing currency information throws a descriptive ParseError`
**Test data:** `"1200"` (numeric but no currency, no hint)

**Steps:**

1. Call `parseCurrentBid("1200")` with no currency hint.
   - **Expected:** throws `ParseError`.
2. Inspect the error message.
   - **Expected:** states that currency information is missing and includes the raw value.
3. Call `parseCurrentBid("1200", "€ 1200 current bid")`.
   - **Expected:** succeeds; currency is resolved from the hint.

**Rationale:** currency may be rendered in a sibling element. The hint parameter covers that
layout without weakening the contract when no currency exists anywhere.

**[⬆ Back to Contents](#contents)**

---

# 6. Traceability

## 6.1 Assignment requirement coverage

| Assignment scenario step                                                | Covered by                                                                                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1. Open https://www.catawiki.com/en/                                    | TC-CAT-01, TC-CAT-16                                                                                                   |
| 2. Type keyword `train` in the search field                             | TC-CAT-01, TC-CAT-06, TC-CAT-16                                                                                        |
| 2. Click magnifier button within the search field                       | TC-CAT-01, TC-CAT-16                                                                                                   |
| 3. Verify the search results page is opened                             | TC-CAT-01, TC-CAT-02, TC-CAT-17                                                                                        |
| 4. Click on the second lot in search results                            | TC-CAT-01, TC-CAT-02, TC-CAT-16                                                                                        |
| 5. Lot's page should be opened                                          | TC-CAT-01, TC-CAT-02, TC-CAT-05                                                                                        |
| 6–7. Read lot name, favorites counter, current bid and print to console | TC-CAT-01, TC-CAT-03, TC-CAT-04, TC-CAT-16                                                                             |
| "Do not limit yourself to one scenario"                                 | 27 test blocks across 8 feature groups                                                                                 |
| "Add diverse test cases which are not similar in implementation"        | Unit (TC-CAT-19–27), API/network (TC-CAT-17, TC-CAT-18), accessibility (TC-CAT-15), cross-page consistency (TC-CAT-04) |

## 6.2 Original manual test case mapping

| Original manual case | Final ID(s)           | Change                                                                                           |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------ |
| TC-CAT-01            | **TC-CAT-01**         | Scope narrowed — deep identity verification delegated to TC-CAT-02                               |
| TC-CAT-02            | **TC-CAT-06**         | **Merged** with the original TC-CAT-04                                                           |
| TC-CAT-03            | **TC-CAT-07, 08, 09** | **Split** into three independent parameterized tests                                             |
| TC-CAT-04            | **TC-CAT-06**         | **Merged** into TC-CAT-06; all steps retained                                                    |
| TC-CAT-05            | **TC-CAT-10, 11**     | **Split** into empty and whitespace-only                                                         |
| TC-CAT-06            | **TC-CAT-12, 13**     | **Split** into special characters and no-results + recovery                                      |
| TC-CAT-07            | **TC-CAT-02**         | Unchanged in scope                                                                               |
| TC-CAT-08            | **TC-CAT-16**         | Unchanged in scope                                                                               |
| TC-CAT-09            | **TC-CAT-03**         | Unchanged in scope                                                                               |
| TC-CAT-10            | **TC-CAT-14**         | Assertion model refined — invariants strict, product behaviour observed, consistency conditional |
| —                    | **TC-CAT-19 … 27**    | **New** — unit layer                                                                             |
| —                    | **TC-CAT-17**         | **New** — API/network layer                                                                      |
| —                    | **TC-CAT-04**         | **New** — cross-page data consistency                                                            |
| —                    | **TC-CAT-18**         | **New** — console and HTTP health                                                                |
| —                    | **TC-CAT-15**         | **New** — accessibility                                                                          |
| —                    | **TC-CAT-05**         | **New** — deep link and reload                                                                   |

No step, assertion, or expected result from the original manual test cases has been dropped.
The "Original manual case" column refers to the client-provided test cases (TC-CAT-01 through
TC-CAT-10); our final IDs were renumbered afterwards, by feature grouping, for readability.

**[⬆ Back to Contents](#contents)**

---

# 7. Out of scope

Documented deliberately rather than omitted silently. These are recorded in the README as
possible future improvements.

| Area                                      | Reason                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Sorting and filtering of search results   | Value/effort trade-off; suite kept lightweight per the assignment brief             |
| Pagination                                | As above                                                                            |
| Cross-browser execution (Firefox, WebKit) | The brief asks not to run every desktop test in every browser without justification |
| Visual regression                         | Live auction imagery changes continuously, making baselines unstable                |
| Authenticated flows, bidding, favouriting | Prohibited by the production-safety rules in section 1                              |

**[⬆ Back to Contents](#contents)**
