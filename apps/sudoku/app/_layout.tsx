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

function readMinLoadingMs(): number {
  const raw = process.env.EXPO_PUBLIC_ULTIMATE_LOADING_MIN_MS;
  // Product requirement: always show the loading/splash screen for ~2s
  // (unless we need longer for real work like pack downloads/updates).
  if (!raw) return 2000;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 2000;
  return Math.max(0, Math.min(30_000, Math.floor(n)));
}

export default function RootLayout() {
  const [boot, setBoot] = React.useState<{ status: 'loading' | 'ready'; message: string; progress01: number | null }>(() => ({
    status: 'loading',
    message: 'Starting…',
    progress01: 0,
  }));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const startedAt = Date.now();
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

      // Optional: keep the loading screen visible long enough to see animations / progress.
      // Default is 0ms (no artificial delay).
      // Set `EXPO_PUBLIC_ULTIMATE_LOADING_MIN_MS` in local dev if desired.
      // Skip in visual snapshot runs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isVisual = typeof globalThis !== 'undefined' && (globalThis as any).__VISUAL_TEST__ === true;
      const minMs = isVisual ? 0 : readMinLoadingMs();
      if (minMs > 0) {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, minMs - elapsed);
        if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      }

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


