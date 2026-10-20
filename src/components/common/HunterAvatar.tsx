import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../../theme';

interface HunterAvatarProps {
  size?: number;
}

export const HunterAvatar: React.FC<HunterAvatarProps> = ({ size = 56 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Circle cx="28" cy="21" r="9" fill="#12304a" />
        <Path d="M8 56c2-16 10-22 20-22s18 6 20 22z" fill="#12304a" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.c1,
    backgroundColor: '#08121e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
