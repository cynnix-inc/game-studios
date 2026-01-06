import React from 'react';
import { Animated, Easing, Platform, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { MakeText } from '../../components/make/MakeText';
import { useMakeTheme } from '../../components/make/MakeThemeProvider';
import { SudokuLogoMark } from '../components/SudokuLogoMark';

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function useFadeIn({
  reducedMotion,
  delayMs,
  durationMs,
}: {
  reducedMotion: boolean | null;
  delayMs: number;
  durationMs: number;
}) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const duration = reducedMotion ? 0 : durationMs;
    const delay = reducedMotion ? 0 : delayMs;
    Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [delayMs, durationMs, reducedMotion, v]);
  return v;
}

export function UltimateLoadingScreen({
  message = 'Loading your puzzle...',
  progress01,
}: {
  message?: string;
  /**
   * Optional progress in the range [0..1].
   * Intended hook point for pack downloads / updates.
   */
  progress01?: number | null;
}) {
  const { reducedMotion } = useMakeTheme();
  const { width } = useWindowDimensions();
  const isMd = width >= 768;

  const pct = progress01 == null ? null : clamp01(progress01);

  // Make-like staged fade-ins
  const logoOpacity = useFadeIn({ reducedMotion, delayMs: 0, durationMs: 300 });
  const titleOpacity = useFadeIn({ reducedMotion, delayMs: 400, durationMs: 800 });
  const barOpacity = useFadeIn({ reducedMotion, delayMs: 800, durationMs: 600 });
  const textOpacity = useFadeIn({ reducedMotion, delayMs: 1000, durationMs: 600 });

  // Smooth progress animation towards the provided pct
  const target = pct == null ? 0 : pct;
  const progressAnim = React.useRef(new Animated.Value(target)).current;
  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: target,
      duration: reducedMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim, reducedMotion, target]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const showAnimatedLogo = reducedMotion ? false : true;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#020617', '#0f172a', '#020617']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
        {/* Background particles */}
        <View style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <View
            style={{
              position: 'absolute',
              top: '25%',
              left: '25%',
              width: 256,
              height: 256,
              borderRadius: 999,
              backgroundColor: 'rgba(168, 85, 247, 0.20)',
              ...(Platform.OS === 'web' ? ({ filter: 'blur(48px)' } as unknown as object) : null),
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: '25%',
              right: '25%',
              width: 384,
              height: 384,
              borderRadius: 999,
              backgroundColor: 'rgba(59, 130, 246, 0.20)',
              ...(Platform.OS === 'web' ? ({ filter: 'blur(64px)' } as unknown as object) : null),
            }}
          />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', gap: 32 }}>
            <Animated.View style={{ opacity: logoOpacity }}>
              <View style={{ padding: 24, borderRadius: 16 }}>
                <SudokuLogoMark size="md" animated={showAnimatedLogo} darkMode isMd={isMd} />
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: titleOpacity }}>
              <MakeText weight="bold" style={{ fontSize: isMd ? 56 : 36, color: '#ffffff', textAlign: 'center' }}>
                Ultimate Sudoku
              </MakeText>
            </Animated.View>

            <Animated.View style={{ opacity: barOpacity, width: isMd ? 320 : 256 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.20)',
                  overflow: 'hidden',
                }}
              >
                <BlurView intensity={18} tint="dark" style={{ position: 'absolute', inset: 0 }} />
                <Animated.View style={{ width: barWidth, height: '100%', borderRadius: 999, overflow: 'hidden' }}>
                  <LinearGradient
                    colors={['#a855f7', '#3b82f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: textOpacity }}>
              <MakeText style={{ fontSize: isMd ? 16 : 14, color: 'rgba(255,255,255,0.70)', textAlign: 'center' }}>
                {message}
              </MakeText>
            </Animated.View>

            {/* Hook point for download progress (optional) */}
            {pct != null ? (
              <MakeText style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                {Math.round(pct * 100)}%
              </MakeText>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}


