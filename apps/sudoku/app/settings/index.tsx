import React from 'react';

import { AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { usePlayerStore } from '../../src/state/usePlayerStore';
import { useSettingsStore } from '../../src/state/useSettingsStore';

export default function SettingsScreen() {
  const profile = usePlayerStore((s) => s.profile);
  const difficulty = usePlayerStore((s) => s.difficulty);
  const syncStatus = useSettingsStore((s) => s.syncStatus);
  const lastSyncAtMs = useSettingsStore((s) => s.lastSyncAtMs);
  const lastError = useSettingsStore((s) => s.lastError);

  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Settings
      </AppText>
      <AppCard>
        <AppText tone="muted">Profile: {profile ? profile.mode : 'none'}</AppText>
        <AppText tone="muted">Difficulty: {difficulty}</AppText>
        <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
          Cloud sync: {syncStatus}
        </AppText>
        <AppText tone="muted">
          Last sync: {lastSyncAtMs ? new Date(lastSyncAtMs).toLocaleString() : 'never'}
        </AppText>
        {lastError ? <AppText tone="muted">Last error: {lastError}</AppText> : null}
        <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
          TODO: add toggles (sound, haptics, etc.)
        </AppText>
      </AppCard>
    </Screen>
  );
}


