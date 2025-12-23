import React from 'react';
import { Switch, View } from 'react-native';

import { AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { useSettingsStore } from '../../src/state/useSettingsStore';
import { Slider } from '../../src/components/Slider';
import { SudokuSizingPreview } from '../../src/components/SudokuSizingPreview';
import { getSettingsToggles, getUiSizingSettings, setSettingsToggles, setUiSizingSettings, UI_SIZING_LIMITS } from '../../src/services/settingsModel';
import { updateLocalSettings } from '../../src/services/settings';

export default function SettingsScreen() {
  const deviceId = usePlayerStore((s) => s.deviceId) ?? 'unknown';
  const profile = usePlayerStore((s) => s.profile);
  const difficulty = usePlayerStore((s) => s.difficulty);
  const puzzleSyncStatus = usePlayerStore((s) => s.puzzleSyncStatus);
  const puzzleLastSyncAtMs = usePlayerStore((s) => s.puzzleLastSyncAtMs);
  const puzzleLastSyncError = usePlayerStore((s) => s.puzzleLastSyncError);
  const settings = useSettingsStore((s) => s.settings);
  const syncStatus = useSettingsStore((s) => s.syncStatus);
  const lastSyncAtMs = useSettingsStore((s) => s.lastSyncAtMs);
  const lastError = useSettingsStore((s) => s.lastError);

  if (!settings) {
    return (
      <Screen>
        <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
          Settings
        </AppText>
        <AppCard>
          <AppText tone="muted">Loading…</AppText>
        </AppCard>
      </Screen>
    );
  }

  const sizing = getUiSizingSettings(settings);
  const toggles = getSettingsToggles(settings);

  const signedIn = profile?.mode === 'supabase';
  const cloudSyncLabel = signedIn ? syncStatus : 'signed out';
  const cloudLastSyncLabel = signedIn && syncStatus === 'ok' && lastSyncAtMs ? new Date(lastSyncAtMs).toLocaleString() : '—';

  const puzzleSyncLabel = signedIn ? puzzleSyncStatus : 'signed out';
  const puzzleLastSyncLabel =
    signedIn && puzzleSyncStatus === 'ok' && puzzleLastSyncAtMs ? new Date(puzzleLastSyncAtMs).toLocaleString() : '—';

  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Settings
      </AppText>

      <AppCard style={{ marginBottom: theme.spacing.md }}>
        <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          UI sizing
        </AppText>

        <View style={{ marginBottom: theme.spacing.md }}>
          <SudokuSizingPreview
            gridSize={sizing.gridSize}
            numberFontScale={sizing.numberFontScale}
            noteFontScale={sizing.noteFontScale}
          />
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <AppText style={{ marginBottom: theme.spacing.xs }}>
            Grid size: {Math.round(sizing.gridSize)} px
          </AppText>
          <View style={{ alignSelf: 'stretch' }}>
            <Slider
              accessibilityLabel="Grid size"
              value={sizing.gridSize}
              min={UI_SIZING_LIMITS.gridSize.min}
              max={UI_SIZING_LIMITS.gridSize.max}
              step={UI_SIZING_LIMITS.gridSize.step}
              onChange={(gridSize) => {
                const next = setUiSizingSettings(settings, { gridSize }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
            />
          </View>
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <AppText style={{ marginBottom: theme.spacing.xs }}>
            Primary number size: {sizing.numberFontScale.toFixed(2)}×
          </AppText>
          <View style={{ alignSelf: 'stretch' }}>
            <Slider
              accessibilityLabel="Primary number font size"
              value={sizing.numberFontScale}
              min={UI_SIZING_LIMITS.numberFontScale.min}
              max={UI_SIZING_LIMITS.numberFontScale.max}
              step={UI_SIZING_LIMITS.numberFontScale.step}
              onChange={(numberFontScale) => {
                const next = setUiSizingSettings(
                  settings,
                  { numberFontScale },
                  { updatedAtMs: Date.now(), updatedByDeviceId: deviceId },
                );
                updateLocalSettings(next);
              }}
            />
          </View>
        </View>

        <View style={{ marginBottom: theme.spacing.sm }}>
          <AppText style={{ marginBottom: theme.spacing.xs }}>
            Note size: {sizing.noteFontScale.toFixed(2)}×
          </AppText>
          <View style={{ alignSelf: 'stretch' }}>
            <Slider
              accessibilityLabel="Note font size"
              value={sizing.noteFontScale}
              min={UI_SIZING_LIMITS.noteFontScale.min}
              max={UI_SIZING_LIMITS.noteFontScale.max}
              step={UI_SIZING_LIMITS.noteFontScale.step}
              onChange={(noteFontScale) => {
                const next = setUiSizingSettings(settings, { noteFontScale }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
                updateLocalSettings(next);
              }}
            />
          </View>
        </View>
      </AppCard>

      <AppCard>
        <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Toggles
        </AppText>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <AppText>Sound</AppText>
          <Switch
            accessibilityLabel="Sound toggle"
            value={toggles.soundEnabled}
            onValueChange={(soundEnabled) => {
              const next = setSettingsToggles(settings, { soundEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
              updateLocalSettings(next);
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText>Haptics</AppText>
          <Switch
            accessibilityLabel="Haptics toggle"
            value={toggles.hapticsEnabled}
            onValueChange={(hapticsEnabled) => {
              const next = setSettingsToggles(settings, { hapticsEnabled }, { updatedAtMs: Date.now(), updatedByDeviceId: deviceId });
              updateLocalSettings(next);
            }}
          />
        </View>

        <View style={{ height: theme.spacing.lg }} />

        <AppText tone="muted">Profile: {profile ? profile.mode : 'none'}</AppText>
        <AppText tone="muted">Difficulty: {difficulty}</AppText>
        <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
          Cloud sync: {cloudSyncLabel}
        </AppText>
        <AppText tone="muted">
          Last sync: {cloudLastSyncLabel}
        </AppText>
        {signedIn && lastError ? <AppText tone="muted">Last error: {lastError}</AppText> : null}

        <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
          Puzzle sync: {puzzleSyncLabel}
        </AppText>
        <AppText tone="muted">
          Puzzle last sync: {puzzleLastSyncLabel}
        </AppText>
        {signedIn && puzzleLastSyncError ? <AppText tone="muted">Puzzle last error: {puzzleLastSyncError}</AppText> : null}
      </AppCard>
    </Screen>
  );
}


