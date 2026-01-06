import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Lock, Map } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeCard } from '../make/MakeCard';
import { MakeText } from '../make/MakeText';
import { useMakeTheme } from '../make/MakeThemeProvider';

function DisabledIconButton({
  label,
  icon: Icon,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  color: string;
}) {
  const { theme: makeTheme } = useMakeTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: makeTheme.card.border,
        backgroundColor: makeTheme.card.background,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.5,
      }}
    >
      <Icon width={16} height={16} color={color} />
    </Pressable>
  );
}

export function JourneyCard({ isMd }: { isMd: boolean }) {
  const { theme: makeTheme } = useMakeTheme();
  return (
    <MakeCard style={{ borderRadius: 12, opacity: 0.6 }}>
      <View style={{ padding: isMd ? 16 : 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <LinearGradient
              colors={['#a855f7', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: isMd ? 32 : 28,
                height: isMd ? 32 : 28,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Map width={isMd ? 18 : 16} height={isMd ? 18 : 16} color="#ffffff" />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MakeText weight="semibold" style={{ fontSize: isMd ? 16 : 14 }}>
                  Journey
                </MakeText>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    ...(Platform.OS === 'web'
                      ? ({ background: 'linear-gradient(90deg, #a855f7, #ec4899)' } as unknown as object)
                      : null),
                    backgroundColor: Platform.OS === 'web' ? undefined : '#a855f7',
                    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 18px rgba(0,0,0,0.25)' } as unknown as object) : null),
                  }}
                >
                  <MakeText weight="bold" style={{ fontSize: 10, color: makeTheme.button.textOnPrimary }}>
                    COMING SOON
                  </MakeText>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DisabledIconButton label="Journey map" icon={Map} color={makeTheme.text.primary} />
            <DisabledIconButton label="Journey locked" icon={Lock} color={makeTheme.text.primary} />
          </View>
        </View>
      </View>
    </MakeCard>
  );
}


