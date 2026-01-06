import { computeScoreMs, type HintType } from '@cynnix-studios/sudoku-core';

describe('PRD scoring (score_ms)', () => {
  test('score_ms = raw_time_ms + mistakes*30s + hint penalties', () => {
    const hint_breakdown: Partial<Record<HintType, number>> = {
      explain_technique: 1, // +30s
      show_candidates: 2, // +45s each
      highlight_next_move: 1, // +60s
      check_selected_cell: 0,
      check_whole_board: 1, // +90s
      reveal_cell_value: 1, // +120s
    };

    const score = computeScoreMs({
      raw_time_ms: 100_000,
      mistakes_count: 2,
      hint_breakdown,
    });

    // 100_000
    // + mistakes: 2 * 30_000 = 60_000
    // + hints: 1*30_000 + 2*45_000 + 1*60_000 + 1*90_000 + 1*120_000 = 390_000
    expect(score).toBe(550_000);
  });

  test('treats missing hint types as 0 and clamps negative counts to 0', () => {
    const score = computeScoreMs({
      raw_time_ms: 1,
      mistakes_count: 0,
      // Negative counts are type-valid but should be clamped at runtime.
      hint_breakdown: { reveal_cell_value: -2 },
    });
    expect(score).toBe(1);
  });
});



