# Gift Exchange — Requirements

## 1. Purpose

A single-page, client-only web app that turns a list of participant names into
a Christmas gift exchange ("Secret Santa") assignment: for each person, exactly
one recipient.

No backend, no build step, no framework, no network calls at runtime.

## 2. Core constraint: minimum cycle length 3

The assignment is a permutation of the participant list, where a permutation
maps each giver to their recipient. Two properties must always hold:

1. **No fixed points** — you never give to yourself.
2. **No 2-cycles** — if Alice gives to Bob, Bob must not give to Alice.

Property 2 is the interesting one. It means the permutation's cycle
decomposition contains **only cycles of length >= 3**. Equivalently: the
assignment graph is a set of disjoint loops, each of which involves at least
three people. Any `A -> B -> A` pair is a bug, not a nicety.

Examples:

| Participants | Valid | Invalid |
| --- | --- | --- |
| A, B, C | `A->B, B->C, C->A` | `A->B, B->A, C->C` (2-cycle + fixed point) |
| A, B, C, D | `A->B, B->C, C->D, D->A` | `A->B, B->A, C->D, D->C` (two 2-cycles) |
| A..F | two 3-cycles: `A->B, B->C, C->A` + `D->E, E->F, F->D` | any pairing |

## 3. Feasibility

- **n < 3**: no valid assignment exists. The app must refuse to generate and
  explain why rather than producing a broken result. (With two people the only
  derangement is a 2-cycle; with one, a fixed point.)
- **n = 3**: exactly one structure is possible — a single 3-cycle. Valid, but
  every giver's recipient is fully determined by the others, so warn the user
  that the exchange is trivially guessable.
- **n >= 4**: always feasible.

## 4. Algorithm

**Uniform rejection sampling over permutations.** Do not use ad-hoc swap loops;
they bias the distribution and can loop badly at small n.

```
loop (bounded, e.g. 10000 attempts):
  p = fisherYatesShuffle(indices)
  if p has no fixed point and no 2-cycle: accept p
```

Details that matter:

- **Fisher–Yates**, not `sort(() => Math.random() - 0.5)` — the latter is
  biased and would skew results even before the constraint filter.
- **Acceptance rate** is fine in practice: for n = 4 it is ~0.50, for n = 5
  ~0.20, for n >= 6 it stabilizes around ~0.22. Expected retries are a handful.
  A 10000-attempt cap is a safety net, not a normal path; if it trips, report
  an error instead of returning an invalid assignment.
- **Uniformity**: because each valid permutation is accepted with equal
  probability, the output is uniformly distributed over all valid assignments.
  This is the reason for rejection sampling rather than construction.
- **Verification is mandatory**: after generation, re-check the result
  independently (every giver present exactly once as giver, exactly once as
  recipient, no self-assignment, no 2-cycle) and refuse to render if it fails.
  Never trust the generator's own claim of success.

`crypto.getRandomValues` is preferable to `Math.random()` for the shuffle; no
secrecy is really at stake, but it is free.

## 5. Input

- A list of participant names, entered one of two ways (pick one and keep it
  simple): a textarea with one name per line, or an "add name" input that
  builds a list of removable entries. A textarea is the lower-effort option and
  handles pasting a list well.
- **Trim** whitespace on each entry; **drop** blank lines.
- **Duplicates**: reject with a clear message naming the duplicate. Do not
  silently de-duplicate — the user probably made a mistake.
- Names are treated as opaque strings; no emails, no addresses, no pairing of
  people with contact info.
- Optional but cheap: persist the current name list to `localStorage` so a
  refresh does not lose work. Assignments should **not** be persisted, to
  reduce the chance of someone opening the page and seeing last year's result.

## 6. Output

- A plain, readable list: `Alice gives to Bob`, one row per participant.
- **Copy to clipboard** as plain text (one line per pair).
- **Per-person reveal** preferred over dumping the whole list: a click/tap
  per giver to show that person's recipient, so the page can be handed around
  a room without spoiling everyone. A "show all" toggle is fine for the person
  organizing.
- **Print stylesheet**: white background, black text, no interactive
  affordances, and enough left margin to cut the list into strips if the host
  wants to hand out paper slips.
- Nothing is sent anywhere. No analytics, no external fonts, no CDN scripts.

## 7. Non-goals

- No exclusions ("Alice and Bob are siblings, keep them apart"). This is a
  likely future feature; if it is added, it changes the algorithm from
  rejection sampling to a constrained sampler and needs its own design pass.
- No multi-group exchanges, no budget tracking, no wishlists.
- No accounts, no sharing links, no server storage.

## 8. Technical constraints

- Vanilla HTML, CSS, and JavaScript. ES modules are fine when served over
  HTTP; the app should also work opened directly from the filesystem, which
  means either a single script file or plain `<script>` tags (module scripts
  are blocked under `file://` by CORS). **Prefer plain `<script defer>`** for
  that reason.
- No bundler, no npm dependencies, no transpilation. Code should run as-is in
  a current browser.
- No global namespace pollution beyond a single entry point.
- Keep the whole app under a few hundred lines; it is a small tool.

## 9. Accessibility and UX

- All controls reachable by keyboard; visible focus states.
- The result list uses real list semantics, not divs with `onclick`.
- Errors are announced (an `aria-live` region) and are specific: "Need at
  least 3 names, you have 2" beats "Invalid input".
- Works on a phone — this will get passed around at a party.
- Respect `prefers-color-scheme` and `prefers-reduced-motion` if any styling
  or animation is added.

## 10. Testing

Even without a framework, the assignment logic must be testable in isolation:

- Pure function: `(names) -> assignment | error`, no DOM access inside it.
- A `tests.html` page or a small `node --test` file that runs at least:
  - n = 1, 2 rejected with the right error;
  - n = 3 produces a single 3-cycle;
  - n = 4..30: 10,000 generated assignments each, asserting zero self-gifts,
    zero 2-cycles, every giver and recipient used exactly once;
  - distribution sanity: for n = 4, all 12 valid 4-cycles appear over enough
    trials (coarse chi-square or just a coverage check).
