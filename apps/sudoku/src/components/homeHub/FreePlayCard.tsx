import React from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
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
  progressPct,
  mistakes,
  hintsUsedCount,
  elapsedLabel,
  onSetup,
  onAbandonAndSetup,
  onPrimary,
}: {
  isMd: boolean;
  lastDifficultyLabel: string;
  lastModeLabel: string;
  hasGameInProgress: boolean;
  progressPct?: number;
  mistakes?: number;
  hintsUsedCount?: number;
  elapsedLabel?: string;
  onSetup: () => void;
  onAbandonAndSetup?: () => void | Promise<void>;
  onPrimary: () => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const [abandonOpen, setAbandonOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const progressClamped = Math.max(0, Math.min(100, Math.round(progressPct ?? 0)));
  const showTooltip = Platform.OS === 'web' && hasGameInProgress && hovered;
  const detailLine = `${progressClamped}% Complete · ${mistakes ?? 0} Mistake${(mistakes ?? 0) === 1 ? '' : 's'} · ${
    hintsUsedCount ?? 0
  } Hint${(hintsUsedCount ?? 0) === 1 ? '' : 's'} · ${elapsedLabel ?? '0:00'}`;

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
              <Play width={isMd ? 18 : 16} height={isMd ? 18 : 16} color={makeTheme.button.textOnPrimary} />
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
              title=""
              variant="secondary"
              elevation="flat"
              radius={10}
              onPress={() => {
                if (hasGameInProgress) {
                  setAbandonOpen(true);
                  return;
                }
                onSetup();
              }}
              leftIcon={<Sliders width={16} height={16} color={makeTheme.text.primary} />}
              contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
            />

            {hasGameInProgress ? (
              <View style={{ position: 'relative' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Free Play resume"
                  onPress={onPrimary}
                  onHoverIn={() => setHovered(true)}
                  onHoverOut={() => setHovered(false)}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    overflow: 'hidden',
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  <LinearGradient
                    colors={makeTheme.button.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Play width={16} height={16} color={makeTheme.button.textOnPrimary} fill={makeTheme.button.textOnPrimary} />
                    <View
                      style={{
                        width: 24,
                        height: 6,
                        borderRadius: 999,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(0,0,0,0.55)',
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.max(10, progressClamped)}%`,
                          height: '100%',
                          minWidth: 6,
                          backgroundColor: '#facc15',
                        }}
                      />
                    </View>
                  </LinearGradient>
                </Pressable>

                {showTooltip ? (
                  <View
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 44,
                      zIndex: 50,
                      width: 220,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: makeTheme.card.border,
                      backgroundColor: makeTheme.card.background,
                      padding: 10,
                      ...(Platform.OS === 'web'
                        ? ({ boxShadow: '0 12px 32px rgba(0,0,0,0.25)' } as unknown as object)
                        : null),
                    }}
                  >
                    <MakeText weight="semibold">Game in Progress</MakeText>
                    <MakeText tone="secondary" style={{ fontSize: 12 }}>
                      {lastDifficultyLabel} • {lastModeLabel}
                    </MakeText>
                    <View style={{ height: 6 }} />
                    <MakeText tone="muted" style={{ fontSize: 12 }}>
                      {detailLine}
                    </MakeText>
                  </View>
                ) : null}
              </View>
            ) : (
              <MakeButton
                accessibilityLabel="Free Play play"
                title=""
                elevation="flat"
                radius={10}
                onPress={onPrimary}
                leftIcon={<Play width={16} height={16} color={makeTheme.button.textOnPrimary} />}
                contentStyle={{ width: 36, height: 36, paddingVertical: 0, paddingHorizontal: 0 }}
              />
            )}
          </View>
        </View>
      </View>

      {/* Abandon confirm */}
      <Modal transparent visible={abandonOpen} animationType="fade" onRequestClose={() => setAbandonOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close abandon dialog"
          onPress={() => setAbandonOpen(false)}
          style={{
            flex: 1,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        >
          <Pressable
            accessibilityRole="none"
            onPress={(e) => {
              const maybe = e as unknown as { stopPropagation?: () => void };
              maybe.stopPropagation?.();
            }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            <MakeCard style={{ borderRadius: 18 }}>
              <View style={{ padding: 16, gap: 12 }}>
                <MakeText weight="bold" style={{ fontSize: 18 }}>
                  Abandon Current Game?
                </MakeText>
                <MakeText tone="secondary">
                  You have a free play game in progress. Starting a new setup will abandon your current game and you'll lose all progress.
                </MakeText>

                <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                  <MakeButton title="Cancel" variant="secondary" elevation="flat" onPress={() => setAbandonOpen(false)} />
                  <MakeButton
                    title="Abandon & Setup"
                    elevation="flat"
                    onPress={async () => {
                      setAbandonOpen(false);
                      await onAbandonAndSetup?.();
                    }}
                    contentStyle={{ backgroundColor: 'rgba(239,68,68,0.40)', borderColor: 'rgba(239,68,68,0.80)' }}
                  />
                </View>
              </View>
            </MakeCard>
          </Pressable>
        </Pressable>
      </Modal>
    </MakeCard>
  );
}


