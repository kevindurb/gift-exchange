# assignment-reveal Specification

## Purpose

Present a generated assignment so a host can hand the page around, reveal one person's recipient at a time, and copy or print the full list when needed.

## Requirements

### Requirement: Readable assignment list

The system SHALL display the assignment as a readable list containing one row per giver, each row naming the giver and that giver's recipient in the form `Alice gives to Bob`.

#### Scenario: Full list covers every participant

- **WHEN** an assignment for five participants is displayed in full
- **THEN** the list contains five rows, one for each participant as giver, and every recipient is named

### Requirement: Per-person reveal

The system SHALL hide every recipient initially and SHALL reveal a giver's recipient only when that giver's own control is activated, without revealing any other participant's recipient.

#### Scenario: Initial state hides recipients

- **WHEN** a newly generated assignment is first shown
- **THEN** no recipient is visible

#### Scenario: Reveal one giver

- **WHEN** the host activates the control for Alice while all recipients are hidden
- **THEN** Alice's recipient becomes visible and every other recipient stays hidden

#### Scenario: Hidden recipients stay out of the accessibility tree

- **WHEN** a recipient is hidden
- **THEN** assistive technology does not announce that recipient

### Requirement: Show-all control

The system SHALL provide a single control that reveals every recipient for the organiser and can return the view to the hidden state.

#### Scenario: Reveal all

- **WHEN** the host activates the show-all control
- **THEN** every giver's recipient is visible

#### Scenario: Hide all again

- **WHEN** the host activates the show-all control while all recipients are visible
- **THEN** every recipient is hidden again

### Requirement: Copy assignment as plain text

The system SHALL copy the full assignment to the clipboard as plain text with one line per giver in `Alice gives to Bob` form, and SHALL report whether the copy succeeded or failed.

#### Scenario: Successful copy

- **WHEN** the host activates the copy control and clipboard access succeeds
- **THEN** the clipboard contains one `giver gives to recipient` line per participant and the system confirms the copy

#### Scenario: Clipboard access denied

- **WHEN** the browser refuses clipboard access
- **THEN** the system reports that copying failed without losing the assignment

### Requirement: Print output

The system SHALL provide print styling that uses a white background and black text, hides interactive controls, and leaves enough left margin to cut the printed assignment into individual slips.

#### Scenario: Printing the assignment

- **WHEN** the host prints the page after generating an assignment
- **THEN** the printed page shows the assignment in black on white with no buttons or other interactive affordances
