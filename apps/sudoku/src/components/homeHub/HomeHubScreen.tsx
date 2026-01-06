import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { BarChart3, Grid3X3, LogIn, Play, Settings, Trophy, User } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { DailyChallengeCard } from './DailyChallengeCard';
import { MakeButton } from '../make/MakeButton';
import { MakeScreen } from '../make/MakeScreen';
import { MakeText } from '../make/MakeText';
import { usePlayerStore } from '../../state/usePlayerStore';
import { makeThemeCurrent } from '../../theme/makeTheme';

function CenteredGridIcon() {
  const size = 72;
  const pad = 14;
  const inner = size - pad * 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 24,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ position: 'absolute', inset: 0, backgroundColor: makeThemeCurrent.card.background }} />
      <View style={{ position: 'absolute', inset: 0, borderWidth: 1, borderColor: makeThemeCurrent.card.border, borderRadius: 24 }} />
      <Grid3X3 width={inner} height={inner} color={makeThemeCurrent.accent} />
    </View>
  );
}

function TileButton({
  label,
  icon: Icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        const showHover = Platform.OS === 'web' && hovered && !disabled && !state.pressed;

        return [
          {
            width: 56,
            height: 56,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.5 : state.pressed ? 0.88 : 1,
            // Match Make icon tiles: shadow-xl + hover:shadow-2xl + subtle hover scale (web).
            ...(Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOpacity: showHover ? 0.24 : 0.18,
                shadowRadius: showHover ? 18 : 14,
                shadowOffset: { width: 0, height: showHover ? 10 : 8 },
              },
              android: { elevation: showHover ? 10 : 8 },
              web: {
                boxShadow: showHover ? '0 20px 50px rgba(0,0,0,0.25)' : '0 14px 36px rgba(0,0,0,0.20)',
                transform: showHover ? 'scale(1.01)' : 'scale(1)',
                transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 150ms ease',
              },
            }) as unknown as object),
          },
        ];
      }}
    >
      {(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        const showHover = Platform.OS === 'web' && hovered && !disabled && !state.pressed;

        return (
          <View style={Platform.OS === 'web' ? ({ transform: showHover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 200ms ease' } as unknown as object) : null}>
            <Icon width={22} height={22} color={theme.colors.text} />
          </View>
        );
      }}
    </Pressable>
  );
}

export function HomeHubScreen() {
  const profile = usePlayerStore((s) => s.profile);
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const signedIn = profile?.mode === 'supabase';
  const username = signedIn ? profile.displayName ?? profile.email ?? 'Account' : '';

  // Gap policy (this iteration): destinations are visible but disabled.
  const profileEnabled = false;
  const statsEnabled = false;
  // Daily entry point is supported via `/daily`. The separate “DailyChallenges” surface is not.
  const dailyEntryEnabled = true;

  return (
    <MakeScreen
      scroll={false}
      // Match MainMenu container: max-w-4xl, centered, min-h-screen, space-y-4 (md:space-y-6)
      style={{ paddingHorizontal: 16, justifyContent: 'center' }}
    >

      {/* Top-right account control */}
      <View style={{ position: 'absolute', top: isMd ? 32 : 16, right: isMd ? 32 : 16, zIndex: 10 }}>
        {!signedIn ? (
          <MakeButton
            accessibilityLabel="Sign In"
            title={isMd ? 'Sign In' : ''}
            variant="secondary"
            // Legacy route removed; keep this screen non-navigable if it is ever rendered.
            onPress={() => {}}
            leftIcon={<LogIn width={isMd ? 20 : 16} height={isMd ? 20 : 16} color={makeThemeCurrent.text.primary} />}
            contentStyle={{ paddingVertical: isMd ? 12 : 10, paddingHorizontal: isMd ? 14 : 12 }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={username}
            disabled={!profileEnabled}
            onPress={profileEnabled ? () => {} : undefined}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: makeThemeCurrent.card.border,
              backgroundColor: makeThemeCurrent.card.background,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.md,
              opacity: !profileEnabled ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <User width={18} height={18} color={makeThemeCurrent.text.primary} />
              {isMd ? <MakeText weight="semibold">{username}</MakeText> : null}
            </View>
          </Pressable>
        )}
      </View>

      <View style={{ alignSelf: 'center', width: '100%', maxWidth: 896, alignItems: 'center' }}>
          {/* Logo/Title */}
          <View style={{ alignItems: 'center', marginBottom: isMd ? 24 : 16 }}>
            <CenteredGridIcon />

            <MakeText accessibilityRole="header" style={{ fontSize: isMd ? 56 : 32, marginTop: isMd ? 16 : 12 }} weight="bold">
              Ultimate Sudoku
            </MakeText>

            <MakeText tone="muted" style={{ marginTop: isMd ? 8 : 6, fontSize: isMd ? 18 : 16, color: makeThemeCurrent.accent }}>
              {signedIn ? `Welcome back, ${username}!` : 'Master the Classic Puzzle'}
            </MakeText>
          </View>

          {/* Daily featured */}
          <View style={{ width: '100%', maxWidth: 448, paddingHorizontal: 16, marginBottom: isMd ? 24 : 16 }}>
            <DailyChallengeCard
              nowMs={Date.now()}
              status="play"
              streak={0}
              onPlay={() => {}}
              onOpenCalendar={() => {}}
              dailyEntryEnabled={dailyEntryEnabled}
            />
          </View>

          {/* Primary CTA */}
          <View style={{ width: '100%', maxWidth: 448, paddingHorizontal: 16 }}>
            <MakeButton
              accessibilityLabel="Play Game"
              title="Play Game"
              onPress={() => {}}
              leftIcon={<Play width={isMd ? 24 : 20} height={isMd ? 24 : 20} color={makeThemeCurrent.button.textOnPrimary} />}
              contentStyle={{ height: isMd ? 64 : 56 }}
            />
          </View>

          {/* Icon tiles */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: isMd ? 16 : 12, paddingTop: isMd ? 24 : 16 }}>
            <TileButton label="Stats" icon={BarChart3} disabled={!statsEnabled} onPress={statsEnabled ? () => {} : undefined} />
            <TileButton label="Leaderboard" icon={Trophy} onPress={() => {}} />
            <TileButton label="Settings" icon={Settings} onPress={() => {}} />
          </View>

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <MakeText tone="muted" style={{ fontSize: 12 }}>
              Cynnix Studios © 2025
            </MakeText>
          </View>
      </View>
    </MakeScreen>
  );
}


