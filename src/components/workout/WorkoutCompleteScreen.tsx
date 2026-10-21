import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { SystemBadge } from '../common/SystemBadge';
import { useWorkout } from '../../context/WorkoutContext';
import { useHunter } from '../../context/HunterContext';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const WorkoutCompleteScreen: React.FC = () => {
  const { session, claimWorkoutRewards } = useWorkout();
  const { hunter, setActiveScreen } = useHunter();

  const summary = session.completedSummary;
  if (!summary) return null;

  const handleClaim = async () => {
    await claimWorkoutRewards();
    setActiveScreen('dash');
  };

  const formatLoad = (kg: number) => {
    if (kg <= 0) return 'BW';
    if (hunter.unit === 'lb') {
      return `${Math.round(kg * 2.20462)} lb`;
    }
    return `${kg} kg`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Quest Cleared Hero Banner */}
      <SystemPanel hot contentStyle={styles.heroInner}>
        <Text style={styles.systemBadgeText}>SYSTEM NOTIFICATION</Text>
        <Text style={styles.questClearedTitle}>QUEST CLEARED</Text>
        <Text style={styles.routineTitle}>{summary.routineTitle}</Text>

        {/* 3 Metric Cells */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCell}>
            <Text style={styles.metricNumber}>{formatTimer(summary.durationSeconds)}</Text>
            <Text style={styles.metricLabel}>TIME</Text>
          </View>

          <View style={styles.metricCell}>
            <Text style={styles.metricNumber}>{summary.totalSetsCompleted}</Text>
            <Text style={styles.metricLabel}>SETS</Text>
          </View>

          <View style={styles.metricCell}>
            <Text style={[styles.metricNumber, styles.xpNumber]}>+{summary.xpAwarded}</Text>
            <Text style={styles.metricLabel}>XP EARNED</Text>
          </View>
        </View>

        {/* Volume & Reps Highlights */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Repetitions</Text>
          <Text style={styles.summaryValue}>{summary.totalReps} reps</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Volume Lifted</Text>
          <Text style={styles.summaryValue}>{formatLoad(summary.totalVolumeKg)}</Text>
        </View>

        {/* Achievement / Personal Record Badge */}
        <View style={styles.badgeRow}>
          <Text style={styles.badgeLead}>Dungeon Clearance</Text>
          <SystemBadge label="RANK COMPLETE" color={COLORS.ok} />
        </View>
      </SystemPanel>

      {/* 2. Exercise Breakdown Panel */}
      <SystemPanel title="Exercise Breakdown">
        {summary.exerciseSummaries.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.exerciseBreakdownItem,
              idx === summary.exerciseSummaries.length - 1 && styles.lastBreakdownItem,
            ]}>
            <View>
              <Text style={styles.exerciseNameText}>{item.name}</Text>
              <Text style={styles.exerciseSetsText}>
                {item.setsCompleted} sets logged · Max load: {formatLoad(item.maxLoadKg)}
              </Text>
            </View>
            <SystemBadge label="VERIFIED" color={COLORS.c1} />
          </View>
        ))}
      </SystemPanel>

      {/* 3. Claim Reward Action Button */}
      <SystemButton
        label="CLAIM REWARDS & RETURN TO SYSTEM"
        onPress={handleClaim}
        style={styles.claimButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: SPACING.s4,
    paddingTop: SPACING.s2,
    paddingBottom: SPACING.s5,
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: SPACING.s4,
  },
  systemBadgeText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.tx3,
    marginBottom: SPACING.s1,
  },
  questClearedTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    letterSpacing: 2.5,
    color: COLORS.c2,
    textShadowColor: 'rgba(57, 191, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  routineTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.tx2,
    marginTop: 4,
    marginBottom: SPACING.s3,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.s2,
    width: '100%',
    marginVertical: SPACING.s2,
  },
  metricCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: SPACING.s2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(57, 191, 255, 0.04)',
  },
  metricNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.tx,
    fontWeight: '700',
  },
  xpNumber: {
    color: COLORS.warn,
  },
  metricLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.tx3,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  summaryLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx2,
  },
  summaryValue: {
    fontFamily: FONTS.displayMedium,
    fontSize: 14,
    color: COLORS.c2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.s3,
  },
  badgeLead: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx2,
  },
  exerciseBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.s2 + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  lastBreakdownItem: {
    borderBottomWidth: 0,
  },
  exerciseNameText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  exerciseSetsText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    marginTop: 2,
  },
  claimButton: {
    marginTop: SPACING.s3,
  },
});
