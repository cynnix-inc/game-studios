# Sudoku — Future Work (Post-v1.1 MVP)

Last updated: 2025-12-22

This doc tracks **intentionally deferred** items (ideas, UX polish, and post-MVP requirements) so they don’t get lost during execution of current epics.

## Identity & profiles

### Editable display names

**Goal**: Let signed-in players change the name shown on Daily leaderboards.

**UX requirements**:
- **Dice button** to generate a pseudonymous name (always available).
- **Manual input** to set a custom name.

**Uniqueness policy**:
- **No availability check required** for MVP/post-MVP if we allow duplicates.
- The unique identifier remains the player id; leaderboards can show name + rank.

**Moderation / validation (TBD — decision required before shipping)**:
- Define validation rules (length, allowed characters, whitespace trimming).
- Decide how to handle reserved words (e.g., Admin/Moderator/Support/System).
- Decide whether to add a profanity filter (and where it runs: client, server, or both).


