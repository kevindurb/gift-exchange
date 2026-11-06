# Design

## Context

See `proposal.md` for motivation. The current repository state that shapes this
design:

- Four runtime files (`index.html`, `styles.css`, `assignment.js`, `app.js`),
  no `package.json`, no lockfile, no build output.
- Tests run with the stock Node test runner: `node --test tests/` — 39 cases,
  about four seconds, no install step. Local Node is 26.10.0.
- The repository is public, `main` is the only branch, and there is no
  `.github/` directory. Pages is not enabled (`has_pages: false`).
- `app-runtime` requires the app to keep working from `file://` and over HTTP,
  with no build step and no runtime network calls. The app's asset references
  are already relative, so it works under a project subpath.
- GitHub Pages serves project sites under `/gift-exchange/` and sends
  `Cache-Control: max-age=600` for HTML and CSS (verified against a live Pages
  site). An artifact deployment replaces the published content wholesale; it
  does not merge with previous deployments.

## Goals / Non-Goals

**Goals:**

- One workflow that is readable in a single screen and makes it impossible for
  a failing commit to become the live site.
- Least-privilege publishing: no stored secrets, no repository writes, and
  deploy permissions confined to the job that needs them.
- An explicit, auditable publication set that contains no docs, specs, or tests.
- Published bytes identical to committed bytes, so the hosted app is
  reproducible without a toolchain.

**Non-Goals:**

- Pull-request preview environments, custom domains, and cache-busting.
- Node version matrices, dependency caching, or a `package.json` introduced
  only for CI.
- Browser automation for the manual accessibility and print checks.
- Enabling Pages from within the workflow.

## Decisions

### D1: Actions artifact deployment, not a branch deploy

The workflow stages the four files into `_site/`, uploads them with
`actions/upload-pages-artifact`, and publishes with `actions/deploy-pages`.

Alternatives rejected:

- **Pages serving `main` directly from repository root.** Zero workflow files,
  but it publishes `README.md`, `requirements.md`, `openspec/`, and `tests/`,
  and it deploys every push regardless of test results. It fails the two
  requirements this change exists for.
- **Pushing a `gh-pages` branch.** Needs a third-party action or a manual
  commit-back step, adds a branch to maintain, and still requires a separate
  test gate. It also writes to the repository, contradicting the no-writes
  requirement.
- **Deploying the repository root via artifact.** `upload-pages-artifact`
  excludes `.git` and `.github` and hidden files, but nothing else, so docs,
  specs, and tests would still be served.

### D2: One workflow file, three jobs

`.github/workflows/ci.yml` contains:

1. `test` — runs on every trigger.
2. `package` — `needs: test`, only on `main`; stages `_site/` and uploads the
   Pages artifact.
3. `deploy` — `needs: package`, only on `main`; holds `pages: write` and
   `id-token: write` and runs `deploy-pages`.

One file with `needs:` makes the test gate structural rather than a convention.
A second `deploy.yml` would either duplicate the test steps or require
`workflow_run` plumbing, which is harder to follow and easy to get wrong.
Splitting `package` from `deploy` keeps the deploy credential off the job that
checks out and reads source files; the extra runner start costs about ten
seconds.

Alternative considered: a two-job version with staging inside the deploy job.
Fewer moving parts, but it puts `pages: write` and `id-token: write` on the job
that also checks out the repository, for no benefit at this size.

### D3: Triggers and the deploy condition

Triggers are every branch push (`branches: ["**"]`), `pull_request`, and
`workflow_dispatch`. Branch pushes must run the tests — the "publication only
from the default branch" requirement is about where a deploy may happen, not
about when tests run, and a trigger filtered to `main` would leave feature
branches untested. There is no `paths-ignore`: the suite takes four seconds, and
skipping docs-only changes would leave a required status check permanently
pending on such pull requests if branch protection is added later.

The `package` and `deploy` jobs are guarded by `github.ref == 'refs/heads/main'`,
so pushes to other branches and manual dispatches from them run tests but cannot
publish.

### D4: Two concurrency scopes

- Workflow level: `group: ${{ github.workflow }}-${{ github.ref }}` with
  `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` so superseded
  pull-request runs are cancelled and main-branch runs are not.
- Deploy job level: `group: pages`, `cancel-in-progress: false`, so deployments
  serialize globally and a deploy in flight always finishes.

The starter workflow's single global `pages` group would also work, but it would
serialize pull-request runs and never cancel them, producing a queue of stale
runs on a chatty branch.

### D5: Literal allowlist for staging

The package job runs `mkdir -p _site` and copies exactly `index.html`,
`styles.css`, `assignment.js`, and `app.js`. The workflow carries a comment
pointing at that list, because adding a runtime asset later means editing it —
that is the deliberate cost of an explicit publication set.

Alternative rejected: a filesystem manifest, `.gitignore` filtering, or rsync
exclude patterns. `upload-pages-artifact` does not honor `.gitignore`, and an
allowlist is easier to audit than a set of exclusions.

### D6: Node 26, no setup-node cache

The `test` job uses `actions/setup-node` with `node-version: 26`. Node 26 became
LTS on 2026-10-28, matching the local runtime. There is no `cache:` input
because there is no lockfile to key a cache on, and no `package.json` or
`.nvmrc` is added: the suite runs on stock Node with no install step, and adding
manifests for CI alone would contradict the project's no-toolchain premise.

Alternative rejected: a 22/24/26 matrix. The tests only exercise the engine, and
nothing in the app or tests is Node-version sensitive; three runs would triple a
four-second job for no diagnostic value. Revisit if a `package.json` or a build
step ever appears.

### D7: Action versions and no configure-pages

Pin major tags: `actions/checkout@v7`, `actions/setup-node@v7`,
`actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`. `configure-pages`
is omitted: it is only needed for generator metadata or enablement, and plain
artifact publishing does not require it. SHA pinning is stronger supply-chain
practice but adds maintenance churn; the official `actions/*` major tags are
acceptable here.

### D8: Pages must be enabled before the first deploy

`configure-pages`'s `enablement` input explicitly requires a token other than
`GITHUB_TOKEN`, so the workflow cannot bootstrap Pages itself. The one-time
setup is Settings → Pages → Source: **GitHub Actions**. Doing this before the
first run avoids a confusing `Get Pages site failed` error that looks like a
workflow bug. This prerequisite is documented in `README.md`.

### D9: No cache-busting

GitHub Pages' ten-minute `max-age` is accepted. Query-string or hash stamping
would alter the published bytes and break the unmodified-publication
requirement; hashed filenames would require a build step. For a party utility,
staleness measured in minutes is not worth either trade.

### D10: Deployment records and rollback by re-run

`deploy-pages` creates a deployment under the `github-pages` environment and
exposes `page_url`, which the job records as its environment URL. Rolling back
means re-running an earlier successful run, which republishes that run's
artifact; the repository is not touched.

### D11: README as the operator manual

`README.md` gains the live URL, a short "Deployment" section (push to `main` →
tests → publish), the one-time Pages setting, and the rollback route. A workflow
status badge is optional; it is documentation, not an app runtime asset, so it
does not affect `app-runtime`.

## Risks / Trade-offs

- **Pages not enabled when the first deploy runs** → the deploy job fails with a
  site-not-found error. Mitigation: enable Pages first, then push; the task list
  orders it that way.
- **Ten-minute cache makes a deploy look missing** → verify in a private window
  or with a cache-busting query string; documented as expected behaviour rather
  than treated as a failure.
- **A new runtime file is forgotten in the allowlist** → the site 404s on it.
  Mitigation: keep the list adjacent to the copy step with a comment, and note
  the list in the README deployment section.
- **A new deploy can be rejected while Pages is still finalizing the previous
  one** → the job-level `pages` group serializes deploy jobs, but Pages' CDN
  purge can outlast the job, so `deploy-pages` may fail with "Deployment request
  failed ... due to in progress deployment". Recovery is to wait for the
  previous deployment to settle and re-run; if the Pages deployment is stuck in
  `purging_cdn`, cancel that deployment through the Pages deployments API
  first. Cancelling a build version is permanent — Pages will not deploy that
  SHA again — so when a re-run is rejected, the reliable rollback is to revert
  the commit and push a new one. A rapid pair of pushes may therefore need one
  retry.
- **Only the engine suite is gated; browser behaviour stays manual** → the
  hosted URL makes manual checks easier, and automating them would add a
  dependency the project avoids. Accepted, with no test additions in scope.
- **Deploy concurrency misconfiguration could interleave deployments** →
  the job-level `pages` group serializes deploys independently of the
  workflow-level key.
- **Major action tags can be superseded** → updates arrive as a deliberate edit
  to one line each; Dependabot is out of scope but can be added later without
  changing this design.
- **A failing direct push to `main` leaves the last good site live** → that is
  the intended gate; the run is red and no deployment is created.
- **The repository's project site shares its `github.io` origin with other
  project pages** → the app's storage key is already namespaced
  (`gift-exchange.names.v1`), so no collision; no action.

## Migration Plan

1. Enable Pages on the repository with Source: GitHub Actions. Confirm via the
   Pages API that the build type is `workflow`.
2. Add `.github/workflows/ci.yml` and the README updates in one commit on
   `main`.
3. The first run executes test → package → deploy and reports the site URL.
4. Verify the root URL loads the app, the stylesheet and scripts return 200, and
   `/requirements.md` and `/tests/assignment.test.js` return 404.
5. Later deploys simply follow pushes to `main`. Rollback is a re-run of the
   previous successful run.
