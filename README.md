# Gift Exchange

A tiny, dependency-free web app for running a Christmas gift exchange (Secret
Santa). You paste in a list of names, hit generate, and it tells you who gives
to whom.

The only hard rule: **nobody is ever in a pair**. Every giver's recipient is
distinct, and the resulting assignment graph is built out of cycles of length
three or more. So if Alice gives to Bob, Bob cannot give to Alice — that loop
has to be at least `A -> B -> C -> A`.

Everything runs in the browser. No server, no accounts, no build step, no
tracking, and no network calls.

## Status

Working, and hosted at <https://kevindurb.github.io/gift-exchange/>. The app is
a static page with a pure assignment engine, tests for the engine, and a print
stylesheet for handing out paper slips.

## Files

```
gift-exchange/
  index.html               # single page, markup only
  styles.css               # vanilla CSS, light/dark and print styles
  assignment.js            # pure assignment logic, no DOM access
  app.js                   # DOM wiring: input, reveal, copy, print
  tests/assignment.test.js # node:test suite for the engine
  .github/workflows/ci.yml # test gate and GitHub Pages deploy
  requirements.md          # spec and algorithm notes
  README.md
```

## Usage

Open <https://kevindurb.github.io/gift-exchange/>, or open `index.html`
directly in a current browser. It works from `file://` because both scripts are
plain `<script defer>` tags, not modules.

Or serve the folder with any static server:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

Enter at least three names, one per line. Blank lines are ignored; duplicate
names (ignoring case) are rejected with a message naming the duplicate. The
name list is kept in `localStorage`, but assignments are never persisted, so a
refresh does not reveal last time's result.

## How the assignment works

Naive shuffling until it "looks right" is a trap: it either rejects valid
results or biases which results you get. The app uses uniform rejection
sampling over permutations — Fisher–Yates shuffle, check the permutation for
fixed points and two-cycles, retry on failure. For typical party sizes it
converges in a handful of tries and every valid assignment is equally likely.
The accepted permutation is re-checked independently before it is displayed.
Details and edge cases are in [`requirements.md`](./requirements.md).

## Testing

The assignment engine has no DOM dependency, so its tests run with Node's
built-in test runner and no packages:

```sh
node --test tests/
```

The suite covers input normalisation, duplicate rejection, infeasible
participant counts, the three-person warning, 10,000 generated assignments for
each size from 4 to 30, the six valid four-person assignments, retry limits,
and tamper detection.

## Deployment

Pushes to `main` run the test suite and then publish to GitHub Pages at
<https://kevindurb.github.io/gift-exchange/>. Pull requests and other branches
run the same tests but never publish.

The site is assembled from exactly four files — `index.html`, `styles.css`,
`assignment.js`, and `app.js` — so repository docs, OpenSpec artifacts, and
tests are not served. Adding a runtime asset means adding it to the copy step in
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

Pages is configured with **Source: GitHub Actions** (Settings → Pages). The
workflow cannot enable Pages itself because that requires a token other than the
automatic `GITHUB_TOKEN`.

To roll back, re-run a previous successful workflow run; it republishes that
run's files. If GitHub reports an in-progress deployment, wait for the previous
one to settle and re-run. GitHub Pages caches responses for up to ten minutes,
so a fresh deploy can take a few minutes to appear.

## License

Not decided yet.
