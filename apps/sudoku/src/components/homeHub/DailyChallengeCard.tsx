import React from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Calendar, CalendarDays, CheckCircle, Clock, Flame, Play } from 'lucide-react-native';

import { msUntilNextUtcMidnight } from '@cynnix-studios/sudoku-core';

import { MakeCard } from '../make/MakeCard';
import { MakeButton } from '../make/MakeButton';
import { MakePrimaryIconProgressButton } from '../make/MakePrimaryIconProgressButton';
import { MakeText } from '../make/MakeText';
import { useMakeTheme } from '../make/MakeThemeProvider';

function formatCountdown(nowMs: number): string {
  const ms = msUntilNextUtcMidnight(nowMs);
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${hh}h ${mm}m`;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  const expanded =
    h.length === 3
      ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
      : h.length === 6
        ? h
        : null;
  if (!expanded) return `rgba(0,0,0,${alpha})`;
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
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

  const actionIcon = isCompleted ? (
    <CheckCircle width={16} height={16} color={makeTheme.text.primary} />
  ) : (
    <Play width={16} height={16} color={makeTheme.button.textOnPrimary} fill={isResume ? makeTheme.button.textOnPrimary : 'transparent'} />
  );

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
              <MakeButton
                accessibilityLabel="Daily calendar"
                title=""
                variant="secondary"
                elevation="flat"
                radius={10}
                disabled={cardDisabled}
                onPress={(e) => {
                  // Stop bubbling to any parent pressables (web).
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (e as any)?.stopPropagation?.();
                  onOpenCalendar();
                }}
                leftIcon={<CalendarDays width={16} height={16} color={makeTheme.text.primary} />}
                contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
              />
            ) : null}

            {isCompleted ? (
              <MakeButton
                accessibilityLabel="Daily completed"
                title=""
                variant="secondary"
                elevation="flat"
                radius={10}
                disabled
                onPress={() => {}}
                leftIcon={actionIcon}
                contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
              />
            ) : (
              <MakePrimaryIconProgressButton
                accessibilityLabel={isResume ? 'Daily resume' : 'Daily play'}
                disabled={cardDisabled}
                onPress={(e) => {
                  // Stop bubbling to any parent pressables (web).
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (e as any)?.stopPropagation?.();
                  onPlay();
                }}
              >
                {actionIcon}
                {isResume ? (
                  <View
                    style={{
                      width: 32,
                      height: 2,
                      borderRadius: 999,
                      overflow: 'hidden',
                      backgroundColor: rgbaFromHex(makeTheme.button.textOnPrimary, 0.2),
                    }}
                  >
                    <View style={{ width: '66%', height: '100%', backgroundColor: makeTheme.button.textOnPrimary, opacity: 0.8 }} />
                  </View>
                ) : null}
              </MakePrimaryIconProgressButton>
            )}
          </View>
        </View>
      </View>
    </MakeCard>
  );
}


