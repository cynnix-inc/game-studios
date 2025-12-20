import React from 'react';
import { Platform, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { signInApple, signInGoogle, signInGoogleWeb } from '../../src/services/auth';
import { usePlayerStore } from '../../src/state/usePlayerStore';

export default function AuthScreen() {
  const profile = usePlayerStore((s) => s.profile);
  const continueAsGuest = usePlayerStore((s) => s.continueAsGuest);

  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Sign in
      </AppText>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <AppText tone="muted">
          Signed in as: {profile ? (profile.mode === 'guest' ? profile.displayName : profile.email ?? profile.userId) : '—'}
        </AppText>

        <AppButton
          title="Sign in with Apple"
          onPress={async () => {
            if (Platform.OS === 'web') {
              // Apple web OAuth is possible but requires configuration; keep this button visible as requested.
              // TODO: wire Apple OAuth on web if desired.
              return;
            }
            await signInApple();
          }}
        />

        <AppButton
          title="Sign in with Google"
          onPress={async () => {
            if (Platform.OS === 'web') {
              const redirectTo = window.location.origin;
              await signInGoogleWeb(redirectTo);
              return;
            }
            await signInGoogle();
          }}
          variant="secondary"
        />

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm }} />

        <AppButton title="Continue as Guest" onPress={continueAsGuest} variant="secondary" />
      </AppCard>
    </Screen>
  );
}


