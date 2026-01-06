import { createTypedSupabaseClient } from '@cynnix-studios/supabase';
import {
  foldMovesToState,
  makeDailyPuzzleKey,
  mergeMoveLogs,
  parseGrid,
  serializeGrid,
  type Difficulty,
  type Grid,
  type SudokuMove,
} from '@cynnix-studios/sudoku-core';
import { fetchWithTimeout } from '@cynnix-studios/game-foundation';

import { usePlayerStore } from '../state/usePlayerStore';
import { getAccessToken } from './auth';

const GAME_KEY = 'sudoku';

type PuzzleSaveV1 = {
  schemaVersion: 1;
  kind: 'sudoku_puzzle_save';
  puzzle_key: string;
  startedAtMs: number;
  givensMask: boolean[];
  serializedGivensPuzzle: string;
  mode: 'free' | 'daily';
  difficulty?: Difficulty;
  dailyDateKey?: string;

  // Per-install state (metadata); canonical history is in `moves`.
  device_id: string;
  revision: number;
  moves: SudokuMove[];
};

function fnv1a32(input: string): string {
  // Simple, deterministic hash for stable puzzle IDs (not cryptographic).
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function deriveGivensPuzzle(puzzle: Grid, givensMask: boolean[]): Grid {
  const out = puzzle.slice() as number[];
  for (let i = 0; i < out.length; i++) {
    if (!givensMask[i]) out[i] = 0;
  }
  return out as unknown as Grid;
}

function getCurrentPuzzleKey(): string | null {
  const s = usePlayerStore.getState();
  if (s.mode === 'daily') {
    if (!s.dailyDateKey) return null;
    return makeDailyPuzzleKey(s.dailyDateKey);
  }

  // Free play: derive a stable puzzle id from givens.
  const givens = deriveGivensPuzzle(s.puzzle, s.givensMask);
  const givensStr = serializeGrid(givens);
  return `free:${s.difficulty}:${fnv1a32(givensStr)}`;
}

function buildLocalPuzzleSave(): PuzzleSaveV1 | null {
  const s = usePlayerStore.getState();
  const deviceId = s.deviceId;
  if (!deviceId) return null;

  // Journey mode is not yet part of the puzzle-save sync contract.
  if (s.mode === 'journey') return null;

  const puzzleKey = getCurrentPuzzleKey();
  if (!puzzleKey) return null;

  const givens = deriveGivensPuzzle(s.puzzle, s.givensMask);
  const serializedGivensPuzzle = serializeGrid(givens);

  const base: PuzzleSaveV1 = {
    schemaVersion: 1,
    kind: 'sudoku_puzzle_save',
    puzzle_key: puzzleKey,
    startedAtMs: s.runTimer.startedAtMs,
    givensMask: [...s.givensMask],
    serializedGivensPuzzle,
    mode: s.mode,
    difficulty: s.mode === 'free' ? s.difficulty : undefined,
    dailyDateKey: s.mode === 'daily' ? s.dailyDateKey ?? undefined : undefined,
    device_id: deviceId,
    revision: s.revision,
    moves: s.moves,
  };

  return base;
}

function isPuzzleSaveV1(x: unknown): x is PuzzleSaveV1 {
  if (typeof x !== 'object' || x == null) return false;
  const r = x as Record<string, unknown>;
  if (r.schemaVersion !== 1) return false;
  if (r.kind !== 'sudoku_puzzle_save') return false;
  if (typeof r.puzzle_key !== 'string' || r.puzzle_key.length === 0) return false;
  if (typeof r.startedAtMs !== 'number' || !Number.isFinite(r.startedAtMs)) return false;
  if (!Array.isArray(r.givensMask)) return false;
  if (typeof r.serializedGivensPuzzle !== 'string') return false;
  if (typeof r.device_id !== 'string' || r.device_id.length === 0) return false;
  if (typeof r.revision !== 'number' || !Number.isFinite(r.revision)) return false;
  if (!Array.isArray(r.moves)) return false;
  return true;
}

function slotForPuzzleKey(puzzleKey: string): string {
  return `puzzle:${puzzleKey}`;
}

export type SyncResult =
  | { ok: true; applied: true }
  | { ok: true; applied: false; reason: 'not_authenticated' | 'missing_device_id' | 'no_puzzle' | 'not_configured' }
  | { ok: false; error: { code: string; message: string } };

export async function pullSave(slot: string): Promise<{ ok: true; data: unknown | null } | { ok: false; error: { code: string; message: string } }> {
  // Ensure supabase is configured and the user is authenticated for RLS read.
  const token = await getAccessToken();
  if (!token) return { ok: false, error: { code: 'not_authenticated', message: 'Not signed in' } };

  let supabase;
  try {
    supabase = createTypedSupabaseClient();
  } catch {
    return { ok: false, error: { code: 'not_configured', message: 'Supabase not configured' } };
  }

  const { data, error } = await supabase.from('saves').select('slot, data, updated_at').eq('game_key', GAME_KEY).eq('slot', slot).maybeSingle();
  if (error) return { ok: false, error: { code: 'pull_failed', message: 'Failed to pull remote save' } };
  return { ok: true, data: (data?.data as unknown) ?? null };
}

export async function pushSave(slot: string, data: unknown): Promise<SyncResult> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (!base) return { ok: true, applied: false, reason: 'not_configured' };

  const token = await getAccessToken();
  if (!token) return { ok: true, applied: false, reason: 'not_authenticated' };

  const payload = {
    game_key: GAME_KEY,
    slot,
    data,
  };

  try {
    const res = await fetchWithTimeout(
      `${base}/upsert-save`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
      // Idempotent if backend upsert is deterministic for a given payload.
      { timeoutMs: 10_000, maxAttempts: 3, idempotent: true },
    );

    if (!res.ok) {
      const status = res.status;
      let detail: string | null = null;
      try {
        const text = await res.text();
        if (text && text.trim().length > 0) {
          // Try to extract the stable edge-function error envelope if present: { ok:false, error:{message}, requestId }
          try {
            const parsed = JSON.parse(text) as unknown;
            if (typeof parsed === 'object' && parsed != null) {
              const p = parsed as Record<string, unknown>;
              const errObj = p.error;
              if (typeof errObj === 'object' && errObj != null) {
                const msg = (errObj as Record<string, unknown>).message;
                if (typeof msg === 'string' && msg.trim().length > 0) detail = msg.trim();
              }
            }
          } catch {
            // Not JSON; keep a short snippet.
            detail = text.trim().slice(0, 140);
          }
        }
      } catch {
        // ignore
      }

      const baseMsg = `Failed to push save (HTTP ${status})`;
      return { ok: false, error: { code: 'push_failed', message: detail ? `${baseMsg}: ${detail}` : baseMsg } };
    }
    return { ok: true, applied: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: { code: 'push_failed', message: msg ? `Failed to push save: ${msg}` : 'Failed to push save' } };
  }
}

export async function pullAndMergeCurrentPuzzle(): Promise<SyncResult> {
  const puzzleKey = getCurrentPuzzleKey();
  if (!puzzleKey) return { ok: true, applied: false, reason: 'no_puzzle' };

  const local = buildLocalPuzzleSave();
  if (!local) return { ok: true, applied: false, reason: 'missing_device_id' };

  usePlayerStore.setState({ puzzleSyncStatus: 'syncing', puzzleLastSyncError: null });

  const pulled = await pullSave(slotForPuzzleKey(puzzleKey));
  if (!pulled.ok) {
    if (pulled.error.code === 'not_authenticated') {
      usePlayerStore.setState({ puzzleSyncStatus: 'idle' });
      return { ok: true, applied: false, reason: 'not_authenticated' };
    }
    if (pulled.error.code === 'not_configured') {
      usePlayerStore.setState({ puzzleSyncStatus: 'idle' });
      return { ok: true, applied: false, reason: 'not_configured' };
    }
    usePlayerStore.setState({ puzzleSyncStatus: 'error', puzzleLastSyncError: pulled.error.message });
    return { ok: false, error: pulled.error };
  }
  if (!pulled.data) {
    usePlayerStore.setState({ puzzleSyncStatus: 'idle' });
    return { ok: true, applied: false, reason: 'no_puzzle' };
  }

  const remoteUnknown = pulled.data;
  if (!isPuzzleSaveV1(remoteUnknown)) {
    usePlayerStore.setState({ puzzleSyncStatus: 'error', puzzleLastSyncError: 'Remote save has invalid shape' });
    return { ok: false, error: { code: 'invalid_remote_save', message: 'Remote save has invalid shape' } };
  }

  const remote = remoteUnknown;
  const mergedMoves = mergeMoveLogs(local.moves, remote.moves);
  const startedAtMs = Math.min(local.startedAtMs, remote.startedAtMs);

  // Re-fold into local state deterministically.
  const basePuzzle = parseGrid(local.serializedGivensPuzzle);
  const folded = foldMovesToState({ startedAtMs, puzzle: basePuzzle }, mergedMoves);

  // Update local store (keep local device metadata).
  const localDeviceRev = Math.max(
    local.revision,
    ...mergedMoves.filter((m) => m.device_id === local.device_id).map((m) => m.rev),
  );
  usePlayerStore.setState({
    puzzle: folded.puzzle as unknown as Grid,
    notes: folded.notes,
    runTimer: folded.runTimer,
    runStatus: folded.runStatus,
    completedAtMs: folded.completedAtMs,
    completionClientSubmissionId: folded.completionClientSubmissionId,
    mistakes: folded.mistakesCount,
    hintsUsedCount: folded.hintsUsedCount,
    hintBreakdown: folded.hintBreakdown,
    moves: mergedMoves,
    revision: Number.isFinite(localDeviceRev) ? localDeviceRev : local.revision,
    // Undo/redo is per-device UX; after a merge we clear local stacks to avoid inconsistent history.
    undoStack: [],
    redoStack: [],
    notesMode: false,
  });

  usePlayerStore.setState({ puzzleSyncStatus: 'ok', puzzleLastSyncAtMs: Date.now(), puzzleLastSyncError: null });
  return { ok: true, applied: true };
}

export async function pushCurrentPuzzle(): Promise<SyncResult> {
  const local = buildLocalPuzzleSave();
  if (!local) return { ok: true, applied: false, reason: 'missing_device_id' };

  usePlayerStore.setState({ puzzleSyncStatus: 'syncing', puzzleLastSyncError: null });
  const res = await pushSave(slotForPuzzleKey(local.puzzle_key), local);
  if (!res.ok) {
    usePlayerStore.setState({ puzzleSyncStatus: 'error', puzzleLastSyncError: res.error.message });
    return res;
  }
  if (res.applied) {
    usePlayerStore.setState({ puzzleSyncStatus: 'ok', puzzleLastSyncAtMs: Date.now(), puzzleLastSyncError: null });
    return res;
  }
  // Not applied is expected when signed out or not configured.
  usePlayerStore.setState({ puzzleSyncStatus: 'idle' });
  return res;
}


