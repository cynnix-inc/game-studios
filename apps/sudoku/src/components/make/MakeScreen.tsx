import React from 'react';
import { Animated, Easing, Platform, SafeAreaView, ScrollView, View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useMakeTheme } from './MakeThemeProvider';
import { shouldAnimateParticles } from '../../ultimate/motion/reducedMotion';

export type MakeScreenProps = ViewProps & {
  scroll?: boolean;
};

export function MakeScreen({ scroll = true, style, children, ...rest }: MakeScreenProps) {
  const { theme, reducedMotion } = useMakeTheme();
  const pulseA = React.useRef(new Animated.Value(0)).current;
  const pulseB = React.useRef(new Animated.Value(0)).current;
  const pulseC = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animate = shouldAnimateParticles({ reducedMotion });
    if (!animate) return;

    const makeLoop = (v: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(v, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        ]),
      );

    const a = makeLoop(pulseA, 0);
    const b = makeLoop(pulseB, 1000);
    const c = makeLoop(pulseC, 2000);
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [pulseA, pulseB, pulseC, reducedMotion]);

  const content = (
    <SafeAreaView
      {...rest}
      style={[
        {
          flex: 1,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );

  return (
    <LinearGradient
      testID="make-screen"
      colors={theme.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      // Prevent horizontal scroll on web due to large blurred background particles.
      style={{ flex: 1, overflow: 'hidden' }}
    >
      {/* Background particles (Figma Make: 3 blobs, blur-3xl, pulse + delays) */}
      <View style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: 384,
            height: 384,
            borderRadius: 384,
            backgroundColor: theme.particles.primary,
            // Web-only blur to match Tailwind blur-3xl. Native degrades to soft opacity.
            ...(Platform.OS === 'web' ? ({ filter: 'blur(64px)' } as unknown as object) : null),
            opacity: 0.9,
            transform: [
              { scale: pulseA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              { translateX: -192 },
              { translateY: -192 },
            ],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: 384,
            height: 384,
            borderRadius: 384,
            backgroundColor: theme.particles.secondary,
            ...(Platform.OS === 'web' ? ({ filter: 'blur(64px)' } as unknown as object) : null),
            opacity: 0.85,
            transform: [
              { scale: pulseB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              { translateX: 192 },
              { translateY: 192 },
            ],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            top: '75%',
            left: '75%',
            width: 384,
            height: 384,
            borderRadius: 384,
            backgroundColor: theme.particles.tertiary,
            ...(Platform.OS === 'web' ? ({ filter: 'blur(64px)' } as unknown as object) : null),
            opacity: 0.8,
            transform: [
              { scale: pulseC.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
              { translateX: -192 },
              { translateY: -192 },
            ],
          }}
        />
      </View>

      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}


