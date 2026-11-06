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

Working. The app is a static page with a pure assignment engine, browser tests
for the engine, and a print stylesheet for handing out paper slips.

## Files

```
gift-exchange/
  index.html              # single page, markup only
  styles.css              # vanilla CSS, light/dark and print styles
  assignment.js           # pure assignment logic, no DOM access
  app.js                  # DOM wiring: input, reveal, copy, print
  tests/assignment.test.js # node:test suite for the engine
  requirements.md         # spec and algorithm notes
  README.md
```

## Usage

Open `index.html` directly in a current browser. It works from `file://`
because both scripts are plain `<script defer>` tags, not modules.

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

## License

Not decided yet.
