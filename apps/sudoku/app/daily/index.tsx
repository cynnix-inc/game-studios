import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';
import { getLastNUtcDateKeys, getRunTimerElapsedMs, msUntilNextUtcMidnight, nowUtcDateKey } from '@cynnix-studios/sudoku-core';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { readLocalInProgressSave, writeLocalSave } from '../../src/services/saves';
import { NumberPad } from '../../src/components/NumberPad';
import { SudokuGrid } from '../../src/components/SudokuGrid';
import { createClientSubmissionId, flushPendingDailySubmissions, submitDailyRun } from '../../src/services/leaderboard';

function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

export default function DailyScreen() {
  const mode = usePlayerStore((s) => s.mode);
  const dailyDateKey = usePlayerStore((s) => s.dailyDateKey);
  const dailyLoad = usePlayerStore((s) => s.dailyLoad);
  const dailySource = usePlayerStore((s) => s.dailySource);

  const puzzle = usePlayerStore((s) => s.puzzle);
  const solution = usePlayerStore((s) => s.solution);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);
  const hintsUsedCount = usePlayerStore((s) => s.hintsUsedCount);
  const hintBreakdown = usePlayerStore((s) => s.hintBreakdown);
  const runTimer = usePlayerStore((s) => s.runTimer);
  const runStatus = usePlayerStore((s) => s.runStatus);
  const completionClientSubmissionId = usePlayerStore((s) => s.completionClientSubmissionId);
  const pauseRun = usePlayerStore((s) => s.pauseRun);
  const resumeRun = usePlayerStore((s) => s.resumeRun);
  const markCompleted = usePlayerStore((s) => s.markCompleted);
  const restoreDailyProgressFromSave = usePlayerStore((s) => s.restoreDailyProgressFromSave);

  const loadDaily = usePlayerStore((s) => s.loadDaily);
  const exitDailyToFreePlay = usePlayerStore((s) => s.exitDailyToFreePlay);
  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const hintRevealCellValue = usePlayerStore((s) => s.hintRevealCellValue);

  const todayKey = nowUtcDateKey(Date.now());
  const archive = useMemo(() => getLastNUtcDateKeys(Date.now(), 30), []);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const countdown = formatCountdown(msUntilNextUtcMidnight(nowMs));

  const [hydrated, setHydrated] = useState(false);
  const [resumeDailyKey, setResumeDailyKey] = useState<string | null>(null);

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        void writeLocalSave();
      }, 600),
    [],
  );

  useEffect(() => {
    void (async () => {
      const saved = await readLocalInProgressSave();
      if (saved?.mode === 'daily') setResumeDailyKey(saved.dailyDateKey);
      await loadDaily(saved?.mode === 'daily' ? saved.dailyDateKey : todayKey);
      setHydrated(true);
    })();
  }, [loadDaily, todayKey]);

  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'queued' | 'submitted'>('idle');

  useEffect(() => {
    void flushPendingDailySubmissions();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        pauseRun();
        void writeLocalSave();
        return;
      }
      void flushPendingDailySubmissions();
    });
    return () => sub.remove();
  }, [pauseRun]);

  useEffect(() => {
    if (!hydrated) return;
    debouncedSave();
  }, [debouncedSave, hydrated, hintBreakdown, hintsUsedCount, puzzle, runTimer, runStatus]);

  useEffect(() => {
    if (dailyLoad.status !== 'ready') return;
    if (!resumeDailyKey) return;
    if (dailyDateKey !== resumeDailyKey) return;
    void (async () => {
      const saved = await readLocalInProgressSave();
      if (!saved || saved.mode !== 'daily') return;
      // Ensure time while the app was closed/backgrounded doesn't count.
      const now = Date.now();
      restoreDailyProgressFromSave({
        dailyDateKey: saved.dailyDateKey,
        serializedPuzzle: saved.serializedPuzzle,
        givensMask: saved.givensMask,
        mistakes: saved.mistakes,
        hintsUsedCount: saved.hintsUsedCount,
        hintBreakdown: saved.hintBreakdown,
        runTimer: saved.runTimer.pausedAtMs == null ? { ...saved.runTimer, pausedAtMs: now } : saved.runTimer,
        runStatus: 'paused',
      });
    })();
  }, [dailyDateKey, dailyLoad.status, restoreDailyProgressFromSave, resumeDailyKey]);

  useEffect(() => {
    if (mode !== 'daily') return;
    if (dailyLoad.status !== 'ready') return;
    if (!dailyDateKey) return;
    if (runStatus === 'completed') return;

    // Solve check: every cell must match the solution and be non-zero.
    for (let i = 0; i < 81; i++) {
      const pv = puzzle[i];
      const sv = solution[i];
      if (pv == null || sv == null) return;
      if (pv === 0) return;
      if (pv !== sv) return;
    }

    const clientSubmissionId = createClientSubmissionId();
    markCompleted({ clientSubmissionId });
    setSubmitState('submitting');

    void (async () => {
      const rawTimeMs = getRunTimerElapsedMs(runTimer, Date.now());
      const res = await submitDailyRun({
        utc_date: dailyDateKey,
        raw_time_ms: rawTimeMs,
        mistakes_count: mistakes,
        hint_breakdown: hintBreakdown,
        client_submission_id: clientSubmissionId,
      });
      if (res.ok && !res.queued) setSubmitState('submitted');
      else if (!res.ok && res.queued) setSubmitState('queued');
      else setSubmitState('idle');
    })();
  }, [dailyDateKey, dailyLoad.status, hintBreakdown, markCompleted, mistakes, mode, puzzle, runStatus, runTimer, solution]);

  const revealDisabled = selectedIndex == null ? true : givensMask[selectedIndex] === true;
  const elapsedMs = getRunTimerElapsedMs(runTimer, Date.now());

  return (
    <Screen scroll>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Daily Sudoku
      </AppText>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText tone="muted">UTC rollover in: {countdown}</AppText>
        <AppText tone="muted">Today: {todayKey}</AppText>
        {mode === 'daily' && dailyDateKey ? <AppText tone="muted">Loaded: {dailyDateKey}</AppText> : null}
        {dailySource ? <AppText tone="muted">Source: {dailySource}</AppText> : null}
      </AppCard>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <AppButton title="Load Today" onPress={() => void loadDaily(todayKey)} />
        <AppButton title="Back to Free Play" variant="secondary" onPress={exitDailyToFreePlay} />
      </View>

      {dailyLoad.status === 'unavailable' ? (
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppText weight="semibold">Daily unavailable</AppText>
          <AppText tone="muted">
            {dailyLoad.reason === 'offline'
              ? 'Offline. Daily requires an internet connection.'
              : dailyLoad.reason === 'missing_base_url'
                ? 'Missing EXPO_PUBLIC_SUDOKU_DAILY_BASE_URL.'
                : 'Daily payload was unavailable or invalid.'}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard style={{ marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <AppText weight="semibold">Archive (last 30 days)</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {archive.map((k) => {
            const active = mode === 'daily' && dailyDateKey === k;
            return (
              <Pressable
                key={k}
                onPress={() => void loadDaily(k)}
                accessibilityRole="button"
                accessibilityLabel={`Load Daily ${k}`}
                style={{
                  paddingVertical: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.accent : theme.colors.surface2,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <AppText weight="semibold" tone={active ? 'default' : 'muted'}>
                  {k.slice(5)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      <AppCard style={{ flex: 1, marginBottom: theme.spacing.md }}>
        <AppText tone="muted">Time: {Math.round(elapsedMs / 1000)}s</AppText>
        <AppText tone="muted">Mistakes: {mistakes}</AppText>
        <AppText tone="muted">Hints: {hintsUsedCount}</AppText>
        {hintsUsedCount > 0 ? (
          <AppText tone="muted">Reveal used: {hintBreakdown.reveal_cell_value ?? 0}</AppText>
        ) : null}
        {submitState === 'submitting' ? <AppText tone="muted">Submitting result…</AppText> : null}
        {submitState === 'queued' ? <AppText tone="muted">Will submit when online.</AppText> : null}
        {submitState === 'submitted' ? <AppText tone="muted">Submitted.</AppText> : null}
        {completionClientSubmissionId ? <AppText tone="muted">Run id: {completionClientSubmissionId.slice(0, 8)}</AppText> : null}
      </AppCard>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <AppButton
          title="Reveal Cell (+120s)"
          variant="secondary"
          disabled={revealDisabled}
          onPress={hintRevealCellValue}
        />
        {runStatus === 'paused' ? (
          <AppButton
            title="Resume"
            onPress={() => {
              resumeRun();
            }}
          />
        ) : (
          <AppButton
            title="Pause"
            variant="secondary"
            onPress={() => {
              pauseRun();
              void writeLocalSave();
            }}
          />
        )}
      </View>

      {runStatus === 'paused' ? (
        <AppCard style={{ marginBottom: theme.spacing.lg }}>
          <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
            Paused
          </AppText>
          <AppText tone="muted">Your timer is stopped. Tap Resume to continue.</AppText>
        </AppCard>
      ) : (
        <>
          <View style={{ marginBottom: theme.spacing.lg }}>
            <SudokuGrid
              puzzle={puzzle}
              givensMask={givensMask}
              selectedIndex={selectedIndex}
              onSelectCell={selectCell}
              onDigit={inputDigit}
              onClear={clearCell}
            />
          </View>

          <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />
        </>
      )}
    </Screen>
  );
}


