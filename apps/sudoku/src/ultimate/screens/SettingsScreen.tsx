import React from 'react';
import { Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  CheckSquare,
  ChevronDown,
  Gamepad2,
  Globe,
  Info,
  Maximize2,
  Moon,
  Music,
  Palette,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Vibrate,
} from 'lucide-react-native';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { Slider } from '../../components/Slider';
import { SudokuSizingPreview } from '../../components/SudokuSizingPreview';
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
        backgroundColor: value ? 'rgba(34,211,238,0.80)' : 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: value ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.14)',
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
  options: readonly SelectOption<T>[];
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
          borderColor: makeTheme.card.border,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        })}
      >
        <MakeText tone="secondary">{current.label}</MakeText>
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

export function UltimateSettingsScreen({ onBack }: { onBack: () => void }) {
  const { theme: makeTheme, themeType, setThemeType } = useMakeTheme();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const isLg = width >= 1024;

  const deviceId = usePlayerStore((s) => s.deviceId) ?? 'unknown';
  const settings = useSettingsStore((s) => s.settings);

  if (!settings) {
    return (
      <MakeScreen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <MakeText weight="bold" style={{ fontSize: theme.fontSize.xl }}>
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
  const hintOptions: readonly SelectOption<HintMode>[] = [
    { value: 'direct', label: 'Direct' },
    { value: 'logic', label: 'Logic' },
    { value: 'assist', label: 'Assist' },
    { value: 'escalate', label: 'Escalate' },
  ];
  const themeOptions: readonly SelectOption<typeof themeType>[] = [
    { value: 'default', label: 'Default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'device', label: 'Match Device' },
  ];

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 96 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
            variant="ghost"
            elevation="flat"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
            contentStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
        />
          <MakeText weight="bold" style={{ fontSize: isMd ? 40 : 32, marginTop: 10 }}>
          Settings
              </MakeText>
            </View>

        {/* Gameplay */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Gamepad2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Gameplay
              </MakeText>
            </View>

            {/* Auto Candidates */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {toggles.autoCandidates ? (
                  <CheckSquare width={16} height={16} color={makeTheme.accent} />
                ) : (
                  <Square width={16} height={16} color={makeTheme.text.muted} />
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <MakeText tone={toggles.autoCandidates ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Auto Candidates {!toggles.autoCandidates ? '(Off)' : ''}
                    </MakeText>
                    <InfoHelp
                      label="Auto Candidates help"
                      text="Shows pencil-mark candidates in empty cells. Updates automatically as the board changes."
                    />
                  </View>
                </View>
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

            {/* Auto Advance */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <ArrowRight width={16} height={16} color={toggles.autoAdvance ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <MakeText tone={toggles.autoAdvance ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Auto-advance {!toggles.autoAdvance ? '(Off)' : ''}
                    </MakeText>
                    <InfoHelp
                      label="Auto-advance help"
                      text="After you type a number, selection moves to the next cell. Hold Shift to move backward."
                    />
                  </View>
                </View>
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

            {/* Hint Type */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  Hint Type
                </MakeText>
                <InfoHelp
                  label="Hint Type help"
                  text="Choose how the Hint button helps: Direct, Logic, Assist, or Escalate."
                />
              </View>
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

            {/* Zen Mode */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Sparkles width={16} height={16} color={toggles.zenMode ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <MakeText tone={toggles.zenMode ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                      Zen Mode {!toggles.zenMode ? '(Off)' : ''}
                    </MakeText>
                    <InfoHelp
                      label="Zen Mode help"
                      text="A calmer experience: hides timer/Lives/status and disables the Lives slider (Lives become Unlimited)."
                    />
                  </View>
                </View>
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

            <View style={{ opacity: zenDisabled ? 0.5 : 1 }}>
              <MakeText tone="secondary" style={{ marginBottom: 6 }}>
                Lives: {gameplay.livesLimit === 11 ? '∞' : gameplay.livesLimit}
              </MakeText>
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
              <MakeText tone="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {zenDisabled ? 'Disabled in Zen Mode.' : '11 = Unlimited'}
              </MakeText>
            </View>
          </View>
        </MakeCard>

        {/* UI sizing */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Maximize2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Grid Sizing
              </MakeText>
            </View>

            <View style={{ flexDirection: isLg ? 'row' : 'column', gap: 16, alignItems: isLg ? 'center' : 'flex-start' }}>
              <View style={{ flex: 1, width: '100%', gap: 10 }}>
              <View>
                  <MakeText tone="secondary">Grid size: {sizing.gridSizePct === 85 ? 'S' : sizing.gridSizePct === 100 ? 'M' : 'L'}</MakeText>
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
                <MakeText tone="secondary">
                  Input number size: {sizing.digitSizePct === 80 ? 'XS' : sizing.digitSizePct === 90 ? 'S' : sizing.digitSizePct === 100 ? 'M' : sizing.digitSizePct === 110 ? 'L' : 'XL'}
                </MakeText>
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
              </View>

              <View>
                <MakeText tone="secondary">
                  Notes size: {sizing.noteSizePct === 100 ? 'XS' : sizing.noteSizePct === 150 ? 'S' : sizing.noteSizePct === 200 ? 'M' : sizing.noteSizePct === 250 ? 'L' : 'XL'}
                </MakeText>
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
                </View>
              </View>

              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <SudokuSizingPreview gridSizePct={sizing.gridSizePct} digitSizePct={sizing.digitSizePct} noteSizePct={sizing.noteSizePct} />
              </View>
            </View>
          </View>
        </MakeCard>

        {/* Audio */}
        <MakeCard>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Volume2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Audio
              </MakeText>
            </View>

            {/* Sound Effects */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {toggles.soundEnabled ? (
                  <Volume2 width={16} height={16} color={makeTheme.accent} />
                ) : (
                  <VolumeX width={16} height={16} color={makeTheme.text.muted} />
                )}
                <MakeText tone={toggles.soundEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                  Sound Effects {!toggles.soundEnabled ? '(Off)' : ''}
                </MakeText>
              </View>
              <MakeSwitch
                accessibilityLabel="Sound Effects"
                value={toggles.soundEnabled}
                onChange={(soundEnabled) => {
                  const next = setSettingsToggles(settings, { soundEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                  updateLocalSettings(next);
                }}
              />
            </View>

            {toggles.soundEnabled ? (
              <View style={{ paddingHorizontal: 4 }}>
                <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                  Volume: {Math.round(audio.soundVolume)}%
                </MakeText>
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
              </View>
            ) : null}

            {/* Music */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {toggles.musicEnabled ? (
                  <Music width={16} height={16} color={makeTheme.accent} />
                ) : (
                  <VolumeX width={16} height={16} color={makeTheme.text.muted} />
                )}
                <MakeText tone={toggles.musicEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                  Music {!toggles.musicEnabled ? '(Off)' : ''}
                </MakeText>
              </View>
              <MakeSwitch
                accessibilityLabel="Music"
                value={toggles.musicEnabled}
                onChange={(musicEnabled) => {
                  const next = setSettingsToggles(settings, { musicEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                  updateLocalSettings(next);
                }}
              />
            </View>

            {toggles.musicEnabled ? (
              <View style={{ paddingHorizontal: 4 }}>
                <MakeText tone="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                  Volume: {Math.round(audio.musicVolume)}%
                </MakeText>
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
              </View>
            ) : null}

            {/* Haptics */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Vibrate width={16} height={16} color={toggles.hapticsEnabled ? makeTheme.accent : makeTheme.text.muted} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <MakeText tone={toggles.hapticsEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                    Haptics {!toggles.hapticsEnabled ? '(Off)' : ''}
                  </MakeText>
                  <InfoHelp label="Haptics help" text="Provides tactile feedback when interacting with the game." />
                </View>
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
        </MakeCard>

        <View style={{ height: 16 }} />

        {/* Display & Language */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Moon width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Display & Language
              </MakeText>
            </View>

            {/* Language (UI only for now) */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Globe width={14} height={14} color={makeTheme.text.muted} />
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  Language
                </MakeText>
              </View>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: makeTheme.card.border,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  opacity: 0.75,
                }}
              >
                <MakeText tone="secondary">English</MakeText>
              </View>
              <MakeText tone="muted" style={{ fontSize: 12 }}>
                UI only: localization is not yet wired.
              </MakeText>
            </View>

            {/* Theme */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Palette width={14} height={14} color={makeTheme.text.muted} />
                <MakeText tone="secondary" style={{ fontSize: 14 }}>
                  Theme
                </MakeText>
              </View>
              <MakeSelect
                label="Theme"
                accessibilityLabel="Select theme"
                value={themeType}
                options={themeOptions}
                onChange={(t) => setThemeType(t)}
              />
              <MakeText tone="muted" style={{ fontSize: 12 }}>
                Theme persists on web; native persistence is a logged gap.
              </MakeText>
            </View>
          </View>
        </MakeCard>

        {/* Notifications */}
        <MakeCard>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Notifications
              </MakeText>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {toggles.notificationsEnabled ? (
                  <Bell width={16} height={16} color={makeTheme.accent} />
                ) : (
                  <BellOff width={16} height={16} color={makeTheme.text.muted} />
                )}
                <MakeText tone={toggles.notificationsEnabled ? 'secondary' : 'muted'} style={{ fontSize: 14 }}>
                  Push Notifications {!toggles.notificationsEnabled ? '(Off)' : ''}
                </MakeText>
              </View>
              <MakeSwitch
                accessibilityLabel="Push Notifications"
                value={toggles.notificationsEnabled}
                onChange={(notificationsEnabled) => {
                const next = setSettingsToggles(
                  settings,
                    { notificationsEnabled },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              />
              </View>

            <MakeText tone="muted" style={{ fontSize: 12 }}>
              UI only: scheduling/permissions are not yet wired.
            </MakeText>
          </View>
        </MakeCard>
      </View>
    </MakeScreen>
  );
}


