import React from 'react';
import { Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronDown,
  Gamepad2,
  Grid3x3,
  Info,
  Lightbulb,
  Maximize2,
  Music,
  Palette,
  Sparkles,
  Volume2,
  Vibrate,
} from 'lucide-react-native';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { Slider } from '../../components/Slider';
import { usePlayerStore } from '../../state/usePlayerStore';
import { useSettingsStore } from '../../state/useSettingsStore';
import {
  AUDIO_LIMITS,
  UI_SIZING_LIMITS,
  getAudioSettings,
  getGameplaySettings,
  getSettingsToggles,
  getUiSizingSettings,
  type HintMode,
  setAudioSettings,
  setGameplaySettings,
  setSettingsToggles,
  setUiSizingSettings,
} from '../../services/settingsModel';
import { updateLocalSettings } from '../../services/settings';

function MakeSwitch({
  value,
  onChange,
  disabled,
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const { theme: makeTheme } = useMakeTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({ pressed }) => ({
        width: 44,
        height: 24,
        borderRadius: 999,
        padding: 2,
        justifyContent: 'center',
        backgroundColor: value ? makeTheme.accent : makeTheme.input.background,
        borderWidth: 1,
        borderColor: value ? makeTheme.accent : makeTheme.input.border,
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#ffffff',
          transform: [{ translateX: value ? 20 : 0 }],
          ...(Platform.OS === 'web'
            ? ({
                transition: 'transform 150ms ease',
              } as unknown as object)
            : null),
        }}
      />
    </Pressable>
  );
}

function InfoHelp({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  const { theme: makeTheme } = useMakeTheme();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          padding: 4,
          borderRadius: 999,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Info width={14} height={14} color={makeTheme.text.muted} />
      </Pressable>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close help"
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          <Pressable
            accessibilityRole="none"
            onPress={(e) => {
              const maybe = e as unknown as { stopPropagation?: () => void };
              maybe.stopPropagation?.();
            }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16 }}>
                <MakeText weight="semibold" style={{ marginBottom: 8 }}>
                  {label}
                </MakeText>
                <MakeText tone="secondary" style={{ lineHeight: 20 }}>
                  {text}
                </MakeText>
                <View style={{ height: 12 }} />
                <MakeButton title="Close" variant="secondary" elevation="flat" onPress={() => setOpen(false)} />
              </View>
            </MakeCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

type SelectOption<T extends string> = { value: T; label: string };

function MakeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  accessibilityLabel,
}: {
  label: string;
  value: T;
  options: readonly [SelectOption<T>, ...SelectOption<T>[]];
  onChange: (next: T) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const [open, setOpen] = React.useState(false);
  const { theme: makeTheme } = useMakeTheme();
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderColor: makeTheme.input.border,
          backgroundColor: makeTheme.input.background,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        })}
      >
        <MakeText>{current.label}</MakeText>
        <ChevronDown width={16} height={16} color={makeTheme.text.muted} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Close ${label} picker`}
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          <Pressable
            accessibilityRole="none"
            onPress={(e) => {
              const maybe = e as unknown as { stopPropagation?: () => void };
              maybe.stopPropagation?.();
            }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16, gap: 10 }}>
                <MakeText weight="semibold">{label}</MakeText>
                {options.map((opt) => {
                  const selected = opt.value === value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      accessibilityLabel={`${label}: ${opt.label}`}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: selected ? makeTheme.accent : makeTheme.card.border,
                        backgroundColor: makeTheme.card.background,
                        opacity: pressed ? 0.92 : 1,
                      })}
                    >
                      <MakeText weight="semibold" style={{ color: selected ? makeTheme.accent : makeTheme.text.primary }}>
                        {opt.label}
                      </MakeText>
                    </Pressable>
                  );
                })}
                <View style={{ height: 4 }} />
                <MakeButton title="Close" variant="secondary" elevation="flat" onPress={() => setOpen(false)} />
              </View>
            </MakeCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function GridPreview({ gridScale, digitScale, noteScale }: { gridScale: number; digitScale: number; noteScale: number }) {
  const { theme: makeTheme, resolvedThemeType } = useMakeTheme();

  // Sample data for preview - fixed to never overlap (mirrors Make `Settings.tsx`)
  const previewCells: ReadonlyArray<{ value: number; notes: readonly number[] }> = [
    { value: 5, notes: [] },
    { value: 0, notes: [1, 2, 3] },
    { value: 7, notes: [] },
    { value: 0, notes: [4, 6] },
    { value: 9, notes: [] },
    { value: 0, notes: [2, 8] },
    { value: 3, notes: [] },
    { value: 0, notes: [5, 7, 9] },
    { value: 6, notes: [] },
  ];

  // Grid size ONLY affects cell dimensions
  const baseSize = 48;
  const cellSize = (baseSize * gridScale) / 100;

  // Font sizes scale independently
  const baseDigitSize = 20;
  const digitFontSize = (baseDigitSize * digitScale) / 100;

  // Note size as a percentage of sub-cell
  const subCellSize = cellSize / 3;
  const notePercentage = 0.5 + (noteScale - 100) / 500; // 100→50%, 150→60%, ..., 300→90%
  const noteFontSize = subCellSize * notePercentage;

  const cellBackground = resolvedThemeType === 'light' ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255, 255, 255, 0.05)';

  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: makeTheme.card.border,
        padding: 16,
        backgroundColor: makeTheme.card.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: cellSize * 3,
          height: cellSize * 3,
          borderRadius: 8,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: makeTheme.card.border,
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        {previewCells.map((cell, idx) => {
          return (
            <View
              key={idx}
              style={{
                width: cellSize,
                height: cellSize,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: cellBackground,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {cell.value !== 0 ? (
                <MakeText
                  style={{
                    fontSize: Math.min(digitFontSize, cellSize * 0.7),
                    lineHeight: Math.min(digitFontSize, cellSize * 0.7) * 1.02,
                  }}
                >
                  {String(cell.value)}
                </MakeText>
              ) : (
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                    const show = cell.notes.includes(num);
                    return (
                      <View
                        key={num}
                        style={{
                          width: subCellSize,
                          height: subCellSize,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: show ? 1 : 0,
                        }}
                      >
                        <MakeText
                          tone="muted"
                          style={{
                            fontSize: noteFontSize,
                            lineHeight: noteFontSize * 0.8,
                          }}
                        >
                          {String(num)}
                        </MakeText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function UltimateSettingsScreen({ onBack }: { onBack: () => void }) {
  const { theme: makeTheme, themeType, setThemeType } = useMakeTheme();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const [language, setLanguage] = React.useState<'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh'>('en');

  const deviceId = usePlayerStore((s) => s.deviceId) ?? 'unknown';
  const settings = useSettingsStore((s) => s.settings);

  if (!settings) {
    return (
      <MakeScreen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <MakeText weight="bold" style={{ fontSize: 24 }}>
            Settings
          </MakeText>
          <MakeText tone="muted">Loading…</MakeText>
        </View>
      </MakeScreen>
    );
  }

  const sizing = getUiSizingSettings(settings);
  const toggles = getSettingsToggles(settings);
  const audio = getAudioSettings(settings);
  const gameplay = getGameplaySettings(settings);
  const zenDisabled = toggles.zenMode;
  const hintOptions: readonly [SelectOption<HintMode>, ...SelectOption<HintMode>[]] = [
    { value: 'direct', label: 'Direct' },
    { value: 'logic', label: 'Logic' },
    { value: 'assist', label: 'Assist' },
    { value: 'escalate', label: 'Escalate' },
  ];
  const themeOptions: readonly [SelectOption<typeof themeType>, ...SelectOption<typeof themeType>[]] = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'vibrant', label: 'Vibrant' },
    { value: 'device', label: 'Match Device' },
  ];
  const languageOptions: readonly [SelectOption<typeof language>, ...SelectOption<typeof language>[]] = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'ja', label: '日本語' },
    { value: 'zh', label: '中文' },
  ];
  return (
    <MakeScreen style={{ paddingHorizontal: 0, paddingTop: 32, paddingBottom: 96 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        {/* Header */}
        <View style={{ marginBottom: 32, paddingHorizontal: 16 }}>
          <View style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
              variant="ghost"
              elevation="flat"
          onPress={onBack}
              leftIcon={<ArrowLeft width={16} height={16} color={makeTheme.text.primary} />}
              contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
        />
          </View>
          <MakeText weight="bold" style={{ fontSize: isMd ? 36 : 30 }}>
          Settings
              </MakeText>
            </View>

        {/* Sections */}
        <View style={{ paddingHorizontal: 16, gap: 20 }}>

        {/* Gameplay */}
        <MakeCard style={[{ borderRadius: 16 }, Platform.select({ web: { boxShadow: '0 20px 50px rgba(0,0,0,0.20)' } as unknown as object, ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }, android: { elevation: 10 } })]}>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Gamepad2 width={24} height={24} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 20 }}>
                Gameplay
              </MakeText>
            </View>

            {/* 2-column layout on desktop */}
            <View style={{ flexDirection: isLg ? 'row' : 'column', flexWrap: isLg ? 'wrap' : 'nowrap', gap: 16 }}>
              <View style={{ width: isLg ? '48%' : '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Grid3x3 width={16} height={16} color={toggles.autoCandidates ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <MakeText tone={toggles.autoCandidates ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                    Auto Candidates
                  </MakeText>
                  <InfoHelp label="Auto Candidates help" text="Shows pencil-mark candidates in empty cells. Updates automatically as the board changes." />
                </View>
                <MakeSwitch
                  accessibilityLabel="Auto Candidates"
                  value={toggles.autoCandidates}
                  onChange={(autoCandidates) => {
                    const next = setSettingsToggles(settings, { autoCandidates }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                />
              </View>

              <View style={{ width: isLg ? '48%' : '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ArrowRight width={16} height={16} color={toggles.autoAdvance ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <MakeText tone={toggles.autoAdvance ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                    Auto-advance
                  </MakeText>
                  <InfoHelp label="Auto-advance help" text="After you type a number, selection moves to the next cell. Hold Shift to move backward." />
                </View>
                <MakeSwitch
                  accessibilityLabel="Auto-advance"
                  value={toggles.autoAdvance}
                  onChange={(autoAdvance) => {
                    const next = setSettingsToggles(settings, { autoAdvance }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                />
              </View>

              <View style={{ width: isLg ? '48%' : '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Sparkles width={16} height={16} color={toggles.zenMode ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                  <MakeText tone={toggles.zenMode ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                    Zen Mode
                  </MakeText>
                  <InfoHelp
                    label="Zen Mode help"
                    text="A calmer experience: • Hides timer, Lives, difficulty, and status. • Runs don't update stats or best times. • Daily puzzles keep fixed Lives. • Sets Lives to Unlimited and disables the Lives slider."
                  />
                </View>
                <MakeSwitch
                  accessibilityLabel="Zen Mode"
                  value={toggles.zenMode}
                  onChange={(zenMode) => {
                    const next = setSettingsToggles(settings, { zenMode }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                />
              </View>

              <View style={{ width: isLg ? '48%' : '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Lightbulb width={16} height={16} color={makeTheme.accent} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MakeText tone="secondary" style={{ fontSize: 14 }}>
                    Hint Type
                  </MakeText>
                  <InfoHelp
                    label="Hint Type help"
                    text="Choose how the Hint button helps: • Direct: place a correct digit. • Logic: highlight a solvable cell and explain. • Assist: show candidates and safe numbers. • Escalate: highlight → candidates → reveal."
                  />
                </View>
                <View style={{ width: 128 }}>
                  <MakeSelect<HintMode>
                    label="Hint Type"
                    accessibilityLabel="Select hint type"
                    value={gameplay.hintMode}
                    options={hintOptions}
                    onChange={(hintMode) => {
                      const next = setGameplaySettings(settings, { hintMode }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: makeTheme.card.border, opacity: 0.8 }} />

            {/* Lives Limit (full width) */}
            <View style={{ opacity: zenDisabled ? 0.5 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MakeText tone="secondary" style={{ fontSize: 14 }}>
                    Lives
              </MakeText>
                  <InfoHelp
                    label="Lives help"
                    text="Lives limit how many wrong entries you can make. Set to 11 for Unlimited. Disabled in Zen mode (Lives are Unlimited). Daily puzzles use fixed Lives by difficulty; this setting won't override Daily."
                  />
                </View>
                <MakeText style={{ fontSize: 14 }}>{gameplay.livesLimit === 11 ? '∞' : String(gameplay.livesLimit)}</MakeText>
              </View>
              <Slider
                accessibilityLabel="Lives limit"
                value={gameplay.livesLimit}
                min={0}
                max={11}
                step={1}
                onChange={(livesLimit) => {
                  const next = setGameplaySettings(settings, { livesLimit }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                  updateLocalSettings(next);
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  0
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12 }}>
                  ∞
              </MakeText>
              </View>
            </View>
          </View>
        </MakeCard>

        {/* Grid Customization */}
        <MakeCard
          style={[
            { borderRadius: 16 },
            Platform.select({
              web: { boxShadow: '0 20px 50px rgba(0,0,0,0.20)' } as unknown as object,
              ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
              android: { elevation: 10 },
            }),
          ]}
        >
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Maximize2 width={24} height={24} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 20 }}>
                Grid Customization
              </MakeText>
            </View>

            <View style={{ flexDirection: isLg ? 'row' : 'column', gap: 32 }}>
              {/* Sliders */}
              <View style={{ flex: 1, gap: 16 }}>
                {/* Grid Size */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Grid Size
            </MakeText>
                      <InfoHelp label="Grid Size help" text="Adjusts overall board/cell size." />
          </View>
                    <MakeText style={{ fontSize: 14 }}>{sizing.gridSizePct === 85 ? 'S' : sizing.gridSizePct === 100 ? 'M' : 'L'}</MakeText>
            </View>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Small
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      Large
                    </MakeText>
                  </View>
              </View>

                {/* Input Number Size */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Input Number Size
                      </MakeText>
                      <InfoHelp label="Input Number Size help" text="Scales the main digit inside each cell." />
                    </View>
                    <MakeText style={{ fontSize: 14 }}>
                      {sizing.digitSizePct === 80 ? 'XS' : sizing.digitSizePct === 90 ? 'S' : sizing.digitSizePct === 100 ? 'M' : sizing.digitSizePct === 110 ? 'L' : 'XL'}
                </MakeText>
                  </View>
                <Slider
                  accessibilityLabel="Primary number font size"
                  value={sizing.digitSizePct}
                  min={UI_SIZING_LIMITS.digitSizePct.min}
                  max={UI_SIZING_LIMITS.digitSizePct.max}
                  step={UI_SIZING_LIMITS.digitSizePct.step}
                  onChange={(digitSizePct) => {
                    const next = setUiSizingSettings(settings, { digitSizePct }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      XS
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      XL
                    </MakeText>
                  </View>
              </View>

                {/* Notes Size */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MakeText tone="secondary" style={{ fontSize: 14 }}>
                        Notes Size
                      </MakeText>
                      <InfoHelp label="Notes Size help" text="Scales pencil-mark annotations." />
                    </View>
                    <MakeText style={{ fontSize: 14 }}>
                      {sizing.noteSizePct === 100 ? 'XS' : sizing.noteSizePct === 150 ? 'S' : sizing.noteSizePct === 200 ? 'M' : sizing.noteSizePct === 250 ? 'L' : 'XL'}
                </MakeText>
                  </View>
                <Slider
                  accessibilityLabel="Note font size"
                  value={sizing.noteSizePct}
                  min={UI_SIZING_LIMITS.noteSizePct.min}
                  max={UI_SIZING_LIMITS.noteSizePct.max}
                  step={UI_SIZING_LIMITS.noteSizePct.step}
                  onChange={(noteSizePct) => {
                    const next = setUiSizingSettings(settings, { noteSizePct }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      XS
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      XL
                    </MakeText>
                  </View>
                </View>
              </View>

              {/* Preview */}
              <View style={{ width: isLg ? 256 : '100%', alignItems: 'center', justifyContent: 'center' }}>
                <MakeText tone="secondary" style={{ fontSize: 14, marginBottom: 12 }}>
                  Preview
                </MakeText>
                <GridPreview gridScale={sizing.gridSizePct} digitScale={sizing.digitSizePct} noteScale={sizing.noteSizePct} />
              </View>
            </View>
          </View>
        </MakeCard>

        {/* Audio */}
        <MakeCard
          style={[
            { borderRadius: 16 },
            Platform.select({
              web: { boxShadow: '0 20px 50px rgba(0,0,0,0.20)' } as unknown as object,
              ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
              android: { elevation: 10 },
            }),
          ]}
        >
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Volume2 width={24} height={24} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 20 }}>
                Audio
              </MakeText>
            </View>

            <View style={{ gap: 16 }}>
              {/* Sound Effects */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Volume2 width={16} height={16} color={toggles.soundEnabled ? makeTheme.accent : makeTheme.text.muted} />
                    <MakeText tone={toggles.soundEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Sound Effects
                    </MakeText>
                    <MakeSwitch
                      accessibilityLabel="Sound Effects"
                      value={toggles.soundEnabled}
                      onChange={(soundEnabled) => {
                        const next = setSettingsToggles(settings, { soundEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                    />
                  </View>
                  {toggles.soundEnabled ? <MakeText style={{ fontSize: 14 }}>{Math.round(audio.soundVolume)}%</MakeText> : null}
              </View>

            {toggles.soundEnabled ? (
                  <View>
                <Slider
                  accessibilityLabel="Sound volume"
                  value={audio.soundVolume}
                  min={AUDIO_LIMITS.volume.min}
                  max={AUDIO_LIMITS.volume.max}
                  step={AUDIO_LIMITS.volume.step}
                  onChange={(soundVolume) => {
                    const next = setAudioSettings(settings, { soundVolume }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        0%
                      </MakeText>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        100%
                      </MakeText>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Music */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Music width={16} height={16} color={toggles.musicEnabled ? makeTheme.accent : makeTheme.text.muted} />
                    <MakeText tone={toggles.musicEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Music
                    </MakeText>
                    <MakeSwitch
                      accessibilityLabel="Music"
                      value={toggles.musicEnabled}
                      onChange={(musicEnabled) => {
                        const next = setSettingsToggles(settings, { musicEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                    />
                  </View>
                  {toggles.musicEnabled ? <MakeText style={{ fontSize: 14 }}>{Math.round(audio.musicVolume)}%</MakeText> : null}
              </View>

            {toggles.musicEnabled ? (
                  <View>
                <Slider
                  accessibilityLabel="Music volume"
                  value={audio.musicVolume}
                  min={AUDIO_LIMITS.musicVolume.min}
                  max={AUDIO_LIMITS.musicVolume.max}
                  step={AUDIO_LIMITS.musicVolume.step}
                  onChange={(musicVolume) => {
                    const next = setAudioSettings(settings, { musicVolume }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        0%
                      </MakeText>
                      <MakeText tone="muted" style={{ fontSize: 12 }}>
                        100%
                      </MakeText>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={{ height: 1, backgroundColor: makeTheme.card.border, opacity: 0.8 }} />

              {/* Haptics */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Vibrate width={16} height={16} color={toggles.hapticsEnabled ? makeTheme.accent : makeTheme.text.muted} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MakeText tone={toggles.hapticsEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Haptics
                    </MakeText>
                    <InfoHelp label="Haptics help" text="Provides tactile feedback when interacting with the game." />
                  </View>
                  <MakeSwitch
                    accessibilityLabel="Haptics"
                    value={toggles.hapticsEnabled}
                    onChange={(hapticsEnabled) => {
                      const next = setSettingsToggles(settings, { hapticsEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
                  />
                </View>
              </View>
            </View>
          </View>
        </MakeCard>

        {/* Preferences */}
        <MakeCard
          style={[
            { borderRadius: 16 },
            Platform.select({
              web: { boxShadow: '0 20px 50px rgba(0,0,0,0.20)' } as unknown as object,
              ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
              android: { elevation: 10 },
            }),
          ]}
        >
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Palette width={24} height={24} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 20 }}>
                Preferences
              </MakeText>
            </View>

            <View style={{ flexDirection: isLg ? 'row' : 'column', gap: 16 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  Theme
                </MakeText>
                <MakeSelect label="Theme" accessibilityLabel="Select theme" value={themeType} options={themeOptions} onChange={setThemeType} />
              </View>

              <View style={{ flex: 1, gap: 8 }}>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  Language
                </MakeText>
                <MakeSelect
                  label="Language"
                  accessibilityLabel="Select language"
                  value={language}
                  options={languageOptions}
                  // UI-only: does not persist or localize yet; kept to match Make layout.
                  onChange={setLanguage}
                />
            <MakeText tone="muted" style={{ fontSize: 12 }}>
                  UI only: localization is not yet wired.
                </MakeText>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: makeTheme.card.border, opacity: 0.8 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell width={16} height={16} color={toggles.notificationsEnabled ? makeTheme.accent : makeTheme.text.muted} />
              <MakeText tone={toggles.notificationsEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                Push Notifications
            </MakeText>
              <MakeSwitch
                accessibilityLabel="Push Notifications"
                value={toggles.notificationsEnabled}
                onChange={(notificationsEnabled) => {
                  const next = setSettingsToggles(settings, { notificationsEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                  updateLocalSettings(next);
                }}
              />
            </View>
          </View>
        </MakeCard>
      </View>
      </View>
    </MakeScreen>
  );
}


