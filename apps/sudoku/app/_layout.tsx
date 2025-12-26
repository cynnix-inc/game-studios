import React, { useEffect } from 'react';
import { Stack } from 'expo-router';

import { AuthBootstrap } from '../src/bootstrap/AuthBootstrap';
import { MakeThemeProvider } from '../src/components/make/MakeThemeProvider';
import { getOrCreateDeviceId } from '../src/services/deviceId';
import { initFreePlayPacks } from '../src/services/freeplayPacks';
import { warmDailyCacheInBackground } from '../src/services/daily';
import { loadLocalSettings, syncSettingsOnce } from '../src/services/settings';
import { loadLocalStats, syncStatsOnce } from '../src/services/stats';
import { trackEvent } from '../src/services/telemetry';
import { usePlayerStore } from '../src/state/usePlayerStore';
import { UltimateLoadingScreen } from '../src/ultimate/screens/LoadingScreen';

export default function RootLayout() {
  const [boot, setBoot] = React.useState<{ status: 'loading' | 'ready'; message: string; progress01: number | null }>(() => ({
    status: 'loading',
    message: 'Starting…',
    progress01: 0,
  }));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const steps: Array<{ message: string; run: () => Promise<void> | void }> = [
        {
          message: 'Preparing device…',
          run: async () => {
            const deviceId = await getOrCreateDeviceId();
            usePlayerStore.getState().setDeviceId(deviceId);
          },
        },
        { message: 'Loading settings…', run: () => loadLocalSettings() },
        { message: 'Loading stats…', run: () => loadLocalStats() },
        {
          message: 'Loading free play packs…',
          run: async () => {
            // Local-only init is awaited; remote refresh runs in background.
            await initFreePlayPacks();
          },
        },
        {
          message: 'Warming daily cache…',
          run: () => warmDailyCacheInBackground(),
        },
      ];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!;
        if (cancelled) return;
        setBoot({ status: 'loading', message: step.message, progress01: steps.length ? i / steps.length : null });
        await step.run();
      }

      // Best-effort background sync (auth-dependent); keep UI responsive.
      void syncSettingsOnce();
      void syncStatsOnce();
      void trackEvent({ name: 'app_open' });

      if (cancelled) return;
      setBoot({ status: 'ready', message: 'Ready', progress01: 1 });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <AuthBootstrap />
      <MakeThemeProvider>
        {boot.status !== 'ready' ? (
          <UltimateLoadingScreen message={boot.message} progress01={boot.progress01} />
        ) : (
          <Stack
            screenOptions={{
              // Design-faithful container: no app chrome unless the design shows it.
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="game/index" />
            <Stack.Screen name="daily/index" />
            <Stack.Screen name="leaderboard/index" />
          </Stack>
        )}
      </MakeThemeProvider>
    </>
  );
}


