import React from 'react';
import { Animated, AppState, Easing, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, Gamepad2, Lightbulb, LogOut, Maximize2, Menu, Play, RotateCcw, User, Volume2 } from 'lucide-react-native';

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
import { MakeCard } from '../../components/make/MakeCard';

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
  const { width } = useWindowDimensions();
  const isSm = width >= 640;
  const isMd = width >= 768;
  const headerHeight = isMd ? 80 : 64;

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
  const { theme: makeTheme, reducedMotion } = useMakeTheme();

  const openMenu = () => {
    setMenuOpen(true);
    pauseRun();
  };
  const closeMenu = () => {
    setMenuOpen(false);
    resumeRun();
  };

  const isPaused = runStatus === 'paused';

  // Menu slide animation (Make: slide-down panel). Tests force reduced motion.
  const menuAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const duration = reducedMotion ? 0 : 300;
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [menuAnim, menuOpen, reducedMotion]);

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-420, headerHeight],
  });

  const [audioExpanded, setAudioExpanded] = React.useState(false);
  const [gameplayExpanded, setGameplayExpanded] = React.useState(false);
  const [gridExpanded, setGridExpanded] = React.useState(false);

  return (
    <MakeScreen scroll={false} style={{ padding: 0 }}>
      {/* Header (fixed) */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 }}>
        <View style={{ backgroundColor: makeTheme.card.background, borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
          <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
          <View style={{ paddingHorizontal: isMd ? 24 : 12, paddingVertical: isMd ? 16 : 12 }}>
            <View style={{ maxWidth: 960, alignSelf: 'center', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: isMd ? 16 : 10 }}>
                {/* Left: menu + difficulty */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={menuOpen || isPaused ? 'Resume' : 'Menu'}
                    onPress={() => (menuOpen ? closeMenu() : openMenu())}
                    style={(state) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Platform.OS === 'web' && state.hovered ? makeTheme.card.background : 'transparent',
                      opacity: state.pressed ? 0.85 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            transition: 'background-color 200ms ease, opacity 150ms ease',
                          } as unknown as object)
                        : null),
                    })}
                  >
                    {menuOpen || isPaused ? (
                      <Play width={isMd ? 24 : 20} height={isMd ? 24 : 20} color={makeTheme.text.primary} />
                    ) : (
                      <Menu width={isMd ? 24 : 20} height={isMd ? 24 : 20} color={makeTheme.text.primary} />
                    )}
                  </Pressable>

                  {isSm ? (
                    <View style={{ gap: 3 }}>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                      </MakeText>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: badge.bg,
                          borderWidth: 1,
                          borderColor: badge.border,
                        }}
                      >
                        <MakeText style={{ fontSize: 12, color: badge.text, textTransform: 'capitalize' }} weight="semibold">
                          {difficulty}
                        </MakeText>
                      </View>
                    </View>
                  ) : (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: badge.bg,
                        borderWidth: 1,
                        borderColor: badge.border,
                      }}
                    >
                      <MakeText style={{ fontSize: 12, color: badge.text, textTransform: 'capitalize' }} weight="semibold">
                        {difficulty}
                      </MakeText>
                    </View>
                  )}
                </View>

                {/* Center: mistakes/hints/time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMd ? 24 : 12 }}>
                  {/* Mistakes */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle width={isMd ? 20 : 16} height={isMd ? 20 : 16} color={mistakes > 3 ? '#f87171' : makeTheme.text.muted} />
                    <View>
                      {isMd ? (
                        <MakeText tone="muted" style={{ fontSize: 12 }}>
                          Mistakes
                        </MakeText>
                      ) : null}
                      <MakeText style={{ fontSize: isMd ? 16 : 14, color: mistakes > 3 ? '#f87171' : makeTheme.text.primary }} weight="semibold">
                        {mistakes}
                      </MakeText>
                    </View>
                  </View>

                  {/* Hints */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Lightbulb width={isMd ? 20 : 16} height={isMd ? 20 : 16} color={makeTheme.text.muted} />
                    <View>
                      {isMd ? (
                        <MakeText tone="muted" style={{ fontSize: 12 }}>
                          Hints
                        </MakeText>
                      ) : null}
                      <MakeText style={{ fontSize: isMd ? 16 : 14 }} weight="semibold">
                        {hintsUsedCount}
                      </MakeText>
                    </View>
                  </View>

                  {/* Timer */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock width={isMd ? 20 : 16} height={isMd ? 20 : 16} color={makeTheme.text.muted} />
                    <View>
                      {isMd ? (
                        <MakeText tone="muted" style={{ fontSize: 12 }}>
                          Time
                        </MakeText>
                      ) : null}
                      <MakeText style={{ fontSize: isMd ? 16 : 14, fontVariant: ['tabular-nums'] }} weight="semibold">
                        {timeLabel}
                      </MakeText>
                    </View>
                  </View>
                </View>

                {/* Right: profile */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {isMd ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        Player
                      </MakeText>
                      <MakeText style={{ fontSize: 14 }} numberOfLines={1}>
                        {username || 'Guest'}
                      </MakeText>
                    </View>
                  ) : null}
                  <View
                    style={{
                      width: isMd ? 40 : 36,
                      height: isMd ? 40 : 36,
                      borderRadius: isMd ? 20 : 18,
                      borderWidth: 1,
                      borderColor: makeTheme.card.border,
                      backgroundColor: makeTheme.card.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <User width={isMd ? 24 : 20} height={isMd ? 24 : 20} color={makeTheme.text.primary} />
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
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: headerHeight,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.50)',
            ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as unknown as object) : null),
            zIndex: 20,
          }}
        />
      ) : null}

      {/* Slide-down menu (simplified first pass) */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 30, transform: [{ translateY: menuTranslateY }] }}>
        <View style={{ backgroundColor: makeTheme.card.background, borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
          <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />

          <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: isMd ? 24 : 16, gap: 12 }}>
            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <MakeButton
                accessibilityLabel="Resume"
                title={isMd ? 'Resume' : ''}
                onPress={closeMenu}
                style={{ flex: 1 }}
                leftIcon={<Play width={18} height={18} color={makeTheme.button.textOnPrimary} />}
                contentStyle={{ height: 44 }}
              />
              <MakeButton
                accessibilityLabel="Restart"
                title={isMd ? 'Restart' : ''}
                variant="secondary"
                onPress={() => {
                  if (gameType === 'daily') {
                    const key = usePlayerStore.getState().dailyDateKey;
                    if (key) void usePlayerStore.getState().loadDaily(key);
                    else void usePlayerStore.getState().loadTodayDaily();
                  } else {
                    usePlayerStore.getState().newPuzzle(difficulty);
                  }
                  closeMenu();
                }}
                style={{ flex: 1 }}
                leftIcon={<RotateCcw width={18} height={18} color={makeTheme.text.primary} />}
                contentStyle={{ height: 44 }}
              />
              <MakeButton
                accessibilityLabel="Exit"
                title={isMd ? 'Exit' : ''}
                variant="secondary"
                onPress={() => {
                  closeMenu();
                  onExitToMenu();
                }}
                style={{ flex: 1 }}
                leftIcon={<LogOut width={18} height={18} color={makeTheme.text.primary} />}
                  contentStyle={{ height: 44, backgroundColor: 'rgba(239,68,68,0.40)', borderColor: 'rgba(239,68,68,0.80)' }}
              />
            </View>

            {/* Collapsible sections (structure parity; deeper wiring handled in later screen passes) */}
            <MakeCard style={{ borderRadius: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Audio Settings"
                onPress={() => setAudioExpanded((v) => !v)}
                style={(state) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: Platform.OS === 'web' && state.hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Volume2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Audio Settings</MakeText>
                </View>
                {audioExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
            </MakeCard>

            <MakeCard style={{ borderRadius: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gameplay Assists"
                onPress={() => setGameplayExpanded((v) => !v)}
                style={(state) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: Platform.OS === 'web' && state.hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Gamepad2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Gameplay Assists</MakeText>
                </View>
                {gameplayExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
            </MakeCard>

            <MakeCard style={{ borderRadius: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Grid Sizing"
                onPress={() => setGridExpanded((v) => !v)}
                style={(state) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: Platform.OS === 'web' && state.hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Maximize2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Grid Sizing</MakeText>
                </View>
                {gridExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
            </MakeCard>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Content */}
      <View style={{ flex: 1, paddingTop: headerHeight, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
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


