import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONTS } from '../../theme';

interface SystemBadgeProps {
  label: string;
  color: string;
  style?: ViewStyle;
}

export const SystemBadge: React.FC<SystemBadgeProps> = ({
  label,
  color,
  style,
}) => {
  return (
    <View style={[styles.badge, { borderColor: color }, style]}>
      <Text style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
