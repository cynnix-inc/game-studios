import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, Award, Clock, Target, TrendingUp, Trophy } from 'lucide-react-native';

import { theme } from '@cynnix-studios/ui';

import { MakeButton } from '../../components/make/MakeButton';
import { MakeCard } from '../../components/make/MakeCard';
import { MakeScreen } from '../../components/make/MakeScreen';
import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import type { PlayerProfile } from '@cynnix-studios/game-foundation';

function usernameFromProfile(profile: PlayerProfile | null): string {
  if (!profile) return '';
  if (profile.mode === 'supabase') return profile.displayName ?? profile.email ?? 'Account';
  return profile.displayName;
}

export function UltimateStatsScreen({ profile, onBack }: { profile: PlayerProfile | null; onBack: () => void }) {
  const { theme: makeTheme } = useMakeTheme();
  const username = usernameFromProfile(profile);

  return (
    <MakeScreen style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: '100%', maxWidth: 1024, alignSelf: 'center' }}>
        <MakeButton
          accessibilityLabel="Back"
          title="Back"
          variant="secondary"
          onPress={onBack}
          leftIcon={<ArrowLeft width={18} height={18} color={makeTheme.text.primary} />}
          contentStyle={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />

        <MakeText weight="bold" style={{ fontSize: 32, marginTop: 12, marginBottom: 16 }}>
          {username ? `${username}’s Stats` : 'Your Stats'}
        </MakeText>

        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Award width={20} height={20} color={makeTheme.accent} />
              <MakeText weight="semibold" style={{ fontSize: 18 }}>
                Stats (UI only)
              </MakeText>
            </View>

            <MakeText tone="secondary">
              This screen is present in the redesign, but most metrics are not yet mapped to a stable data contract. Values below are disabled placeholders.
            </MakeText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {[
                { label: 'Puzzles Solved', icon: Target },
                { label: 'Total Score', icon: Trophy },
                { label: 'Play Time', icon: Clock },
                { label: 'Completion Rate', icon: TrendingUp },
              ].map(({ label, icon: Icon }) => (
                <View
                  key={label}
                  style={{
                    width: '48%',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: makeTheme.card.border,
                    backgroundColor: makeTheme.card.background,
                    padding: 14,
                    opacity: 0.6,
                  }}
                >
                  <Icon width={20} height={20} color={makeTheme.text.muted} />
                  <MakeText weight="bold" style={{ fontSize: 20, marginTop: 8 }}>
                    —
                  </MakeText>
                  <MakeText tone="muted" style={{ fontSize: 12 }}>
                    {label}
                  </MakeText>
                </View>
              ))}
            </View>
          </View>
        </MakeCard>

        <MakeText tone="muted" style={{ fontSize: 12 }}>
          Logged as a Figma→Code gap: stats data contract.
        </MakeText>
        <View style={{ height: theme.spacing.lg }} />
      </View>
    </MakeScreen>
  );
}


