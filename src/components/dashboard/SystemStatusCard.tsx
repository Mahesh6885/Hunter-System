import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { HunterAvatar } from '../common/HunterAvatar';
import { RankBadge } from '../common/RankBadge';
import { ProgressBar } from '../common/ProgressBar';
import { HunterState } from '../../types/hunter';

interface SystemStatusCardProps {
  hunter: HunterState;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ hunter }) => {
  const xpPercent = (hunter.xp / hunter.maxXP) * 100;

  return (
    <SystemPanel title="System Status">
      {/* Top Profile Row */}
      <View style={styles.profileRow}>
        <HunterAvatar size={56} />
        <View style={styles.nameContainer}>
          <Text style={styles.hunterName}>{hunter.name}</Text>
          <Text style={styles.hunterSubtitle}>
            Hunter · Level {hunter.level}
          </Text>
        </View>
        <RankBadge rank={hunter.rank} size={44} />
      </View>

      {/* Separator Line */}
      <View style={styles.separator} />

      {/* XP Header Row */}
      <View style={styles.infoRow}>
        <Text style={styles.mutedLabel}>XP</Text>
        <Text style={styles.secondaryValue}>
          {hunter.xp.toLocaleString()} / {hunter.maxXP.toLocaleString()}
        </Text>
      </View>

      {/* XP Progress Bar */}
      <ProgressBar progress={xpPercent} height={6} style={styles.xpBar} />

      {/* Streak Info */}
      <View style={[styles.infoRow, { marginTop: SPACING.s2 }]}>
        <Text style={styles.mutedLabel}>Streak</Text>
        <Text style={styles.cyanValue}>{hunter.streakDays} days</Text>
      </View>

      {/* 7-Day Streak Indicators */}
      <View style={styles.daysRow}>
        {hunter.weekActivity.map((active, index) => (
          <View
            key={index}
            style={[
              styles.dayPill,
              active && styles.dayPillActive,
            ]}
          />
        ))}
      </View>
    </SystemPanel>
  );
};

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s3,
  },
  nameContainer: {
    flex: 1,
  },
  hunterName: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    letterSpacing: 1.2,
    color: COLORS.tx,
    fontWeight: '700',
  },
  hunterSubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: SPACING.s2 + 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mutedLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    letterSpacing: 0.8,
  },
  secondaryValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.tx2,
    letterSpacing: 0.5,
  },
  cyanValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.c2,
    letterSpacing: 0.5,
  },
  xpBar: {
    marginTop: 2,
    marginBottom: SPACING.s1,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.s2,
  },
  dayPill: {
    flex: 1,
    height: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'transparent',
  },
  dayPillActive: {
    backgroundColor: COLORS.c1,
    borderColor: COLORS.c2,
  },
});
