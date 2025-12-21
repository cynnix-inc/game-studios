import {
  DIFFICULTIES,
  countSolutions,
  createFreePlayState,
  generate,
  inputDigit,
  redo,
  selectCell,
  toggleNotesMode,
  undo,
} from '@cynnix-studios/sudoku-core';

describe('Epic 1 gate: core play loop (Free Play)', () => {
  test('supports the 5 MVP Free Play difficulties', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard', 'expert', 'extreme']);
  });

  test('free play generator produces uniquely-solvable puzzles (sampled)', () => {
    for (const d of DIFFICULTIES) {
      const gen = generate(d, { seed: 1337 });
      expect(countSolutions(gen.puzzle, { limit: 2 })).toBe(1);
    }
  });

  test('notes + value input are undo/redo-able and deterministic', () => {
    const gen = generate('easy', { seed: 42 });
    const s0 = createFreePlayState({ difficulty: 'easy', generated: gen, startedAtMs: 123 });

    const editableIndex = gen.givensMask.findIndex((g) => !g);
    expect(editableIndex).toBeGreaterThanOrEqual(0);

    // Add a note
    const s1 = selectCell(s0, editableIndex);
    const s2 = toggleNotesMode(s1);
    const s3 = inputDigit(s2, 5);
    expect(s3.notes[editableIndex]).toBeGreaterThan(0);

    // Enter a value (should clear notes)
    const s4 = toggleNotesMode(s3);
    const s5 = inputDigit(s4, 1);
    expect(s5.puzzle[editableIndex]).toBe(1);
    expect(s5.notes[editableIndex]).toBe(0);

    // Undo restores previous state (value cleared, note restored)
    const s6 = undo(s5);
    expect(s6.puzzle[editableIndex]).toBe(0);
    expect(s6.notes[editableIndex]).toBeGreaterThan(0);

    // Redo reapplies value and clears note again
    const s7 = redo(s6);
    expect(s7.puzzle[editableIndex]).toBe(1);
    expect(s7.notes[editableIndex]).toBe(0);
  });
});


