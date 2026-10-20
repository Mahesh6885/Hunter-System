import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../theme';
import { HunterRank } from '../../types/hunter';

interface RankBadgeProps {
  rank: HunterRank | string;
  size?: number;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 44 }) => {
  const fontSize = Math.round(size * 0.45);

  return (
    <View style={[styles.diamondWrapper, { width: size, height: size }]}>
      <View style={[styles.diamond, { width: size - 4, height: size - 4 }]}>
        <Text style={[styles.rankText, { fontSize }]}>{rank}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  diamondWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  diamond: {
    borderWidth: 2,
    borderColor: COLORS.c1,
    backgroundColor: '#071524',
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.c1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  rankText: {
    transform: [{ rotate: '-45deg' }],
    fontFamily: FONTS.displayBold,
    color: COLORS.c2,
    fontWeight: '700',
    textAlign: 'center',
  },
});
