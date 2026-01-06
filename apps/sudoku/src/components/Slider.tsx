import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';

import { theme } from '@cynnix-studios/ui';

import { ratioFromValue, valueFromDragDx, valueFromX } from './sliderMath';

type SliderProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function Slider({ value, min, max, step, onChange, accessibilityLabel, disabled }: SliderProps) {
  return Platform.OS === 'web' ? (
    <SliderWeb value={value} min={min} max={max} step={step} onChange={onChange} accessibilityLabel={accessibilityLabel} disabled={disabled} />
  ) : (
    <SliderNative value={value} min={min} max={max} step={step} onChange={onChange} accessibilityLabel={accessibilityLabel} disabled={disabled} />
  );
}

function SliderWeb({ value, min, max, step, onChange, accessibilityLabel, disabled }: SliderProps) {
  // Web: use a native <input type="range"> for reliable pointer/keyboard support.
  // PanResponder drag behavior can be flaky on web across browsers.
  const handle = (e: unknown) => {
    const target = (e as { target?: { value?: string } }).target;
    const raw = target?.value;
    const next = raw == null ? NaN : Number(raw);
    if (!Number.isFinite(next)) return;
    onChange(next);
  };

  return (
    <View style={{ width: '100%', alignSelf: 'stretch', height: 32, justifyContent: 'center', opacity: disabled ? 0.55 : 1 }}>
      {React.createElement('input', {
        type: 'range',
        'aria-label': accessibilityLabel,
        min,
        max,
        step,
        value: String(value),
        disabled,
        // React maps range updates primarily through `onChange`, but some environments/tests
        // dispatch `input` events directly. Supporting both keeps behavior consistent.
        onChange: handle,
        onInput: handle,
        style: {
          width: '100%',
          height: 32,
          cursor: disabled ? 'not-allowed' : 'pointer',
          // Modern browsers support this for range inputs.
          accentColor: theme.colors.accent,
          background: 'transparent',
        } as unknown,
      })}
    </View>
  );
}

function SliderNative({ value, min, max, step, onChange, accessibilityLabel, disabled }: SliderProps) {
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
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponderCapture: () => !disabled,
        onPanResponderTerminationRequest: () => false,
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
    [disabled, max, min, onChange, step, trackWidth, value],
  );

  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={(e) => {
        if (disabled) return;
        setFromX(e.nativeEvent.locationX);
      }}
      style={{
        height: 32,
        justifyContent: 'center',
        width: '100%',
        alignSelf: 'stretch',
        opacity: disabled ? 0.55 : 1,
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


