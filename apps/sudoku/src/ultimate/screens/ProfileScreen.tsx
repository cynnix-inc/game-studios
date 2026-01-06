import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, Calendar, Edit, LogOut, Mail, Target, Trophy } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';
import type { PlayerProfile } from '@cynnix-studios/game-foundation';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { signOutAll } from '../../services/auth';
import { usePlayerStore } from '../../state/usePlayerStore';

function displayName(profile: PlayerProfile | null): string {
  if (!profile) return 'Guest';
  if (profile.mode === 'guest') return profile.displayName;
  return profile.displayName ?? profile.email ?? 'Account';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export function UltimateProfileScreen({ profile, onBack }: { profile: PlayerProfile | null; onBack: () => void }) {
  const { theme: makeTheme } = useMakeTheme();
  const setProfile = usePlayerStore((s) => s.setProfile);
  const name = displayName(profile);

  const signedIn = profile?.mode === 'supabase';

  const userStats = [
    { label: 'Total Wins', value: '104', icon: Trophy },
    { label: 'Games Played', value: '156', icon: Target },
    { label: 'Member Since', value: '2024', icon: Calendar },
  ] as const;

  const badges = [
    { name: 'First Victory', color: '#3b82f6' },
    { name: 'Century Club', color: '#a855f7' },
    { name: 'Elite Player', color: '#eab308' },
    { name: 'Marathon Runner', color: '#22c55e' },
  ] as const;

  const activity = [
    { game: 'Daily Challenge', result: 'Completed', score: '1,250', time: '2 hours ago' },
    { game: 'Classic (Hard)', result: 'Completed', score: '980', time: '5 hours ago' },
    { game: 'Classic (Expert)', result: 'In progress', score: '—', time: '1 day ago' },
  ] as const;

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: '100%', maxWidth: 896, alignSelf: 'center' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
          variant="secondary"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />

        <MakeText weight="bold" style={{ fontSize: 32, marginTop: 12, marginBottom: 16 }}>
          Profile
        </MakeText>

        {/* Profile header */}
        <MakeCard style={{ marginBottom: 16, borderRadius: 18 }}>
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 2,
                    borderColor: makeTheme.card.border,
                    backgroundColor: makeTheme.card.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MakeText weight="bold" style={{ fontSize: 22 }}>
                    {initials(name)}
                  </MakeText>
                </View>

                <View style={{ flex: 1 }}>
                  <MakeText weight="bold" style={{ fontSize: 22 }} numberOfLines={1}>
                    {name}
                  </MakeText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Mail width={14} height={14} color={makeTheme.text.muted} />
                    <MakeText tone="secondary" numberOfLines={1}>
                      {signedIn ? profile?.email ?? '—' : 'Signed out'}
                    </MakeText>
                  </View>
                </View>
              </View>

              <MakeButton title="Edit Profile" variant="secondary" disabled leftIcon={<Edit width={18} height={18} color={makeTheme.text.primary} />} />
            </View>

            <MakeText tone="muted" style={{ fontSize: 12 }}>
              UI-only placeholders until profile contracts are finalized.
            </MakeText>
          </View>
        </MakeCard>

        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {userStats.map(({ label, value, icon: Icon }) => (
            <MakeCard key={label} style={{ borderRadius: 18, width: '31%' as unknown as number }}>
              <View style={{ padding: 14, gap: 8, alignItems: 'center' }}>
                <Icon width={22} height={22} color={makeTheme.accent} />
                <MakeText weight="bold" style={{ fontSize: 20 }}>
                  {value}
                </MakeText>
                <MakeText tone="muted" style={{ fontSize: 12, textAlign: 'center' }}>
                  {label}
                </MakeText>
              </View>
            </MakeCard>
          ))}
        </View>

        {/* Badges */}
        <MakeCard style={{ borderRadius: 18, marginBottom: 16 }}>
          <View style={{ padding: 16, gap: 10 }}>
            <MakeText weight="semibold" style={{ fontSize: 18 }}>
              Badges
            </MakeText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {badges.map((b) => (
                <View
                  key={b.name}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: b.color,
                  }}
                >
                  <MakeText style={{ color: '#ffffff', fontSize: 12 }} weight="semibold">
                    {b.name}
                  </MakeText>
                </View>
              ))}
            </View>
          </View>
        </MakeCard>

        {/* Recent activity */}
        <MakeCard style={{ borderRadius: 18, marginBottom: 16 }}>
          <View style={{ padding: 16, gap: 10 }}>
            <MakeText weight="semibold" style={{ fontSize: 18 }}>
              Recent Activity
            </MakeText>
            <View style={{ gap: 10 }}>
              {activity.map((a) => (
                <View
                  key={`${a.game}-${a.time}`}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: makeTheme.card.border,
                    backgroundColor: makeTheme.card.background,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <MakeText weight="semibold" numberOfLines={1}>
                      {a.game}
                    </MakeText>
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      {a.time}
                    </MakeText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <MakeText tone="secondary" style={{ fontSize: 12 }}>
                      {a.result}
                    </MakeText>
                    <MakeText weight="semibold">{a.score}</MakeText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </MakeCard>

        <MakeButton
          title={signedIn ? 'Sign Out' : 'Signed out'}
          variant="secondary"
          disabled={!signedIn}
          onPress={async () => {
            if (!signedIn) return;
            try {
              await signOutAll();
            } finally {
              setProfile(null);
            }
          }}
          leftIcon={<LogOut width={18} height={18} color={makeTheme.text.primary} />}
        />

        <View style={{ height: theme.spacing.lg }} />
      </View>
    </MakeScreen>
  );
}


