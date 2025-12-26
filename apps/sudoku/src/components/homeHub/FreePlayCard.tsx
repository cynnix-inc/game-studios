import React from 'react';
import { View } from 'react-native';
import { Play, Sliders } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeButton } from '../make/MakeButton';
import { MakeCard } from '../make/MakeCard';
import { MakeText } from '../make/MakeText';
import { useMakeTheme } from '../make/MakeThemeProvider';

export function FreePlayCard({
  isMd,
  lastDifficultyLabel,
  lastModeLabel,
  hasGameInProgress,
  onSetup,
  onPrimary,
}: {
  isMd: boolean;
  lastDifficultyLabel: string;
  lastModeLabel: string;
  hasGameInProgress: boolean;
  onSetup: () => void;
  onPrimary: () => void;
}) {
  const { theme: makeTheme } = useMakeTheme();

  return (
    <MakeCard style={{ borderRadius: 12 }}>
      <View style={{ padding: isMd ? 16 : 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <LinearGradient
              colors={makeTheme.button.primaryGradient}
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
              <Play width={isMd ? 18 : 16} height={isMd ? 18 : 16} color="#ffffff" />
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <MakeText weight="semibold" style={{ fontSize: isMd ? 16 : 14 }}>
                Free Play
              </MakeText>
              <MakeText tone="secondary" style={{ fontSize: 12 }}>
                {lastDifficultyLabel} • {lastModeLabel}
              </MakeText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MakeButton
              accessibilityLabel="Free Play setup"
              title="Setup"
              variant="secondary"
              elevation="flat"
              radius={10}
              onPress={onSetup}
              leftIcon={<Sliders width={14} height={14} color={makeTheme.text.primary} />}
              contentStyle={{ height: isMd ? 36 : 32, paddingVertical: 0, paddingHorizontal: 10 }}
              titleStyle={{ fontSize: 12, lineHeight: 16 }}
            />

            <MakeButton
              accessibilityLabel={hasGameInProgress ? 'Free Play resume' : 'Free Play play'}
              title={hasGameInProgress ? 'Resume' : 'Play'}
              elevation="flat"
              radius={10}
              onPress={onPrimary}
              contentStyle={{ height: isMd ? 36 : 32, paddingVertical: 0, paddingHorizontal: isMd ? 14 : 12 }}
              titleStyle={{ fontSize: 12, lineHeight: 16 }}
            />
          </View>
        </View>
      </View>
    </MakeCard>
  );
}


