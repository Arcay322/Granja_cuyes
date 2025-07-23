# Requirements Document

## Introduction

This specification addresses the improvement of the Reproduction module in the SUMAQ UYWA system. The module manages breeding cycles, pregnancy tracking, and litter management for guinea pigs. Current issues include lack of differentiating information between mothers and fathers, allowing pregnant mothers to be selected again, and missing validation for gestation periods.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see detailed and differentiating information when selecting mothers and fathers, so that I can make informed breeding decisions.

#### Acceptance Criteria

1. WHEN selecting a mother THEN I SHALL see ID, race, sex, location, life stage, weight, birth date, and reproductive history
2. WHEN selecting a father THEN I SHALL see ID, race, sex, location, life stage, weight, birth date, and breeding performance
3. WHEN viewing breeding options THEN mothers and fathers SHALL display different relevant information
4. WHEN selecting breeding pairs THEN I SHALL see compatibility information and breeding recommendations

### Requirement 2

**User Story:** As a user, I want the system to prevent selecting mothers that are already pregnant, so that I avoid breeding conflicts and ensure proper reproductive management.

#### Acceptance Criteria

1. WHEN selecting a mother for new pregnancy THEN mothers already pregnant SHALL NOT appear in the selection list
2. WHEN a mother is in active pregnancy THEN she SHALL be marked as unavailable for new breeding
3. WHEN viewing available mothers THEN only mothers ready for breeding SHALL be displayed
4. WHEN a pregnancy is completed or failed THEN the mother SHALL become available again

### Requirement 3

**User Story:** As a user, I want the system to validate gestation periods before allowing litter registration, so that I ensure biological accuracy and prevent premature registrations.

#### Acceptance Criteria

1. WHEN registering a litter THEN the system SHALL verify the mother has completed minimum gestation period (60+ days)
2. WHEN gestation period is insufficient THEN the system SHALL prevent litter registration with clear error message
3. WHEN gestation period is overdue THEN the system SHALL show warning but allow registration
4. WHEN selecting mothers for litter registration THEN only mothers with appropriate gestation time SHALL be available

### Requirement 4

**User Story:** As a user, I want enhanced selection interfaces with search, filtering, and detailed information, so that I can efficiently manage breeding operations.

#### Acceptance Criteria

1. WHEN selecting breeding animals THEN I SHALL have search functionality by ID, race, or location
2. WHEN viewing breeding options THEN I SHALL be able to filter by life stage, availability, and performance
3. WHEN selecting mothers or fathers THEN I SHALL see detailed cards with photos, stats, and history
4. WHEN making breeding decisions THEN I SHALL have access to breeding recommendations and compatibility scores

### Requirement 5

**User Story:** As a user, I want the system to track and display reproductive performance metrics, so that I can optimize breeding decisions.

#### Acceptance Criteria

1. WHEN viewing mothers THEN I SHALL see pregnancy success rate, average litter size, and breeding intervals
2. WHEN viewing fathers THEN I SHALL see breeding frequency, offspring survival rate, and genetic contribution
3. WHEN selecting breeding pairs THEN I SHALL see predicted outcomes based on historical data
4. WHEN managing reproduction THEN I SHALL have access to performance analytics and trends