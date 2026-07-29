# AI Usage

This document describes how AI assistance was used while building this assignment, in the
interest of full transparency.

## Which AI assistant was used

Claude (Anthropic), used through an agentic coding environment with direct access to the
terminal, the file system and a browser.

## How AI was used

AI was used as a pair-programming assistant throughout, under continuous engineering review.
The working pattern was deliberately incremental: one step at a time, each step executed and
verified against the live site before moving on. No phase was accepted on the basis of
"it looks correct".

Concretely, AI supported:

- **Environment and project setup** — verifying the toolchain, initialising the project, and
  selecting mutually compatible dependency versions.
- **Configuration** — TypeScript in strict mode, the Playwright projects, ESLint with
  type-aware rules, and Prettier.
- **Test design review** — analysing a first draft of ten manual test cases and proposing a
  restructured suite (see below).
- **Page objects and parsing utilities** — including the European currency parsing rules.
- **Test implementation** — the 27 automated test blocks.
- **Live-site exploration** — reading the actual DOM to derive locators instead of guessing.
- **Documentation** — this file, the README, `docs/TEST_CASES.md`, and
  `docs/PRODUCT_OBSERVATIONS.md`.

## Examples of tasks where AI added real value

**Locator discovery from the live DOM.** Rather than inventing selectors, the live site was
inspected directly. This surfaced three traps that guessed locators would have hit:

1. The cookie consent element stays in the DOM permanently, so a presence check is not a valid
   signal — visibility must be checked.
2. The favourites chip is rendered by the same component on recommendation cards, so an
   unscoped locator silently reads the wrong lot's counter.
3. The mobile layout does not render the search input at all until a toggle is pressed, and
   that toggle exposes no accessible name.

**Test suite analysis.** The initial ten manual test cases were reviewed critically. Two cases
(keyboard entry and keyboard editing) overlapped by roughly 70% and were merged; three cases
were split so that each scenario runs independently; and additional layers were introduced —
unit tests for the parsers, an API-level test, a cross-page data-consistency test, health
monitoring, and an accessibility test — to satisfy the brief's request for test cases that are
"not similar in implementation".

**Debugging real failures.** Several genuine problems were diagnosed and fixed rather than
worked around: an `exactOptionalPropertyTypes` type error, an ESLint configuration that could
not parse itself, a consent dialog whose controls are not exposed as buttons, and a redundant
wait that added roughly ten seconds per test.

Two failures only appeared under **parallel execution** and are worth calling out specifically,
because they show the value of running the full suite, not just individual files, before
declaring anything finished:

- A cookie-consent handler marked a page as "already handled" as soon as its wait expired, even
  when the banner had not appeared yet. Under parallel load the third-party consent script
  loaded slowly enough that the banner then appeared _after_ the check — and every later click
  in that test hit the invisible overlay instead of the intended button. The fix records a page
  as handled only after an actual dismissal, not after a timeout.
- An attempted fix for a flaky keyboard test used `Escape` to close the search field's
  autocomplete dropdown. The very next full-suite run failed immediately with the field value
  reading empty instead of the expected query: on an `input[type="search"]`, `Escape` is handled
  natively by the browser and clears the field — this had nothing to do with the application.
  The fix was corrected to wait for the autocomplete's `aria-expanded` state instead of trying
  to dismiss it. This is a concrete example of an AI-proposed fix being wrong, the test suite
  catching it immediately, and the fix being replaced rather than patched around.

**Adapting external guidance rather than copying it.** The engineer flagged that the original
page objects mixed locator values and interaction logic in the same file — a real Page Object
Model gap — and shared a reference directory structure from their own workplace to illustrate
the pattern expected (a dedicated `selectors/` layer, a `shared/` layer for reusable code,
feature-grouped test folders). That reference used a three-level, multi-product namespace
(`playwright/ui/catawiki/...`) and included `.env` scaffolding. Both were evaluated and
deliberately not copied: this is a single-product assignment with zero secrets, so the extra
nesting and environment-file infrastructure would have added depth and ceremony without a
corresponding benefit. The underlying principle — selectors and shared code separated from page
behaviour — was kept and applied at the scale the project actually needs. Before committing to
the restructure, the riskiest technical assumption (whether TypeScript path aliases would
resolve at runtime, not just at typecheck) was proven with a disposable proof-of-concept test
rather than assumed; when it introduced unnecessary complexity for a now-flatter directory
layout, the alias plan itself was dropped in favour of plain relative imports.

**Responding to targeted senior-level review questions.** In a later pass the engineer asked a
specific set of architecture questions: whether `describe`/`beforeEach`/`afterEach`/`beforeAll`
were being used, whether 13 spec files for 27 tests was over-fragmented relative to SMART
principles, whether `fixtures.ts` should live in its own folder, and whether the `unit/` folder
name was well chosen. Each was answered on its merits rather than deferred to agreement: the
fixtures-folder and hook-usage questions were acted on directly; the "collapse to two files"
suggestion was respectfully disagreed with and the reasoning given (several single-test files
are justified by the test's size, importance, or Playwright's own project-routing rules), while
the _actual_ duplication problem underneath that instinct — the same four-line search sequence
copied across seven files — was found and fixed by extracting it to a shared helper. That
extraction pass also surfaced a real inconsistency: one of the five near-identical
"at least two valid lots" assertions was missing the descriptive failure message every other
copy had, an easy thing to miss by eye across scattered files and an easy thing to catch once
the duplication was centralised.

**Revisiting a decision under continued pushback.** The `describe`/hooks question above was not
settled in one pass. In a later review the engineer raised it again — still unconvinced that
five single-test files should stay unwrapped, and still unconvinced by the reasoning against
`beforeEach`/`afterEach`. Re-examining the actual spec files rather than repeating the earlier
answer changed one position and reinforced the other:

- On `describe`, the fact that the same question kept coming back was itself evidence that the
  mixed rule ("wrap only when a file holds more than one test") was not self-explanatory, and
  the cost of always wrapping is low. All 13 spec files were changed to use `test.describe()`
  uniformly.
- On `beforeEach`, the file-by-file evidence held up under a second look: in
  `search-negative.spec.ts`, each of the four tests submits a different query as part of the
  same step that opens the page, so there is no setup that is genuinely identical across tests
  to extract. Rather than defend that position in the abstract a second time, the engineer asked
  for hooks to be applied specifically where they _did_ fit. That surfaced three describe blocks
  with byte-identical setup across every test in the block — `lot-navigation.spec.ts`,
  `lot-data-contract.spec.ts`, and the three-way loop in `search-normalization.spec.ts` —
  `beforeEach` was added there and nowhere else, and the full 27-test suite was re-run against
  the live site to confirm no regression.

**Removing `test.slow()` after questioning its own justification.** AI had earlier added
`test.slow()` — tripling the timeout — to a test that occasionally ran close to its limit. When
the engineer said this "didn't feel like a professional approach," the response was not to
accept or defend it reflexively but to check the actual numbers: the test's observed runtime was
around 37 seconds against a 90-second budget, headroom that tripling the timeout did nothing to
address. The call was removed as unjustified rather than kept "just in case."

**Catching a self-undermining entry in AI's own documentation.** `docs/PRODUCT_OBSERVATIONS.md`
— itself an AI-authored document — listed "submitting an empty search gives no feedback" and
"two different no-match states" as findings, even though each entry's own text already conceded
the underlying behaviour was correct ("the behaviour itself... is correct", "very likely
intentional"). The engineer questioned this directly: if the behaviour is correct, why record it
as a finding at all? A screenshot of the live site prompted a fresh live re-check of both states
first, confirming the code's model was accurate; that same scrutiny, applied to the document
rather than the code, showed the two entries added nothing but padding. Both were removed. A
findings document that lists expected behaviour alongside real issues (the missing accessible
names, the consent-banner pointer-event timing) makes the real findings less credible, not more.

## How the generated code was reviewed and validated

Every change was verified, not assumed:

- **Executed against the live site.** Each test was run and observed before being accepted.
  Nothing was marked complete on the strength of the code alone.
- **Behaviour established by exploration, not assumption.** Where the specification left
  behaviour open — empty search, whitespace-only search, unmatchable queries, Back and refresh
  — the real product behaviour was measured first and only then asserted. This directly
  changed the implementation: an unmatchable query turned out to return "No exact results" with
  related objects rather than an empty page, so the suite models both states separately. A test
  written on the original assumption would have passed while asserting the wrong thing.
- **Mechanically enforced quality.** `npm run typecheck`, `npm run lint` and
  `npm run format:check` were run after every change and all pass cleanly. Type-aware ESLint
  rules and the Playwright plugin caught several issues that were then fixed at the source.
- **Assertions challenged for weakness.** Assertions that could never fail were rejected. For
  example, "any of five outcomes is acceptable" was replaced by pinning the observed behaviour,
  and a "results or empty state" check was replaced by asserting the page reaches exactly one
  declared state.
- **Design decisions questioned.** Suggestions were pushed back on where they were wrong. The
  guidance to treat keyboard editing as "testing the browser rather than the product" was
  corrected: because the search field is a React-controlled component, key handling is
  application code and deserves strict assertions.
- **Documentation cross-checked against the brief and the running code, not assumed complete.**
  Asked to verify `docs/TEST_CASES.md`, all 27 test titles were diffed word-for-word against the
  actual `test()` strings in the spec files, and each of the original 10 client-provided cases
  was traced through its merges and splits to a final id. The result was not padded with invented
  problems: the one real inconsistency found turned out to be in README's summary table, not in
  `TEST_CASES.md` itself. Separately, the engineer spotted a genuine gap by reading a spec file
  directly in the editor, not from any report: no test title carried its own `TC-CAT-XX` id, so a
  failing test in a CI log couldn't be traced back to its specification without a manual lookup.
  All 27 titles and their documentation entries were updated to close that gap.

## Statement

AI-generated content was **not** accepted blindly. It was treated as a draft to be verified,
challenged and corrected. Every locator was checked against the real DOM, every test was
executed against the live site, every assertion was reviewed for whether it could actually
fail, and every automated quality gate passes. Where AI proposed something incorrect or
weakly reasoned, it was rejected or reworked. The engineering decisions in this repository,
and responsibility for them, are the author's.
