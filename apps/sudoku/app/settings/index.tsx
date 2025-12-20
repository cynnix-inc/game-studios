import React from 'react';

import { AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { usePlayerStore } from '../../src/state/usePlayerStore';

export default function SettingsScreen() {
  const profile = usePlayerStore((s) => s.profile);
  const difficulty = usePlayerStore((s) => s.difficulty);

  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Settings
      </AppText>
      <AppCard>
        <AppText tone="muted">Profile: {profile ? profile.mode : 'none'}</AppText>
        <AppText tone="muted">Difficulty: {difficulty}</AppText>
        <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
          TODO: add toggles (sound, haptics, etc.)
        </AppText>
      </AppCard>
    </Screen>
  );
}


