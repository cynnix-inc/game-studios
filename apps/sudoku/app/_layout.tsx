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

export default function RootLayout() {
  useEffect(() => {
    void (async () => {
      const deviceId = await getOrCreateDeviceId();
      usePlayerStore.getState().setDeviceId(deviceId);
      await loadLocalSettings();
      void syncSettingsOnce();
      await loadLocalStats();
      void syncStatsOnce();
      void initFreePlayPacks();
      warmDailyCacheInBackground();
      void trackEvent({ name: 'app_open' });
    })();
  }, []);

  return (
    <>
      <AuthBootstrap />
      <MakeThemeProvider>
        <Stack
          screenOptions={{
            // Design-faithful container: no app chrome unless the design shows it.
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
        </Stack>
      </MakeThemeProvider>
    </>
  );
}


