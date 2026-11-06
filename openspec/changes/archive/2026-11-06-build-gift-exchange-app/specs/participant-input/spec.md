# Spec Delta

## Purpose

Collect the participant list from the host, normalise what was typed, and reject unusable lists with messages that name the actual problem, while keeping the name list across a refresh.

## ADDED Requirements

### Requirement: One-name-per-line entry

The system SHALL accept participant names through a single multi-line text field, one participant per line, so a list can be typed or pasted in one action.

#### Scenario: Paste a multi-line list

- **WHEN** the host pastes four lines naming Alice, Bob, Carol, and Dave and submits the list
- **THEN** the system treats them as four participants in the pasted order

#### Scenario: Type names on separate lines

- **WHEN** the host types one name, starts a new line, and types a second name
- **THEN** the system treats the two lines as two separate participants

### Requirement: Entry normalisation

The system SHALL trim leading and trailing whitespace from each line, drop lines that are empty after trimming, and otherwise preserve each name exactly as typed, including internal spaces and letter case.

#### Scenario: Blank and padded lines

- **WHEN** the host submits `"  Alice  "`, `"   "`, and `"Bob "`
- **THEN** the system uses `Alice` and `Bob` as the participant names

#### Scenario: Internal spacing is preserved

- **WHEN** the host submits the name `Mary Jane O'Neil`
- **THEN** the system keeps that exact name, with its internal spaces and punctuation

### Requirement: Duplicate rejection

The system SHALL reject the entire list when two entries are equal ignoring case after trimming, SHALL identify the duplicated name in the error message, and SHALL NOT silently remove duplicates.

#### Scenario: Differing only by case

- **WHEN** the host submits `Alice` and `alice`
- **THEN** the system refuses to generate, reports that `Alice` appears more than once, and leaves the entered list unchanged

#### Scenario: Distinct names are accepted

- **WHEN** the host submits names that differ by more than case and surrounding whitespace
- **THEN** the system accepts all of them as distinct participants

### Requirement: Name-list persistence

The system SHALL persist the current participant name list in browser local storage and restore it when the page is reopened in the same browser, and SHALL NOT persist any generated assignment.

#### Scenario: Refresh restores the names

- **WHEN** the host enters a valid list, reloads the page, and returns to the name field
- **THEN** the same names are present in the field

#### Scenario: Assignment is not restored

- **WHEN** the host generates an assignment, reloads the page, and returns to the result view
- **THEN** no previous assignment or revealed recipient is shown

### Requirement: Storage failure tolerance

The system SHALL remain fully usable when local storage is unavailable or rejects reads or writes, continuing without persistence and without blocking name entry or assignment generation.

#### Scenario: Storage access throws

- **WHEN** reading or writing local storage raises an error
- **THEN** the system still accepts the submitted names and can generate an assignment
