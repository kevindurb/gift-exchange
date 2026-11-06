# Spec Delta

## Purpose

Test the app on every proposed change and publish exactly the files the app needs to GitHub Pages, so the hosted site is always a tested, unmodified copy of the repository.

## ADDED Requirements

### Requirement: Test gate before publication

The pipeline SHALL publish the site only after the project's automated test suite passes for the exact commit being published. A commit whose tests fail SHALL NOT become the published site.

#### Scenario: Failing tests block a deploy

- **WHEN** a commit is pushed to `main` and its automated test suite fails
- **THEN** no new site content is published and the run reports the test failure

#### Scenario: Passing tests allow a deploy

- **WHEN** a commit is pushed to `main` and its automated test suite passes
- **THEN** that commit's files become the published site

### Requirement: Publication only from the default branch

The pipeline SHALL run tests for every push and pull request but SHALL publish only from the default branch (`main`).

#### Scenario: Pull request runs tests without publishing

- **WHEN** a pull request is opened or updated
- **THEN** the test suite runs and no site content is published

#### Scenario: Feature branch push does not publish

- **WHEN** a commit is pushed to a branch other than `main`
- **THEN** the test suite runs and no site content is published

### Requirement: Explicit published file set

The published site SHALL contain only the files the app requires at runtime: `index.html`, `styles.css`, `assignment.js`, and `app.js`. Repository documentation, OpenSpec artifacts, tests, and workflow configuration SHALL NOT be served by the site.

#### Scenario: Runtime files are served

- **WHEN** the site is requested at its root URL
- **THEN** the app's HTML, stylesheet, assignment engine, and browser script are all available

#### Scenario: Documentation is not served

- **WHEN** a visitor requests a repository document such as `requirements.md` or `README.md` from the site
- **THEN** the site responds that the resource does not exist

#### Scenario: Tests and specs are not served

- **WHEN** a visitor requests a path under `tests/` or `openspec/` from the site
- **THEN** the site responds that the resource does not exist

#### Scenario: A deploy replaces the previous site

- **WHEN** a file is removed from the published set and a new deploy completes
- **THEN** the removed file is no longer served, rather than being retained from an earlier deploy

### Requirement: Stable site address and subpath-safe resources

The site SHALL be served at the repository's GitHub Pages project URL, `https://kevindurb.github.io/gift-exchange/`, and every stylesheet and script reference SHALL resolve relative to that path.

#### Scenario: Root URL serves the app

- **WHEN** the Pages URL is opened
- **THEN** the gift exchange app loads and is usable

#### Scenario: Assets resolve under the project path

- **WHEN** the page is loaded from the project path rather than a domain root
- **THEN** the stylesheet and both scripts load successfully

### Requirement: Unmodified publication

Published files SHALL be byte-identical to the files committed in the repository at the deployed commit. The pipeline SHALL NOT minify, bundle, template, inject content into, or otherwise transform them.

#### Scenario: Published bytes match the repository

- **WHEN** a deployed file is downloaded from the site and compared with the same file at the deployed commit
- **THEN** the contents are identical

### Requirement: Serialized publishing

Publishing SHALL be serialized so that at most one deploy is in progress at a time, and a deploy that has started SHALL NOT be cancelled by a later push. A newer push SHALL publish after the in-progress deploy finishes.

#### Scenario: Rapid consecutive pushes

- **WHEN** two commits are pushed to `main` in quick succession and both pass tests
- **THEN** the first deploy completes without being cancelled and the second deploy follows it, leaving the newer commit published

### Requirement: Deployment record and rollback

Each publication SHALL create a deployment record that identifies the published commit and the site URL. Re-running a previous successful publication SHALL restore that publication's files.

#### Scenario: Deployment is recorded

- **WHEN** a deploy completes
- **THEN** a deployment record names the published commit and the site URL

#### Scenario: Rollback by re-running a previous deploy

- **WHEN** an earlier successful publication is re-run
- **THEN** the files from that earlier commit are published again

### Requirement: Manual publication on demand

An operator SHALL be able to run the pipeline manually against the default branch without pushing a new commit.

#### Scenario: Manual run publishes the current default branch

- **WHEN** the pipeline is started manually while `main` is selected
- **THEN** the test suite runs and, if it passes, the current `main` files are published

### Requirement: No stored credentials or repository writes

Publishing SHALL NOT require stored secrets, and the pipeline SHALL NOT modify repository contents. Its only write access SHALL be the short-lived workflow token's permission to deploy to Pages.

#### Scenario: Deploy needs no configured secrets

- **WHEN** the repository has no actions secrets configured
- **THEN** the pipeline can still test and publish

#### Scenario: Repository is left unchanged

- **WHEN** a publish completes
- **THEN** no commit, tag, or branch has been created or modified by the pipeline
