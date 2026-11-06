# Gift Exchange

A tiny, dependency-free web app for running a Christmas gift exchange (Secret
Santa). You paste in a list of names, hit generate, and it tells you who gives
to whom.

The only hard rule: **nobody is ever in a pair**. Every giver's recipient is
distinct, and the resulting assignment graph is built out of cycles of length
three or more. So if Alice gives to Bob, Bob cannot give to Alice — that loop
has to be at least `A -> B -> C -> A`.

Everything runs in the browser. No server, no accounts, no build step, no
tracking.

## Status

Early. The repository currently contains the plan (`requirements.md`) and
nothing else. The app itself is not written yet.

## Planned shape

```
gift-exchange/
  index.html      # single page, markup only
  styles.css      # vanilla CSS, no preprocessor
  app.js          # vanilla ES modules, no bundler
  requirements.md # spec and algorithm notes
  README.md
```

## Usage (once built)

Open `index.html` in a browser, or serve the folder with any static server:

```sh
python3 -m http.server 8000
```

## How the assignment works

Naive shuffling until it "looks right" is a trap: it either rejects valid
results or biases which results you get. The plan is uniform rejection
sampling over permutations — shuffle, check the permutation for fixed points
and two-cycles, retry on failure. For typical party sizes it converges in a
handful of tries and every valid assignment is equally likely. Details and
edge cases are in [`requirements.md`](./requirements.md).

## License

Not decided yet.
