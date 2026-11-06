# Tasks

## 1. Assignment core

- [x] 1.1 Create `assignment.js` with the single `GiftExchange` namespace, Node `module.exports` support, and `prepare(rawText)` implementing line splitting, trimming, blank-line removal, and case-insensitive duplicate rejection (verify: a `node -e` run shows padded lines trimmed, blank lines dropped, and `Alice`/`alice` returning `DUPLICATE` with the name in the message).
- [x] 1.2 Implement the unbiased `randomInt` helper, Fisher–Yates shuffle, and rejection loop with the 10,000-attempt cap, returning `{ ok, assignment }` or `{ ok, error }` (verify: `node -e` generates a valid four-person assignment and a forced invalid-only random source returns `RETRY_LIMIT`).
- [x] 1.3 Implement `generate(names, opts)` feasibility checks (`TOO_FEW` for n < 3), the n = 3 guessability warning, and independent `verify(names, assignment)` run before returning a result (verify: n = 1 and n = 2 return `TOO_FEW`, n = 3 returns a 3-cycle plus warning, and a tampered assignment fails `verify`).
- [x] 1.4 Add `tests/assignment.test.js` cases for `prepare` and feasibility, and run `node --test tests/assignment.test.js` with all cases passing (verify: duplicate, trimming, n = 1, n = 2, and n = 3 tests report pass).
- [x] 1.5 Add the invariant suite: 10,000 assignments for each n = 4..30 with no self-gift, no 2-cycle, every giver and recipient used once; n = 4 coverage of all six valid assignments; injected-RNG retry-cap and verification failures (verify: `node --test tests/assignment.test.js` passes and a deliberately broken invariant makes the suite fail).

## 2. Page shell and styling

- [x] 2.1 Create `index.html` with the name `<form>` and textarea, generate button, `aria-live` status region, hidden result section with a focusable heading, a `<ul>` container, and show-all/copy/print controls, loading `assignment.js` and `app.js` with `<script defer>` (verify: the file loads with no console errors and contains native form controls plus an empty result list).
- [x] 2.2 Add base `styles.css` for layout, visible `:focus-visible` states, a narrow-viewport layout, `prefers-color-scheme: dark`, and `prefers-reduced-motion: reduce` (verify: at a 360px viewport there is no horizontal scrolling, keyboard focus is visible, dark mode uses a readable palette, and reduced motion removes transitions).
- [x] 2.3 Add print styles that force recipients visible, use black on white, hide the form and controls, avoid splitting list rows, and add a left margin for cutting slips (verify: browser print preview shows the full assignment with no buttons and a printable left margin).

## 3. Browser wiring

- [x] 3.1 Wire form submission to `GiftExchange.prepare` and `GiftExchange.generate`, render error and warning text in the live region, and move focus to the result heading on success (verify: two names announce the count-aware error, three names show the warning, and success focuses the heading).
- [x] 3.2 Render one list item per giver with a reveal button whose recipient `<span>` starts `hidden`, toggle only that recipient on activation, and implement the show-all control with `aria-expanded` updates (verify: recipients are hidden initially, revealing Alice leaves every other recipient hidden, and show-all toggles all of them).
- [x] 3.3 Load the name list from the versioned local-storage key on startup and save it on change, wrapping access in `try/catch` and never storing the assignment (verify: refresh restores the names, no prior assignment appears, and with storage access forced to throw the app still generates).
- [x] 3.4 Implement copy-to-clipboard with the `giver gives to recipient` text, the `execCommand` fallback, and a manual-copy textarea plus status message when both fail (verify: the clipboard contains one line per pair, a denied clipboard permission reaches the fallback, and failure is announced).
- [x] 3.5 Wire the print control to the browser print dialog (verify: activating it opens the print dialog and the control is absent from print output).

## 4. Documentation

- [x] 4.1 Update `README.md` with the implemented status, the final file layout including `assignment.js` and `tests/`, usage from `file://` and a static server, and the test command (verify: each documented command and path exists and the test command runs as written).

## 5. Integration checks

- [x] 5.1 Run `node --test tests/` and confirm the full suite passes with the app's actual `assignment.js` (verify: zero failing tests, zero skipped tests).
- [x] 5.2 Complete the flow from both `file://` and a static HTTP server with the network disabled: enter names, generate, reveal one person, show all, copy, and print (verify: every step works and DevTools shows no external requests).
- [x] 5.3 Perform a keyboard and assistive-technology pass through the same flow (verify: every control is Tab-reachable with a visible focus ring, Enter/Space activate controls, errors are announced, and unrevealed recipients are not announced).
