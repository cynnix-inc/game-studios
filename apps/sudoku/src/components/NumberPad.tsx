import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton, AppText, theme } from '@cynnix-studios/ui';

export function NumberPad({
  onDigit,
  onClear,
}: {
  onDigit: (d: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
  onClear: () => void;
}) {
  const digits = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9] as const, []);
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {digits.map((d) => (
          <Pressable
            key={d}
            onPress={() => onDigit(d)}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface2,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText weight="semibold">{d}</AppText>
          </Pressable>
        ))}
      </View>
      <AppButton title="Clear" variant="secondary" onPress={onClear} />
    </View>
  );
}


