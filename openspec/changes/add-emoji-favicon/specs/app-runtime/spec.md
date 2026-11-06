# Spec Delta

## ADDED Requirements

### Requirement: Emoji favicon

The system SHALL declare a favicon that displays a gift emoji and SHALL embed that icon in the page document itself, so displaying it requires no separate image file, no build step, and no runtime network request.

#### Scenario: Emoji icon in the browser tab

- **WHEN** the page is opened in a browser that supports image favicons
- **THEN** the tab, bookmark, or history entry shows a gift emoji icon instead of a blank or default icon

#### Scenario: Icon works offline

- **WHEN** the page is opened with no network connection
- **THEN** the favicon still appears, because the icon is embedded in the page rather than fetched from a URL

#### Scenario: No separate favicon request

- **WHEN** the page is loaded
- **THEN** the browser makes no request for a separate favicon file and the app still conforms to its no-runtime-network-dependency requirement
