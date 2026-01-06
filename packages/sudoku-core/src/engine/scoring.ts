export type HintType =
  | 'explain_technique'
  | 'show_candidates'
  | 'highlight_next_move'
  | 'check_selected_cell'
  | 'check_whole_board'
  | 'reveal_cell_value';

const HINT_PENALTY_MS: Record<HintType, number> = {
  explain_technique: 30_000,
  show_candidates: 45_000,
  highlight_next_move: 60_000,
  check_selected_cell: 30_000,
  check_whole_board: 90_000,
  reveal_cell_value: 120_000,
};

export type ComputeScoreInput = {
  raw_time_ms: number;
  mistakes_count: number;
  hint_breakdown?: Partial<Record<HintType, number>> | null;
};

function toNonNegativeInt(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/**
 * PRD v1.1:
 * score_ms = raw_time_ms + (mistakes_count * 30_000) + hint_penalty_ms
 */
export function computeScoreMs(input: ComputeScoreInput): number {
  const raw = toNonNegativeInt(input.raw_time_ms);
  const mistakes = toNonNegativeInt(input.mistakes_count);
  const breakdown = input.hint_breakdown ?? {};

  let hintPenalty = 0;
  for (const [hintType, ms] of Object.entries(HINT_PENALTY_MS) as Array<[HintType, number]>) {
    const count = toNonNegativeInt((breakdown as Record<string, unknown>)[hintType]);
    hintPenalty += count * ms;
  }

  return raw + mistakes * 30_000 + hintPenalty;
}



