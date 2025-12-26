import React from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { Apple, Chrome, X } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { usePlayerStore } from '../../state/usePlayerStore';
import { signInApple, signInGoogle, signInGoogleWeb } from '../../services/auth';
import { getSessionUser } from '../../services/auth';
import { computeNextProfileFromSession } from '../../services/authBootstrapLogic';
import { trackEvent } from '../../services/telemetry';

export function UltimateAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const [loading, setLoading] = React.useState<'none' | 'apple' | 'google'>('none');
  const [error, setError] = React.useState<string | null>(null);

  if (!open) return null;

  async function syncProfileAndClose() {
    // Supabase session propagation can be async across platforms; do a short bounded retry
    // so the home UI reliably flips to the authenticated state right after sign-in.
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const user = await getSessionUser();
        if (user) {
          usePlayerStore.getState().setProfile(
            computeNextProfileFromSession({
              user: { id: user.id, email: user.email ?? null },
            }),
          );
          onClose();
          return;
        }
      } catch {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    // If session isn't available yet, still close the modal; AuthBootstrap will reconcile shortly.
    onClose();
  }

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close auth modal"
        onPress={loading === 'none' ? onClose : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.50)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Pressable
          accessibilityRole="none"
          onPress={() => {}}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <MakeCard style={{ borderRadius: 24 }}>
            <View style={{ padding: 18 }}>
              <View style={{ position: 'relative', alignItems: 'center', paddingBottom: 12 }}>
                <MakeText style={{ fontSize: 22 }} weight="bold">
                  Welcome
                </MakeText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={loading === 'none' ? onClose : undefined}
                  style={{ position: 'absolute', right: 0, top: 0, padding: 6, opacity: loading === 'none' ? 1 : 0.6 }}
                >
                  <X width={22} height={22} color={makeTheme.text.muted} />
                </Pressable>
              </View>

              {error ? (
                <MakeText tone="muted" style={{ color: '#ff5a6b', marginBottom: theme.spacing.sm }}>
                  {error}
                </MakeText>
              ) : null}

              {/* Provider buttons */}
              <View style={{ gap: 10 }}>
                <MakeButton
                  accessibilityLabel="Continue with Apple"
                  title={Platform.OS === 'web' ? 'Apple sign-in (iOS only)' : loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
                  disabled={Platform.OS === 'web' || loading !== 'none'}
                  onPress={async () => {
                    setError(null);
                    setLoading('apple');
                    try {
                      if (Platform.OS === 'web') return;
                      await signInApple();
                      void trackEvent({ name: 'sign_in_success', props: { provider: 'apple' } });
                      await syncProfileAndClose();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setLoading('none');
                    }
                  }}
                  leftIcon={<Apple width={18} height={18} color={makeTheme.button.textOnPrimary} />}
                />

                <MakeButton
                  accessibilityLabel="Continue with Google"
                  title={loading === 'google' ? 'Signing in…' : 'Continue with Google'}
                  variant="secondary"
                  disabled={loading !== 'none'}
                  onPress={async () => {
                    setError(null);
                    setLoading('google');
                    if (Platform.OS === 'web') {
                      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
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
                      await syncProfileAndClose();
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setLoading('none');
                    }
                  }}
                  leftIcon={<Chrome width={18} height={18} color={makeTheme.text.primary} />}
                />
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: makeTheme.card.border, marginVertical: 14 }} />

              {/* Email UI (design present, backend contract unknown) */}
              <MakeText tone="muted" style={{ marginBottom: 8 }}>
                Or continue with email (disabled)
              </MakeText>
              <View style={{ gap: 10, opacity: 0.6 }}>
                <View>
                  <MakeText tone="secondary" style={{ marginBottom: 6 }}>
                    Username
                  </MakeText>
                  <TextInput
                    editable={false}
                    placeholder="Enter your username"
                    placeholderTextColor={makeTheme.text.muted}
                    style={{
                      borderWidth: 1,
                      borderColor: makeTheme.card.border,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: makeTheme.text.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <View>
                  <MakeText tone="secondary" style={{ marginBottom: 6 }}>
                    Password
                  </MakeText>
                  <TextInput
                    editable={false}
                    placeholder="Enter your password"
                    placeholderTextColor={makeTheme.text.muted}
                    style={{
                      borderWidth: 1,
                      borderColor: makeTheme.card.border,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: makeTheme.text.primary,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <MakeButton title="Sign In" disabled onPress={() => {}} />
              </View>
            </View>
          </MakeCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


