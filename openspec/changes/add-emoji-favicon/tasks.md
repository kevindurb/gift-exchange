# Tasks

## 1. Replace the favicon markup

- [x] 1.1 In `index.html`, replace `<link rel="icon" href="data:," />` with a `<link rel="icon">` whose `href` is the percent-encoded SVG data URI from `design.md` rendering `🎁`; verify with `grep -n 'rel="icon"' index.html` that the link uses `data:image/svg+xml` and no longer uses the empty `data:,` value.
- [x] 1.2 Confirm the edit changed nothing else in the document head or body: `git diff -- index.html` shows only the favicon line, and `git diff --stat` lists no new files.

## 2. Verify the icon and static delivery

- [x] 2.1 Open `index.html` directly from disk in a current browser and verify the tab shows a gift emoji icon rather than a blank or default icon, at both normal and narrow window widths.
- [x] 2.2 In the browser's developer tools, load the page and verify the Network panel shows no request for `favicon.ico` or any separate icon asset, then repeat with the page served by `python3 -m http.server 8000` and confirm the icon still renders.
- [x] 2.3 Run `node --test tests/` and verify the existing assignment-engine suite still passes, confirming the markup-only change did not affect app behaviour.

## 3. Verify the published site

- [x] 3.1 After the change reaches `main` and the Pages workflow succeeds, open <https://kevindurb.github.io/gift-exchange/> (allowing for the documented cache delay) and verify the browser tab shows the gift emoji favicon.
- [x] 3.2 Verify the deploy published the updated `index.html` unchanged by comparing `curl -sS https://kevindurb.github.io/gift-exchange/ | grep -o 'rel="icon" href="[^"]*"'` with the local `index.html` value; the two match.
