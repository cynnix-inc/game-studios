import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText, theme } from '@cynnix-studios/ui';

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: active ? theme.colors.accent : theme.colors.border,
        backgroundColor: active ? theme.colors.surface : theme.colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AppText weight="semibold" style={{ fontSize: 18 }}>
          {icon}
        </AppText>
      </View>
    </Pressable>
  );
}


