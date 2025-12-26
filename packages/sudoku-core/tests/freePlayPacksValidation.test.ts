import { assertFreePlayManifest, assertFreePlayPack } from '../src';

const PUZZLE_81 = Array.from({ length: 81 }, () => 0);
const SOLUTION_81 = Array.from({ length: 81 }, (_, i) => ((i % 9) + 1));

describe('free play packs validation', () => {
  test('assertFreePlayManifest accepts a minimal valid manifest', () => {
    const m = assertFreePlayManifest({
      schema_version: 1,
      packs: {
        novice: { version: 'v1', url: '/freeplay/novice/v1.json', sha256: 'abc' },
      },
    });
    expect(m.schema_version).toBe(1);
    expect(m.packs.novice?.version).toBe('v1');
  });

  test('assertFreePlayManifest rejects unknown difficulty keys', () => {
    expect(() =>
      assertFreePlayManifest({
        schema_version: 1,
        packs: { impossible: { version: 'v1', url: '/x' } },
      }),
    ).toThrow(/invalid difficulty key/i);
  });

  test('assertFreePlayPack accepts a valid pack', () => {
    const p = assertFreePlayPack({
      schema_version: 1,
      difficulty: 'novice',
      version: 'v1',
      puzzles: [{ puzzle_id: 'p1', puzzle: PUZZLE_81, solution: SOLUTION_81 }],
    });
    expect(p.difficulty).toBe('novice');
    expect(p.puzzles).toHaveLength(1);
  });

  test('assertFreePlayPack rejects a solution with 0s', () => {
    const badSolution = [...SOLUTION_81];
    badSolution[0] = 0;
    expect(() =>
      assertFreePlayPack({
        schema_version: 1,
        difficulty: 'novice',
        version: 'v1',
        puzzles: [{ puzzle_id: 'p1', puzzle: PUZZLE_81, solution: badSolution }],
      }),
    ).toThrow(/solution/i);
  });
});


