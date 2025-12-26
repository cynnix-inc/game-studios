import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft, Bell, Gamepad2, Globe, Palette, SlidersHorizontal, Volume2, Vibrate } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

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

function nextHintMode(current: HintMode): HintMode {
  if (current === 'direct') return 'logic';
  if (current === 'logic') return 'assist';
  if (current === 'assist') return 'escalate';
  return 'direct';
}

export function UltimateSettingsScreen({ onBack }: { onBack: () => void }) {
  const { theme: makeTheme, themeType, setThemeType } = useMakeTheme();

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

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
          variant="secondary"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />

        <MakeText weight="bold" style={{ fontSize: 32, marginTop: 12, marginBottom: 16 }}>
          Settings
        </MakeText>

        {/* Theme */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Palette width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Theme
              </MakeText>
            </View>

            <MakeText tone="secondary">Select a theme (web persists; native persistence is a logged gap).</MakeText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(['default', 'light', 'dark', 'grayscale', 'device'] as const).map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  accessibilityLabel={`Theme ${t}`}
                  onPress={() => setThemeType(t)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: themeType === t ? makeTheme.accent : makeTheme.card.border,
                    backgroundColor: makeTheme.card.background,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <MakeText weight="semibold" style={{ color: themeType === t ? makeTheme.accent : makeTheme.text.primary }}>
                    {t}
                  </MakeText>
                </Pressable>
              ))}
            </View>
          </View>
        </MakeCard>

        {/* Gameplay */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Gamepad2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Gameplay
              </MakeText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle auto candidates"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { autoCandidates: !toggles.autoCandidates },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Auto Candidates</MakeText>
                <MakeText tone="secondary">{toggles.autoCandidates ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle auto advance"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { autoAdvance: !toggles.autoAdvance },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Auto-advance</MakeText>
                <MakeText tone="secondary">{toggles.autoAdvance ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change hint type"
              onPress={() => {
                const next = setGameplaySettings(
                  settings,
                  { hintMode: nextHintMode(gameplay.hintMode) },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Hint Type</MakeText>
                <MakeText tone="secondary">{gameplay.hintMode}</MakeText>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle zen mode"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { zenMode: !toggles.zenMode },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Zen Mode</MakeText>
                <MakeText tone="secondary">{toggles.zenMode ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

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

        {/* Display & Language (UI-first; localization not yet wired) */}
        <View style={{ height: 16 }} />
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Globe width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Display & Language
              </MakeText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Language"
              onPress={() => {}}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Language</MakeText>
                <MakeText tone="secondary">English</MakeText>
              </View>
            </Pressable>

            <MakeText tone="muted" style={{ fontSize: 12 }}>
              UI only: localization is not yet wired.
            </MakeText>
          </View>
        </MakeCard>

        {/* UI sizing */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SlidersHorizontal width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Grid Sizing
              </MakeText>
            </View>

            <SudokuSizingPreview gridSizePct={sizing.gridSizePct} digitSizePct={sizing.digitSizePct} noteSizePct={sizing.noteSizePct} />

            <View style={{ gap: 10 }}>
              <View>
                <MakeText tone="secondary">
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
          </View>
        </MakeCard>

        {/* Audio */}
        <MakeCard>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Volume2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Audio
              </MakeText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle sound effects"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { soundEnabled: !toggles.soundEnabled },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Sound Effects</MakeText>
                <MakeText tone="secondary">{toggles.soundEnabled ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle music"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { musicEnabled: !toggles.musicEnabled },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Music</MakeText>
                <MakeText tone="secondary">{toggles.musicEnabled ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle haptics"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { hapticsEnabled: !toggles.hapticsEnabled },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Vibrate width={16} height={16} color={makeTheme.text.muted} />
                  <MakeText weight="semibold">Haptics</MakeText>
                </View>
                <MakeText tone="secondary">{toggles.hapticsEnabled ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>
          </View>
        </MakeCard>

        <View style={{ height: 16 }} />

        {/* Notifications */}
        <MakeCard>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Notifications
              </MakeText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle notifications"
              onPress={() => {
                const next = setSettingsToggles(
                  settings,
                  { notificationsEnabled: !toggles.notificationsEnabled },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <MakeText weight="semibold">Push Notifications</MakeText>
                <MakeText tone="secondary">{toggles.notificationsEnabled ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

            <MakeText tone="muted" style={{ fontSize: 12 }}>
              UI only: scheduling/permissions are not yet wired.
            </MakeText>
          </View>
        </MakeCard>
      </View>
    </MakeScreen>
  );
}


