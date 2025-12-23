import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { theme } from '@cynnix-studios/ui';

import { ratioFromValue, valueFromDragDx, valueFromX } from './sliderMath';

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  accessibilityLabel: string;
};

export function Slider({ value, min, max, step, onChange, accessibilityLabel }: SliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeThumbStartValueRef = useRef(value);

  const ratio = useMemo(() => {
    return ratioFromValue(value, min, max);
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
      const next = valueFromX({ x, trackWidth, min, max, step });
      if (next == null) return;
      onChange(next);
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
          const next = valueFromDragDx({
            startValue: activeThumbStartValueRef.current,
            dx: gestureState.dx,
            trackWidth,
            min,
            max,
            step,
          });
          if (next == null) return;
          onChange(next);
        },
      }),
    [max, min, onChange, step, trackWidth, value],
  );

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      onPress={(e) => setFromX(e.nativeEvent.locationX)}
      style={{
        height: 32,
        justifyContent: 'center',
        width: '100%',
      }}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      <View
        style={{
          height: 6,
          width: '100%',
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


