import React from 'react';
import { View } from 'react-native';
import { ArrowLeft, LogOut, Mail, User } from 'lucide-react-native';

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

export function UltimateProfileScreen({ profile, onBack }: { profile: PlayerProfile | null; onBack: () => void }) {
  const { theme: makeTheme } = useMakeTheme();
  const setProfile = usePlayerStore((s) => s.setProfile);
  const name = displayName(profile);

  const signedIn = profile?.mode === 'supabase';

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

        <MakeCard style={{ marginBottom: 16 }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 1,
                    borderColor: makeTheme.card.border,
                    backgroundColor: makeTheme.card.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User width={28} height={28} color={makeTheme.text.primary} />
                </View>
                <View>
                  <MakeText weight="bold" style={{ fontSize: 20 }}>
                    {name}
                  </MakeText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Mail width={14} height={14} color={makeTheme.text.muted} />
                    <MakeText tone="secondary">{signedIn ? profile.email ?? '—' : 'Signed out'}</MakeText>
                  </View>
                </View>
              </View>
            </View>

            <MakeText tone="secondary">
              This screen is present in the redesign. Profile editing/badges/activity are not yet mapped to backend data; those sections are deferred.
            </MakeText>
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


