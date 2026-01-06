import React from 'react';
import { Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Check, GripVertical, X } from 'lucide-react-native';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { SudokuGrid } from '../../components/SudokuGrid';
import {
  getGridHighlightSettings,
  getUiSizingSettings,
  setGridCustomizationSettings,
  type SudokuSettingsV1,
} from '../../services/settingsModel';
import { updateLocalSettings } from '../../services/settings';

// Make `GridCustomizer.tsx` sample board (ported 1:1): values + fixed flags + notes.
// We convert it into our `SudokuGrid` inputs (puzzle + givensMask + notes).
type MakeSampleCell = { value: number; isFixed: boolean; notes: readonly number[] };
const MAKE_SAMPLE_BOARD: ReadonlyArray<ReadonlyArray<MakeSampleCell>> = [
  [
    { value: 5, isFixed: true, notes: [] },
    { value: 3, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [4, 7] },
    { value: 0, isFixed: false, notes: [] },
    { value: 7, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [1, 2] },
    { value: 0, isFixed: false, notes: [] },
  ],
  [
    { value: 6, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [2, 4] },
    { value: 3, isFixed: true, notes: [] },
    { value: 9, isFixed: false, notes: [] },
    { value: 5, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 3, isFixed: false, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [1, 8] },
    { value: 9, isFixed: true, notes: [] },
    { value: 8, isFixed: false, notes: [] },
    { value: 4, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [5, 6] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [1, 2] },
    { value: 0, isFixed: false, notes: [] },
    { value: 7, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 1, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 2, isFixed: false, notes: [] },
    { value: 3, isFixed: true, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [1, 2] },
    { value: 0, isFixed: false, notes: [3, 6, 7] },
    { value: 5, isFixed: false, notes: [] },
    { value: 2, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 6, isFixed: true, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 1, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [4, 8] },
    { value: 3, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [2, 6] },
    { value: 0, isFixed: false, notes: [] },
    { value: 9, isFixed: true, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [2, 5] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 3, isFixed: true, notes: [] },
    { value: 2, isFixed: false, notes: [] },
    { value: 4, isFixed: false, notes: [] },
    { value: 7, isFixed: false, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 4, isFixed: false, notes: [] },
    { value: 3, isFixed: true, notes: [] },
    { value: 9, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 7, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [1, 6] },
    { value: 8, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
  ],
  [
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [5, 8] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 0, isFixed: false, notes: [] },
    { value: 6, isFixed: true, notes: [] },
    { value: 3, isFixed: true, notes: [] },
    { value: 9, isFixed: true, notes: [] },
    { value: 0, isFixed: false, notes: [] },
  ],
] as const;

const SAMPLE_PUZZLE: number[] = MAKE_SAMPLE_BOARD.flatMap((row) => row.map((c) => c.value));
const SAMPLE_GIVENS_MASK: boolean[] = MAKE_SAMPLE_BOARD.flatMap((row) => row.map((c) => c.isFixed));
const SAMPLE_NOTES: Array<Set<number>> = MAKE_SAMPLE_BOARD.flatMap((row) => row.map((c) => new Set<number>(c.notes)));

type GridSizeOption = 'S' | 'M' | 'L' | 'XL';
type DigitSizeOption = 'XS' | 'S' | 'M' | 'L' | 'XL';
type NoteSizeOption = 'XS' | 'S' | 'M' | 'L' | 'XL';
type ContrastOption = 'Off' | 'Normal' | 'High' | 'Max';

const gridSizeToNumber: Record<GridSizeOption, number> = { S: 80, M: 100, L: 120, XL: 140 };
const digitSizeToNumber: Record<DigitSizeOption, number> = { XS: 70, S: 85, M: 100, L: 130, XL: 170 };
const noteSizeToNumber: Record<NoteSizeOption, number> = { XS: 120, S: 160, M: 200, L: 250, XL: 300 };
const contrastToNumber: Record<ContrastOption, number> = { Off: 0, Normal: 100, High: 150, Max: 200 };

function numberToGridSize(num: number): GridSizeOption {
  if (num <= 85) return 'S';
  if (num <= 110) return 'M';
  if (num <= 130) return 'L';
  return 'XL';
}
function numberToDigitSize(num: number): DigitSizeOption {
  if (num <= 75) return 'XS';
  if (num <= 90) return 'S';
  if (num <= 115) return 'M';
  if (num <= 150) return 'L';
  return 'XL';
}
function numberToNoteSize(num: number): NoteSizeOption {
  if (num <= 140) return 'XS';
  if (num <= 180) return 'S';
  if (num <= 225) return 'M';
  if (num <= 275) return 'L';
  return 'XL';
}
function numberToContrast(num: number): ContrastOption {
  if (num <= 25) return 'Off';
  if (num <= 125) return 'Normal';
  if (num <= 175) return 'High';
  return 'Max';
}

function DiscreteSlider({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const { theme: makeTheme, resolvedThemeType } = useMakeTheme();
  const currentIndex = Math.max(0, options.indexOf(value));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <MakeText tone="secondary" style={{ fontSize: 14 }}>
          {label}
        </MakeText>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: makeTheme.card.border }}>
          <MakeText style={{ fontSize: 14 }}>{value}</MakeText>
        </View>
      </View>

      {/* Track with snap points */}
      <View
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          const x = (e.nativeEvent as unknown as { locationX?: number }).locationX ?? 0;
          const width = (e.currentTarget as unknown as { offsetWidth?: number }).offsetWidth ?? 1;
          const pct = Math.max(0, Math.min(1, width > 0 ? x / width : 0));
          const idx = Math.round(pct * (options.length - 1));
          onChange(options[Math.max(0, Math.min(options.length - 1, idx))] ?? value);
        }}
        onResponderMove={(e) => {
          // Web-only: dragging feels like Make; on native it still works as a scrub.
          const x = (e.nativeEvent as unknown as { locationX?: number }).locationX ?? 0;
          const width = (e.currentTarget as unknown as { offsetWidth?: number }).offsetWidth ?? 1;
          const pct = Math.max(0, Math.min(1, width > 0 ? x / width : 0));
          const idx = Math.round(pct * (options.length - 1));
          onChange(options[Math.max(0, Math.min(options.length - 1, idx))] ?? value);
        }}
        style={{
          height: 18,
          justifyContent: 'center',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: makeTheme.card.border,
          backgroundColor: resolvedThemeType === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.05)',
          paddingHorizontal: 2,
        }}
      >
        {/* Fill */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${(currentIndex / Math.max(1, options.length - 1)) * 100}%`,
            borderRadius: 999,
            backgroundColor: makeTheme.accent,
            opacity: 0.35,
          }}
        />
        {/* Snap dots */}
        <View style={{ position: 'absolute', left: 8, right: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
          {options.map((_, i) => (
            <View
              key={String(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i <= currentIndex ? makeTheme.accent : makeTheme.card.border,
                transform: [{ scale: i === currentIndex ? 1.2 : 1 }],
              }}
            />
          ))}
        </View>
        {/* Thumb */}
        <View
          style={{
            position: 'absolute',
            left: `calc(${(currentIndex / Math.max(1, options.length - 1)) * 100}% - 10px)` as unknown as number,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: makeTheme.accent,
            borderWidth: 2,
            borderColor: '#ffffff',
            ...(Platform.OS === 'web'
              ? ({
                  boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
                } as unknown as object)
              : null),
          }}
        />
      </View>

      {/* Option labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        {options.map((opt, i) => (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${opt}`}
            onPress={() => onChange(opt)}
            style={({ pressed }) => ({
              paddingVertical: 2,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MakeText tone={i === currentIndex ? 'secondary' : 'muted'} style={{ fontSize: 12 }}>
              {opt}
            </MakeText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function GridCustomizerModal({
  open,
  onClose,
  settings,
  deviceId,
}: {
  open: boolean;
  onClose: () => void;
  settings: SudokuSettingsV1;
  deviceId: string;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const { width } = useWindowDimensions();
  const sizing = getUiSizingSettings(settings);
  const highlights = getGridHighlightSettings(settings);

  const [gridSize, setGridSize] = React.useState<GridSizeOption>(numberToGridSize(sizing.gridSizePct));
  const [digitSize, setDigitSize] = React.useState<DigitSizeOption>(numberToDigitSize(sizing.digitSizePct));
  const [noteSize, setNoteSize] = React.useState<NoteSizeOption>(numberToNoteSize(sizing.noteSizePct));
  const [contrast, setContrast] = React.useState<ContrastOption>(numberToContrast(highlights.highlightContrast));

  // draggable panel position (web parity)
  const [position, setPosition] = React.useState(() => ({ x: Math.max(16, width - 360), y: 80 }));
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragOriginRef = React.useRef<{ x: number; y: number } | null>(null);

  const selectedIndex = 4 * 9 + 3; // Make: row 4, col 3 (0-based)

  // Match the real game board sizing logic (see `UltimateGameScreen`):
  // compute a base cell size that fits the viewport at scale=1.0,
  // then apply Make's grid size scale with "fit" clamping.
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const isXl = width >= 1280;
  const horizontalPadding = isMd ? 16 : 8;
  const containerMaxWidth = isXl ? 1024 : isLg ? 896 : 672;
  const contentMaxWidth = Math.min(containerMaxWidth, Math.max(0, Math.floor(width - horizontalPadding * 2)));
  const stackPad = isMd ? 24 : 12;
  const gridGap = 6;
  const baseCellFromViewport = Math.max(20, Math.min(56, Math.floor((contentMaxWidth - 2 * stackPad - 4 * gridGap) / 9)));
  const stackBaseWidth = 9 * baseCellFromViewport + 4 * gridGap + 2 * stackPad;
  const desiredScale = gridSizeToNumber[gridSize] / 100;
  const maxScaleToFit = stackBaseWidth > 0 ? contentMaxWidth / stackBaseWidth : 1;
  const effectiveScale = Math.min(desiredScale, maxScaleToFit);

  React.useEffect(() => {
    if (!open) return;
    const nextSizing = getUiSizingSettings(settings);
    const nextHighlights = getGridHighlightSettings(settings);
    setGridSize(numberToGridSize(nextSizing.gridSizePct));
    setDigitSize(numberToDigitSize(nextSizing.digitSizePct));
    setNoteSize(numberToNoteSize(nextSizing.noteSizePct));
    setContrast(numberToContrast(nextHighlights.highlightContrast));
    setPosition({ x: Math.max(16, width - 360), y: 80 });
  }, [open, settings, width]);

  // Web: drag only from the header handle, and use document-level listeners like Make.
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!open) return;
    if (!isDragging) return;
    if (typeof document === 'undefined') return;

    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !dragOriginRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({ x: dragOriginRef.current.x + dx, y: dragOriginRef.current.y + dy });
    };
    const onUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      dragOriginRef.current = null;
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, open]);

  const apply = () => {
    const numeric = {
      gridSizePct: gridSizeToNumber[gridSize],
      digitSizePct: digitSizeToNumber[digitSize],
      noteSizePct: noteSizeToNumber[noteSize],
      highlightContrast: contrastToNumber[contrast],
      highlightAssistance: contrast !== 'Off',
    };
    const next = setGridCustomizationSettings(
      settings,
      numeric,
      { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
    );
    updateLocalSettings(next);
    onClose();
  };

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close grid customizer"
          onPress={onClose}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.50)',
            ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)' } as unknown as object) : null),
          }}
        />

        {/* Full-width preview board (pointer-events none like Make) */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: effectiveScale }],
              ...(Platform.OS === 'web' ? ({ transformOrigin: 'center center' } as unknown as object) : null),
            }}
          >
            {/* Important: Use the same "glass board card" surface as the real game.
                `SudokuGrid` intentionally leaves unhighlighted cells transparent (Make parity),
                so without this surface the backdrop/app can "bleed" through. */}
            <MakeCard style={{ borderRadius: 24, padding: stackPad }}>
              <SudokuGrid
                puzzle={SAMPLE_PUZZLE as unknown as import('@cynnix-studios/sudoku-core').Grid}
                givensMask={SAMPLE_GIVENS_MASK}
                notes={SAMPLE_NOTES}
                notesMode={false}
                selectedIndex={selectedIndex}
                uiSizing={{
                  gridSizePct: gridSizeToNumber[gridSize],
                  digitSizePct: digitSizeToNumber[digitSize],
                  noteSizePct: noteSizeToNumber[noteSize],
                }}
                cellSizePx={baseCellFromViewport}
                autoCandidatesEnabled={false}
                showConflicts={true}
                highlightContrast={contrastToNumber[contrast]}
                highlightAssistance={contrast !== 'Off'}
                onSelectCell={() => {
                  // preview-only: selected stays fixed (matches Make's previewSelectedCell behavior)
                }}
              />
            </MakeCard>
          </View>
        </View>

        {/* Floating draggable control panel */}
        <View
          style={{
            position: 'absolute',
            left: Platform.OS === 'web' ? position.x : Math.max(16, width - 344),
            top: Platform.OS === 'web' ? position.y : 80,
            width: 320,
          }}
        >
          <MakeCard style={{ borderRadius: 18, overflow: 'hidden' }}>
            {/* Drag handle header */}
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: makeTheme.card.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Drag grid settings panel"
                onPress={() => {
                  // no-op: click doesn't do anything; drag is the interaction
                }}
                // RN Web: `onPressIn` reliably fires on mouse down; use it to start dragging (Make parity: drag handle only).
                onPressIn={(e) => {
                  if (Platform.OS !== 'web') return;
                  const ne = e.nativeEvent as unknown as { pageX?: number; pageY?: number; preventDefault?: () => void };
                  ne.preventDefault?.();
                  setIsDragging(true);
                  dragStartRef.current = { x: ne.pageX ?? 0, y: ne.pageY ?? 0 };
                  dragOriginRef.current = { x: position.x, y: position.y };
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  opacity: pressed ? 0.92 : 1,
                  ...(Platform.OS === 'web' ? ({ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' } as unknown as object) : null),
                })}
              >
                <GripVertical width={16} height={16} color={makeTheme.text.muted} />
                <MakeText style={{ fontSize: 14 }}>Grid Settings</MakeText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Close grid customizer panel" onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <X width={16} height={16} color={makeTheme.text.muted} />
              </Pressable>
            </View>

            {/* Controls */}
            <View style={{ padding: 14, gap: 14 }}>
              <DiscreteSlider label="Grid Size" options={['S', 'M', 'L', 'XL']} value={gridSize} onChange={(v) => setGridSize(v as GridSizeOption)} />
              <DiscreteSlider label="Digit Size" options={['XS', 'S', 'M', 'L', 'XL']} value={digitSize} onChange={(v) => setDigitSize(v as DigitSizeOption)} />
              <DiscreteSlider label="Note Size" options={['XS', 'S', 'M', 'L', 'XL']} value={noteSize} onChange={(v) => setNoteSize(v as NoteSizeOption)} />
              <DiscreteSlider label="Highlight" options={['Off', 'Normal', 'High', 'Max']} value={contrast} onChange={(v) => setContrast(v as ContrastOption)} />
            </View>

            {/* Footer */}
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: makeTheme.card.border }}>
              <MakeButton
                title="Apply Settings"
                accessibilityLabel="Apply settings"
                elevation="flat"
                radius={12}
                onPress={apply}
                leftIcon={<Check width={16} height={16} color={makeTheme.button.textOnPrimary} />}
                contentStyle={{ height: 44, paddingVertical: 0, paddingHorizontal: 16 }}
              />
            </View>
          </MakeCard>
        </View>
      </View>
    </Modal>
  );
}


