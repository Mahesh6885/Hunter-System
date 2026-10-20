import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme';

export type ProgressVariant = 'default' | 'ok' | 'warn' | 'rare';

interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: ProgressVariant;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  height = 6,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'ok':
        return [COLORS.ok, '#8BFEC4'];
      case 'warn':
        return [COLORS.warn, '#FFE2A4'];
      case 'rare':
        return [COLORS.rare, '#D8CBFF'];
      case 'default':
      default:
        return [COLORS.c1, COLORS.c2];
    }
  };

  return (
    <View style={[styles.track, { height }, style]}>
      <View style={[styles.fillWrapper, { width: `${clampedProgress}%` }]}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.barTrack,
    borderWidth: 1,
    borderColor: COLORS.line,
    width: '100%',
    overflow: 'hidden',
  },
  fillWrapper: {
    height: '100%',
  },
});
