import React from 'react';
import { Animated, AppState, Easing, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Gamepad2,
  Lightbulb,
  Lock,
  LogOut,
  Maximize2,
  Menu,
  Music,
  Play,
  RotateCcw,
  Undo2,
  User,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

import { getRunTimerElapsedMs } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { Slider } from '../../components/Slider';
import { SudokuSizingPreview } from '../../components/SudokuSizingPreview';
import { SudokuGrid } from '../../components/SudokuGrid';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useSettingsStore } from '../../state/useSettingsStore';
import { formatElapsedSecondsMMSS } from './game/formatTime';
import { MakeCard } from '../../components/make/MakeCard';
import {
  UI_SIZING_LIMITS,
  getAudioSettings,
  getGameplaySettings,
  getSettingsToggles,
  getUiSizingSettings,
  setAudioSettings,
  setGameplaySettings,
  setSettingsToggles,
  setUiSizingSettings,
  type HintMode,
} from '../../services/settingsModel';
import { updateLocalSettings } from '../../services/settings';
import { MakeDigitPad } from '../components/MakeDigitPad';

type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function difficultyBadge(difficulty: string): { bg: string; border: string; text: string } {
  if (difficulty === 'easy') return { bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.30)', text: '#4ade80' };
  if (difficulty === 'medium') return { bg: 'rgba(234,179,8,0.20)', border: 'rgba(234,179,8,0.30)', text: '#facc15' };
  if (difficulty === 'hard') return { bg: 'rgba(249,115,22,0.20)', border: 'rgba(249,115,22,0.30)', text: '#fb923c' };
  if (difficulty === 'expert') return { bg: 'rgba(239,68,68,0.20)', border: 'rgba(239,68,68,0.30)', text: '#f87171' };
  // Fallback styling (should be unreachable unless a new difficulty is introduced).
  return { bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.20)', text: 'rgba(255,255,255,0.80)' };
}

function hintModeLabel(mode: HintMode): string {
  if (mode === 'direct') return 'Direct';
  if (mode === 'logic') return 'Logic';
  if (mode === 'assist') return 'Assist';
  return 'Escalate';
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, opacity: 0.9 }} />;
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
  const { width, height } = useWindowDimensions();
  const isSm = width >= 640;
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const isXl = width >= 1280;
  const headerHeight = isMd ? 80 : 64;
  // Make-like centering: tablet feels like max-w-xl; desktop feels like max-w-2xl.
  const menuMaxWidth = isLg ? 672 : isMd ? 576 : 520;
  const maxMenuHeight = Math.max(260, Math.floor(height - headerHeight - 16));

  // Match Make spacing: px-2 on mobile, md:px-4.
  const horizontalPadding = isMd ? 16 : 8;
  // Make container widths: max-w-2xl, lg:max-w-4xl, xl:max-w-5xl.
  const containerMaxWidth = isXl ? 1024 : isLg ? 896 : 672;

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
  const canUndo = usePlayerStore((s) => s.undoStack.length > 0);

  const selectCell = usePlayerStore((s) => s.selectCell);
  const inputDigit = usePlayerStore((s) => s.inputDigit);
  const clearCell = usePlayerStore((s) => s.clearCell);
  const toggleNotesMode = usePlayerStore((s) => s.toggleNotesMode);
  const undo = usePlayerStore((s) => s.undo);
  const redo = usePlayerStore((s) => s.redo);
  const hintRevealCellValue = usePlayerStore((s) => s.hintRevealCellValue);
  const pauseRun = usePlayerStore((s) => s.pauseRun);
  const resumeRun = usePlayerStore((s) => s.resumeRun);

  const [menuOpen, setMenuOpen] = React.useState(false);
  // Mirror latest Make: when the app auto-pauses due to background/visibility change,
  // show a dedicated "Welcome Back" overlay that hides the puzzle until the user explicitly resumes.
  const [autoResumeNeeded, setAutoResumeNeeded] = React.useState(false);
  const { theme: makeTheme, reducedMotion } = useMakeTheme();
  const isComplete = runStatus === 'completed';
  const [lockMode, setLockMode] = React.useState(false);
  const [lockedDigit, setLockedDigit] = React.useState<Digit | null>(null);

  // Track latest runStatus to avoid stale closures in background listeners.
  const runStatusRef = React.useRef(runStatus);
  React.useEffect(() => {
    runStatusRef.current = runStatus;
  }, [runStatus]);

  const [nowMs, setNowMs] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-pause on background / tab hidden (parity with legacy screen).
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') return;
      const status = runStatusRef.current;
      if (status === 'paused' || status === 'completed') return;
      // Auto-pause: do not show in-game menu; show dedicated overlay instead.
      setMenuOpen(false);
      setAutoResumeNeeded(true);
      pauseRun();
    });
    return () => sub.remove();
  }, [pauseRun]);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    const handler = () => {
      if (!document.hidden) return;
      const status = runStatusRef.current;
      if (status === 'paused' || status === 'completed') return;
      setMenuOpen(false);
      setAutoResumeNeeded(true);
      pauseRun();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pauseRun]);

  // Visual tests: allow deterministic snapshots of the auto-resume overlay without relying on
  // browser visibility APIs (which are not controllable in Playwright reliably).
  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : null;
    if (!g || g.__VISUAL_TEST__ !== true) return;
    if (g.__VISUAL_GAME_AUTO_RESUME_OVERLAY__ !== true) return;
    setMenuOpen(false);
    setAutoResumeNeeded(true);
    pauseRun();
  }, [pauseRun]);

  const elapsedSeconds = Math.floor(getRunTimerElapsedMs(runTimer, nowMs) / 1000);
  const timeLabel = formatElapsedSecondsMMSS(elapsedSeconds);
  const badge = difficultyBadge(difficulty);

  const openMenu = React.useCallback(() => {
    setMenuOpen(true);
    setAutoResumeNeeded(false);
    pauseRun();
  }, [pauseRun]);

  const closeMenu = React.useCallback(() => {
    setMenuOpen(false);
    resumeRun();
  }, [resumeRun]);

  const [hintPickerOpen, setHintPickerOpen] = React.useState(false);

  // Web: allow Esc to close the in-game menu (even when the grid isn't focused).
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!menuOpen && !hintPickerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (hintPickerOpen) {
        setHintPickerOpen(false);
        return;
      }
      if (menuOpen) closeMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeMenu, hintPickerOpen, menuOpen]);

  // Menu slide animation (Make: slide-down panel). Tests force reduced motion.
  const menuAnim = React.useRef(new Animated.Value(0)).current;
  const [menuPanelHeight, setMenuPanelHeight] = React.useState(520);
  React.useEffect(() => {
    const duration = reducedMotion ? 0 : 300;
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [menuAnim, menuOpen, reducedMotion]);

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    // Use measured height so the menu fully hides when closed (no "leftover strip").
    // Closed: fully off-screen above.
    // Open: explicitly positioned just below the header (never "behind" it).
    outputRange: [-Math.max(0, menuPanelHeight), headerHeight],
  });

  const [audioExpanded, setAudioExpanded] = React.useState(false);
  const [gameplayExpanded, setGameplayExpanded] = React.useState(false);
  const [gridExpanded, setGridExpanded] = React.useState(false);

  const settings = useSettingsStore((s) => s.settings);
  const deviceId = usePlayerStore((s) => s.deviceId) ?? 'unknown';
  const toggles = settings ? getSettingsToggles(settings) : null;
  const audio = settings ? getAudioSettings(settings) : null;
  const gameplay = settings ? getGameplaySettings(settings) : null;
  const sizing = settings ? getUiSizingSettings(settings) : null;

  // --- Grid + keypad sizing ---
  // Goal:
  // - grid never exceeds viewport width (no horizontal scroll)
  // - keypad matches the grid's overall width
  const contentMaxWidth = Math.min(containerMaxWidth, Math.max(0, Math.floor(width - horizontalPadding * 2)));
  // Make parity sizing:
  // - board card padding: p-3 (12) / md:p-6 (24)
  // - major 3×3 gap: gap-1.5 (6)
  // - outer board inset: p-1.5 (6)
  const stackPad = isMd ? 24 : 12;
  const gridGap = 6;
  // Compute a base cell size that fits the viewport at scale=1.0, then apply Make-style scaling.
  // Board outer size = 9*cell + 4*gap (outer inset + 2 block gaps).
  // Card outer size = board outer size + 2*stackPad.
  const baseCellFromViewport = Math.max(20, Math.min(56, Math.floor((contentMaxWidth - 2 * stackPad - 4 * gridGap) / 9)));
  const stackBaseWidth = 9 * baseCellFromViewport + 4 * gridGap + 2 * stackPad;
  const desiredScale = (sizing?.gridSizePct ?? UI_SIZING_LIMITS.gridSizePct.default) / 100;
  const maxScaleToFit = stackBaseWidth > 0 ? contentMaxWidth / stackBaseWidth : 1;
  const effectiveScale = Math.min(desiredScale, maxScaleToFit);
  // Header content should not exceed the effective game area width (grid stack after scaling).
  const headerContentMaxWidth = Math.max(0, Math.floor(stackBaseWidth * effectiveScale));

  function SwitchRow({
    label,
    icon,
    value,
    onToggle,
    disabled,
  }: {
    label: string;
    icon?: React.ComponentType<{ width?: number; height?: number; color?: string }>;
    value: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) {
    const Icon = icon;
    return (
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
        onPress={onToggle}
        disabled={disabled}
            style={(state) => {
              const hovered =
                Platform.OS === 'web' && 'hovered' in state
                  ? Boolean((state as unknown as { hovered?: boolean }).hovered)
                  : false;
              return {
                paddingVertical: 10,
                paddingHorizontal: 6,
                marginHorizontal: -6,
                borderRadius: 10,
                backgroundColor: state.pressed
                  ? 'rgba(255,255,255,0.08)'
                  : Platform.OS === 'web' && hovered
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                ...(Platform.OS === 'web' ? ({ transition: 'background-color 150ms ease, opacity 150ms ease' } as unknown as object) : null),
                opacity: disabled ? 0.55 : state.pressed ? 0.92 : 1,
              };
            }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {Icon ? <Icon width={14} height={14} color={value ? makeTheme.accent : makeTheme.text.muted} /> : null}
            <MakeText weight="semibold" tone="secondary">
              {label}
            </MakeText>
          </View>
          <View
            style={{
              width: 40,
              height: 22,
              borderRadius: 999,
              backgroundColor: value ? makeTheme.accent : makeTheme.card.border,
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#ffffff',
                alignSelf: value ? 'flex-end' : 'flex-start',
              }}
            />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <MakeScreen scroll={false} style={{ padding: 0 }}>
      {/* Header (fixed) */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 }}>
        <View style={{ backgroundColor: makeTheme.card.background, borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
          <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
          <View style={{ height: headerHeight, paddingHorizontal: isMd ? 24 : 12, justifyContent: 'center' }}>
            <View style={{ maxWidth: headerContentMaxWidth, alignSelf: 'center', width: '100%' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: isMd ? 16 : 10 }}>
                {/* Left: menu + difficulty */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMd ? 16 : 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    // Show "Resume" only when the in-game menu panel is open.
                    // When the app auto-pauses due to backgrounding/visibility, we still show "Menu" to avoid the
                    // header icon appearing to "flip" unexpectedly while the player is actively playing.
                    accessibilityLabel={menuOpen ? 'Resume' : 'Menu'}
                    onPress={() => (menuOpen ? closeMenu() : openMenu())}
                    style={(state) => ({
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                          backgroundColor:
                            Platform.OS === 'web' && 'hovered' in state && (state as unknown as { hovered?: boolean }).hovered
                              ? makeTheme.card.background
                              : 'transparent',
                      opacity: state.pressed ? 0.85 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            transition: 'background-color 200ms ease, opacity 150ms ease',
                          } as unknown as object)
                        : null),
                    })}
                  >
                    {menuOpen ? (
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
                    <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                      <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 2 }}>
                        {gameType === 'daily' ? 'Daily' : 'Classic'}
                      </MakeText>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 10,
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

      {/* Hint type picker (Make-inspired, superset-friendly) */}
      {hintPickerOpen && settings && gameplay ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close hint type picker"
          onPress={() => setHintPickerOpen(false)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.60)',
            zIndex: 60,
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <Pressable
            accessibilityRole="none"
            onPress={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}
          >
            <MakeCard style={{ borderRadius: 16 }}>
              <View style={{ padding: 16, gap: 10 }}>
                <MakeText weight="bold" style={{ fontSize: 18 }}>
                  Hint Type
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  Choose how the Hint button helps you.
                </MakeText>

                <View style={{ gap: 8 }}>
                  {(['direct', 'logic', 'assist', 'escalate'] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      accessibilityRole="radio"
                      accessibilityLabel={hintModeLabel(mode)}
                      accessibilityState={{ checked: gameplay.hintMode === mode }}
                      onPress={() => {
                        const next = setGameplaySettings(settings, { hintMode: mode }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                        updateLocalSettings(next);
                        setHintPickerOpen(false);
                      }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: gameplay.hintMode === mode ? makeTheme.accent : makeTheme.card.border,
                        backgroundColor: makeTheme.card.background,
                        opacity: pressed ? 0.92 : 1,
                      })}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <MakeText weight="semibold" style={{ color: gameplay.hintMode === mode ? makeTheme.accent : makeTheme.text.primary }}>
                          {hintModeLabel(mode)}
                        </MakeText>
                        <MakeText tone="muted">{gameplay.hintMode === mode ? 'Selected' : ''}</MakeText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </MakeCard>
          </Pressable>
        </Pressable>
      ) : null}

      {/* Slide-down menu (simplified first pass) */}
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 30, transform: [{ translateY: menuTranslateY }] }}>
        {/* Important: keep this container transparent.
            The menu UI itself (buttons/cards) already renders its own glass background.
            A solid full-width background here creates the "purple slab + sharp line" artifact. */}
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (typeof h === 'number' && Number.isFinite(h) && h > 0) setMenuPanelHeight(Math.ceil(h));
          }}
        >
          <ScrollView
            style={{ maxHeight: maxMenuHeight }}
            contentContainerStyle={{ paddingHorizontal: isMd ? 24 : 16, paddingVertical: isMd ? 24 : 16 }}
          >
            <View style={{ width: '100%', maxWidth: menuMaxWidth, alignSelf: 'center', gap: 12 }}>
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

              {/* Collapsible sections */}
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
                          backgroundColor:
                            Platform.OS === 'web' && 'hovered' in state && (state as unknown as { hovered?: boolean }).hovered
                              ? 'rgba(255,255,255,0.08)'
                              : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Volume2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Audio Settings</MakeText>
                </View>
                {audioExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
              {audioExpanded ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
                  <Divider color={makeTheme.card.border} />
                  {!settings || !toggles || !audio ? (
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Loading settings…
                    </MakeText>
                  ) : (
                    <View style={{ paddingTop: 12, gap: 10 }}>
                      <SwitchRow
                        label="Sound Effects"
                        icon={toggles.soundEnabled ? Volume2 : VolumeX}
                        value={toggles.soundEnabled}
                        onToggle={() => {
                          const next = setSettingsToggles(settings, { soundEnabled: !toggles.soundEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                          updateLocalSettings(next);
                        }}
                      />
                      {toggles.soundEnabled ? (
                        <View style={{ paddingLeft: 22 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <MakeText tone="muted" style={{ fontSize: 12 }}>
                              Volume
                            </MakeText>
                            <MakeText tone="muted" style={{ fontSize: 12 }}>
                              {Math.round(audio.soundVolume)}%
                            </MakeText>
                          </View>
                          <Slider
                            accessibilityLabel="Sound volume"
                            value={audio.soundVolume}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(soundVolume) => {
                              const next = setAudioSettings(settings, { soundVolume }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                              updateLocalSettings(next);
                            }}
                          />
                        </View>
                      ) : null}

                      <SwitchRow
                        label="Music"
                        icon={toggles.musicEnabled ? Music : VolumeX}
                        value={toggles.musicEnabled}
                        onToggle={() => {
                          const next = setSettingsToggles(settings, { musicEnabled: !toggles.musicEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                          updateLocalSettings(next);
                        }}
                      />
                      {toggles.musicEnabled ? (
                        <View style={{ paddingLeft: 22 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <MakeText tone="muted" style={{ fontSize: 12 }}>
                              Volume
                            </MakeText>
                            <MakeText tone="muted" style={{ fontSize: 12 }}>
                              {Math.round(audio.musicVolume)}%
                            </MakeText>
                          </View>
                          <Slider
                            accessibilityLabel="Music volume"
                            value={audio.musicVolume}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(musicVolume) => {
                              const next = setAudioSettings(settings, { musicVolume }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                              updateLocalSettings(next);
                            }}
                          />
                        </View>
                      ) : null}

                      <SwitchRow
                        label="Haptics"
                        icon={Vibrate}
                        value={toggles.hapticsEnabled}
                        onToggle={() => {
                          const next = setSettingsToggles(settings, { hapticsEnabled: !toggles.hapticsEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                          updateLocalSettings(next);
                        }}
                      />
                    </View>
                  )}
                </View>
              ) : null}
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
                          backgroundColor:
                            Platform.OS === 'web' && 'hovered' in state && (state as unknown as { hovered?: boolean }).hovered
                              ? 'rgba(255,255,255,0.08)'
                              : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Gamepad2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Gameplay Assists</MakeText>
                </View>
                {gameplayExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
              {gameplayExpanded ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
                  <Divider color={makeTheme.card.border} />
                  {!settings || !toggles || !gameplay ? (
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Loading settings…
                    </MakeText>
                  ) : (
                    <View style={{ paddingTop: 12, gap: 10 }}>
                      <SwitchRow
                        label="Auto Candidates"
                        value={toggles.autoCandidates}
                        onToggle={() => {
                          const next = setSettingsToggles(settings, { autoCandidates: !toggles.autoCandidates }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                          updateLocalSettings(next);
                        }}
                      />

                      <SwitchRow
                        label="Auto-advance"
                        value={toggles.autoAdvance}
                        onToggle={() => {
                          const next = setSettingsToggles(settings, { autoAdvance: !toggles.autoAdvance }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                          updateLocalSettings(next);
                        }}
                      />

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Change hint type"
                        onPress={() => {
                          // Superset-friendly: show an explicit picker (instead of cycling) for better discoverability.
                          setHintPickerOpen(true);
                        }}
                        style={({ pressed }) => ({ paddingVertical: 10, opacity: pressed ? 0.92 : 1 })}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <MakeText weight="semibold">Hint Type</MakeText>
                          <MakeText tone="secondary">{hintModeLabel(gameplay.hintMode)}</MakeText>
                        </View>
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : null}
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
                          backgroundColor:
                            Platform.OS === 'web' && 'hovered' in state && (state as unknown as { hovered?: boolean }).hovered
                              ? 'rgba(255,255,255,0.08)'
                              : 'transparent',
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Maximize2 width={20} height={20} color={makeTheme.accent} />
                  <MakeText>Grid Sizing</MakeText>
                </View>
                {gridExpanded ? <ChevronUp width={20} height={20} color={makeTheme.text.muted} /> : <ChevronDown width={20} height={20} color={makeTheme.text.muted} />}
              </Pressable>
              {gridExpanded ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 10 }}>
                  <Divider color={makeTheme.card.border} />
                  {!settings || !sizing ? (
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Loading settings…
                    </MakeText>
                  ) : (
                    <View style={{ paddingTop: 12, gap: 10 }}>
                      <View>
                        <MakeText tone="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
                          Preview
                        </MakeText>
                        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: makeTheme.card.border, padding: 12 }}>
                          <SudokuSizingPreview gridSizePct={sizing.gridSizePct} digitSizePct={sizing.digitSizePct} noteSizePct={sizing.noteSizePct} />
                        </View>
                      </View>
                      <View>
                        <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                          Grid size: {sizing.gridSizePct === 85 ? 'S' : sizing.gridSizePct === 100 ? 'M' : 'L'}
                        </MakeText>
                        <Slider
                          accessibilityLabel="Grid size"
                          value={sizing.gridSizePct}
                          min={UI_SIZING_LIMITS.gridSizePct.min}
                          max={UI_SIZING_LIMITS.gridSizePct.max}
                          step={UI_SIZING_LIMITS.gridSizePct.step}
                          onChange={(gridSizePct) => {
                            const next = setUiSizingSettings(settings, { gridSizePct }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                            updateLocalSettings(next);
                          }}
                        />
                      </View>
                      <View>
                        <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                          Digit size: {sizing.digitSizePct === 80 ? 'XS' : sizing.digitSizePct === 90 ? 'S' : sizing.digitSizePct === 100 ? 'M' : sizing.digitSizePct === 110 ? 'L' : 'XL'}
                        </MakeText>
                        <Slider
                          accessibilityLabel="Digit size"
                          value={sizing.digitSizePct}
                          min={UI_SIZING_LIMITS.digitSizePct.min}
                          max={UI_SIZING_LIMITS.digitSizePct.max}
                          step={UI_SIZING_LIMITS.digitSizePct.step}
                          onChange={(digitSizePct) => {
                            const next = setUiSizingSettings(settings, { digitSizePct }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                            updateLocalSettings(next);
                          }}
                        />
                      </View>
                      <View>
                        <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                          Notes size: {sizing.noteSizePct === 100 ? 'XS' : sizing.noteSizePct === 150 ? 'S' : sizing.noteSizePct === 200 ? 'M' : sizing.noteSizePct === 250 ? 'L' : 'XL'}
                        </MakeText>
                        <Slider
                          accessibilityLabel="Notes size"
                          value={sizing.noteSizePct}
                          min={UI_SIZING_LIMITS.noteSizePct.min}
                          max={UI_SIZING_LIMITS.noteSizePct.max}
                          step={UI_SIZING_LIMITS.noteSizePct.step}
                          onChange={(noteSizePct) => {
                            const next = setUiSizingSettings(settings, { noteSizePct }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                            updateLocalSettings(next);
                          }}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ) : null}
            </MakeCard>
            </View>
          </ScrollView>
        </View>
      </Animated.View>

      {/* Content (scrolls; header stays fixed) */}
      <View style={{ flex: 1, paddingTop: headerHeight }}>
        {/* Auto-Resume Overlay (latest Make): masks the puzzle after background/visibility auto-pause */}
        {autoResumeNeeded ? (
          <Pressable
            accessibilityRole="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 80,
              backgroundColor: 'rgba(0,0,0,0.80)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            {Platform.OS !== 'web' ? <BlurView intensity={24} tint="dark" style={{ position: 'absolute', inset: 0 }} /> : null}

            <View style={{ width: '100%', maxWidth: 420 }}>
              <MakeCard style={{ borderRadius: 18 }}>
                <View style={{ padding: isMd ? 24 : 20, gap: 16 }}>
                  {/* Icon */}
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: isMd ? 80 : 64,
                        height: isMd ? 80 : 64,
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <MakeButton
                        title=""
                        accessibilityLabel="Resume Game"
                        onPress={() => {
                          setAutoResumeNeeded(false);
                          resumeRun();
                        }}
                        radius={999}
                        elevation="flat"
                        leftIcon={<Play width={isMd ? 40 : 32} height={isMd ? 40 : 32} color={makeTheme.button.textOnPrimary} />}
                        contentStyle={{
                          width: isMd ? 80 : 64,
                          height: isMd ? 80 : 64,
                          paddingHorizontal: 0,
                          paddingVertical: 0,
                        }}
                      />
                    </View>
                  </View>

                  {/* Title */}
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <MakeText weight="bold" style={{ fontSize: isMd ? 28 : 22, textAlign: 'center' }}>
                      Welcome Back!
                    </MakeText>
                    <MakeText tone="secondary" style={{ fontSize: 14, textAlign: 'center' }}>
                      Your game was paused while you were away
                    </MakeText>
                  </View>

                  {/* Stats Summary */}
                  <MakeCard style={{ borderRadius: 12 }}>
                    <View style={{ padding: 12, gap: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MakeText tone="secondary" style={{ fontSize: 13 }}>
                          Game Type
                        </MakeText>
                        <MakeText style={{ fontSize: 13 }}>
                          {gameType === 'daily' ? 'Daily Challenge' : 'Classic'}
                        </MakeText>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MakeText tone="secondary" style={{ fontSize: 13 }}>
                          Difficulty
                        </MakeText>
                        <View
                          style={{
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
                      <View style={{ height: 1, backgroundColor: makeTheme.card.border, opacity: 0.8 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MakeText tone="secondary" style={{ fontSize: 13 }}>
                          Time Elapsed
                        </MakeText>
                        <MakeText style={{ fontSize: 13, fontVariant: ['tabular-nums'] }}>{timeLabel}</MakeText>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MakeText tone="secondary" style={{ fontSize: 13 }}>
                          Mistakes
                        </MakeText>
                        <MakeText style={{ fontSize: 13, color: mistakes > 3 ? '#f87171' : makeTheme.text.primary }}>{mistakes}</MakeText>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <MakeText tone="secondary" style={{ fontSize: 13 }}>
                          Hints Used
                        </MakeText>
                        <MakeText style={{ fontSize: 13 }}>{hintsUsedCount}</MakeText>
                      </View>
                    </View>
                  </MakeCard>

                  {/* Actions */}
                  <View style={{ gap: 10 }}>
                    <MakeButton
                      title="Resume Game"
                      accessibilityLabel="Resume Game"
                      onPress={() => {
                        setAutoResumeNeeded(false);
                        resumeRun();
                      }}
                      elevation="flat"
                      radius={12}
                      leftIcon={<Play width={18} height={18} color={makeTheme.button.textOnPrimary} />}
                      contentStyle={{ height: 44, paddingVertical: 0, paddingHorizontal: 18 }}
                      titleStyle={{ lineHeight: 18 }}
                    />
                    <MakeButton
                      title="Exit to Menu"
                      accessibilityLabel="Exit to Menu"
                      variant="ghost"
                      elevation="flat"
                      radius={12}
                      onPress={() => {
                        setAutoResumeNeeded(false);
                        onExitToMenu();
                      }}
                      contentStyle={{ height: 44, paddingVertical: 0, paddingHorizontal: 18 }}
                      titleStyle={{ lineHeight: 18 }}
                    />
                  </View>
                </View>
              </MakeCard>
            </View>
          </Pressable>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: isMd ? 16 : 12,
            paddingBottom: theme.spacing.md,
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: containerMaxWidth, gap: isMd ? 16 : 12 }}>
            <View
              style={{
                width: stackBaseWidth,
                alignSelf: 'center',
                transform: [{ scale: effectiveScale }],
                ...(Platform.OS === 'web' ? ({ transformOrigin: 'top center' } as unknown as object) : null),
              }}
            >
              {/* Sudoku Board Card (Make parity: rounded-3xl, p-3 md:p-6, shadow-xl, backdrop-blur) */}
              <MakeCard style={{ borderRadius: 24, padding: stackPad }}>
                <SudokuGrid
                  puzzle={puzzle}
                  givensMask={givensMask}
                  notes={notes}
                  notesMode={notesMode}
                  selectedIndex={selectedIndex}
                  uiSizing={sizing ?? undefined}
                  cellSizePx={baseCellFromViewport}
                  autoCandidatesEnabled={toggles?.autoCandidates ?? false}
                  showConflicts={!(toggles?.zenMode ?? false)}
                  onSelectCell={(i) => {
                    // Lock mode (Make behavior):
                    // - tapping a filled cell locks to that digit
                    // - tapping any editable cell places/toggles the locked digit (notes mode respected)
                    selectCell(i);
                    if (!lockMode) return;

                    const cellValue = puzzle[i] ?? 0;
                    // Critical: tapping a filled cell should NEVER mutate the grid; it only updates the lock selection.
                    // Previously, tapping a user-filled cell would call inputDigit with the same value and toggle/erase it.
                    if (cellValue !== 0) {
                      setLockedDigit(cellValue as Digit);
                      return;
                    }

                    const digitToUse = lockedDigit as Digit | null;
                    if (digitToUse == null) return;
                    if (givensMask[i]) return;
                    if (runStatus === 'completed') return;

                    inputDigit(digitToUse);
                  }}
                  onDigit={(d) => {
                    if (lockMode) {
                      // In lock mode, digit input chooses the locked digit instead of editing the selected cell.
                      setLockedDigit((prev) => (prev === d ? null : d));
                      return;
                    }
                    inputDigit(d);
                  }}
                  onClear={clearCell}
                  onToggleNotesMode={toggleNotesMode}
                  onUndo={undo}
                  onRedo={redo}
                  onEscape={() => {
                    if (menuOpen) closeMenu();
                  }}
                />
              </MakeCard>
              <View style={{ marginTop: isMd ? 16 : 12 }}>
                <MakeDigitPad
                  widthPx={stackBaseWidth}
                  contentPaddingPx={stackPad}
                  lockMode={lockMode}
                  lockedDigit={lockedDigit}
                  disabled={isComplete || (!lockMode && selectedIndex == null)}
                  onDigit={(d) => {
                    if (lockMode) {
                      setLockedDigit((prev) => (prev === d ? null : d));
                      return;
                    }
                    inputDigit(d);
                  }}
                />
              </View>

              <View style={{ marginTop: isMd ? 16 : 12, paddingHorizontal: stackPad, gap: isMd ? 16 : 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <MakeButton
                    title="Undo"
                    variant="secondary"
                    onPress={undo}
                    disabled={!canUndo || isComplete}
                    elevation="flat"
                    radius={10}
                    leftIcon={<Undo2 width={20} height={20} color={makeTheme.text.primary} />}
                    titleStyle={{ fontSize: 14, lineHeight: 18 }}
                    contentStyle={{ height: isMd ? 40 : 36, paddingVertical: 0, paddingHorizontal: 12 }}
                    style={{ flex: 1 }}
                  />
                  <MakeButton
                    title="Notes"
                    variant={notesMode ? 'primary' : 'secondary'}
                    onPress={toggleNotesMode}
                    disabled={isComplete}
                    elevation="flat"
                    radius={10}
                    leftIcon={
                      <Edit3 width={20} height={20} color={notesMode ? makeTheme.button.textOnPrimary : makeTheme.text.primary} />
                    }
                    titleStyle={{ fontSize: 14, lineHeight: 18 }}
                    contentStyle={{ height: isMd ? 40 : 36, paddingVertical: 0, paddingHorizontal: 12 }}
                    style={{ flex: 1 }}
                  />
                  <MakeButton
                    title="Lock"
                    variant={lockMode ? 'primary' : 'secondary'}
                    disabled={isComplete}
                    onPress={() => {
                      setLockMode((v) => {
                        const next = !v;
                        if (!next) setLockedDigit(null);
                        return next;
                      });
                    }}
                    elevation="flat"
                    radius={10}
                    leftIcon={<Lock width={20} height={20} color={lockMode ? makeTheme.button.textOnPrimary : makeTheme.text.primary} />}
                    titleStyle={{ fontSize: 14, lineHeight: 18 }}
                    contentStyle={{ height: isMd ? 40 : 36, paddingVertical: 0, paddingHorizontal: 12 }}
                    style={{ flex: 1 }}
                  />
                  <MakeButton
                    title="Hint"
                    variant="secondary"
                    onPress={hintRevealCellValue}
                    disabled={isComplete || selectedIndex == null}
                    elevation="flat"
                    radius={10}
                    leftIcon={<Lightbulb width={20} height={20} color={makeTheme.text.primary} />}
                    titleStyle={{ fontSize: 14, lineHeight: 18 }}
                    contentStyle={{ height: isMd ? 40 : 36, paddingVertical: 0, paddingHorizontal: 12 }}
                    style={{ flex: 1 }}
                  />
                </View>

                {isMd ? (
                  <MakeText tone="muted" style={{ fontSize: 12, textAlign: 'center' }}>
                    Notes: N · Undo: U · Redo: R · Clear: Backspace/Delete · Close menu: Esc
                  </MakeText>
                ) : null}
              </View>
            </View>

            {/* Solve status placeholder (real completion UI will be ported later) */}
            {solution.length === 0 ? <MakeText tone="muted">Loading puzzle…</MakeText> : null}
          </View>
        </ScrollView>
      </View>
    </MakeScreen>
  );
}


