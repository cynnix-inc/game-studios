import React from 'react';
import { Tabs } from 'expo-router';

import { theme } from '@cynnix-studios/ui';

export default function RootLayout() {
  return (
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
  );
}


