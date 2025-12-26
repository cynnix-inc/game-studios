import React from 'react';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Calendar, CalendarDays, CheckCircle, Clock, Flame } from 'lucide-react-native';

import { msUntilNextUtcMidnight } from '@cynnix-studios/sudoku-core';

import { MakeCard } from '../make/MakeCard';
import { MakeText } from '../make/MakeText';
import { MakeButton } from '../make/MakeButton';
import { useMakeTheme } from '../make/MakeThemeProvider';

function formatCountdown(nowMs: number): string {
  const ms = msUntilNextUtcMidnight(nowMs);
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${hh}h ${mm}m`;
}

export function DailyChallengeCard({
  nowMs,
  status,
  streak,
  onPlay,
  onOpenCalendar,
  dailyEntryEnabled,
}: {
  nowMs: number;
  status: 'play' | 'resume' | 'completed';
  streak: number;
  onPlay: () => void;
  onOpenCalendar?: () => void;
  dailyEntryEnabled: boolean;
}) {
  const { width } = useWindowDimensions();
  const isMd = width >= 768;
  const { theme: makeTheme } = useMakeTheme();
  const timeRemaining = formatCountdown(nowMs);

  const cardDisabled = !dailyEntryEnabled;
  const isCompleted = status === 'completed';
  const isResume = status === 'resume';

  function buttonLabel() {
    if (isCompleted) return 'Completed';
    if (isResume) return 'Resume';
    return 'Play';
  }

  return (
    <MakeCard style={{ borderRadius: 12 }}>
      <View style={{ padding: isMd ? 16 : 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: isMd ? 32 : 28, height: isMd ? 32 : 28, position: 'relative' }}>
              <Calendar width={isMd ? 32 : 28} height={isMd ? 32 : 28} color={makeTheme.accent} />
              {streak > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: '#f97316',
                    ...(Platform.OS === 'web' ? ({ boxShadow: '0 10px 18px rgba(0,0,0,0.25)' } as unknown as object) : null),
                  }}
                >
                  <Flame width={10} height={10} color="#ffffff" />
                  <MakeText weight="bold" style={{ fontSize: 10, color: '#ffffff' }}>
                    {streak}
                  </MakeText>
                </View>
              ) : null}
            </View>

            <View style={{ flex: 1 }}>
              <MakeText weight="semibold" style={{ fontSize: isMd ? 16 : 14 }}>
                Daily Challenge
              </MakeText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock width={12} height={12} color={makeTheme.text.secondary} />
                <MakeText tone="secondary" style={{ fontSize: 12 }}>
                  Resets in {timeRemaining}
                </MakeText>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onOpenCalendar ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Daily calendar"
                disabled={cardDisabled}
                onPress={(e) => {
                  // Stop bubbling to any parent pressables (web).
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (e as any)?.stopPropagation?.();
                  onOpenCalendar();
                }}
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: makeTheme.card.border,
                  backgroundColor: makeTheme.card.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: cardDisabled ? 0.5 : pressed ? 0.9 : 1,
                })}
              >
                <CalendarDays width={16} height={16} color={makeTheme.text.primary} />
              </Pressable>
            ) : null}

            <MakeButton
              accessibilityLabel="Daily play"
              title={buttonLabel()}
              onPress={onPlay}
              disabled={cardDisabled || isCompleted}
              variant={isCompleted ? 'secondary' : 'primary'}
              leftIcon={isCompleted ? <CheckCircle width={16} height={16} color={makeTheme.text.primary} /> : undefined}
              contentStyle={{ paddingVertical: isMd ? 10 : 8, paddingHorizontal: isMd ? 14 : 12 }}
            />
          </View>
        </View>
      </View>
    </MakeCard>
  );
}


