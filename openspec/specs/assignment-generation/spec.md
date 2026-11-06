# assignment-generation Specification

## Purpose

Turn a participant list into a uniformly random, verifiably valid Secret Santa assignment in which nobody gives to themselves and no two people are paired with each other.

## Requirements

### Requirement: Refuse infeasible participant counts

The system SHALL refuse to generate an assignment when fewer than three participants are supplied, SHALL report that at least three names are required together with the supplied count, and SHALL NOT produce a partial or invalid assignment.

#### Scenario: One participant

- **WHEN** the host submits a list containing only one name
- **THEN** the system refuses to generate and reports that at least three names are required while stating that one name was supplied

#### Scenario: Two participants

- **WHEN** the host submits a list containing two names
- **THEN** the system refuses to generate and reports that at least three names are required while stating that two names were supplied

### Requirement: Warn for a three-person exchange

The system SHALL allow generation with exactly three participants and SHALL display a warning that the exchange is trivially guessable.

#### Scenario: Three participants generate with a warning

- **WHEN** the host submits exactly three names
- **THEN** the system produces a valid assignment and shows a warning that each person's recipient is easy to guess

### Requirement: Valid assignment structure

The system SHALL produce an assignment in which every participant appears exactly once as a giver, every participant appears exactly once as a recipient, no participant is assigned to themselves, and no two participants are assigned to each other.

#### Scenario: Every participant gives exactly once

- **WHEN** an assignment is generated for any accepted participant list
- **THEN** each participant appears exactly once as a giver

#### Scenario: Every participant receives exactly once

- **WHEN** an assignment is generated for any accepted participant list
- **THEN** each participant appears exactly once as a recipient

#### Scenario: No self-assignment

- **WHEN** an assignment is generated for any accepted participant list
- **THEN** no participant is assigned to themselves

#### Scenario: No two-person pair

- **WHEN** an assignment is generated for any accepted participant list
- **THEN** there is no pair of participants who are assigned to each other

#### Scenario: Three participants form one cycle

- **WHEN** an assignment is generated for exactly three participants
- **THEN** following the assignments visits all three participants before returning to the first

### Requirement: Uniform selection among valid assignments

The system SHALL select every valid assignment with equal probability by uniformly shuffling the participant order and rejecting candidates that violate the structural rules, rather than by applying biased swaps or repairing a candidate in place.

#### Scenario: All four-person assignments are reachable

- **WHEN** the system generates 10,000 assignments for the same four participants
- **THEN** every structurally valid four-person assignment appears at least once and the observed frequencies show no gross skew

#### Scenario: Invalid candidates are rejected

- **WHEN** a uniformly shuffled candidate contains a self-assignment or a two-person pair
- **THEN** the system discards it and tries another candidate instead of repairing or returning it

### Requirement: Bounded generation attempts

The system SHALL stop after a bounded number of attempts and report a generation error rather than returning an invalid or partial assignment.

#### Scenario: Attempt limit reached

- **WHEN** no valid candidate is found within the configured attempt limit
- **THEN** the system reports a generation error and displays no assignment

### Requirement: Independent verification before display

After generation, the system SHALL independently verify the structural rules and SHALL refuse to display the result if verification fails.

#### Scenario: Verification failure blocks output

- **WHEN** a generated candidate fails independent verification
- **THEN** the system reports an error and does not display the assignment

### Requirement: Testable core logic

The assignment logic SHALL accept a participant list and return either an assignment or an error without reading from or writing to the document object model.

#### Scenario: Headless test run

- **WHEN** the assignment logic is exercised from a test process with no browser document
- **THEN** it computes assignments and errors normally
