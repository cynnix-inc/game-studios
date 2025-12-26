import React from 'react';
import { Animated, Easing, Platform, View } from 'react-native';

import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';

type LogoPhase = 'initial' | 'notes' | 'solving' | 'complete';

function dimForSize(size: 'sm' | 'md' | 'lg', isMd: boolean): number {
  if (size === 'sm') return isMd ? 80 : 64;
  if (size === 'lg') return isMd ? 160 : 128;
  return isMd ? 128 : 96;
}

function fontForSize(size: 'sm' | 'md' | 'lg', isMd: boolean): { cell: number; notes: number } {
  if (size === 'sm') return { cell: isMd ? 14 : 12, notes: isMd ? 7 : 6 };
  if (size === 'lg') return { cell: isMd ? 20 : 16, notes: isMd ? 10 : 8 };
  return { cell: isMd ? 18 : 14, notes: isMd ? 9 : 7 };
}

/**
 * Make-style animated Sudoku logo, ported to RN styles.
 * - Home screen uses `size="md"`, `animated`
 * - Loading screen uses `darkMode`
 */
export function SudokuLogoMark({
  size = 'md',
  animated = false,
  darkMode = false,
  isMd = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  darkMode?: boolean;
  /**
   * Pass from screen breakpoint (since RN doesn't have CSS media queries).
   */
  isMd?: boolean;
}) {
  const { theme, reducedMotion } = useMakeTheme();
  const [phase, setPhase] = React.useState<LogoPhase>(() => (animated ? 'initial' : 'complete'));
  const [visibleNotes, setVisibleNotes] = React.useState<Set<string>>(() => new Set<string>());
  const [visibleSolutions, setVisibleSolutions] = React.useState<Set<number>>(() => new Set<number>());

  React.useEffect(() => {
    const shouldAnimate = animated && !reducedMotion;
    if (!shouldAnimate) {
      setPhase('complete');
      // Show all notes and solutions immediately (Make reduced-motion behavior).
      const allNotes = new Set<string>();
      const pencilMarks: Record<number, number[]> = { 1: [3, 6, 9], 3: [2, 9], 4: [6, 9], 7: [3, 9] };
      for (const [cellIdx, marks] of Object.entries(pencilMarks)) {
        for (const m of marks) allNotes.add(`${cellIdx}-${m}`);
      }
      setVisibleNotes(allNotes);
      setVisibleSolutions(new Set<number>([1, 3, 4, 7]));
      return;
    }

    const timers: Array<ReturnType<typeof setTimeout>> = [];
    timers.push(setTimeout(() => setPhase('notes'), 500));

    const pencil = [
      { cell: 1, n: 3 },
      { cell: 3, n: 2 },
      { cell: 1, n: 6 },
      { cell: 4, n: 6 },
      { cell: 7, n: 9 },
      { cell: 3, n: 9 },
      { cell: 1, n: 9 },
      { cell: 4, n: 9 },
      { cell: 7, n: 3 },
    ];

    pencil.forEach((p, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleNotes((prev) => {
            const next = new Set(prev);
            next.add(`${p.cell}-${p.n}`);
            return next;
          });
        }, 800 + i * 300),
      );
    });

    const notesEnd = 800 + pencil.length * 300 + 400;
    timers.push(setTimeout(() => setPhase('solving'), notesEnd));

    const solving = [1, 3, 4, 7] as const;
    solving.forEach((cell, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleSolutions((prev) => {
            const next = new Set(prev);
            next.add(cell);
            return next;
          });
        }, notesEnd + 400 + i * 500),
      );
    });

    timers.push(setTimeout(() => setPhase('complete'), notesEnd + 400 + solving.length * 500 + 300));
    return () => timers.forEach(clearTimeout);
  }, [animated, reducedMotion]);

  const dim = dimForSize(size, isMd);
  const fonts = fontForSize(size, isMd);

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

  // Web: approximate Make's pop-in animation with a quick scale/opacity on solve.
  const pop = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (reducedMotion) return;
    if (phase !== 'solving') return;
    pop.setValue(0.98);
    Animated.spring(pop, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 14, bounciness: 10 }).start();
  }, [phase, pop, reducedMotion]);

  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      <View
        style={{
          width: dim,
          height: dim,
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
                ...(Platform.OS === 'web' && isComplete && isSolving
                  ? ({ boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)' } as unknown as object)
                  : null),
              }}
            >
              {typeof cell === 'number' ? (
                <MakeText weight="semibold" style={{ color: text, fontSize: fonts.cell }}>
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
                        <MakeText style={{ fontSize: fonts.notes, color: notes, lineHeight: fonts.notes + 1 }}>
                          {isVisible ? String(n) : ''}
                        </MakeText>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {showSolution ? (
                <MakeText weight="semibold" style={{ color: isComplete ? accent : text, fontSize: fonts.cell }}>
                  {String(solutions[idx] ?? '')}
                </MakeText>
              ) : null}
            </View>
          );
        })}

        {/* Completion glow */}
        {phase === 'complete' ? (
          <View
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              ...(Platform.OS === 'web'
                ? ({ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)' } as unknown as object)
                : null),
              opacity: 1,
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}


