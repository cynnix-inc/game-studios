import React from 'react';
import { Switch, View } from 'react-native';

import { theme } from '@cynnix-studios/ui';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { useSettingsStore } from '../../src/state/useSettingsStore';
import { Slider } from '../../src/components/Slider';
import { SudokuSizingPreview } from '../../src/components/SudokuSizingPreview';
import { getSettingsToggles, getUiSizingSettings, setSettingsToggles, setUiSizingSettings, UI_SIZING_LIMITS } from '../../src/services/settingsModel';
import { updateLocalSettings } from '../../src/services/settings';
import { MakeCard } from '../../src/components/make/MakeCard';
import { MakeScreen } from '../../src/components/make/MakeScreen';
import { MakeText } from '../../src/components/make/MakeText';

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
      <MakeScreen>
        <MakeText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
          Settings
        </MakeText>
        <MakeCard>
          <MakeText tone="muted">Loading…</MakeText>
        </MakeCard>
      </MakeScreen>
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
    <MakeScreen>
      <MakeText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Settings
      </MakeText>

      <MakeCard style={{ marginBottom: theme.spacing.md }}>
        <MakeText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          UI sizing
        </MakeText>

        <View style={{ marginBottom: theme.spacing.md }}>
          <SudokuSizingPreview
            gridSize={sizing.gridSize}
            numberFontScale={sizing.numberFontScale}
            noteFontScale={sizing.noteFontScale}
          />
        </View>

        <View style={{ marginBottom: theme.spacing.md }}>
          <MakeText style={{ marginBottom: theme.spacing.xs }}>
            Grid size: {Math.round(sizing.gridSize)} px
          </MakeText>
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
          <MakeText style={{ marginBottom: theme.spacing.xs }}>
            Primary number size: {sizing.numberFontScale.toFixed(2)}×
          </MakeText>
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
          <MakeText style={{ marginBottom: theme.spacing.xs }}>
            Note size: {sizing.noteFontScale.toFixed(2)}×
          </MakeText>
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
      </MakeCard>

      <MakeCard>
        <MakeText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Toggles
        </MakeText>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <MakeText>Sound</MakeText>
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
          <MakeText>Haptics</MakeText>
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

        <MakeText tone="muted">Profile: {profile ? profile.mode : 'none'}</MakeText>
        <MakeText tone="muted">Difficulty: {difficulty}</MakeText>
        <MakeText tone="muted" style={{ marginTop: theme.spacing.md }}>
          Cloud sync: {cloudSyncLabel}
        </MakeText>
        <MakeText tone="muted">
          Last sync: {cloudLastSyncLabel}
        </MakeText>
        {signedIn && lastError ? <MakeText tone="muted">Last error: {lastError}</MakeText> : null}

        <MakeText tone="muted" style={{ marginTop: theme.spacing.md }}>
          Puzzle sync: {puzzleSyncLabel}
        </MakeText>
        <MakeText tone="muted">
          Puzzle last sync: {puzzleLastSyncLabel}
        </MakeText>
        {signedIn && puzzleLastSyncError ? <MakeText tone="muted">Puzzle last error: {puzzleLastSyncError}</MakeText> : null}
      </MakeCard>
    </MakeScreen>
  );
}


