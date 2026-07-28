# Product Observations — Catawiki (catawiki.com/en)

While building read-only functional test automation for the mandatory search-and-lot-details
flow, a number of incidental observations were made about the live product. None of these were
the target of the assignment, and none were found through security testing — they surfaced
naturally while writing resilient locators and exploring edge-case behaviour. They are recorded
here in case they are useful to the product or QA team.

**Scope and method:** functional, black-box, read-only exploration of the public site
(`https://www.catawiki.com/en/`) using Chromium via Playwright, desktop and a Pixel 5 emulated
viewport. No authentication, no security testing, no attempt to bypass any protection. Findings
below are UX/accessibility/robustness observations, not a security assessment.

## 1. Accessibility

### 1.1 Mobile search toggle has no accessible name

On the mobile viewport, the header button that reveals the search input exposes no `aria-label`,
no visible text and no other accessible name — it had to be located structurally (its position
relative to the favourites link) rather than by role or label. A screen-reader user on mobile
would have no way to know what this control does before activating it.

**Suggestion:** add `aria-label="Search"` (or equivalent) to the mobile magnifier toggle. This
is a small, low-risk fix with a direct accessibility benefit.

### 1.2 Cookie consent dialog exposes no accessible name

The Usercentrics consent dialog itself carries no accessible name, and its least-intrusive
option ("Continue without accepting") is rendered as plain text rather than an interactive
`<button>` element — it had to be located by matching its visible text rather than by role.
Assistive technology may not announce this control as interactive in the way "Accept All" and
"Manage Cookies" (which _are_ real buttons) are announced.

**Suggestion:** render all three consent actions as semantically equivalent controls (all
`<button>`, each with a clear accessible name), so assistive technology treats the "decline"
path with the same affordance as "accept."

## 2. UX robustness

### 2.1 Submitting an empty search gives no feedback

Clicking the magnifier button with an empty search field does nothing observable: no error, no
shake/focus animation, no disabled state on the button beforehand. A user might reasonably
wonder whether their click registered at all. The behaviour itself (safely no-op) is correct
and was deliberately preserved by our tests — only the _lack of any acknowledgement_ is the
observation.

**Suggestion:** a subtle affordance (briefly disabling the button, a focus ring, or a one-line
hint) would remove the ambiguity without changing the underlying validation behaviour.

### 2.2 Two different "nothing matched" experiences, with no visible distinction rule

Catawiki renders two different empty-result experiences depending on the query:

| Query type              | Result                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Whitespace-only         | `No matches for " "` — a bare empty state, zero lot cards                                                                         |
| Unmatchable random text | `No exact results. Check out these related objects.` — same empty state text pattern, but ~24 unrelated lots are shown underneath |

This is very likely intentional (a related-items fallback is a reasonable retention feature),
and our tests were written to respect both as valid outcomes rather than treat either as wrong.
The observation is narrower: a user typing a genuine typo has no way to tell, from the page
alone, whether the objects shown below are _related to their intent_ or simply _popular
filler_ — the two cases read almost identically at a glance.

**Suggestion:** consider a small visual/copy distinction between "we found nothing, here is
what's popular right now" and a true zero-results state, so users don't mistake unrelated
suggestions for an approximate match.

### 2.3 Consent banner can intercept a click aimed at the page behind it

The consent platform's root element keeps intercepting pointer events for a brief window after
its dismiss button visually disappears (our automation had to explicitly wait for the root
element itself to be removed, not just its button). If the timing is similar for a real user
who clicks "Continue without accepting" and then immediately clicks something on the page
underneath, that second click could plausibly land on the still-present overlay instead of the
intended element. We did not confirm this happens to real users — it is an inference from what
we had to work around in automation — but it may be worth a UX pass if any bug reports mention
"clicked and nothing happened" right after the cookie banner.

## 3. What we did **not** find

Worth stating explicitly, since a findings document that only lists problems is misleading:

- **No uncaught JavaScript errors** and **no 5xx server responses** were observed across the
  mandatory search-and-lot flow in any of the dozens of full-suite runs performed while building
  this project (this is exactly what TC-CAT-18 continuously verifies).
- **No data-integrity issue** between the search results grid and the lot details page: title
  and current bid were always consistent between the two views in every run (TC-CAT-04).
- **Currency and counter formatting was consistent** across every lot we sampled — no malformed
  numbers, no missing currency symbols.

## 4. Positive design observations

- **URL-based search state.** The query lives entirely in the `q` query parameter, and both
  browser Back and a full page reload restore the exact same search context (URL, input value,
  and results all agree — see `README.md` §23). This is a clean, shareable-link-friendly design
  that a lot of search UIs get wrong.
- **Fast search response times.** Every search in this suite resolved and rendered results well
  within a few seconds, with no visible loading jank.
- **Stable, semantic hooks where they exist.** `data-testid` attributes on search fields and lot
  cards, and unhashed BEM class names on card titles/prices, made those specific elements far
  easier and more reliable to automate than the hashed CSS-module class names used elsewhere on
  the lot details page (see `README.md` §21 for how this shaped our locator strategy).

## 5. A note for internal QA/automation teams

Catawiki is fronted by Akamai bot protection, which returns `HTTP 403` to headless browser
traffic (confirmed for both bundled Chromium and real Chrome in headless mode) while a plain
HTTP request from the same network returns `200` — the block targets the headless browser
signature specifically, not the network path. This is presumably an intentional security
control and is not something this document suggests changing. It is simply worth knowing for
any internal team automating this site: headless CI runners will need to either run headed
(with a virtual display), be allow-listed, or the team should coordinate with whoever owns the
bot-protection configuration. See `README.md` §19 and §25 for how this project handled it.

---

_This document was produced as a side effect of building the automation suite in this
repository, not as a dedicated audit. Findings are offered in good faith as constructive,
read-only observations from a QA engineering perspective._
