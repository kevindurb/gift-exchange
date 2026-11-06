# Proposal

## Why

The app works, but it has no hosted URL: using it today means cloning the repo
or running a local server. The repository is now public on GitHub with `main`
as the only branch, so GitHub Pages and GitHub Actions can provide a stable,
shareable URL at no cost and with no new runtime dependencies. Hosting alone is
not enough, though: a direct branch deploy would publish a broken engine just
as readily as a working one. The deploy needs to be gated on the existing test
suite.

## What Changes

- Add one GitHub Actions workflow that runs the existing engine suite with
  `node --test tests/` on every push and pull request.
- On pushes to `main` only, and only after that suite passes, publish the app to
  GitHub Pages and report the resulting URL as a deployment.
- Publish an explicit allowlist of four files (`index.html`, `styles.css`,
  `assignment.js`, `app.js`) so repository docs, OpenSpec artifacts, and tests
  are not served by the site. Every deploy replaces the published site wholesale.
- Document the live URL, the test gate, and the rollback route in `README.md`.
- Enable Pages once with the GitHub Actions source. This is a repository
  setting, not a file change, and must happen before the first deploy because
  the workflow cannot bootstrap Pages with `GITHUB_TOKEN`.

Explicit non-goals:

- No custom domain, `CNAME`, or DNS configuration.
- No pull-request preview deployments; the free Pages model has one site.
- No new tests, browser automation, linting, or formatting checks.
- No build, bundling, minification, or other transformation of the published
  files. CI copies them unchanged, so the app remains reproducible from the
  repository with no toolchain.
- No cache-busting or asset fingerprinting. GitHub Pages' inherited ten-minute
  cache is accepted.
- No branch protection or required-reviewer configuration.

## Capabilities

### New Capabilities

- `deployment-pipeline`: how the app is tested and published — the test gate,
  the exact set of published files, the address the site is served from, and
  the guarantee that publishing does not alter the app.

### Modified Capabilities

None. `app-runtime` still describes how the app is delivered (static files, no
build step, no runtime network calls); copying those files to a host does not
change any of its requirements.

## Impact

- New file: `.github/workflows/ci.yml`.
- Modified file: `README.md` (live URL, deployment notes, status).
- No changes to `index.html`, `styles.css`, `assignment.js`, or `app.js`.
- No new dependencies, no `package.json`, no lockfile, no build output.
- One-time repository configuration: Pages source must be set to GitHub Actions
  before the first push that attempts a deploy.
- The repository is public, so Actions minutes are free and fork pull requests
  receive a read-only token with no secrets.
