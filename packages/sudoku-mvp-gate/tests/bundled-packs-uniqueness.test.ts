import fs from 'node:fs/promises';
import path from 'node:path';

import { assertFreePlayPack, assertPuzzleSolutionContract } from '@cynnix-studios/sudoku-core';

describe('bundled freeplay packs (quality gate)', () => {
  // Uniqueness checks can be slow on harder puzzles; keep CI stable.
  jest.setTimeout(180_000);

  test('every bundled pack puzzle has exactly one solution and matches its provided solution', async () => {
    const repoRoot = path.resolve(__dirname, '../../..');
    const bundledDir = path.join(repoRoot, 'apps/sudoku/src/freeplayPacks/bundled');

    const entries = await fs.readdir(bundledDir);
    const jsonFiles = entries.filter((f) => f.endsWith('.json'));
    expect(jsonFiles.length).toBeGreaterThan(0);

    const failures: string[] = [];

    for (const file of jsonFiles) {
      const fullPath = path.join(bundledDir, file);
      const raw = await fs.readFile(fullPath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const pack = assertFreePlayPack(parsed);

      for (const p of pack.puzzles) {
        try {
          assertPuzzleSolutionContract(p.puzzle, p.solution);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          failures.push(`${file} :: ${pack.difficulty} :: ${p.puzzle_id} :: ${msg}`);
        }
      }
    }

    if (failures.length) {
      throw new Error(`Bundled pack quality violations:\n- ${failures.join('\n- ')}`);
    }
  });
});


