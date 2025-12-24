import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft, Palette, SlidersHorizontal, Volume2, Vibrate } from 'lucide-react-native';

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
import { getSettingsToggles, getUiSizingSettings, setSettingsToggles, setUiSizingSettings } from '../../services/settingsModel';
import { updateLocalSettings } from '../../services/settings';

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

        {/* UI sizing */}
        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <SlidersHorizontal width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Grid Sizing
              </MakeText>
            </View>

            <SudokuSizingPreview gridSize={sizing.gridSize} numberFontScale={sizing.numberFontScale} noteFontScale={sizing.noteFontScale} />

            <View style={{ gap: 10 }}>
              <View>
                <MakeText tone="secondary">Grid size: {Math.round(sizing.gridSize)} px</MakeText>
                <Slider
                  accessibilityLabel="Grid size"
                  value={sizing.gridSize}
                  min={28}
                  max={56}
                  step={1}
                  onChange={(gridSize) => {
                    const next = setUiSizingSettings(settings, { gridSize }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
              </View>

              <View>
                <MakeText tone="secondary">Input number size: {sizing.numberFontScale.toFixed(2)}×</MakeText>
                <Slider
                  accessibilityLabel="Primary number font size"
                  value={sizing.numberFontScale}
                  min={0.85}
                  max={1.35}
                  step={0.05}
                  onChange={(numberFontScale) => {
                    const next = setUiSizingSettings(settings, { numberFontScale }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
              </View>

              <View>
                <MakeText tone="secondary">Notes size: {sizing.noteFontScale.toFixed(2)}×</MakeText>
                <Slider
                  accessibilityLabel="Note font size"
                  value={sizing.noteFontScale}
                  min={0.7}
                  max={1.25}
                  step={0.05}
                  onChange={(noteFontScale) => {
                    const next = setUiSizingSettings(settings, { noteFontScale }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                    updateLocalSettings(next);
                  }}
                />
              </View>
            </View>
          </View>
        </MakeCard>

        {/* Audio + haptics */}
        <MakeCard>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Volume2 width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Audio & Haptics
              </MakeText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle sound"
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
                <MakeText weight="semibold">Sound</MakeText>
                <MakeText tone="secondary">{toggles.soundEnabled ? 'On' : 'Off'}</MakeText>
              </View>
            </Pressable>

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
      </View>
    </MakeScreen>
  );
}


