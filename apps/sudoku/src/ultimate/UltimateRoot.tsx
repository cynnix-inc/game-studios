import React from 'react';
import { AppState, Platform, View } from 'react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeScreen } from '../components/make/MakeScreen';
import { MakeText } from '../components/make/MakeText';
import { initialUltimateNavState, ultimateNavReducer, type UltimateNavState } from './navigation/UltimateNavState';
import { usePlayerStore } from '../state/usePlayerStore';
import { UltimateAuthModal } from './components/UltimateAuthModal';
import { UltimateFreePlaySetupScreen } from './screens/FreePlaySetupScreen';
import { UltimateVariantSelectScreen } from './screens/VariantSelectScreen';
import { UltimateDailyChallengesScreen } from './screens/DailyChallengesScreen';
import { UltimateGameScreen } from './screens/GameScreen';
import { UltimateLeaderboardScreen } from './screens/LeaderboardScreen';
import { UltimateProfileScreen } from './screens/ProfileScreen';
import { UltimateSettingsScreen } from './screens/SettingsScreen';
import { UltimateStatsScreen } from './screens/StatsScreen';
import { UltimateMenuScreen } from './screens/MenuScreen';
import { readLocalInProgressSave, writeLocalSave } from '../services/saves';
import { syncSignedInSaveSlotsOnce } from '../services/cloudSaveSync';
import { useDevModeStore } from '../state/useDevModeStore';
import { isDevToolsAllowed } from '../services/runtimeEnv';
import { UltimateDeveloperMenuOverlay } from './components/UltimateDeveloperMenuOverlay';

/**
 * Design-faithful container for the Figma Make UI.
 *
 * This is intentionally a single-screen state machine (matching Make `App.tsx`),
 * not tab navigation. Individual screens will be ported into `src/ultimate/**`.
 */
export function UltimateRoot() {
  // Hidden Developer Menu toggle (Make parity): Ctrl+Shift+D (web only).
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;
    if (typeof window === 'undefined') return;
    if (!isDevToolsAllowed()) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;
      if (typeof e.key !== 'string') return;
      if (e.key.toLowerCase() !== 'd') return;
      e.preventDefault();
      useDevModeStore.getState().toggle();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
  const profile = usePlayerStore((s) => s.profile);
  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const loadDaily = usePlayerStore((s) => s.loadDaily);
  const loadTodayDaily = usePlayerStore((s) => s.loadTodayDaily);
  const restoreDailyProgressFromSave = usePlayerStore((s) => s.restoreDailyProgressFromSave);

  const [state, dispatch] = React.useReducer(ultimateNavReducer, initialUltimateNavState, (base) => {
    // Test-only: allow Playwright visual snapshot runs to force a specific screen/state.
    // This is used exclusively by `apps/sudoku/e2e/visual/**`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (!g || g.__VISUAL_TEST__ !== true) return base;
    const override = (g.__VISUAL_ULTIMATE_STATE__ ?? null) as Partial<UltimateNavState> | null;
    if (!override) return base;
    return { ...base, ...override };
  });

  const [nowMs, setNowMs] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Flush save when the app is backgrounded / the tab is closing.
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (g?.__VISUAL_TEST__ === true) return;

    const flush = () => {
      // Always flush local first.
      void writeLocalSave();
      // Best-effort cloud push/pull if signed-in; not realtime, but good for cross-device resume.
      if (profile?.mode === 'supabase') void syncSignedInSaveSlotsOnce(profile.userId, { force: true });
    };

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') flush();
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onHide = () => flush();
      window.addEventListener('pagehide', onHide);
      window.addEventListener('beforeunload', onHide);
      return () => {
        sub.remove();
        window.removeEventListener('pagehide', onHide);
        window.removeEventListener('beforeunload', onHide);
      };
    }

    return () => sub.remove();
  }, [profile]);

  // Ensure in-progress runs can be resumed by persisting local saves (debounced).
  // This must live at the root so it works for both Free Play and Daily, regardless of which screen is mounted.
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    // Visual tests seed localStorage directly; don't mutate it during snapshot runs.
    if (g?.__VISUAL_TEST__ === true) return;

    const SAVE_DEBOUNCE_MS = 350;
    let t: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        t = null;
        void writeLocalSave();
      }, SAVE_DEBOUNCE_MS);
    };

    // Save on meaningful state changes. (revision tracks moves/notes/undo/redo; runStatus/timer track pause/resume.)
    const unsubscribe = usePlayerStore.subscribe((next, prev) => {
      if (
        next.mode !== prev.mode ||
        next.dailyDateKey !== prev.dailyDateKey ||
        next.difficulty !== prev.difficulty ||
        next.revision !== prev.revision ||
        next.runStatus !== prev.runStatus ||
        next.runTimer !== prev.runTimer
      ) {
        schedule();
      }
    });

    return () => {
      if (t) clearTimeout(t);
      unsubscribe();
      // Best-effort final flush.
      void writeLocalSave();
    };
  }, []);

  // Mirror auth state from the real profile into the local UI state machine.
  React.useEffect(() => {
    if (profile?.mode === 'supabase') {
      const username = profile.displayName ?? profile.email ?? 'Account';
      if (!state.isAuthenticated || state.username !== username) {
        dispatch({ type: 'AUTH_SUCCESS', username });
      }
      return;
    }
    if (state.isAuthenticated) {
      dispatch({ type: 'SIGN_OUT' });
    }
  }, [profile, state.isAuthenticated, state.username]);

  // Placeholder container: real screens will be introduced in the next todo.
  const devMenuOpen = useDevModeStore((s) => s.open);
  const closeDevMenu = React.useCallback(() => useDevModeStore.getState().setOpen(false), []);

  let content: React.ReactNode = null;
  if (state.screen === 'menu') {
    content = (
      <>
        <UltimateMenuScreen
          profile={profile}
          nowMs={nowMs}
          onShowAuth={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', open: true })}
          onNavigate={(screen) => dispatch({ type: 'NAVIGATE', screen })}
          onResumeFreePlay={() => dispatch({ type: 'RESUME_FREE_PLAY' })}
          onStartDailyToday={async () => {
            await loadTodayDaily();
            dispatch({ type: 'START_DAILY' });
          }}
          onResumeDailyFromSave={async () => {
            const saved = await readLocalInProgressSave();
            if (!saved || saved.mode !== 'daily') {
              await loadTodayDaily();
              // If we didn't have a specific daily save to restore, ensure the run starts unpaused.
              usePlayerStore.getState().resumeRun();
              dispatch({ type: 'START_DAILY' });
              return;
            }
            await loadDaily(saved.dailyDateKey);
            restoreDailyProgressFromSave({
              dailyDateKey: saved.dailyDateKey,
              serializedPuzzle: saved.serializedPuzzle,
              givensMask: saved.givensMask,
              mistakes: saved.mistakes,
              hintsUsedCount: saved.hintsUsedCount,
              hintBreakdown: saved.hintBreakdown ?? {},
              runTimer: saved.runTimer,
              runStatus: saved.runStatus,
              difficulty: saved.difficulty,
              variantId: saved.variantId,
              subVariantId: saved.subVariantId ?? null,
              runId: saved.runId,
              statsStartedCounted: saved.statsStartedCounted,
              zenModeAtStart: saved.zenModeAtStart ?? null,
              revision: saved.revision,
              moves: saved.moves,
              undoStack: saved.undoStack,
              redoStack: saved.redoStack,
            });
            // Restored runs may be paused (common when we save on background). "Resume" should resume.
            // But terminal states (completed/failed) should not auto-resume.
            const status = usePlayerStore.getState().runStatus;
            if (status === 'paused') usePlayerStore.getState().resumeRun();
            dispatch({ type: 'START_DAILY' });
          }}
        />
        <UltimateAuthModal open={state.authModalOpen} onClose={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', open: false })} />
      </>
    );
  } else if (state.screen === 'difficulty') {
    content = (
      <UltimateFreePlaySetupScreen
        selectedVariant={state.selectedVariant}
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'variantSelect' })}
        onStart={({ difficulty }) => {
          newPuzzle(difficulty, { mode: 'free', variantId: state.selectedVariant, subVariantId: 'classic:9x9' });
          dispatch({ type: 'SELECT_DIFFICULTY', difficulty });
        }}
      />
    );
  } else if (state.screen === 'variantSelect') {
    content = (
      <UltimateVariantSelectScreen
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
        onSelectVariant={(variant) => dispatch({ type: 'SELECT_VARIANT', variant })}
      />
    );
  } else if (state.screen === 'game') {
    content = (
      <UltimateGameScreen
        username={state.username}
        gameType={state.gameType}
        onExitToMenu={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
      />
    );
  } else if (state.screen === 'dailyChallenges') {
    content = (
      <UltimateDailyChallengesScreen
        username={state.username}
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
        onPlayDaily={async (dateKey) => {
          const saved = await readLocalInProgressSave();
          const canResumeSaved =
            Boolean(saved) &&
            saved?.mode === 'daily' &&
            saved?.dailyDateKey === dateKey &&
            saved?.runStatus !== 'completed' &&
            saved?.runStatus !== 'failed';

          if (!saved || !canResumeSaved) {
            await loadDaily(dateKey);
            dispatch({ type: 'START_DAILY' });
            return;
          }

          await loadDaily(saved.dailyDateKey);
          restoreDailyProgressFromSave({
            dailyDateKey: saved.dailyDateKey,
            serializedPuzzle: saved.serializedPuzzle,
            givensMask: saved.givensMask,
            mistakes: saved.mistakes,
            hintsUsedCount: saved.hintsUsedCount,
            hintBreakdown: saved.hintBreakdown ?? {},
            runTimer: saved.runTimer,
            runStatus: saved.runStatus,
            difficulty: saved.difficulty,
            variantId: saved.variantId,
            subVariantId: saved.subVariantId ?? null,
            runId: saved.runId,
            statsStartedCounted: saved.statsStartedCounted,
            zenModeAtStart: saved.zenModeAtStart ?? null,
            revision: saved.revision,
            moves: saved.moves,
            undoStack: saved.undoStack,
            redoStack: saved.redoStack,
          });
          const status = usePlayerStore.getState().runStatus;
          if (status === 'paused') usePlayerStore.getState().resumeRun();
          dispatch({ type: 'START_DAILY' });
        }}
      />
    );
  } else if (state.screen === 'settings') {
    content = <UltimateSettingsScreen onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  } else if (state.screen === 'leaderboard') {
    content = <UltimateLeaderboardScreen onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  } else if (state.screen === 'stats') {
    content = <UltimateStatsScreen profile={profile} onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  } else if (state.screen === 'profile') {
    content = <UltimateProfileScreen profile={profile} onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  } else {
    // Remaining screens will be ported next.
    content = (
      <MakeScreen scroll={false} style={{ padding: 0 }}>
        <View style={{ flex: 1, padding: theme.spacing.lg, justifyContent: 'center' }}>
          <MakeText weight="bold" style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.sm }}>
            Ultimate Sudoku
          </MakeText>
          <MakeText tone="muted">Screen not yet ported: {state.screen}</MakeText>
          <View style={{ height: theme.spacing.md }} />
          <MakeText tone="muted">Returning to menu soon…</MakeText>
        </View>
      </MakeScreen>
    );
  }

  return (
    <>
      {content}
      <UltimateDeveloperMenuOverlay open={devMenuOpen} onClose={closeDevMenu} />
    </>
  );
}


