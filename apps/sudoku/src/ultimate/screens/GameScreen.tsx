import React from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Clock, Lightbulb, LogOut, Menu, Play, RotateCcw, User } from 'lucide-react-native';

import { getRunTimerElapsedMs } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { NumberPad } from '../../components/NumberPad';
import { SudokuGrid } from '../../components/SudokuGrid';
import { usePlayerStore } from '../../state/usePlayerStore';
import { formatElapsedSecondsMMSS } from './game/formatTime';

function difficultyBadge(difficulty: string): { bg: string; border: string; text: string } {
  if (difficulty === 'easy') return { bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.30)', text: '#4ade80' };
  if (difficulty === 'medium') return { bg: 'rgba(234,179,8,0.20)', border: 'rgba(234,179,8,0.30)', text: '#facc15' };
  if (difficulty === 'hard') return { bg: 'rgba(249,115,22,0.20)', border: 'rgba(249,115,22,0.30)', text: '#fb923c' };
  if (difficulty === 'expert') return { bg: 'rgba(239,68,68,0.20)', border: 'rgba(239,68,68,0.30)', text: '#f87171' };
  // Fallback styling (should be unreachable unless a new difficulty is introduced).
  return { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.20)', text: 'rgba(255,255,255,0.80)' };
}

export function UltimateGameScreen({
  username,
  gameType,
  onExitToMenu,
}: {
  username: string;
  gameType: 'classic' | 'daily';
  onExitToMenu: () => void;
}) {
  const difficulty = usePlayerStore((s) => s.difficulty);
  const puzzle = usePlayerStore((s) => s.puzzle);
  const solution = usePlayerStore((s) => s.solution);
  const givensMask = usePlayerStore((s) => s.givensMask);
  const notes = usePlayerStore((s) => s.notes);
  const notesMode = usePlayerStore((s) => s.notesMode);
  const selectedIndex = usePlayerStore((s) => s.selectedIndex);
  const mistakes = usePlayerStore((s) => s.mistakes);
  const hintsUsedCount = usePlayerStore((s) => s.hintsUsedCount);
  const runTimer = usePlayerStore((s) => s.runTimer);
  const runStatus = usePlayerStore((s) => s.runStatus);

  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const toggleNotesMode = usePlayerStore((s) => s.toggleNotesMode);
  const undo = usePlayerStore((s) => s.undo);
  const redo = usePlayerStore((s) => s.redo);
  const hintRevealCellValue = usePlayerStore((s) => s.hintRevealCellValue);
  const pauseRun = usePlayerStore((s) => s.pauseRun);
  const resumeRun = usePlayerStore((s) => s.resumeRun);

  const [nowMs, setNowMs] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-pause on background / tab hidden (parity with legacy screen).
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pauseRun();
    });
    return () => sub.remove();
  }, [pauseRun]);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const handler = () => {
      if (document.hidden) pauseRun();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pauseRun]);

  const elapsedSeconds = Math.floor(getRunTimerElapsedMs(runTimer, nowMs) / 1000);
  const timeLabel = formatElapsedSecondsMMSS(elapsedSeconds);
  const badge = difficultyBadge(difficulty);

  const [menuOpen, setMenuOpen] = React.useState(false);
  const { theme: makeTheme } = useMakeTheme();

  const openMenu = () => {
    setMenuOpen(true);
    pauseRun();
  };
  const closeMenu = () => {
    setMenuOpen(false);
    resumeRun();
  };

  const isPaused = runStatus === 'paused';

  return (
    <MakeScreen scroll={false} style={{ padding: 0 }}>
      {/* Header (fixed) */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 }}>
        <View style={{ backgroundColor: makeTheme.card.background, borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
          <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
          <View style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md }}>
            <View style={{ maxWidth: 960, alignSelf: 'center', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                {/* Left: menu + difficulty */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={menuOpen || isPaused ? 'Resume' : 'Menu'}
                    onPress={() => (menuOpen ? closeMenu() : openMenu())}
                    style={({ pressed }) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    {menuOpen || isPaused ? (
                      <Play width={22} height={22} color={makeTheme.text.primary} />
                    ) : (
                      <Menu width={22} height={22} color={makeTheme.text.primary} />
                    )}
                  </Pressable>

                  <View style={{ gap: 3 }}>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                    </MakeText>
                    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: badge.bg, borderWidth: 1, borderColor: badge.border }}>
                      <MakeText style={{ fontSize: 12, color: badge.text }} weight="semibold">
                        {difficulty}
                      </MakeText>
                    </View>
                  </View>
                </View>

                {/* Center: mistakes/hints/time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle width={18} height={18} color={mistakes > 3 ? '#f87171' : makeTheme.text.muted} />
                    <MakeText style={{ fontSize: 14, color: mistakes > 3 ? '#f87171' : makeTheme.text.primary }} weight="semibold">
                      {mistakes}
                    </MakeText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Lightbulb width={18} height={18} color={makeTheme.text.muted} />
                    <MakeText style={{ fontSize: 14 }} weight="semibold">
                      {hintsUsedCount}
                    </MakeText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock width={18} height={18} color={makeTheme.text.muted} />
                    <MakeText style={{ fontSize: 14, fontVariant: ['tabular-nums'] }} weight="semibold">
                      {timeLabel}
                    </MakeText>
                  </View>
                </View>

                {/* Right: profile */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Player
                    </MakeText>
                    <MakeText style={{ fontSize: 14 }} numberOfLines={1}>
                      {username || 'Guest'}
                    </MakeText>
                  </View>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: makeTheme.card.border,
                      backgroundColor: makeTheme.card.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User width={22} height={22} color={makeTheme.text.primary} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Overlay when menu open */}
      {menuOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={closeMenu}
          style={{ position: 'absolute', left: 0, right: 0, top: 80, bottom: 0, backgroundColor: 'rgba(0,0,0,0.50)', zIndex: 20 }}
        />
      ) : null}

      {/* Slide-down menu (simplified first pass) */}
      {menuOpen ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 80, zIndex: 30 }}>
          <View style={{ backgroundColor: makeTheme.card.background, borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
            <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
            <View style={{ padding: theme.spacing.md }}>
              <View style={{ maxWidth: 720, alignSelf: 'center', width: '100%', gap: theme.spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <MakeButton title="Resume" onPress={closeMenu} leftIcon={<Play width={18} height={18} color={makeTheme.button.textOnPrimary} />} />
                  <MakeButton
                    title="Restart"
                    variant="secondary"
                    onPress={() => {
                      // Restart: reset via selecting new puzzle of same difficulty.
                      // (Full “restart current seed” parity is a future enhancement.)
                    if (gameType === 'daily') {
                      const key = usePlayerStore.getState().dailyDateKey;
                      if (key) {
                        void usePlayerStore.getState().loadDaily(key);
                      } else {
                        void usePlayerStore.getState().loadTodayDaily();
                      }
                    } else {
                      usePlayerStore.getState().newPuzzle(difficulty);
                    }
                      closeMenu();
                    }}
                    leftIcon={<RotateCcw width={18} height={18} color={makeTheme.text.primary} />}
                  />
                  <MakeButton
                    title="Exit"
                    variant="secondary"
                    onPress={() => {
                      closeMenu();
                      onExitToMenu();
                    }}
                    leftIcon={<LogOut width={18} height={18} color={makeTheme.text.primary} />}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Content */}
      <View style={{ flex: 1, paddingTop: 96, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
        <View style={{ alignSelf: 'center', width: '100%', maxWidth: 720, gap: theme.spacing.md }}>
          <View style={{ alignItems: 'center' }}>
            <SudokuGrid
              puzzle={puzzle}
              givensMask={givensMask}
              notes={notes}
              notesMode={notesMode}
              selectedIndex={selectedIndex}
              onSelectCell={selectCell}
              onDigit={(d) => inputDigit(d)}
              onClear={clearCell}
              onToggleNotesMode={toggleNotesMode}
              onUndo={undo}
              onRedo={redo}
              onEscape={() => {
                if (menuOpen) closeMenu();
              }}
            />
          </View>

          <View style={{ alignItems: 'center' }}>
            {/* Temporary: reuse existing NumberPad; will be restyled to match Make keypad. */}
            <NumberPad onDigit={(d) => inputDigit(d)} onClear={clearCell} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <MakeButton
              title="Undo"
              variant="secondary"
              onPress={undo}
              disabled={false}
              style={{ flex: 1 }}
            />
            <MakeButton
              title={notesMode ? 'Notes (On)' : 'Notes'}
              variant={notesMode ? 'primary' : 'secondary'}
              onPress={toggleNotesMode}
              style={{ flex: 1 }}
            />
            {/* Lock mode is in Make reference UI but not supported by current engine UI. */}
            <MakeButton title="Lock" variant="secondary" disabled onPress={() => {}} style={{ flex: 1 }} />
            <MakeButton
              title="Hint"
              variant="secondary"
              onPress={hintRevealCellValue}
              style={{ flex: 1 }}
            />
          </View>

          <MakeText tone="muted" style={{ fontSize: 12 }}>
            Notes: N · Undo: U · Redo: R · Clear: Backspace/Delete · Close menu: Esc
          </MakeText>

          {/* Solve status placeholder (real completion UI will be ported later) */}
          {solution.length === 0 ? (
            <MakeText tone="muted">Loading puzzle…</MakeText>
          ) : null}
        </View>
      </View>
    </MakeScreen>
  );
}


