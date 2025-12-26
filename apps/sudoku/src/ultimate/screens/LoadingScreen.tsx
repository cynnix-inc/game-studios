import React from 'react';
import { Animated, Easing, Platform, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function useFadeIn({
  reducedMotion,
  delayMs,
  durationMs,
}: {
  reducedMotion: boolean | null;
  delayMs: number;
  durationMs: number;
}) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const duration = reducedMotion ? 0 : durationMs;
    const delay = reducedMotion ? 0 : delayMs;
    Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [delayMs, durationMs, reducedMotion, v]);
  return v;
}

function SudokuLogoLite({ animated, darkMode }: { animated: boolean; darkMode: boolean }) {
  const { theme } = useMakeTheme();
  const [phase, setPhase] = React.useState<'initial' | 'notes' | 'solving' | 'complete'>(() => (animated ? 'initial' : 'complete'));
  const [visibleNotes, setVisibleNotes] = React.useState<Set<string>>(() => new Set<string>());
  const [visibleSolutions, setVisibleSolutions] = React.useState<Set<number>>(() => new Set<number>());

  React.useEffect(() => {
    if (!animated) return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(setTimeout(() => setPhase('notes'), 500));
    const pencil = [
      { cell: 1, n: 3 },
      { cell: 1, n: 6 },
      { cell: 1, n: 9 },
      { cell: 3, n: 2 },
      { cell: 3, n: 9 },
      { cell: 4, n: 6 },
      { cell: 4, n: 9 },
      { cell: 7, n: 3 },
      { cell: 7, n: 9 },
    ];
    pencil.forEach((p, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleNotes((prev) => new Set(prev).add(`${p.cell}-${p.n}`));
        }, 800 + i * 300),
      );
    });

    const notesEnd = 800 + pencil.length * 300 + 400;
    timers.push(setTimeout(() => setPhase('solving'), notesEnd));

    const solving = [1, 3, 4, 7] as const;
    solving.forEach((cell, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleSolutions((prev) => new Set(prev).add(cell));
        }, notesEnd + 400 + i * 500),
      );
    });

    timers.push(setTimeout(() => setPhase('complete'), notesEnd + 400 + solving.length * 500 + 300));

    return () => timers.forEach(clearTimeout);
  }, [animated]);

  const gridData: Array<number | null> = [5, null, 7, null, null, 4, 1, null, 8];
  const solutions: Record<number, number> = { 1: 3, 3: 2, 4: 6, 7: 9 };
  const pencilMarks: Record<number, number[]> = { 1: [3, 6, 9], 3: [2, 9], 4: [6, 9], 7: [3, 9] };

  const outerBg = darkMode ? 'rgba(255,255,255,0.10)' : theme.card.background;
  const outerBorder = darkMode ? 'rgba(255,255,255,0.20)' : theme.card.border;
  const cellBg = darkMode ? 'rgba(255,255,255,0.10)' : theme.card.background;
  const cellBorder = darkMode ? 'rgba(255,255,255,0.30)' : theme.card.border;
  const text = darkMode ? '#ffffff' : theme.text.primary;
  const notes = darkMode ? 'rgba(255,255,255,0.50)' : theme.text.muted;
  const accent = darkMode ? 'rgb(216,180,254)' : theme.accent;

  return (
    <View
      style={{
        width: 112,
        height: 112,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: outerBorder,
        backgroundColor: outerBg,
        padding: 4,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)' } as unknown as object) : null),
      }}
    >
      {gridData.map((cell, idx) => {
        const isSolving = cell == null;
        const showSolution = isSolving && (phase === 'solving' || phase === 'complete') && visibleSolutions.has(idx);
        const isComplete = phase === 'complete';

        return (
          <View
            key={idx}
            style={{
              width: '32%',
              aspectRatio: 1,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: cellBorder,
              backgroundColor: cellBg,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              ...(isComplete && isSolving ? ({ boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)' } as unknown as object) : null),
            }}
          >
            {typeof cell === 'number' ? (
              <MakeText weight="semibold" style={{ color: text, fontSize: 18 }}>
                {String(cell)}
              </MakeText>
            ) : null}

            {isSolving && !showSolution ? (
              <View style={{ position: 'absolute', inset: 0, padding: 4, flexDirection: 'row', flexWrap: 'wrap' }}>
                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((n) => {
                  const isMark = (pencilMarks[idx] ?? []).includes(n);
                  const isVisible = isMark && visibleNotes.has(`${idx}-${n}`);
                  return (
                    <View key={n} style={{ width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' }}>
                      <MakeText style={{ fontSize: 9, color: notes, lineHeight: 10 }}>{isVisible ? String(n) : ''}</MakeText>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {showSolution ? (
              <MakeText weight="semibold" style={{ color: isComplete ? accent : text, fontSize: 18 }}>
                {String(solutions[idx] ?? '')}
              </MakeText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function UltimateLoadingScreen({
  message = 'Loading your puzzle...',
  progress01,
}: {
  message?: string;
  /**
   * Optional progress in the range [0..1].
   * Intended hook point for pack downloads / updates.
   */
  progress01?: number | null;
}) {
  const { theme: makeTheme, reducedMotion } = useMakeTheme();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const pct = progress01 == null ? null : clamp01(progress01);

  // Make-like staged fade-ins
  const logoOpacity = useFadeIn({ reducedMotion, delayMs: 0, durationMs: 300 });
  const titleOpacity = useFadeIn({ reducedMotion, delayMs: 400, durationMs: 800 });
  const barOpacity = useFadeIn({ reducedMotion, delayMs: 800, durationMs: 600 });
  const textOpacity = useFadeIn({ reducedMotion, delayMs: 1000, durationMs: 600 });

  // Smooth progress animation towards the provided pct
  const target = pct == null ? 0 : pct;
  const progressAnim = React.useRef(new Animated.Value(target)).current;
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: target,
      duration: reducedMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, reducedMotion, target]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const showAnimatedLogo = reducedMotion ? false : true;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        {/* Background particles */}
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <View
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: 256,
              height: 256,
              borderRadius: 999,
              backgroundColor: 'rgba(168, 85, 247, 0.20)',
              ...(Platform.OS === 'web' ? ({ filter: 'blur(48px)' } as unknown as object) : null),
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: '25%',
              right: '25%',
              width: 384,
              height: 384,
              borderRadius: 999,
              backgroundColor: 'rgba(59, 130, 246, 0.20)',
              ...(Platform.OS === 'web' ? ({ filter: 'blur(64px)' } as unknown as object) : null),
            }}
          />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', gap: 32 }}>
            <Animated.View style={{ opacity: logoOpacity }}>
              <View style={{ padding: 24, borderRadius: 16 }}>
                <SudokuLogoLite animated={showAnimatedLogo} darkMode />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: titleOpacity }}>
              <MakeText weight="bold" style={{ fontSize: isMd ? 56 : 36, color: '#ffffff', textAlign: 'center' }}>
                Ultimate Sudoku
              </MakeText>
            </Animated.View>

            <Animated.View style={{ opacity: barOpacity, width: isMd ? 320 : 256 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                  overflow: 'hidden',
                }}
              >
                <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
                <Animated.View style={{ width: barWidth, height: '100%', borderRadius: 999, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={['#a855f7', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: textOpacity }}>
              <MakeText style={{ fontSize: isMd ? 16 : 14, color: 'rgba(255,255,255,0.70)', textAlign: 'center' }}>
                {message}
              </MakeText>
            </Animated.View>

            {/* Hook point for download progress (optional) */}
            {pct != null ? (
              <MakeText style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                {Math.round(pct * 100)}%
              </MakeText>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}


