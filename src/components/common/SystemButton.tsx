import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';

interface SystemButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'active';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const SystemButton: React.FC<SystemButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.baseButton,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'active' && styles.activeButton,
        pressed && !disabled && (variant === 'primary' ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.baseText,
          variant === 'primary' && styles.primaryText,
          variant === 'secondary' && styles.secondaryText,
          variant === 'active' && styles.activeText,
          disabled && styles.disabledText,
          textStyle,
        ]}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    minHeight: 52,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.c1,
    backgroundColor: COLORS.btnBg,
    shadowColor: COLORS.c1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: SPACING.s4,
  },
  primaryPressed: {
    backgroundColor: COLORS.btnBgActive,
    borderColor: COLORS.c2,
  },
  primaryText: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 1.6,
    color: COLORS.c2,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: SPACING.s4,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
  },
  secondaryPressed: {
    backgroundColor: COLORS.chipBgActive,
    borderColor: COLORS.c1,
  },
  secondaryText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: COLORS.tx2,
    fontWeight: '700',
  },
  activeButton: {
    minHeight: 44,
    paddingHorizontal: SPACING.s4,
    borderWidth: 1,
    borderColor: COLORS.c1,
    backgroundColor: COLORS.chipBgActive,
  },
  activeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 1.2,
    color: COLORS.c2,
    fontWeight: '700',
  },
  baseText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  disabledText: {
    color: COLORS.tx3,
  },
});
