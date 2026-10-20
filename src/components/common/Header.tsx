import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemIcon } from './SystemIcon';

interface HeaderProps {
  onPressNotifications?: () => void;
  hasUnreadNotifications?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onPressNotifications,
  hasUnreadNotifications = true,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.brandTitle}>HUNTER SYSTEM</Text>
      <Pressable
        onPress={onPressNotifications}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Notifications">
        <SystemIcon name="bell" size={22} color={COLORS.tx2} />
        {hasUnreadNotifications && <View style={styles.unreadDot} />}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.s4,
    paddingVertical: SPACING.s3,
    backgroundColor: COLORS.bg,
  },
  brandTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    letterSpacing: 2.2,
    color: COLORS.c2,
    fontWeight: '700',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonPressed: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.err,
  },
});
