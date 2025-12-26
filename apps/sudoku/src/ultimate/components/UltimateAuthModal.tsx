import React from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Loader2, Mail, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { signInApple, signInGoogle, signInGoogleWeb } from '../../services/auth';
import { trackEvent } from '../../services/telemetry';

function AppleLogo({ size = 20 }: { size?: number }) {
  // Official-ish Apple glyph (from latest Make AuthModal snapshot)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  // Google "G" 4-color mark (from latest Make AuthModal snapshot)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function UltimateAuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { theme: makeTheme, resolvedThemeType } = useMakeTheme();
  const [loading, setLoading] = React.useState<'none' | 'apple' | 'google' | 'email'>('none');
  const [error, setError] = React.useState<string>('');
  const [email, setEmail] = React.useState('');
  const [magicLinkSent] = React.useState(false);

  // Match Make: max-w-md (448px)
  const cardMaxWidth = 448;
  const padX = 24;
  const padY = 24;
  const sectionGap = 24;
  const providerGap = 12;
  const buttonHeight = 48; // Make: h-12
  const inputHeight = 48; // Latest Make AuthModal: input is h-12
  const inputRadius = 8; // Make: rounded-md (approx)

  // Make ThemeContext: inputs differ from button secondary background (notably light theme).
  const inputBg =
    resolvedThemeType === 'light'
      ? 'rgba(255,255,255,0.60)'
      : resolvedThemeType === 'dark'
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.10)';
  const inputBorder = makeTheme.card.border;

  const emailEnabled = false; // Backend contract: magic link not implemented yet.
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

  const isLoading = loading !== 'none';

  const closeIfIdle = () => {
    if (isLoading) return;
    onClose();
  };

  // Latest Make has a "magic link sent" success view; keep structure, but we won't reach it until email is enabled.
  if (magicLinkSent) {
    return (
      <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close auth modal"
          onPress={closeIfIdle}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.50)',
            ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as unknown as object) : null),
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          {Platform.OS !== 'web' ? <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} /> : null}
          <View style={{ width: '100%', maxWidth: cardMaxWidth }}>
            <MakeCard style={{ borderRadius: 24 }}>
              <View style={{ paddingHorizontal: padX, paddingVertical: 32, alignItems: 'center', gap: 24 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    overflow: 'hidden',
                  }}
                >
                  <MakeButton
                    title=""
                    accessibilityLabel="Email sent"
                    disabled
                    contentStyle={{
                      width: 64,
                      height: 64,
                      paddingHorizontal: 0,
                      paddingVertical: 0,
                    }}
                    leftIcon={<Mail width={32} height={32} color={makeTheme.button.textOnPrimary} />}
                  />
                </View>

                <View style={{ alignItems: 'center', gap: 8 }}>
                  <MakeText weight="semibold" style={{ fontSize: 18 }}>
                    Check your email
                  </MakeText>
                  <MakeText tone="secondary" style={{ textAlign: 'center' }}>
                    We&apos;ve sent a magic link to <MakeText weight="semibold">{email}</MakeText>
                  </MakeText>
                  <MakeText tone="muted" style={{ fontSize: 12, textAlign: 'center' }}>
                    Click the link in the email to sign in instantly.
                  </MakeText>
                </View>

                <MakeButton
                  title="Close"
                  variant="secondary"
                  elevation="flat"
                  radius={12}
                  disabled={isLoading}
                  onPress={closeIfIdle}
                  contentStyle={{ height: buttonHeight, paddingVertical: 0, paddingHorizontal: 18 }}
                  titleStyle={{ lineHeight: 18 }}
                />
              </View>
            </MakeCard>
          </View>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close auth modal"
        onPress={closeIfIdle}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.50)',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as unknown as object) : null),
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Native: approximate Make's backdrop blur (web uses CSS backdrop-filter above). */}
        {Platform.OS !== 'web' ? <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} /> : null}

        <Pressable
          accessibilityRole="none"
          onPress={(e) => {
            // RN web: prevent the outer overlay from receiving the click.
            const maybe = e as unknown as { stopPropagation?: () => void };
            maybe.stopPropagation?.();
          }}
          style={{ width: '100%', maxWidth: cardMaxWidth }}
        >
          <MakeCard
            style={[
              { borderRadius: 24 },
              // Make parity: shadow-2xl for modal cards.
              Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOpacity: 0.28,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 14 },
                },
                android: { elevation: 14 },
                web: {
                  boxShadow: '0 28px 80px rgba(0,0,0,0.45)',
                } as unknown as object,
              }),
            ]}
          >
            {/* Header */}
            <View
              style={{
                position: 'relative',
                paddingHorizontal: padX,
                paddingVertical: padY,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={closeIfIdle}
                disabled={isLoading}
                style={(state) => {
                  const hovered =
                    Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
                  return {
                    position: 'absolute',
                    top: padY,
                    right: padX,
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      Platform.OS === 'web' && hovered
                        ? makeTheme.card.background
                        : state.pressed
                          ? 'rgba(255,255,255,0.08)'
                          : 'transparent',
                    opacity: isLoading ? 0.5 : 1,
                    ...(Platform.OS === 'web'
                      ? ({
                          transition: 'background-color 150ms ease, opacity 150ms ease',
                        } as unknown as object)
                      : null),
                  };
                }}
              >
                <X width={20} height={20} color={makeTheme.text.muted} />
              </Pressable>

              <View style={{ alignItems: 'center', gap: 8 }}>
                {/* Make: h2 defaults to text-xl, font-weight-medium */}
                <MakeText weight="medium" style={{ fontSize: 20, lineHeight: 30, textAlign: 'center' }}>
                  Welcome to Ultimate Sudoku
                </MakeText>
                {/* Make: p defaults to text-base */}
                <MakeText tone="secondary" style={{ fontSize: 16, lineHeight: 24, textAlign: 'center' }}>
                  Save progress • Track stats • Compete globally
                </MakeText>
              </View>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: padX, paddingBottom: padY, gap: sectionGap }}>
              {/* Error Message (Make: red tint box) */}
              {error ? (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: 'rgba(239,68,68,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.20)',
                  }}
                >
                  <MakeText style={{ fontSize: 14, lineHeight: 21 }}>{error}</MakeText>
                </View>
              ) : null}

              {/* Provider buttons */}
              <View style={{ gap: providerGap }}>
                {/* Apple Sign In - Outline Style (Make: white bg, black border) */}
                <MakeButton
                  accessibilityLabel="Sign in with Apple"
                  title={isLoading ? 'Signing in…' : 'Sign in with Apple'}
                  variant="secondary"
                  elevation="flat"
                  radius={12}
                  disabled={Platform.OS === 'web' || isLoading}
                  onPress={async () => {
                    setError('');
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
                  leftIcon={
                    isLoading ? (
                      <Loader2 width={20} height={20} color="#000000" />
                    ) : (
                      <AppleLogo size={20} />
                    )
                  }
                  contentStyle={{
                    height: buttonHeight,
                    paddingVertical: 0,
                    paddingHorizontal: 18,
                    backgroundColor: '#ffffff',
                    borderColor: '#000000',
                    borderWidth: 2,
                  }}
                  titleStyle={{ fontSize: 16, lineHeight: 24, color: '#000000' }}
                />

                {/* Google Sign In - Standard light style */}
                <MakeButton
                  accessibilityLabel="Sign in with Google"
                  title={isLoading ? 'Signing in…' : 'Sign in with Google'}
                  variant="secondary"
                  elevation="flat"
                  radius={12}
                  disabled={isLoading}
                  onPress={async () => {
                    setError('');
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
                  leftIcon={
                    isLoading ? (
                      <Loader2 width={20} height={20} color="#374151" />
                    ) : (
                      <GoogleLogo size={20} />
                    )
                  }
                  contentStyle={{
                    height: buttonHeight,
                    paddingVertical: 0,
                    paddingHorizontal: 18,
                    backgroundColor: '#ffffff',
                    borderColor: '#d1d5db',
                    borderWidth: 1,
                  }}
                  titleStyle={{ fontSize: 16, lineHeight: 24, color: '#374151' }}
                />
              </View>

              {/* Divider (Make: line with centered label) */}
              <View style={{ position: 'relative', height: 20, justifyContent: 'center' }}>
                <View style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: makeTheme.card.border }} />
                <View style={{ alignSelf: 'center', paddingHorizontal: 16, backgroundColor: makeTheme.card.background }}>
                  <MakeText tone="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                    or use email
                  </MakeText>
                </View>
              </View>

              {/* Email Section (Make: magic link) — UI matches, but disabled until backend exists */}
              <View style={{ gap: 12, opacity: emailEnabled ? 1 : 0.75 }}>
                <View style={{ gap: 8 }}>
                  <MakeText tone="secondary" weight="medium" style={{ fontSize: 16, lineHeight: 24 }}>
                    Email
                  </MakeText>
                  <TextInput
                    editable={emailEnabled && !isLoading}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={makeTheme.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                  title={isLoading && loading === 'email' ? 'Sending...' : 'Send Magic Link'}
                  disabled={!emailEnabled || isLoading}
                  onPress={() => {
                    // Keep the UI deterministic: until backend supports it, show a consistent message.
                    setError(emailDisabledReason);
                  }}
                  elevation="flat"
                  radius={12}
                  leftIcon={
                    isLoading && loading === 'email' ? (
                      <Loader2 width={18} height={18} color={makeTheme.button.textOnPrimary} />
                    ) : (
                      <Mail width={18} height={18} color={makeTheme.button.textOnPrimary} />
                    )
                  }
                  contentStyle={{ height: buttonHeight, paddingVertical: 0, paddingHorizontal: 18 }}
                  titleStyle={{ fontSize: 16, lineHeight: 24 }}
                />
              </View>

              {/* Footer (Make) */}
              <View>
                <MakeText tone="muted" style={{ fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
                  By signing in, you agree to our{' '}
                  <MakeText tone="secondary" style={{ textDecorationLine: 'underline' }}>
                    Terms
                  </MakeText>
                  {' & '}
                  <MakeText tone="secondary" style={{ textDecorationLine: 'underline' }}>
                    Privacy
                  </MakeText>
                </MakeText>
              </View>
            </View>
          </MakeCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


