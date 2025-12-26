import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { candidatesForCell, type Grid } from '@cynnix-studios/sudoku-core';

import type { UiSizingSettings } from '../services/settingsModel';

import { computeGridHighlights } from './gridHighlight';
import { computeGridConflicts } from './gridConflicts';
import { MakeText } from './make/MakeText';
import { useMakeTheme } from './make/MakeThemeProvider';

type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

function rgbaFromHex(hex: string, alpha: number): string {
  // Supports #rgb, #rrggbb
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const expanded =
    h.length === 3
      ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : h.length === 6
        ? h
        : null;
  if (!expanded) return `rgba(0,0,0,${alpha})`;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function digitFromKey(key: string): Digit | null {
  switch (key) {
    case '1':
      return 1;
    case '2':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
    case '5':
      return 5;
    case '6':
      return 6;
    case '7':
      return 7;
    case '8':
      return 8;
    case '9':
      return 9;
    default:
      return null;
  }
}

function Cell({
  i,
  value,
  notes,
  selected,
  highlightRowCol,
  highlightBox,
  highlightSameValue,
  hasConflict,
  isRightEdge,
  isBottomEdge,
  given,
  cellSize,
  numberFontSize,
  noteFontSize,
  makeTheme,
  resolvedThemeType,
  onPress,
}: {
  i: number;
  value: number;
  notes?: ReadonlySet<number>;
  selected: boolean;
  highlightRowCol: boolean;
  highlightBox: boolean;
  highlightSameValue: boolean;
  hasConflict: boolean;
  isRightEdge: boolean;
  isBottomEdge: boolean;
  given: boolean;
  cellSize: number;
  numberFontSize: number;
  noteFontSize: number;
  makeTheme: { card: { background: string; border: string }; text: { primary: string; secondary: string; muted: string }; accent: string };
  resolvedThemeType: 'default' | 'light' | 'dark' | 'grayscale' | 'vibrant';
  onPress: () => void;
}) {
  const r = Math.floor(i / 9);
  const c = i % 9;

  const isLight = resolvedThemeType === 'light';
  // We want the glass card to be the only “surface” behind the grid (Figma parity),
  // so leave unhighlighted cells transparent and let the board card show through.
  const baseBg = 'transparent';
  const rowColBg = isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.06)';
  const boxBg = isLight ? 'rgba(15,23,42,0.035)' : 'rgba(255,255,255,0.04)';
  const sameValueBg = rgbaFromHex(makeTheme.accent, isLight ? 0.12 : 0.14);
  const selectedBg = rgbaFromHex(makeTheme.accent, isLight ? 0.16 : 0.18);
  const conflictBg = isLight ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.20)'; // Make: bg-red-500/20

  const bg = hasConflict
    ? conflictBg
    : selected
      ? selectedBg
      : highlightSameValue
        ? sameValueBg
        : highlightRowCol
          ? rowColBg
          : highlightBox
            ? boxBg
            : baseBg;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Cell row ${r + 1} column ${c + 1}${given ? ', given' : ''}${selected ? ', selected' : ''}`}
      style={(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        return {
          width: cellSize,
          height: cellSize,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          // Make parity: minor cell dividers only (right/bottom), plus a full accent border for selected.
          borderColor: selected ? makeTheme.accent : makeTheme.card.border,
          borderWidth: selected ? 2 : 0,
          borderRightWidth: selected ? 2 : isRightEdge ? 0 : 1,
          borderBottomWidth: selected ? 2 : isBottomEdge ? 0 : 1,
          opacity: state.pressed ? 0.92 : 1,
          ...(Platform.OS === 'web'
            ? ({
                transform: hovered && !state.pressed ? 'scale(1.01)' : 'scale(1)',
                transition: 'transform 160ms ease, background-color 160ms ease, opacity 120ms ease',
              } as unknown as object)
            : null),
        };
      }}
    >
      {value === 0 ? (
        notes && notes.size > 0 ? (
          <View style={{ position: 'absolute', inset: 0, flexDirection: 'row', flexWrap: 'wrap' }}>
            {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((n) => (
              <View
                key={n}
                style={{
                  width: '33.33%',
                  height: '33.33%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: notes.has(n) ? 1 : 0,
                }}
              >
                <MakeText
                  tone="muted"
                  style={{
                    fontSize: noteFontSize,
                    lineHeight: Math.round(noteFontSize * 1.15),
                    color: makeTheme.text.muted,
                  }}
                >
                  {String(n)}
                </MakeText>
              </View>
            ))}
          </View>
        ) : (
          <MakeText>{''}</MakeText>
        )
      ) : (
        <MakeText
          weight={given ? 'bold' : 'semibold'}
          style={{
            fontSize: numberFontSize,
            lineHeight: Math.round(numberFontSize * 1.1),
            color: given ? makeTheme.text.primary : makeTheme.text.secondary,
          }}
        >
          {String(value)}
        </MakeText>
      )}
    </Pressable>
  );
}

export function SudokuGrid({
  puzzle,
  givensMask,
  notes,
  notesMode,
  selectedIndex,
  uiSizing,
  cellSizePx,
  autoCandidatesEnabled,
  showConflicts,
  onSelectCell,
  onDigit,
  onClear,
  onToggleNotesMode,
  onUndo,
  onRedo,
  onEscape,
}: {
  puzzle: Grid;
  givensMask: boolean[];
  notes?: Array<Set<number>>;
  notesMode?: boolean;
  selectedIndex: number | null;
  uiSizing?: UiSizingSettings;
  /**
   * Optional override used by responsive containers to ensure the grid never exceeds the viewport.
   * This is the rendered cell size (in px), not the user's stored preference.
   */
  cellSizePx?: number;
  /**
   * When enabled, show computed candidates in empty cells that have no manual notes.
   */
  autoCandidatesEnabled?: boolean;
  /**
   * When enabled, show Make-style red conflict highlights for duplicate values.
   */
  showConflicts?: boolean;
  onSelectCell: (i: number) => void;
  onDigit?: (d: Digit) => void;
  onClear?: () => void;
  onToggleNotesMode?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [focusRing, setFocusRing] = useState(false);
  const pointerDownRef = React.useRef(false);
  const { theme: makeTheme, resolvedThemeType } = useMakeTheme();
  const highlights = React.useMemo(() => computeGridHighlights({ puzzle, selectedIndex }), [puzzle, selectedIndex]);

  // Board sizing (Make semantics):
  // - cellSizePx is the rendered cell size for a single cell
  // - fixed Tailwind spacing: p-1.5 and gap-1.5 (≈ 6px), which scale with the overall container transform
  const cellSize = Math.max(20, Math.min(56, Math.round(cellSizePx ?? 36)));
  const gap = 6;
  const outerPad = gap; // Make: p-1.5 around the board
  const majorGap = gap; // Make: gap-1.5 between 3×3 blocks
  const blockSize = cellSize * 3;
  // Make: outer padding + 2 internal gaps.
  const boardSize = 9 * cellSize + 4 * gap;

  const digitScale = (uiSizing?.digitSizePct ?? 100) / 100;
  // Legacy parity: notes used to be ~1.0 default; Make default is 200 (so 200 -> 1.0 multiplier).
  const noteScale = (uiSizing?.noteSizePct ?? 200) / 200;
  const numberFontSize = Math.max(12, Math.round(cellSize * 0.55 * digitScale));
  const noteFontSize = Math.max(8, Math.round(cellSize * 0.22 * noteScale));

  const autoNotes = useMemo(() => {
    if (!autoCandidatesEnabled) return null;
    const out: Array<ReadonlySet<number>> = Array.from({ length: 81 }, () => new Set<number>());
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] !== 0) continue;
      const candidates = candidatesForCell(puzzle as unknown as number[], i);
      out[i] = new Set<number>(candidates);
    }
    return out;
  }, [autoCandidatesEnabled, puzzle]);

  const conflicts = useMemo(() => {
    if (!showConflicts) return null;
    return computeGridConflicts(puzzle);
  }, [puzzle, showConflicts]);

  const handleKey = useCallback(
    (key: string, preventDefault?: () => void) => {
      const lower = key.toLowerCase();

      // Esc: close-only (modal/overlay) per PRD 7.2. If nothing is open, this is a no-op.
      if (key === 'Escape') {
        preventDefault?.();
        onEscape?.();
        return;
      }

      if (lower === 'n') {
        preventDefault?.();
        onToggleNotesMode?.();
        return;
      }
      if (lower === 'u') {
        preventDefault?.();
        onUndo?.();
        return;
      }
      if (lower === 'r') {
        preventDefault?.();
        onRedo?.();
        return;
      }

      // Digits
      const digit = digitFromKey(key);
      if (digit) {
        preventDefault?.();
        onDigit?.(digit);
        return;
      }

      // Clear
      if (key === 'Backspace' || key === 'Delete' || key === '0') {
        preventDefault?.();
        onClear?.();
        return;
      }

      // Navigation
      const startIndex = selectedIndex ?? 0;
      let next = startIndex;
      if (key === 'ArrowUp') next = Math.max(0, startIndex - 9);
      if (key === 'ArrowDown') next = Math.min(80, startIndex + 9);
      if (key === 'ArrowLeft') next = startIndex % 9 === 0 ? startIndex : startIndex - 1;
      if (key === 'ArrowRight') next = startIndex % 9 === 8 ? startIndex : startIndex + 1;

      if (next !== startIndex || selectedIndex == null) {
        if (key.startsWith('Arrow') || selectedIndex == null) {
          preventDefault?.();
          onSelectCell(next);
        }
      }
    },
    [onClear, onDigit, onEscape, onRedo, onSelectCell, onToggleNotesMode, onUndo, selectedIndex],
  );

  useEffect(() => {
    if (!active && !focusRing) return;
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    function onKeyDown(e: KeyboardEvent) {
      // NOTE: keeping this local allows keyboard support without relying on react-native-web specific props.
      handleKey(e.key, () => e.preventDefault());
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, focusRing, handleKey]);

  return (
    <Pressable
      focusable
      accessibilityLabel="Sudoku grid"
      accessibilityHint={`Use arrow keys to move between cells. Use number keys 1 through 9 to enter. Use Backspace or Delete to clear. Notes mode is ${notesMode ? 'on' : 'off'}.`}
      onFocus={() => {
        // RN-web may focus this wrapper on pointer click; emulate focus-visible by only
        // showing the ring when focus did not originate from a pointer down.
        if (pointerDownRef.current) return;
        setFocusRing(true);
      }}
      onBlur={() => {
        setFocusRing(false);
        setActive(false);
      }}
      // On web, clicking a cell should enable keyboard immediately, but should NOT show a focus ring.
      onPressIn={() => {
        pointerDownRef.current = true;
        setFocusRing(false);
      }}
      onPressOut={() => {
        // Reset after the click/focus sequence completes.
        pointerDownRef.current = false;
      }}
      onPress={() => setActive(true)}
      style={() => ({
        alignItems: 'center',
        alignSelf: 'center',
        // Avoid double frames: the outer board card shell now provides the border/blur/padding.
        // Keep focus indication on web via outline to avoid layout shifts.
        ...(Platform.OS === 'web'
          ? ({
              outline: focusRing ? `2px solid ${makeTheme.accent}` : 'none',
              outlineOffset: 2,
            } as unknown as object)
          : null),
      })}
    >
      {/* Outer wrapper with gap background (Make parity) */}
      <View
        style={{
          width: boardSize,
          height: boardSize,
          backgroundColor: 'transparent',
          borderRadius: 10,
          overflow: 'hidden',
          padding: outerPad,
        }}
      >
        {/* 3×3 major grid with gaps */}
        <View style={{ width: boardSize - 2 * outerPad, height: boardSize - 2 * outerPad, flexDirection: 'row', flexWrap: 'wrap' }}>
          {([0, 1, 2] as const).flatMap((majorRow) =>
            ([0, 1, 2] as const).map((majorCol) => {
              const isLastMajorCol = majorCol === 2;
              const isLastMajorRow = majorRow === 2;
              return (
                <View
                  key={`${majorRow}-${majorCol}`}
                  style={{
                    width: blockSize,
                    height: blockSize,
                    marginRight: isLastMajorCol ? 0 : majorGap,
                    marginBottom: isLastMajorRow ? 0 : majorGap,
                    // This is the “grid surface” in Make (each 3×3 block sits on the card background).
                    // Keeping the outer wrapper transparent avoids the extra “middle panel” look.
                    backgroundColor: makeTheme.card.background,
                  }}
                >
                  {/* 3×3 minor grid of cells */}
                  <View style={{ width: blockSize, height: blockSize, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {([0, 1, 2] as const).flatMap((minorRow) =>
                      ([0, 1, 2] as const).map((minorCol) => {
                        const rowIndex = majorRow * 3 + minorRow;
                        const colIndex = majorCol * 3 + minorCol;
                        const i = rowIndex * 9 + colIndex;
                        const isRightEdge = minorCol === 2;
                        const isBottomEdge = minorRow === 2;
                        const v = puzzle[i] ?? 0;
                        return (
                          <Cell
                            key={i}
                            i={i}
                            value={v}
                            notes={notes?.[i] && notes[i]!.size > 0 ? notes[i] : autoNotes?.[i]}
                            selected={selectedIndex === i}
                            highlightRowCol={selectedIndex != null && (highlights.row.has(i) || highlights.col.has(i))}
                            highlightBox={selectedIndex != null && highlights.box.has(i)}
                            highlightSameValue={selectedIndex != null && highlights.sameValue.has(i)}
                            hasConflict={!!conflicts?.has(i)}
                            isRightEdge={isRightEdge}
                            isBottomEdge={isBottomEdge}
                            given={!!givensMask[i]}
                            cellSize={cellSize}
                            numberFontSize={numberFontSize}
                            noteFontSize={noteFontSize}
                            makeTheme={makeTheme}
                            resolvedThemeType={resolvedThemeType}
                            onPress={() => {
                              setActive(true);
                              onSelectCell(i);
                            }}
                          />
                        );
                      }),
                    )}
                  </View>
                </View>
              );
            }),
          )}
        </View>
      </View>
    </Pressable>
  );
}



