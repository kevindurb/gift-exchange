# Proposal

## Why

The app currently suppresses the favicon with `<link rel="icon" href="data:," />`,
so browser tabs, bookmarks, and history entries show a generic blank icon. A
recognisable, playful icon makes the shared link easier to spot among open tabs
and gives the page a small amount of personality at no cost.

## What Changes

- Replace the blank favicon link in `index.html` with an inline SVG data URI that
  renders a wrapped-gift emoji (`🎁`) as the page icon.
- Keep the icon entirely embedded: no new image file, no additional HTTP
  request, and no change to the GitHub Pages publication allowlist.
- Leave the existing `<link rel="icon">` position and the rest of the document
  head unchanged.

Assumption recorded for review: the emoji is `🎁` (wrapped gift), chosen as the
most legible gift-exchange symbol at favicon sizes. Swapping in another emoji
later is a one-line change.

Explicit non-goals:

- No `favicon.ico`, PNG, or `manifest.webmanifest`; no installable PWA icons.
- No new files or build assets, so `.github/workflows/ci.yml` and `README.md`
  need no changes.
- No change to the page title, meta description, or visible header branding.
- No browser-specific icon variants or `apple-touch-icon`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-runtime`: add a requirement that the page declares an emoji favicon inline
  in the document, and that doing so introduces no runtime network request or
  new build step.

## Impact

- Modified file: `index.html` (one `<link rel="icon">` attribute).
- No changes to `styles.css`, `assignment.js`, `app.js`, tests, or CI.
- No new dependencies, files, or server configuration.
- Works both from `file://` and over HTTP, preserving the existing static,
  offline-capable delivery model.
