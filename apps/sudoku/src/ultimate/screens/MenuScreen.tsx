import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { BarChart3, Grid3X3, LogIn, Play, Settings, Trophy, User } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { DailyChallengeCard } from '../../components/homeHub/DailyChallengeCard';
import { MakeButton } from '../../components/make/MakeButton';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import type { UltimateScreen } from '../navigation/UltimateNavState';

function CenteredGridIcon() {
  const { theme: makeTheme } = useMakeTheme();
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
      <View style={{ position: 'absolute', inset: 0, backgroundColor: makeTheme.card.background }} />
      <View style={{ position: 'absolute', inset: 0, borderWidth: 1, borderColor: makeTheme.card.border, borderRadius: 24 }} />
      <Grid3X3 width={inner} height={inner} color={makeTheme.accent} />
    </View>
  );
}

function TileButton({
  label,
  icon: Icon,
  onPress,
  disabled,
  isMd,
}: {
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  onPress?: () => void;
  disabled?: boolean;
  isMd: boolean;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const size = isMd ? 64 : 56;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={(state) => ({
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: makeTheme.card.border,
        backgroundColor: makeTheme.card.background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : state.pressed ? 0.85 : 1,
        ...(Platform.OS === 'web'
          ? ({
              boxShadow: state.hovered ? '0 18px 44px rgba(0,0,0,0.25)' : '0 12px 32px rgba(0,0,0,0.20)',
              transform: state.hovered ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 150ms ease',
            } as unknown as object)
          : null),
      })}
    >
      <Icon width={isMd ? 24 : 22} height={isMd ? 24 : 22} color={makeTheme.text.primary} />
    </Pressable>
  );
}

function usernameFromProfile(profile: PlayerProfile | null): string {
  if (!profile) return '';
  if (profile.mode !== 'supabase') return '';
  return profile.displayName ?? profile.email ?? 'Account';
}

export function UltimateMenuScreen({
  profile,
  nowMs,
  onNavigate,
  onShowAuth,
}: {
  profile: PlayerProfile | null;
  nowMs: number;
  onNavigate: (screen: UltimateScreen) => void;
  onShowAuth: () => void;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const { theme: makeTheme } = useMakeTheme();

  const signedIn = profile?.mode === 'supabase';
  const username = usernameFromProfile(profile);

  // Gap policy: Stats/Profile are present in the Make design, but not fully wired yet.
  // We will implement them later in this todo and keep them disabled until then.
  const profileEnabled = false;
  const statsEnabled = false;

  // Daily entry point is supported via DailyChallenges surface.
  const dailyEntryEnabled = true;

  return (
    <MakeScreen scroll={false} style={{ paddingHorizontal: 16, justifyContent: 'center' }}>
      {/* Top-right account control */}
      <View style={{ position: 'absolute', top: isMd ? 32 : 16, right: isMd ? 32 : 16, zIndex: 10 }}>
        {!signedIn ? (
          <MakeButton
            accessibilityLabel="Sign In"
            title={isMd ? 'Sign In' : ''}
            variant="secondary"
            onPress={onShowAuth}
            leftIcon={<LogIn width={isMd ? 20 : 16} height={isMd ? 20 : 16} color={makeTheme.text.primary} />}
            contentStyle={{ paddingVertical: isMd ? 12 : 10, paddingHorizontal: isMd ? 14 : 12 }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={username}
            disabled={!profileEnabled}
            onPress={profileEnabled ? () => onNavigate('profile') : undefined}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: makeTheme.card.border,
              backgroundColor: makeTheme.card.background,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.md,
              opacity: !profileEnabled ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <User width={18} height={18} color={makeTheme.text.primary} />
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

          <MakeText tone="muted" style={{ marginTop: isMd ? 8 : 6, fontSize: isMd ? 18 : 16, color: makeTheme.accent }}>
            {signedIn ? `Welcome back, ${username}!` : 'Master the Classic Puzzle'}
          </MakeText>
        </View>

        {/* Daily featured */}
        <View style={{ width: '100%', maxWidth: 448, paddingHorizontal: 16, marginBottom: isMd ? 24 : 16 }}>
          <DailyChallengeCard nowMs={nowMs} onNavigateDaily={() => onNavigate('dailyChallenges')} dailyEntryEnabled={dailyEntryEnabled} />
        </View>

        {/* Primary CTA */}
        <View style={{ width: '100%', maxWidth: 448, paddingHorizontal: 16 }}>
          <MakeButton
            accessibilityLabel="Play Game"
            title="Play Game"
            onPress={() => onNavigate('game')}
            leftIcon={<Play width={isMd ? 24 : 20} height={isMd ? 24 : 20} color={makeTheme.button.textOnPrimary} />}
            contentStyle={{ height: isMd ? 64 : 56 }}
          />
        </View>

        {/* Icon tiles */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: isMd ? 16 : 12, paddingTop: isMd ? 24 : 16 }}>
          <TileButton
            label="Stats"
            icon={BarChart3}
            isMd={isMd}
            disabled={!statsEnabled}
            onPress={statsEnabled ? () => onNavigate('stats') : undefined}
          />
          <TileButton label="Leaderboard" icon={Trophy} isMd={isMd} onPress={() => onNavigate('leaderboard')} />
          <TileButton label="Settings" icon={Settings} isMd={isMd} onPress={() => onNavigate('settings')} />
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


