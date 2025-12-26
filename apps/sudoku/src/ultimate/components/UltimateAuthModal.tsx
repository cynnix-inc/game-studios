import React from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { Apple, Chrome, X } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { signInApple, signInGoogle, signInGoogleWeb } from '../../services/auth';
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
  const [activeTab, setActiveTab] = React.useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Match Make: max-w-md (448px)
  const cardMaxWidth = 448;
  const headerPad = 24;
  const contentPad = 24;
  const sectionGap = 24;
  const providerGap = 12;
  const tabHeight = 48;
  const buttonHeight = 48; // Make: h-12
  const inputHeight = 36; // Make Input default: h-9
  const inputRadius = 8; // Make: rounded-md (approx)

  const inputBg = makeTheme.button.secondaryBackground;
  const inputBorder = makeTheme.card.border;

  const emailEnabled = false; // Backend contract: Apple/Google only today.
  const emailDisabledReason = 'Email sign-in is not available yet.';

  // Web: allow Esc to close the auth modal when idle.
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (loading !== 'none') return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loading, onClose, open]);

  if (!open) return null;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close auth modal"
        onPress={loading === 'none' ? onClose : undefined}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.50)',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as unknown as object) : null),
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(e) => {
            // RN web: prevent the outer overlay from receiving the click.
            const maybe = e as unknown as { stopPropagation?: () => void };
            maybe.stopPropagation?.();
          }}
          style={{ width: '100%', maxWidth: cardMaxWidth }}
        >
          <MakeCard style={{ borderRadius: 24 }}>
            {/* Header */}
            <View
              style={{
                position: 'relative',
                padding: headerPad,
                borderBottomWidth: 1,
                borderBottomColor: makeTheme.card.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MakeText style={{ fontSize: 22 }} weight="bold">
                Welcome
              </MakeText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={loading === 'none' ? onClose : undefined}
                style={({ pressed }) => ({
                  position: 'absolute',
                  top: headerPad,
                  right: headerPad,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading === 'none' ? (pressed ? 0.75 : 1) : 0.6,
                })}
              >
                <X width={24} height={24} color={makeTheme.text.muted} />
              </Pressable>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: makeTheme.card.border }}>
              {(['signin', 'signup'] as const).map((tab) => {
                const selected = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityLabel={tab === 'signin' ? 'Sign In tab' : 'Sign Up tab'}
                    accessibilityState={{ selected }}
                    onPress={() => setActiveTab(tab)}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: tabHeight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: pressed ? 0.9 : 1,
                      ...(Platform.OS === 'web'
                        ? ({
                            transition: 'opacity 150ms ease',
                          } as unknown as object)
                        : null),
                    })}
                  >
                    <MakeText tone={selected ? 'secondary' : 'muted'} weight={selected ? 'semibold' : 'regular'}>
                      {tab === 'signin' ? 'Sign In' : 'Sign Up'}
                    </MakeText>
                  </Pressable>
                );
              })}
            </View>

              {error ? (
                <MakeText tone="muted" style={{ color: '#ff5a6b', marginBottom: theme.spacing.sm }}>
                  {error}
                </MakeText>
              ) : null}

            {/* Content */}
            <View style={{ padding: contentPad, gap: sectionGap }}>
              {error ? (
                <MakeText tone="muted" style={{ color: '#ff5a6b' }}>
                  {error}
                </MakeText>
              ) : null}

              {/* Provider buttons */}
              <View style={{ gap: providerGap }}>
                <MakeButton
                  accessibilityLabel="Continue with Apple"
                  title={loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
                  disabled={Platform.OS === 'web' || loading !== 'none'}
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
                  leftIcon={<Apple width={20} height={20} color={makeTheme.button.textOnPrimary} />}
                  radius={8}
                  elevation="flat"
                  contentStyle={{ height: buttonHeight, paddingVertical: 0, paddingHorizontal: 18 }}
                  titleStyle={{ lineHeight: 18 }}
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
                    } catch (e) {
                      setError(e instanceof Error ? e.message : String(e));
                    } finally {
                      setLoading('none');
                    }
                  }}
                  leftIcon={<Chrome width={20} height={20} color={makeTheme.text.primary} />}
                  radius={8}
                  elevation="flat"
                  contentStyle={{ height: buttonHeight, paddingVertical: 0, paddingHorizontal: 18 }}
                  titleStyle={{ lineHeight: 18, color: makeTheme.button.textOnSecondary }}
                />
              </View>

              {/* Divider (Make: line with centered label) */}
              <View style={{ position: 'relative', height: 20, justifyContent: 'center' }}>
                <View style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: makeTheme.card.border }} />
                <View style={{ alignSelf: 'center', paddingHorizontal: 16, backgroundColor: makeTheme.card.background }}>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    Or continue with email
                  </MakeText>
                </View>
              </View>

              {/* Email form (design present; disabled until backend exists) */}
              <View style={{ gap: 16, opacity: emailEnabled ? 1 : 0.6 }}>
                {!emailEnabled ? (
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    {emailDisabledReason}
                  </MakeText>
                ) : null}

                <View style={{ gap: 8 }}>
                  <MakeText tone="secondary">Username</MakeText>
                  <TextInput
                    editable={emailEnabled && loading === 'none'}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter your username"
                    placeholderTextColor={makeTheme.text.muted}
                    style={{
                      height: inputHeight,
                      borderWidth: 1,
                      borderColor: inputBorder,
                      backgroundColor: inputBg,
                      color: makeTheme.text.primary,
                      borderRadius: inputRadius,
                      paddingHorizontal: 12,
                      paddingVertical: 0,
                    }}
                  />
                </View>

                <View style={{ gap: 8 }}>
                  <MakeText tone="secondary">Password</MakeText>
                  <TextInput
                    editable={emailEnabled && loading === 'none'}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={makeTheme.text.muted}
                    secureTextEntry
                    style={{
                      height: inputHeight,
                      borderWidth: 1,
                      borderColor: inputBorder,
                      backgroundColor: inputBg,
                      color: makeTheme.text.primary,
                      borderRadius: inputRadius,
                      paddingHorizontal: 12,
                      paddingVertical: 0,
                    }}
                  />
                </View>

                <MakeButton
                  title={activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                  disabled={!emailEnabled || loading !== 'none'}
                  onPress={() => {
                    setError(emailDisabledReason);
                  }}
                  radius={8}
                  elevation="flat"
                  contentStyle={{ height: buttonHeight, paddingVertical: 0, paddingHorizontal: 18 }}
                  titleStyle={{ lineHeight: 18 }}
                />
              </View>
            </View>
          </MakeCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


