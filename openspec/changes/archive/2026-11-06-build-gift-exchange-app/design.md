# Design

## Context

See `proposal.md` for motivation. The repository is greenfield: `requirements.md`
is the authoritative behaviour description, and there is no application code,
build configuration, or test framework yet. The design therefore has to choose
the file layout, the boundary between pure logic and the DOM, and the testing
route, while honouring the hard constraints: no backend, no build step, no
runtime dependencies, no network calls, and operation from `file://` as well as
over HTTP.

## Goals / Non-Goals

**Goals:**

- Isolate the assignment algorithm in a DOM-free unit that can be tested from
  Node without a browser or a bundler.
- Keep the browser layer thin: parse input, call the core, render results, and
  manage reveal/copy/print state.
- Make every specified failure mode a returned error with a specific message,
  not an exception or a silently wrong assignment.
- Keep the whole app small enough to read in one sitting.

**Non-Goals:**

- Exclusion rules, multi-group exchanges, budgets, wishlists, accounts, or
  sharing links (explicit non-goals in `requirements.md`).
- A service worker or installable PWA. "Offline" here means no network calls,
  not cached assets.
- A test framework, transpiler, linter pipeline, or CI configuration.
- Internationalisation or pluralisation beyond the English messages in the
  requirements.

## Decisions

### D1: Two classic scripts, one global namespace

Files:

```
index.html
styles.css
assignment.js      # pure logic, no DOM
app.js             # DOM wiring only
tests/assignment.test.js
```

`index.html` loads both with `<script defer>` (not `type="module"`), so the app
works when opened directly from disk; module scripts are blocked under
`file://` by CORS. `assignment.js` attaches a single `GiftExchange` object to
`globalThis` and also assigns `module.exports` when running under Node. `app.js`
runs inside an IIFE and reads that namespace, so there is one app-owned global.

Alternative rejected: ES modules. They are cleaner but break the required
`file://` use case. Alternative rejected: a single `app.js` containing both
logic and DOM code, which would force tests to fake a document.

### D2: Result objects instead of exceptions

Public surface:

```js
GiftExchange.prepare(rawText)        // -> { ok: true, names } | { ok: false, error }
GiftExchange.generate(names, opts)   // -> { ok: true, assignment } | { ok: false, error }
GiftExchange.verify(names, assignment) // -> { ok: true } | { ok: false, reasons }
```

`assignment` is an array of `{ giver, recipient }` in input order. Errors carry
a stable `code` (`TOO_FEW`, `DUPLICATE`, `RETRY_LIMIT`, `VERIFY_FAILED`) plus a
human message that includes the concrete count or name. The UI renders the
message verbatim; tests assert on the code. Internal work uses indices so the
verifier can compare identity without relying on name uniqueness.

### D3: Uniform rejection sampling with an injectable random source

The generator:

1. Builds `[0..n-1]`.
2. Fisher–Yates shuffles it using an unbiased `randomInt(maxExclusive)`.
3. Rejects the permutation if any index maps to itself or if any two indices
   map to each other.
4. Repeats, up to 10,000 attempts, then returns `RETRY_LIMIT`.
5. Runs `verify()` on the accepted permutation before returning it and returns
   `VERIFY_FAILED` if that fails.

The shuffle uses `crypto.getRandomValues` when available and falls back to
`Math.random` only if it is not. `randomInt` rejects raw 32-bit values in the
final partial bucket before taking the modulo, so the shuffle itself is not
biased by modulo skew. `generate` accepts an optional `randomInt` so tests can
inject a deterministic or deliberately failing source.

Rejection sampling is chosen over constructive cycle-building or swap repair
because each valid permutation is accepted with equal probability, which gives
the uniform distribution the requirements demand. The cap is a safety net, not
an expected path; at n = 4..30 the acceptance rate is roughly 0.2–0.5.

### D4: Input normalisation and duplicate policy

`prepare` splits on line breaks (`\r\n` or `\n`), trims each line, drops empty
lines, and preserves everything else. Duplicate detection compares entries after
trimming and lower-casing with `toLowerCase()`; the first repeated entry is
reported using the spelling the host typed. Case-insensitive comparison is a
deliberate choice: `Alice` and `alice` cannot be distinguished reliably in a
party setting, and silently keeping both would produce an ambiguous result.

The participant count check lives in `generate`, not `prepare`, so the
feasibility rule is part of the assignment capability and has a single source of
truth. The `n = 3` warning is returned alongside a successful assignment as a
non-fatal `warning` field.

### D5: State, persistence, and reveal model

The only persisted state is the raw name text / parsed list, under a versioned
local-storage key (`gift-exchange.names.v1`). Reads and writes are wrapped in
`try/catch`; failure is non-fatal. Assignments and reveal state are held only in
memory and are discarded on reload.

The result is a real `<ul>` with one `<li>` per giver. Each item contains a
`<button type="button" aria-expanded="false" aria-controls="recipient-N">` for
the giver and a `<span id="recipient-N" hidden>` for the recipient. Using the
`hidden` attribute keeps unrevealed recipients out of the accessibility tree as
well as out of view. Activating a button flips only that item; a separate
show-all button flips all items and updates every `aria-expanded`. After
generation, focus moves to the result heading (`tabindex="-1"`), and status
messages go to a single `aria-live="polite"` region with `aria-atomic="true"`.

Alternative rejected: CSS-only visibility for recipients, which would leave
hidden names readable by screen readers and in page text.

### D6: Copy and print

Copy tries `navigator.clipboard.writeText` with the full `giver gives to
recipient` text. If it rejects (common under `file://` or denied permission),
the app falls back to a temporary textarea plus `document.execCommand("copy")`.
If both fail, it reveals a read-only textarea containing the text and announces
that manual copying is needed. The result is never discarded.

The print stylesheet forces recipients visible (print is an explicit organiser
action), switches to black on white, hides the form and controls, avoids
breaking list items across pages, and adds a left margin wide enough to cut
slips. Reveal state is not consulted when printing.

### D7: Testing with Node's built-in runner

`tests/assignment.test.js` uses `node:test` and `node:assert`, requiring
`../assignment.js`; no package installation. Coverage:

- `prepare`: trimming, blank-line removal, duplicate rejection, internal
  spacing preservation.
- `generate`: n = 1 and n = 2 return `TOO_FEW`; n = 3 returns a single 3-cycle
  and a warning.
- n = 4..30, 10,000 assignments each, asserting no self-gift, no 2-cycle,
  one giver and one recipient per participant.
- n = 4 coverage: all structurally valid assignments appear (the requirements
  say "12 valid 4-cycles"; the correct count of permutations with no fixed
  point and no 2-cycle is 6, so the test asserts all six).
- Injected random source that always produces an invalid permutation trips
  `RETRY_LIMIT`; a tampered assignment fails `verify`.
- A headless run with no `document` global, proving the core is DOM-free.

Browser-only concerns (keyboard flow, live-region announcements, print layout,
`file://` loading, clipboard fallback) are checked manually against the
scenarios in the specs; they are not worth a browser automation dependency for
this size of app.

### D8: Styling

One `styles.css` with custom properties for colours and spacing, a light
default, a `prefers-color-scheme: dark` block, a `prefers-reduced-motion:
reduce` block that removes transitions, a narrow-viewport layout, and a print
block. No external fonts; the system font stack is sufficient.

## Risks / Trade-offs

- **Rejection sampling could hit the retry cap in principle** → the cap is
  10,000 against acceptance rates near 0.2, so the failure probability is
  negligible; if it happens the app reports an error instead of rendering an
  invalid assignment.
- **Large test matrix is slow** → 270,000 generated assignments is still a
  seconds-scale Node run; if it becomes annoying, the loop count can be lowered
  without changing the invariant coverage, but the requirements ask for 10,000.
- **Case-insensitive duplicate detection can merge two genuinely distinct
  people who differ only by case** → accepted trade-off; names that collide
  that closely are ambiguous for reveal and clipboard output anyway.
- **Clipboard access is restricted in some contexts** → explicit fallback path
  and a visible manual-copy field, with a clear status message.
- **Print exposes every recipient** → intentional for the organiser's printing
  step; the on-screen per-person reveal remains the default way to hand the
  page around.
- **Two script files instead of the README's single `app.js`** → the extra file
  buys DOM-free testing; the README's planned shape will be updated as part of
  the change.

## Migration Plan

Greenfield addition: create `index.html`, `styles.css`, `assignment.js`,
`app.js`, and `tests/assignment.test.js`, then update `README.md` status and
usage. No data migration. Rollback is deleting the new files; `requirements.md`
and the OpenSpec history remain untouched.
