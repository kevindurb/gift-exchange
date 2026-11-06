# Proposal

## Why

The repository currently contains only `requirements.md` and a README describing
the planned app; there is no working gift-exchange tool yet. The project needs
its first implementation so a host can turn a list of names into a valid Secret
Santa assignment without a server, build step, or network access.

The defining constraint is that no participant is ever in a two-person pair:
every assignment must decompose into cycles of length three or more. A naive
shuffle-and-retry or ad-hoc swap loop is easy to get subtly wrong, so the
algorithm needs to be specified, isolated, and tested rather than improvised.

## What Changes

- Add a static, dependency-free web app (`index.html`, `styles.css`, `app.js`)
  that runs either from a static HTTP server or directly from `file://`.
- Add a pure assignment engine that:
  - rejects fewer than three participants with a specific error;
  - warns that a three-person exchange is trivially guessable;
  - uses Fisher–Yates shuffling with a cryptographic random source, uniform
    rejection sampling over permutations, a bounded retry cap, and independent
    post-generation verification of every invariant.
- Add participant entry: one name per line in a textarea, trimmed, blank lines
  dropped, and duplicates rejected with a message naming the duplicate.
- Add assignment output: a readable `Alice gives to Bob` list, per-person reveal
  with a "show all" toggle, copy-to-clipboard as plain text, and a print
  stylesheet suitable for cutting into slips.
- Add accessibility and delivery behaviour: keyboard-operable controls, visible
  focus, real list semantics, errors in an `aria-live` region, phone-friendly
  layout, and respect for `prefers-color-scheme` / `prefers-reduced-motion`.
- Add automated tests for the pure engine (rejections, cycle structure,
  invariant checks across n = 4..30, and a distribution coverage check), plus a
  way to run them without a build step.
- Persist only the participant name list to `localStorage`; assignments are
  never persisted.

## Capabilities

### New Capabilities

- `participant-input`: collecting, trimming, validating, and optionally
  persisting the participant name list, including duplicate and short-list
  errors.
- `assignment-generation`: feasibility rules, the uniform rejection-sampling
  algorithm, retry limits, and mandatory invariant verification for the pure
  assignment function.
- `assignment-reveal`: rendering assignments, per-person reveal and show-all
  behaviour, copying as plain text, and print output.
- `app-runtime`: zero-dependency delivery and cross-cutting UX guarantees —
  `file://` and static-server operation, no network calls or third-party
  assets, keyboard and screen-reader accessibility, mobile layout, and
  user-preference media queries.

### Modified Capabilities

None. The project has no existing specs.

## Impact

- New files: `index.html`, `styles.css`, `app.js`, and a test entry point
  (e.g. `tests.html` and/or `test/assignment.test.js`).
- No new runtime dependencies, no bundler, no build step, no network calls.
- `README.md` will need its "Status" and usage notes updated once the app
  exists; `requirements.md` remains the source requirements.
- Out of scope for this change: exclusions/constraints between specific people,
  multi-group exchanges, budgets, wishlists, accounts, sharing links, and
  server storage.
