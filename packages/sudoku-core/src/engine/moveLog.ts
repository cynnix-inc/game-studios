import { createRunTimer, pauseRunTimer, resumeRunTimer, type RunTimer } from './runTimer';
import type { HintType } from './scoring';

export type SudokuMoveKind =
  | 'set'
  | 'clear'
  | 'note_add'
  | 'note_remove'
  | 'pause'
  | 'resume'
  | 'complete'
  | 'mistake'
  | 'hint';

export type SudokuMove = {
  schemaVersion: 1;
  device_id: string;
  rev: number;
  ts: number;
  kind: SudokuMoveKind;
  cell?: number;
  value?: number;
  hintType?: HintType;
  clientSubmissionId?: string;
};

export type SudokuFoldedState = {
  puzzle: number[];
  notes: Array<Set<number>>;
  runTimer: RunTimer;
  runStatus: 'running' | 'paused' | 'completed';
  completedAtMs: number | null;
  completionClientSubmissionId: string | null;
  mistakesCount: number;
  hintsUsedCount: number;
  hintBreakdown: Partial<Record<HintType, number>>;
};

function isFiniteInt(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n);
}

function clampCellIndex(i: number): number {
  return Math.max(0, Math.min(80, i));
}

function clampDigit(v: number): number {
  return Math.max(0, Math.min(9, v));
}

export function mergeMoveLogs(a: readonly SudokuMove[], b: readonly SudokuMove[]): SudokuMove[] {
  const byKey = new Map<string, SudokuMove>();
  const push = (m: SudokuMove) => {
    if (m.schemaVersion !== 1) return;
    if (typeof m.device_id !== 'string' || m.device_id.length === 0) return;
    if (!isFiniteInt(m.rev) || m.rev < 0) return;
    if (!isFiniteInt(m.ts) || m.ts < 0) return;
    const key = `${m.device_id}:${m.rev}`;
    if (!byKey.has(key)) byKey.set(key, m);
  };

  for (const m of a) push(m);
  for (const m of b) push(m);

  const out = Array.from(byKey.values());
  out.sort((x, y) => {
    if (x.ts !== y.ts) return x.ts - y.ts;
    if (x.device_id !== y.device_id) return x.device_id < y.device_id ? -1 : 1;
    return x.rev - y.rev;
  });
  return out;
}

export function foldMovesToState(
  initial: { startedAtMs: number; puzzle?: readonly number[] },
  moves: readonly SudokuMove[],
): SudokuFoldedState {
  const puzzle = (initial.puzzle ? [...initial.puzzle] : Array.from({ length: 81 }, () => 0)) as number[];
  const notes = Array.from({ length: 81 }, () => new Set<number>());

  let runTimer = createRunTimer(initial.startedAtMs);
  let runStatus: SudokuFoldedState['runStatus'] = 'running';
  let completedAtMs: number | null = null;
  let completionClientSubmissionId: string | null = null;
  let mistakesCount = 0;
  let hintsUsedCount = 0;
  let hintBreakdown: Partial<Record<HintType, number>> = {};

  for (const raw of moves) {
    if (raw.schemaVersion !== 1) continue;

    switch (raw.kind) {
      case 'set': {
        if (!isFiniteInt(raw.cell) || !isFiniteInt(raw.value)) break;
        const idx = clampCellIndex(raw.cell);
        const v = clampDigit(raw.value);
        if (v === 0) break;
        puzzle[idx] = v;
        break;
      }
      case 'clear': {
        if (!isFiniteInt(raw.cell)) break;
        const idx = clampCellIndex(raw.cell);
        puzzle[idx] = 0;
        break;
      }
      case 'note_add': {
        if (!isFiniteInt(raw.cell) || !isFiniteInt(raw.value)) break;
        const idx = clampCellIndex(raw.cell);
        const v = clampDigit(raw.value);
        if (v === 0) break;
        const set = notes[idx];
        if (!set) break;
        set.add(v);
        break;
      }
      case 'note_remove': {
        if (!isFiniteInt(raw.cell) || !isFiniteInt(raw.value)) break;
        const idx = clampCellIndex(raw.cell);
        const v = clampDigit(raw.value);
        if (v === 0) break;
        const set = notes[idx];
        if (!set) break;
        set.delete(v);
        break;
      }
      case 'pause': {
        if (runStatus === 'completed') break;
        runTimer = pauseRunTimer(runTimer, raw.ts);
        runStatus = 'paused';
        break;
      }
      case 'resume': {
        if (runStatus === 'completed') break;
        runTimer = resumeRunTimer(runTimer, raw.ts);
        runStatus = 'running';
        break;
      }
      case 'complete': {
        if (runStatus === 'completed') break;
        runTimer = pauseRunTimer(runTimer, raw.ts);
        runStatus = 'completed';
        completedAtMs = raw.ts;
        completionClientSubmissionId = typeof raw.clientSubmissionId === 'string' ? raw.clientSubmissionId : null;
        break;
      }
      case 'mistake':
        if (runStatus === 'completed') break;
        mistakesCount += 1;
        break;
      case 'hint':
        if (runStatus === 'completed') break;
        if (!raw.hintType) break;
        hintsUsedCount += 1;
        hintBreakdown = { ...hintBreakdown, [raw.hintType]: (hintBreakdown[raw.hintType] ?? 0) + 1 };
        break;
      default:
        // Intentionally ignored for now; keep fold deterministic.
        break;
    }
  }

  return {
    puzzle,
    notes,
    runTimer,
    runStatus,
    completedAtMs,
    completionClientSubmissionId,
    mistakesCount,
    hintsUsedCount,
    hintBreakdown,
  };
}


