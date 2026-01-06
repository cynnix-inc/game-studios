import React from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { Play, Sliders } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeButton } from '../make/MakeButton';
import { MakeCard } from '../make/MakeCard';
import { MakeText } from '../make/MakeText';
import { useMakeTheme } from '../make/MakeThemeProvider';
import { MakePrimaryIconProgressButton } from '../make/MakePrimaryIconProgressButton';

export function FreePlayCard({
  isMd,
  lastDifficultyLabel,
  lastModeLabel,
  hasGameInProgress,
  progressPct,
  mistakes,
  hintsUsedCount,
  elapsedLabel,
  hideRunStats,
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
  hideRunStats?: boolean;
  onSetup: () => void;
  onAbandonAndSetup?: () => void | Promise<void>;
  onPrimary: () => void;
}) {
  const { theme: makeTheme } = useMakeTheme();
  const [abandonOpen, setAbandonOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const anchorRef = React.useRef<View>(null);
  const [anchorRect, setAnchorRect] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const progressClamped = Math.max(0, Math.min(100, Math.round(progressPct ?? 0)));
  const showTooltip = Platform.OS === 'web' && hasGameInProgress && hovered;
  const mistakesLabel = `${mistakes ?? 0} Mistake${(mistakes ?? 0) === 1 ? '' : 's'}`;
  const hintsLabel = `${hintsUsedCount ?? 0} Hint${(hintsUsedCount ?? 0) === 1 ? '' : 's'} Used`;
  const elapsed = elapsedLabel ?? '0:00';
  const buttonSize = 36;
  // Make (Radix): TooltipContent is w-fit with modest padding and sideOffset=0.
  // Our tooltip arrow is rendered slightly outside the box; keep the overall gap effectively ~0.
  const tooltipBottomOffset = buttonSize + 5;

  const tooltipRunStats = hideRunStats ? null : (
    <>
      <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
        {mistakesLabel}
      </MakeText>
      <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
        {hintsLabel}
      </MakeText>
      <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
        Time Elapsed: {elapsed}
      </MakeText>
    </>
  );

  const [portalFn, setPortalFn] = React.useState<((children: React.ReactNode, container: Element) => React.ReactPortal) | null>(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    void (async () => {
      try {
        // Web-only: avoid pulling react-dom into native bundles.
        const rd = (await import('react-dom')) as unknown as {
          createPortal?: (children: React.ReactNode, container: Element) => React.ReactPortal;
        };
        if (cancelled) return;
        setPortalFn(typeof rd?.createPortal === 'function' ? rd.createPortal : null);
      } catch {
        if (cancelled) return;
        setPortalFn(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const measureAnchor = React.useCallback(() => {
    if (Platform.OS !== 'web') return;
    const node = anchorRef.current as unknown as { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void };
    if (!node?.measureInWindow) return;
    node.measureInWindow((x, y, width, height) => {
      setAnchorRect({ x, y, width, height });
    });
  }, []);

  React.useEffect(() => {
    if (!showTooltip) return;
    // Measure after hover renders to ensure layout is stable.
    requestAnimationFrame(() => measureAnchor());
  }, [showTooltip, measureAnchor]);

  return (
    // Allow overflow so hover tooltip can escape the card bounds (Make parity).
    <MakeCard style={{ borderRadius: 12, overflow: 'visible' }}>
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
              <View ref={anchorRef} collapsable={false} style={{ position: 'relative' }}>
                <MakePrimaryIconProgressButton
                  accessibilityLabel="Free Play resume"
                  onPress={onPrimary}
                  onHoverIn={() => {
                    setHovered(true);
                    requestAnimationFrame(() => measureAnchor());
                  }}
                  onHoverOut={() => setHovered(false)}
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
                </MakePrimaryIconProgressButton>

                {showTooltip ? (
                  // Make uses Radix Tooltip Portal, so it never gets clipped and always layers above cards.
                  portalFn && typeof document !== 'undefined' && anchorRect
                    ? portalFn(
                        <View
                          pointerEvents="none"
                          style={{
                            // RN style types don't include `position: 'fixed'`; apply it web-only via a cast.
                            position: 'absolute',
                            left: anchorRect.x + anchorRect.width / 2,
                            top: anchorRect.y - 2,
                            zIndex: 2147483647,
                            // Prevent crazy long lines while still feeling like w-fit.
                            maxWidth: 320,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: makeTheme.card.border,
                            backgroundColor: makeTheme.card.background,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            ...(Platform.OS === 'web'
                              ? ({
                                  position: 'fixed',
                                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                  backdropFilter: 'blur(24px)',
                                  WebkitBackdropFilter: 'blur(24px)',
                                  transform: 'translate(-50%, -100%)',
                                  // Make tooltip is w-fit (web-only)
                                  width: 'fit-content',
                                } as unknown as object)
                              : null),
                          }}
                        >
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -5,
                              width: 10,
                              height: 10,
                              backgroundColor: makeTheme.card.background,
                              borderRightWidth: 1,
                              borderBottomWidth: 1,
                              borderColor: makeTheme.card.border,
                              ...(Platform.OS === 'web'
                                ? ({
                                    backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    left: '50%',
                                    transform: 'translateX(-50%) rotate(45deg)',
                                  } as unknown as object)
                                : null),
                            }}
                          />

                          <MakeText style={{ fontSize: 14, lineHeight: 18 }}>Game in Progress</MakeText>
                          <View style={{ height: 4 }} />
                          <View style={{ gap: 2 }}>
                            <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
                              {lastDifficultyLabel} • {lastModeLabel}
                            </MakeText>
                            <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
                              {progressClamped}% Complete
                            </MakeText>
                            {tooltipRunStats}
                          </View>
                        </View>,
                        document.body,
                      )
                    : // Fallback (no portal): still render above button inside card; may clip in some stacking contexts.
                      (
                        <View
                          pointerEvents="none"
                          style={{
                            position: 'absolute',
                            bottom: tooltipBottomOffset,
                            zIndex: 9999,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: makeTheme.card.border,
                            backgroundColor: makeTheme.card.background,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            ...(Platform.OS === 'web'
                              ? ({
                                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                                  backdropFilter: 'blur(24px)',
                                  WebkitBackdropFilter: 'blur(24px)',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  // Make tooltip is w-fit (web-only)
                                  width: 'fit-content',
                                  maxWidth: 320,
                                } as unknown as object)
                              : null),
                          }}
                        >
                          <View
                            style={{
                              position: 'absolute',
                              bottom: -5,
                              width: 10,
                              height: 10,
                              backgroundColor: makeTheme.card.background,
                              borderRightWidth: 1,
                              borderBottomWidth: 1,
                              borderColor: makeTheme.card.border,
                              ...(Platform.OS === 'web'
                                ? ({
                                    backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    left: '50%',
                                    transform: 'translateX(-50%) rotate(45deg)',
                                  } as unknown as object)
                                : null),
                            }}
                          />
                          <MakeText style={{ fontSize: 14, lineHeight: 18 }}>Game in Progress</MakeText>
                          <View style={{ height: 4 }} />
                          <View style={{ gap: 2 }}>
                            <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
                              {lastDifficultyLabel} • {lastModeLabel}
                            </MakeText>
                            <MakeText tone="secondary" style={{ fontSize: 12, lineHeight: 16 }}>
                              {progressClamped}% Complete
                            </MakeText>
                            {tooltipRunStats}
                          </View>
                        </View>
                      )
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


