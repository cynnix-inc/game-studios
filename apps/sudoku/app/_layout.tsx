import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';

import { theme } from '@cynnix-studios/ui';

import { AuthBootstrap } from '../src/bootstrap/AuthBootstrap';
import { getOrCreateDeviceId } from '../src/services/deviceId';
import { loadLocalSettings, syncSettingsOnce } from '../src/services/settings';
import { usePlayerStore } from '../src/state/usePlayerStore';

export default function RootLayout() {
  useEffect(() => {
    void (async () => {
      const deviceId = await getOrCreateDeviceId();
      usePlayerStore.getState().setDeviceId(deviceId);
      await loadLocalSettings();
      void syncSettingsOnce();
    })();
  }, []);

  return (
    <>
      <AuthBootstrap />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          tabBarStyle: { backgroundColor: theme.colors.surface },
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.muted,
        }}
      >
        <Tabs.Screen name="game/index" options={{ title: 'Game' }} />
        <Tabs.Screen name="daily/index" options={{ title: 'Daily' }} />
        <Tabs.Screen name="leaderboard/index" options={{ title: 'Leaderboard' }} />
        <Tabs.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Tabs.Screen name="auth/index" options={{ title: 'Auth' }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </>
  );
}


