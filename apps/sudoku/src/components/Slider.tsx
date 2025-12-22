import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { theme } from '@cynnix-studios/ui';

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  accessibilityLabel: string;
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundToStep(v: number, min: number, step: number): number {
  const n = Math.round((v - min) / step);
  const next = min + n * step;
  const places = step < 1 ? Math.min(6, String(step).split('.')[1]?.length ?? 0) : 0;
  return places > 0 ? Number(next.toFixed(places)) : next;
}

export function Slider({ value, min, max, step, onChange, accessibilityLabel }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeThumbStartValueRef = useRef(value);

  const ratio = useMemo(() => {
    if (max <= min) return 0;
    return clamp((value - min) / (max - min), 0, 1);
  }, [max, min, value]);

  const thumbX = useMemo(() => {
    if (trackWidth <= 0) return 0;
    return ratio * trackWidth;
  }, [ratio, trackWidth]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const setFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const r = clamp(x / trackWidth, 0, 1);
      const raw = min + r * (max - min);
      const stepped = roundToStep(raw, min, step);
      onChange(clamp(stepped, min, max));
    },
    [max, min, onChange, step, trackWidth],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          activeThumbStartValueRef.current = value;
        },
        onPanResponderMove: (_evt, gestureState) => {
          const startRatio = max <= min ? 0 : clamp((activeThumbStartValueRef.current - min) / (max - min), 0, 1);
          const startX = startRatio * trackWidth;
          setFromX(startX + gestureState.dx);
        },
      }),
    [max, min, setFromX, trackWidth, value],
  );

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      onPress={(e) => setFromX(e.nativeEvent.locationX)}
      style={{
        height: 32,
        justifyContent: 'center',
      }}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      <View
        style={{
          height: 6,
          backgroundColor: theme.colors.surface2,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: 999,
        }}
      >
        <View
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            backgroundColor: theme.colors.accent,
            borderRadius: 999,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: thumbX - 10,
          width: 20,
          height: 20,
          borderRadius: 999,
          backgroundColor: theme.colors.text,
          borderWidth: 2,
          borderColor: theme.colors.surface,
        }}
      />
    </Pressable>
  );
}


