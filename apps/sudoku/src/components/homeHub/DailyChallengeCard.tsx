import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Calendar, CheckCircle, Clock, Flame } from 'lucide-react-native';

import { msUntilNextUtcMidnight } from '@cynnix-studios/sudoku-core';
import { theme } from '@cynnix-studios/ui';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeCard } from '../make/MakeCard';
import { MakeText } from '../make/MakeText';
import { MakeButton } from '../make/MakeButton';
import { makeThemeCurrent } from '../../theme/makeTheme';

function formatCountdown(nowMs: number): string {
  const ms = msUntilNextUtcMidnight(nowMs);
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${hh}h ${mm}m`;
}

export function DailyChallengeCard({
  nowMs,
  onNavigateDaily,
  dailyEntryEnabled,
}: {
  nowMs: number;
  onNavigateDaily: () => void;
  dailyEntryEnabled: boolean;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const timeRemaining = formatCountdown(nowMs);

  // Gap policy: do not invent “completed”, “score”, or “streak” until we can source real values.
  const isCompleted = false;
  const currentStreak = 0;

  const cardDisabled = !dailyEntryEnabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Daily Challenge"
      disabled={cardDisabled}
      onPress={onNavigateDaily}
      style={({ pressed }) => [
        {
          opacity: cardDisabled ? 0.6 : pressed ? 0.92 : 1,
        },
      ]}
    >
      <MakeCard style={{ borderRadius: 12 }}>
        <View style={{ padding: isMd ? 20 : 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isMd ? 12 : 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMd ? 12 : 8, flex: 1 }}>
              <View style={{ width: isMd ? 36 : 32, height: isMd ? 36 : 32 }}>
                <Calendar width={isMd ? 36 : 32} height={isMd ? 36 : 32} color={makeThemeCurrent.accent} />
                <View style={{ position: 'absolute', top: -6, right: -10 }}>
                  <LinearGradient
                    colors={makeThemeCurrent.button.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <MakeText style={{ fontSize: 10 }} weight="bold">
                      DAILY
                    </MakeText>
                  </LinearGradient>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <MakeText style={{ fontSize: isMd ? 18 : 16 }} weight="semibold">
                  Daily Challenge
                </MakeText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock width={isMd ? 16 : 14} height={isMd ? 16 : 14} color={makeThemeCurrent.text.secondary} />
                  <MakeText tone="secondary" style={{ fontSize: isMd ? 14 : 12 }}>
                    Resets in {timeRemaining}
                  </MakeText>
                </View>
              </View>
            </View>

            {currentStreak > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: makeThemeCurrent.card.background,
                  borderWidth: 1,
                  borderColor: makeThemeCurrent.card.border,
                }}
              >
                <Flame width={isMd ? 16 : 14} height={isMd ? 16 : 14} color="#f97316" />
                <MakeText style={{ fontSize: 14 }} weight="semibold">
                  {currentStreak}
                </MakeText>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              {isCompleted ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CheckCircle width={isMd ? 20 : 18} height={isMd ? 20 : 18} color="#22c55e" />
                  <View>
                    <MakeText style={{ fontSize: isMd ? 16 : 14 }} weight="semibold">
                      Completed!
                    </MakeText>
                    <MakeText tone="secondary" style={{ fontSize: isMd ? 14 : 12 }}>
                      View results
                    </MakeText>
                  </View>
                </View>
              ) : (
                <View>
                  <MakeText style={{ fontSize: isMd ? 16 : 14 }}>Ready to play</MakeText>
                  <MakeText tone="secondary" style={{ fontSize: isMd ? 14 : 12 }}>
                    Complete today&apos;s challenge
                  </MakeText>
                </View>
              )}
            </View>

            <MakeButton
              accessibilityLabel="Play Now"
              title={isCompleted ? 'View Results' : 'Play Now'}
              onPress={onNavigateDaily}
              disabled={cardDisabled}
              variant={isCompleted ? 'secondary' : 'primary'}
              contentStyle={{ paddingVertical: isMd ? 10 : 8, paddingHorizontal: isMd ? 16 : 12 }}
            />
          </View>
        </View>
      </MakeCard>
    </Pressable>
  );
}


