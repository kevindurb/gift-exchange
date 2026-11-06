# Design

## Context

See `proposal.md` for motivation. The current `index.html` head contains
`<link rel="icon" href="data:," />`, an empty data URI that deliberately stops
the browser from requesting `/favicon.ico`. The app is published as an explicit
four-file allowlist by `.github/workflows/ci.yml`, so adding a separate icon
file would also mean changing the deploy copy step and the documented file set.
The app must keep working from `file://` and with no network access.

## Goals / Non-Goals

**Goals:**

- Show a recognizable gift emoji favicon in the browser tab.
- Keep the icon inline so no file, request, CI change, or build step is added.
- Preserve the existing static, offline-capable delivery model.

**Non-Goals:**

- Cross-browser pixel-perfect icon rendering; emoji glyphs vary by platform.
- Multiple icon sizes, `apple-touch-icon`, maskable icons, or a web manifest.
- Changing the page title, visible header, or any other branding.

## Decisions

### Inline SVG data URI rather than an image file

Use one `<link rel="icon">` with a `data:image/svg+xml` URI containing an SVG
`<text>` element that renders `🎁`. This keeps the icon in the already-published
`index.html`, avoids touching the CI allowlist, and works when the page is
opened from disk. Alternatives considered:

- **`favicon.ico` or `favicon.svg` file**: more conventional and allows
  hand-drawn artwork, but adds a published asset, a CI copy-step change, and a
  request (or another inlined asset). Unnecessary for a single emoji.
- **`<link rel="icon" href="data:image/png;base64,...">`**: renders consistently
  but requires generating and maintaining a binary blob in the HTML.
- **Emoji inside the SVG via `<text>`**: simple, theme-independent, and easy to
  change to another emoji, at the cost of platform-dependent glyph appearance.

### URL-encode the SVG data URI

Write the attribute with percent-encoded `#`, `<`, `>`, quotes, and `&` (or use
single quotes inside a double-quoted attribute plus encoded angle brackets) so
the markup stays valid HTML and the URL survives all browsers. A representative
value is:

```
data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8E%81%3C/text%3E%3C/svg%3E
```

Use a `viewBox` and `font-size` near the full canvas so the emoji fills the
16-pixel tab area rather than appearing as a tiny glyph.

### Keep the icon purely decorative

The favicon has no accessibility tree role and needs no `alt` text. Do not
change surrounding head metadata or add `sizes`/`type` attributes that the
inline SVG does not need.

## Risks / Trade-offs

- **Emoji rendering varies by OS and browser** (colour vs monochrome, different
  gift artwork) → accepted; the icon remains recognizable and on-theme. The
  emoji is a single character that can be swapped later.
- **Some older browsers ignore SVG favicons** → they fall back to no favicon,
  which is the current behaviour, so no regression.
- **Encoding mistakes break the data URI** → verify by loading the page and
  checking the tab icon, and by confirming the attribute is valid HTML.
- **An inline data URI adds a few hundred bytes to `index.html`** → negligible
  compared with the existing page and preferable to another request or file.

## Migration Plan

Replace the existing `data:,` favicon link in `index.html` in one commit.
Rollback is reverting that line; there is no stored state, cache, or deployment
configuration to unwind. The next Pages deploy republishes the same four files.
