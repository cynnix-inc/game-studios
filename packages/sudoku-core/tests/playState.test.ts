import { generate } from '../src/engine/generator';
import { createFreePlayState, inputDigit, clearCell, selectCell, toggleNotesMode, undo, redo } from '../src/engine/playState';

describe('playState', () => {
  it('prevents editing given cells', () => {
    const gen = generate('easy', { seed: 1337 });
    const state0 = createFreePlayState({ difficulty: 'easy', generated: gen, startedAtMs: 123 });

    const givenIndex = gen.givensMask.findIndex((g) => g);
    expect(givenIndex).toBeGreaterThanOrEqual(0);

    const state1 = selectCell(state0, givenIndex);
    const state2 = inputDigit(state1, 9);
    expect(state2.puzzle[givenIndex]).toBe(state0.puzzle[givenIndex]);
    expect(state2.undoStack).toHaveLength(0);
  });

  it('supports notes mode, value input, and undo/redo', () => {
    const gen = generate('easy', { seed: 42 });
    const state0 = createFreePlayState({ difficulty: 'easy', generated: gen, startedAtMs: 123 });

    const editableIndex = gen.givensMask.findIndex((g) => !g);
    expect(editableIndex).toBeGreaterThanOrEqual(0);

    // Add a note
    const s1 = selectCell(state0, editableIndex);
    const s2 = toggleNotesMode(s1);
    const s3 = inputDigit(s2, 5);
    expect(s3.notes[editableIndex]).toBeGreaterThan(0);
    expect(s3.undoStack).toHaveLength(1);

    // Undo note
    const s4 = undo(s3);
    expect(s4.notes[editableIndex]).toBe(0);
    expect(s4.redoStack).toHaveLength(1);

    // Redo note
    const s5 = redo(s4);
    expect(s5.notes[editableIndex]).toBeGreaterThan(0);

    // Enter a value (should clear notes for that cell)
    const s6 = toggleNotesMode(s5);
    const s7 = inputDigit(s6, 1);
    expect(s7.puzzle[editableIndex]).toBe(1);
    expect(s7.notes[editableIndex]).toBe(0);

    // Clear cell clears value and notes
    const s8 = clearCell(s7);
    expect(s8.puzzle[editableIndex]).toBe(0);
    expect(s8.notes[editableIndex]).toBe(0);

    // Undo clear restores previous value
    const s9 = undo(s8);
    expect(s9.puzzle[editableIndex]).toBe(1);
  });

  it('clears redo stack after a new action', () => {
    const gen = generate('easy', { seed: 99 });
    const state0 = createFreePlayState({ difficulty: 'easy', generated: gen, startedAtMs: 123 });
    const editableIndex = gen.givensMask.findIndex((g) => !g);
    const s1 = selectCell(state0, editableIndex);
    const s2 = inputDigit(s1, 1);
    const s3 = undo(s2);
    expect(s3.redoStack).toHaveLength(1);

    const s4 = inputDigit(s3, 2);
    expect(s4.redoStack).toHaveLength(0);
  });
});


