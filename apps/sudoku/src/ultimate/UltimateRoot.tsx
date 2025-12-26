import React from 'react';
import { View } from 'react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeScreen } from '../components/make/MakeScreen';
import { MakeText } from '../components/make/MakeText';
import { initialUltimateNavState, ultimateNavReducer, type UltimateNavState } from './navigation/UltimateNavState';
import { usePlayerStore } from '../state/usePlayerStore';
import { UltimateAuthModal } from './components/UltimateAuthModal';
import { UltimateDifficultyScreen } from './screens/DifficultyScreen';
import { UltimateDailyChallengesScreen } from './screens/DailyChallengesScreen';
import { UltimateGameScreen } from './screens/GameScreen';
import { UltimateLeaderboardScreen } from './screens/LeaderboardScreen';
import { UltimateProfileScreen } from './screens/ProfileScreen';
import { UltimateSettingsScreen } from './screens/SettingsScreen';
import { UltimateStatsScreen } from './screens/StatsScreen';
import { UltimateMenuScreen } from './screens/MenuScreen';

/**
 * Design-faithful container for the Figma Make UI.
 *
 * This is intentionally a single-screen state machine (matching Make `App.tsx`),
 * not tab navigation. Individual screens will be ported into `src/ultimate/**`.
 */
export function UltimateRoot() {
  const profile = usePlayerStore((s) => s.profile);
  const newPuzzle = usePlayerStore((s) => s.newPuzzle);
  const loadDaily = usePlayerStore((s) => s.loadDaily);

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
  if (state.screen === 'menu') {
    return (
      <>
        <UltimateMenuScreen
          profile={profile}
          nowMs={nowMs}
          onShowAuth={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', open: true })}
          onNavigate={(screen) => dispatch({ type: 'NAVIGATE', screen })}
        />
        <UltimateAuthModal open={state.authModalOpen} onClose={() => dispatch({ type: 'SET_AUTH_MODAL_OPEN', open: false })} />
      </>
    );
  }

  if (state.screen === 'difficulty') {
    return (
      <UltimateDifficultyScreen
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
        onSelectDifficulty={(difficulty) => {
          newPuzzle(difficulty);
          dispatch({ type: 'SELECT_DIFFICULTY', difficulty });
        }}
      />
    );
  }

  if (state.screen === 'game') {
    return (
      <UltimateGameScreen
        username={state.username}
        gameType={state.gameType}
        onExitToMenu={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
      />
    );
  }

  if (state.screen === 'dailyChallenges') {
    return (
      <UltimateDailyChallengesScreen
        username={state.username}
        onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })}
        onStartDaily={(dateKey) => {
          void loadDaily(dateKey);
          dispatch({ type: 'START_DAILY' });
        }}
      />
    );
  }

  if (state.screen === 'settings') {
    return <UltimateSettingsScreen onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  }

  if (state.screen === 'leaderboard') {
    return <UltimateLeaderboardScreen onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  }

  if (state.screen === 'stats') {
    return <UltimateStatsScreen profile={profile} onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  }

  if (state.screen === 'profile') {
    return <UltimateProfileScreen profile={profile} onBack={() => dispatch({ type: 'NAVIGATE', screen: 'menu' })} />;
  }

  // Remaining screens will be ported next.
  return (
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


