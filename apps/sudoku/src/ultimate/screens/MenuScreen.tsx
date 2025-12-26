import React from 'react';
import { Animated, Easing, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { BarChart3, LogIn, Settings, Trophy, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@cynnix-studios/ui';
import { nowUtcDateKey } from '@cynnix-studios/sudoku-core';

import { DailyChallengeCard } from '../../components/homeHub/DailyChallengeCard';
import { FreePlayCard } from '../../components/homeHub/FreePlayCard';
import { JourneyCard } from '../../components/homeHub/JourneyCard';
import { MakeButton } from '../../components/make/MakeButton';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import type { PlayerProfile } from '@cynnix-studios/game-foundation';
import { readDailyCompletionIndex } from '../../services/dailyCompletion';
import { loadLocalSave, readLocalInProgressSave } from '../../services/saves';
import { usePlayerStore } from '../../state/usePlayerStore';
import type { UltimateScreen } from '../navigation/UltimateNavState';
import { SudokuLogoMark } from '../components/SudokuLogoMark';

function capitalizeDifficulty(d: string): string {
  const lower = d.toLowerCase();
  if (lower === 'novice') return 'Novice';
  if (lower === 'skilled') return 'Skilled';
  if (lower === 'advanced') return 'Advanced';
  if (lower === 'expert') return 'Expert';
  if (lower === 'fiendish') return 'Fiendish';
  if (lower === 'ultimate') return 'Ultimate';
  return d;
}

function TileButton({
  label,
  icon: Icon,
  iconColor,
  onPress,
  disabled,
  isMd,
}: {
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  isMd: boolean;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const size = isMd ? 56 : 48;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={(state) => {
        const hovered =
          Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
        return {
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
                boxShadow: hovered ? '0 18px 44px rgba(0,0,0,0.25)' : '0 12px 32px rgba(0,0,0,0.20)',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 150ms ease',
              } as unknown as object)
            : null),
        };
      }}
    >
      <Icon width={isMd ? 24 : 22} height={isMd ? 24 : 22} color={iconColor ?? makeTheme.text.primary} />
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
  onResumeFreePlay,
  onStartDailyToday,
  onResumeDailyFromSave,
}: {
  profile: PlayerProfile | null;
  nowMs: number;
  onNavigate: (screen: UltimateScreen) => void;
  onShowAuth: () => void;
  onResumeFreePlay: () => void;
  onStartDailyToday: () => Promise<void>;
  onResumeDailyFromSave: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const isLg = width >= 1024;
  const { theme: makeTheme, reducedMotion } = useMakeTheme();

  const signedIn = profile?.mode === 'supabase';
  const username = usernameFromProfile(profile);

  const profileEnabled = signedIn;
  const statsEnabled = true;
  const dailyEntryEnabled = true;

  const [dailyStatus, setDailyStatus] = React.useState<'play' | 'resume' | 'completed'>('play');
  const [dailyStreak, setDailyStreak] = React.useState(0);
  const [freeLastDifficulty, setFreeLastDifficulty] = React.useState('Medium');
  const [freeLastMode, setFreeLastMode] = React.useState('Classic');
  const [freeHasInProgress, setFreeHasInProgress] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [saved, completion] = await Promise.all([readLocalInProgressSave(), readDailyCompletionIndex()]);
        if (cancelled) return;

        const todayKey = nowUtcDateKey(nowMs);
        const completed = Boolean(completion.byDateKey[todayKey]);
        const dailyResume = Boolean(saved && saved.mode === 'daily' && saved.dailyDateKey === todayKey && saved.runStatus !== 'completed');

        setDailyStatus(completed ? 'completed' : dailyResume ? 'resume' : 'play');
        // Gap policy: streak isn't modeled yet; keep at 0 (hidden).
        setDailyStreak(0);

        if (saved && saved.mode === 'free' && saved.runStatus !== 'completed') {
          setFreeHasInProgress(true);
          setFreeLastDifficulty(capitalizeDifficulty(saved.difficulty));
          setFreeLastMode('Classic');
        } else {
          setFreeHasInProgress(false);
          setFreeLastDifficulty('Medium');
          setFreeLastMode('Classic');
        }
      } catch {
        // Best-effort; never crash home.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nowMs]);

  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
      if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, shimmer]);
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-320, 320] });

  // Match Make vertical rhythm:
  // - root: space-y-6 (24) / md:space-y-8 (32), py-8 (32)
  // - logo block: space-y-3 (12)
  const sectionGap = isMd ? 32 : 24;
  const logoGap = 12;
  const titleSize = isLg ? 60 : isMd ? 48 : 30; // Make: text-3xl / md:text-5xl / lg:text-6xl

  return (
    <MakeScreen scroll={false} style={{ paddingHorizontal: 16, paddingVertical: 32, justifyContent: 'center' }}>
      {/* Profile button - Top Right (only when authenticated) */}
      {signedIn ? (
        <View style={{ position: 'absolute', top: isMd ? 24 : 16, right: isMd ? 24 : 16, zIndex: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={username}
            disabled={!profileEnabled}
            onPress={profileEnabled ? () => onNavigate('profile') : undefined}
            style={(state) => {
              const hovered =
                Platform.OS === 'web' && 'hovered' in state ? Boolean((state as unknown as { hovered?: boolean }).hovered) : false;
              return {
                borderWidth: 1,
                borderColor: makeTheme.card.border,
                backgroundColor: makeTheme.card.background,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.md,
                opacity: !profileEnabled ? 0.5 : state.pressed ? 0.85 : 1,
                ...(Platform.OS === 'web'
                  ? ({
                      boxShadow: hovered ? '0 18px 44px rgba(0,0,0,0.25)' : '0 12px 32px rgba(0,0,0,0.20)',
                      transition: 'box-shadow 200ms ease, opacity 150ms ease',
                    } as unknown as object)
                  : null),
              };
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <User width={18} height={18} color={makeTheme.text.primary} />
              {isMd ? <MakeText weight="semibold">{username}</MakeText> : null}
            </View>
          </Pressable>
        </View>
      ) : null}

      <View style={{ alignSelf: 'center', width: '100%', maxWidth: 896, alignItems: 'center', gap: sectionGap }}>
        {/* Logo/Title */}
        <View style={{ alignItems: 'center', gap: logoGap }}>
          <View style={{ alignItems: 'center' }}>
            <SudokuLogoMark size="md" animated darkMode={false} isMd={isMd} />
          </View>

          <MakeText accessibilityRole="header" style={{ fontSize: titleSize }} weight="bold">
            Ultimate Sudoku
          </MakeText>

          <MakeText tone="secondary" style={{ fontSize: isMd ? 16 : 14, color: makeTheme.text.secondary }}>
            Daily puzzles. Endless possibilities.
          </MakeText>
        </View>

        {/* Game Mode Cards - Stacked */}
        <View style={{ width: '100%', maxWidth: 448, gap: 12 }}>
          <DailyChallengeCard
            nowMs={nowMs}
            status={dailyStatus}
            streak={dailyStreak}
            dailyEntryEnabled={dailyEntryEnabled}
            onOpenCalendar={() => onNavigate('dailyChallenges')}
            onPlay={() => {
              if (dailyStatus === 'resume') {
                void onResumeDailyFromSave();
                return;
              }
              void onStartDailyToday();
            }}
          />

          <FreePlayCard
            isMd={isMd}
            lastDifficultyLabel={freeLastDifficulty}
            lastModeLabel={freeLastMode}
            hasGameInProgress={freeHasInProgress}
            onSetup={() => onNavigate('difficulty')}
            onPrimary={() => {
              if (freeHasInProgress) {
                void (async () => {
                  await loadLocalSave();
                  // Saves are hydrated as paused; "Resume" should immediately resume the run.
                  usePlayerStore.getState().resumeRun();
                  onResumeFreePlay();
                })();
                return;
              }
              onNavigate('difficulty');
            }}
          />

          <JourneyCard isMd={isMd} />

          {/* Sign In Button - Make has mt-2 (8px) after Journey */}
          {!signedIn ? (
            <View style={{ overflow: 'hidden', borderRadius: 12, marginTop: 8 }}>
              <MakeButton
                accessibilityLabel="Sign In"
                title="Sign In to Track Progress"
                variant="secondary"
                elevation="flat"
                radius={12}
                onPress={onShowAuth}
                leftIcon={<LogIn width={isMd ? 18 : 16} height={isMd ? 18 : 16} color={makeTheme.text.primary} />}
                contentStyle={{ height: isMd ? 48 : 40, paddingVertical: 0, paddingHorizontal: 14 }}
                titleStyle={{ fontSize: isMd ? 13 : 12, lineHeight: 16 }}
              />
              {!reducedMotion ? (
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: 160,
                    transform: [{ translateX: shimmerX }],
                    opacity: 0.9,
                    pointerEvents: 'none',
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.20)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              ) : null}
            </View>
          ) : null}

          {/* Icon-only tiles (Make: pt-2, gap-3) */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
            <TileButton
              label="Stats"
              icon={BarChart3}
              iconColor="#22d3ee"
              isMd={isMd}
              disabled={!statsEnabled}
              onPress={statsEnabled ? () => onNavigate('stats') : undefined}
            />
            <TileButton label="Leaderboard" icon={Trophy} iconColor="#fbbf24" isMd={isMd} onPress={() => onNavigate('leaderboard')} />
            <TileButton label="Settings" icon={Settings} isMd={isMd} onPress={() => onNavigate('settings')} />
          </View>
        </View>

        {/* Footer (Make: text-sm) */}
        <View style={{ alignItems: 'center' }}>
          <MakeText tone="muted" style={{ fontSize: 14 }}>
            Cynnix Studios © 2025
          </MakeText>
        </View>
      </View>
    </MakeScreen>
  );
}


