import React from 'react';
import { Platform, View } from 'react-native';

import { AppButton, AppCard, AppText, Screen, theme } from '@cynnix-studios/ui';

import { signInApple, signInGoogle, signInGoogleWeb } from '../../src/services/auth';
import { trackEvent } from '../../src/services/telemetry';
import { usePlayerStore } from '../../src/state/usePlayerStore';

export default function AuthScreen() {
  const profile = usePlayerStore((s) => s.profile);
  const continueAsGuest = usePlayerStore((s) => s.continueAsGuest);
  const [loading, setLoading] = React.useState<'none' | 'apple' | 'google' | 'guest'>('none');
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Screen>
      <AppText style={{ fontSize: theme.fontSize.xl, marginBottom: theme.spacing.lg }} weight="bold">
        Sign in
      </AppText>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <AppText tone="muted">
          Signed in as: {profile ? (profile.mode === 'guest' ? profile.displayName : profile.email ?? profile.userId) : '—'}
        </AppText>

        {error ? (
          <AppText tone="muted" style={{ color: theme.colors.danger }}>
            {error}
          </AppText>
        ) : null}

        <AppButton
          title={Platform.OS === 'web' ? 'Apple sign-in (iOS only)' : loading === 'apple' ? 'Signing in…' : 'Sign in with Apple'}
          disabled={Platform.OS === 'web' || loading !== 'none'}
          style={
            Platform.OS === 'web' || loading !== 'none'
              ? {
                  opacity: 0.6,
                }
              : undefined
          }
          onPress={async () => {
            setError(null);
            setLoading('apple');
            try {
              if (Platform.OS === 'web') return;
              await signInApple();
              void trackEvent({ name: 'sign_in_success', props: { provider: 'apple' } });
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setLoading('none');
            }
          }}
        />

        <AppButton
          title={loading === 'google' ? 'Signing in…' : 'Sign in with Google'}
          disabled={loading !== 'none'}
          style={
            loading !== 'none'
              ? {
                  opacity: 0.6,
                }
              : undefined
          }
          onPress={async () => {
            setError(null);
            setLoading('google');
            if (Platform.OS === 'web') {
              // Use a stable in-app callback route on web so the session is detected in-url
              // and we land back on the Auth screen after the OAuth redirect.
              const redirectTo = new URL('/auth', window.location.origin).toString();
              try {
                await signInGoogleWeb(redirectTo);
                void trackEvent({ name: 'sign_in_success', props: { provider: 'google' } });
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
                setLoading('none');
              }
              return;
            }
            try {
              await signInGoogle();
              void trackEvent({ name: 'sign_in_success', props: { provider: 'google' } });
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setLoading('none');
            }
          }}
          variant="secondary"
        />

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm }} />

        <AppButton
          title={loading === 'guest' ? 'Continuing…' : 'Continue as Guest'}
          onPress={() => {
            setError(null);
            setLoading('guest');
            try {
              continueAsGuest();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setLoading('none');
            }
          }}
          disabled={loading !== 'none'}
          style={
            loading !== 'none'
              ? {
                  opacity: 0.6,
                }
              : undefined
          }
          variant="secondary"
        />
      </AppCard>
    </Screen>
  );
}


