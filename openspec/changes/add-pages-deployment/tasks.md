# Tasks

## 1. Enable Pages

- [x] 1.1 Enable GitHub Pages for `kevindurb/gift-exchange` with Source set to **GitHub Actions** (Settings → Pages, or the equivalent Pages API call), and verify with `gh api repos/kevindurb/gift-exchange/pages --jq '.build_type, .html_url'` that the build type is `workflow` and the URL is `https://kevindurb.github.io/gift-exchange/`.

## 2. Workflow and test gate

- [x] 2.1 Create `.github/workflows/ci.yml` with the workflow name, triggers (`push` on all branches, `pull_request`, `workflow_dispatch`), top-level `permissions: contents: read`, and workflow-level concurrency (`group: ${{ github.workflow }}-${{ github.ref }}`, cancelling only pull-request runs), and verify the file parses with `yq '.' .github/workflows/ci.yml`.
- [ ] 2.2 Add the `test` job using `actions/checkout@v7`, `actions/setup-node@v7` with `node-version: 26` and no `cache` input, then `node --test tests/`; verify the job passes on the implementation branch and that `gh api repos/kevindurb/gift-exchange/deployments --jq 'length'` is unchanged, proving branch runs publish nothing.

## 3. Package and deploy

- [ ] 3.1 Add the `package` job with `needs: test` and the `main`-only condition, staging `_site/` with exactly `index.html`, `styles.css`, `assignment.js`, and `app.js` (an adjacent comment records that list), then uploading it with `actions/upload-pages-artifact@v5` and `path: _site`; verify a `main` run's `github-pages` artifact contains exactly those four files via `gh run download <run-id> -n github-pages -D /tmp/pages && tar -tf /tmp/pages/artifact.tar`.
- [ ] 3.2 Add the `deploy` job with `needs: package` and the same `main`-only condition, `environment: github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`, job permissions `pages: write` and `id-token: write`, job-level concurrency `group: pages` / `cancel-in-progress: false`, and `actions/deploy-pages@v5`; verify the first `main` run creates a deployment whose `sha` matches the pushed commit (`gh api repos/kevindurb/gift-exchange/deployments --jq '.[0].sha'`) and whose job reports the Pages URL.

## 4. Documentation

- [x] 4.1 Update `README.md` with the live URL, a Deployment section covering the push-to-`main` → tests → publish flow, the four-file publication set, the one-time Pages setting, the ten-minute cache caveat, and rollback by re-running a previous successful run; verify every URL, path, and command in the section matches the workflow and the Pages configuration.

## 5. Integration verification

- [ ] 5.1 Verify the live site serves the app: `curl -sSI https://kevindurb.github.io/gift-exchange/` and each of `styles.css`, `assignment.js`, and `app.js` return 200, while `requirements.md`, `tests/assignment.test.js`, and `openspec/specs/app-runtime/spec.md` return 404; then open the URL in a browser and generate an assignment end to end.
- [ ] 5.2 Verify publication is unmodified by comparing `curl -sS https://kevindurb.github.io/gift-exchange/assignment.js | sha256sum` with `sha256sum assignment.js` at the deployed commit; the digests match.
- [ ] 5.3 Verify the test gate on a scratch branch by adding a temporary failing test, pushing the branch, and confirming the `test` job fails while `package` and `deploy` are skipped and no deployment is added; then delete the branch and confirm the temporary failing test was never merged.
- [ ] 5.4 Verify manual publication with `gh workflow run ci.yml --ref main`, watching the run to confirm tests pass and a new deployment is recorded.
- [ ] 5.5 Verify rollback by re-running a previous successful run with `gh run rerun <run-id>`, confirming a new deployment is recorded for that run's commit and the site still serves successfully.
