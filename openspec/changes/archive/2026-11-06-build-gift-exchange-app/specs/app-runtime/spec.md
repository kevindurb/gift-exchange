# Spec Delta

## Purpose

Deliver the app as static, offline-capable files that work when opened directly or served over HTTP, and keep every control usable with a keyboard, assistive technology, or a phone.

## ADDED Requirements

### Requirement: No-build static delivery

The system SHALL consist of static HTML, CSS, and JavaScript files that run without a build step, bundler, package installation, or transpilation, both when opened directly from the filesystem and when served over HTTP.

#### Scenario: Open from the filesystem

- **WHEN** the host opens the app's HTML file directly from disk in a current browser
- **THEN** the page loads, accepts names, and generates an assignment

#### Scenario: Serve over HTTP

- **WHEN** the app directory is served by any static file server
- **THEN** the same behaviour is available without a build or install step

### Requirement: No runtime network dependency

The system SHALL make no network requests at runtime and SHALL NOT load remote fonts, scripts, stylesheets, analytics, or other third-party assets.

#### Scenario: Offline use

- **WHEN** the browser has no network connection
- **THEN** the app loads and generates assignments normally

#### Scenario: No third-party requests

- **WHEN** the app is loaded and used
- **THEN** all scripts, styles, and assets come from the app's own files

### Requirement: Keyboard operability

The system SHALL make every control reachable and operable by keyboard and SHALL show a visible focus indicator on the focused control.

#### Scenario: Complete a flow with the keyboard only

- **WHEN** the host uses Tab to move through the page and activates controls with Enter or Space
- **THEN** they can enter names, generate an assignment, reveal recipients, and copy the list without a pointer

#### Scenario: Focus is visible

- **WHEN** a control receives keyboard focus
- **THEN** a visible focus indicator is shown

### Requirement: Semantic controls and lists

The system SHALL use native form controls and list semantics, so the assignment is marked up as a real list and interactive elements are buttons rather than non-semantic containers with click handlers.

#### Scenario: Assignment exposed as a list

- **WHEN** an assignment is displayed
- **THEN** assistive technology can identify it as a list with one item per giver

### Requirement: Accessible error announcements

The system SHALL announce errors through a live region and SHALL state the specific problem, including relevant counts or the offending name, rather than a generic failure message.

#### Scenario: Too few names is announced

- **WHEN** the host submits two names
- **THEN** the error is announced and states that at least three names are required and that two were supplied

### Requirement: Phone-sized layout

The system SHALL remain usable at phone widths without horizontal scrolling, with controls and text sized for touch.

#### Scenario: Narrow viewport

- **WHEN** the app is opened at a 360-pixel-wide viewport
- **THEN** the name field, controls, and assignment list fit the screen and remain operable

### Requirement: User preference support

The system SHALL respect the operating system's colour-scheme preference and SHALL avoid or reduce animation when the user prefers reduced motion.

#### Scenario: Dark colour scheme

- **WHEN** the operating system requests a dark colour scheme
- **THEN** the app uses a dark-appropriate palette with readable contrast

#### Scenario: Reduced motion

- **WHEN** the operating system requests reduced motion
- **THEN** any non-essential animation or transition is removed
