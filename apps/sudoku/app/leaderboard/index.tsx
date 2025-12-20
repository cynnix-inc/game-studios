import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { getTop50, type LeaderboardEntry, type LeaderboardMode } from '../../src/services/leaderboard';

function Board({ mode }: { mode: LeaderboardMode }) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    void (async () => {
      setRows(await getTop50(mode));
    })();
  }, [mode]);

  return (
    <AppCard style={{ marginBottom: theme.spacing.md }}>
      <AppText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
        {mode === 'time_ms' ? 'Fastest Times' : 'Fewest Mistakes'}
      </AppText>
      {rows.map((r) => (
        <View
          key={`${mode}-${r.rank}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 6,
            borderTopWidth: r.rank === 1 ? 0 : 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <AppText tone="muted">
            {r.rank}. {r.displayName}
          </AppText>
          <AppText>{mode === 'time_ms' ? `${Math.round(r.value / 1000)}s` : r.value}</AppText>
        </View>
      ))}
    </AppCard>
  );
}

export default function LeaderboardScreen() {
  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Leaderboard
      </AppText>
      <Board mode="time_ms" />
      <Board mode="mistakes" />
      <AppText tone="muted" style={{ marginTop: theme.spacing.md }}>
        TODO: replace mock data with Supabase queries once configured.
      </AppText>
    </Screen>
  );
}


