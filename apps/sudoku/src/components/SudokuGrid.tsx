import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { candidatesForCell, type Grid } from '@cynnix-studios/sudoku-core';

import type { UiSizingSettings } from '../services/settingsModel';

import { computeGridHighlights } from './gridHighlight';
import { computeGridConflicts } from './gridConflicts';
import { MakeText } from './make/MakeText';
import { useMakeTheme } from './make/MakeThemeProvider';

type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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
  highlightContrast,
  highlightAssistance,
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
  resolvedThemeType: 'default' | 'light' | 'dark' | 'grayscale';
  highlightContrast: number;
  highlightAssistance: boolean;
  onPress: () => void;
}) {
  const r = Math.floor(i / 9);
  const c = i % 9;

  const isLight = resolvedThemeType === 'light';
  // We want the glass card to be the only “surface” behind the grid (Figma parity),
  // so leave unhighlighted cells transparent and let the board card show through.
  const baseBg = 'transparent';
  const contrastFactor = Math.max(0, Math.min(2, highlightContrast / 100));
  const assist = highlightAssistance && contrastFactor > 0;
  // Make parity: sudoku highlights are neutral overlays (not accent-tinted).
  // From Make `ThemeContext.tsx`:
  // - selected: 20%
  // - row/col: 10%
  // - box: 5%
  // - same number: 15%
  const rgb = isLight ? '15,23,42' : '255,255,255';
  const alphaSelected = Math.min(0.5, 0.2 * Math.max(1, contrastFactor));
  const alphaRowCol = Math.min(0.35, 0.1 * contrastFactor);
  const alphaBox = Math.min(0.25, 0.05 * contrastFactor);
  const alphaSame = Math.min(0.4, 0.15 * contrastFactor);

  const rowColBg = assist ? `rgba(${rgb},${alphaRowCol.toFixed(3)})` : baseBg;
  const boxBg = assist ? `rgba(${rgb},${alphaBox.toFixed(3)})` : baseBg;
  const sameValueBg = assist ? `rgba(${rgb},${alphaSame.toFixed(3)})` : baseBg;
  const selectedBg = `rgba(${rgb},${alphaSelected.toFixed(3)})`;
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
        const hoverBg =
          !selected && !hasConflict && bg === 'transparent'
            ? isLight
              ? 'rgba(15,23,42,0.03)'
              : 'rgba(255,255,255,0.04)'
            : null;
        return {
          width: cellSize,
          height: cellSize,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hovered && hoverBg ? hoverBg : bg,
          // Make parity: minor cell dividers only (right/bottom). Selection is a bg overlay, not a thick border.
          borderColor: makeTheme.card.border,
          borderWidth: 0,
          borderRightWidth: isRightEdge ? 0 : 1,
          borderBottomWidth: isBottomEdge ? 0 : 1,
          zIndex: selected ? 2 : 0,
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
                    // Make web uses line-height: 1 for notes.
                    lineHeight: noteFontSize,
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
            // Make web uses `opacity-80` for user-entered digits.
            opacity: given ? 1 : 0.8,
          }}
        >
          {String(value)}
        </MakeText>
      )}
    </Pressable>
  );
}

type InputMeta = { autoAdvanceDirection?: 'forward' | 'backward' };

export function SudokuGrid({
  puzzle,
  givensMask,
  notes,
  notesMode,
  selectedIndex,
  uiSizing,
  cellSizePx,
  autoCandidatesEnabled,
  hintCandidates,
  showConflicts,
  highlightContrast,
  highlightAssistance,
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
   * Hint affordance (Make: Assist) to show candidates for a single cell without mutating notes.
   */
  hintCandidates?: { cell: number; candidates: ReadonlySet<number> } | null;
  /**
   * When enabled, show Make-style red conflict highlights for duplicate values.
   */
  showConflicts?: boolean;
  /**
   * Make GridCustomizer: 0=Off, 100=Normal, 150=High, 200=Max
   */
  highlightContrast?: number;
  /**
   * When false, disables row/col/box/same-number highlights (selection still shows).
   */
  highlightAssistance?: boolean;
  onSelectCell: (i: number) => void;
  onDigit?: (d: Digit, meta?: InputMeta) => void;
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
  // Make parity: base digit size is ~40% of cell size at default, then scaled by digitSizePct.
  // Cap high values so very large digits never overlap cell borders.
  const numberFontSize = Math.max(12, Math.round(Math.min(cellSize * 0.72, cellSize * 0.4 * digitScale)));

  // Make parity: notes scale as a percentage of the sub-cell size (not a simple multiplier).
  // noteSizePct is one of 120/160/200/250/300 (XS..XL). Make maps 100→50% .. 300→90%.
  const noteSizePct = uiSizing?.noteSizePct ?? 200;
  const subCellSize = cellSize / 3;
  const notePercentage = 0.5 + (noteSizePct - 100) / 500; // 100→50%, 150→60%, ..., 300→90%
  const noteFontSize = Math.max(7, Math.round(subCellSize * notePercentage));
  const effectiveHighlightContrast = typeof highlightContrast === 'number' && Number.isFinite(highlightContrast) ? highlightContrast : 100;
  const effectiveHighlightAssistance = typeof highlightAssistance === 'boolean' ? highlightAssistance : effectiveHighlightContrast > 0;

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
    (args: { key: string; shiftKey?: boolean }, preventDefault?: () => void) => {
      const key = args.key;
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
        onDigit?.(digit, { autoAdvanceDirection: args.shiftKey ? 'backward' : 'forward' });
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
      handleKey({ key: e.key, shiftKey: e.shiftKey }, () => e.preventDefault());
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
          backgroundColor: makeTheme.card.border,
          // Make: rounded-lg
          borderRadius: 8,
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
                        const inlineHintCandidates =
                          hintCandidates && hintCandidates.cell === i && hintCandidates.candidates.size > 0 ? hintCandidates.candidates : null;
                        const notesToShow =
                          notes?.[i] && notes[i]!.size > 0 ? notes[i] : inlineHintCandidates ? inlineHintCandidates : autoNotes?.[i];

                        return (
                          <Cell
                            key={i}
                            i={i}
                            value={v}
                            notes={notesToShow}
                            selected={selectedIndex === i}
                            highlightRowCol={effectiveHighlightAssistance && selectedIndex != null && (highlights.row.has(i) || highlights.col.has(i))}
                            highlightBox={effectiveHighlightAssistance && selectedIndex != null && highlights.box.has(i)}
                            highlightSameValue={effectiveHighlightAssistance && selectedIndex != null && highlights.sameValue.has(i)}
                            hasConflict={!!conflicts?.has(i)}
                            isRightEdge={isRightEdge}
                            isBottomEdge={isBottomEdge}
                            given={!!givensMask[i]}
                            cellSize={cellSize}
                            numberFontSize={numberFontSize}
                            noteFontSize={noteFontSize}
                            makeTheme={makeTheme}
                            resolvedThemeType={resolvedThemeType}
                            highlightContrast={effectiveHighlightContrast}
                            highlightAssistance={effectiveHighlightAssistance}
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



