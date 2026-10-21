import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { SystemBadge } from '../common/SystemBadge';
import { useWorkout } from '../../context/WorkoutContext';
import { useHunter } from '../../context/HunterContext';
import { clearWorkoutHistory } from '../../storage/workoutStorageService';

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ''}`;
}

export const WorkoutHistoryView: React.FC = () => {
  const { history, isHistoryLoading, refreshHistory } = useWorkout();
  const { hunter } = useHunter();

  const handleClearHistory = () => {
    Alert.alert(
      'CLEAR DUNGEON ARCHIVES?',
      'Are you sure you want to erase all completed workout history? Hunter XP and stats will not be affected.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'CLEAR ALL ARCHIVES',
          style: 'destructive',
          onPress: async () => {
            await clearWorkoutHistory();
            await refreshHistory();
          },
        },
      ]
    );
  };

  const formatLoad = (kg: number) => {
    if (kg <= 0) return 'BW';
    if (hunter.unit === 'lb') {
      return `${Math.round(kg * 2.20462)} lb`;
    }
    return `${kg} kg`;
  };

  if (isHistoryLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.c1} />
        <Text style={styles.loadingText}>ACCESSING SYSTEM ARCHIVES...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <SystemPanel title="Dungeon Archives">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>NO COMPLETED GATES LOGGED</Text>
          <Text style={styles.emptySubtitle}>
            Complete a workout routine to record your hunter training performance and XP rewards in the system archives.
          </Text>
        </View>
      </SystemPanel>
    );
  }

  return (
    <View style={styles.container}>
      {history.map((record) => (
        <SystemPanel
          key={record.id}
          title={record.routineTitle}
          headerRight={<SystemBadge label={`+${record.xpAwarded} XP`} color={COLORS.warn} />}>
          {/* Date & Duration Row */}
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>{formatDate(record.completedAt)}</Text>
            <Text style={styles.durationText}>{formatDuration(record.durationSeconds)}</Text>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{record.totalSetsCompleted}</Text>
              <Text style={styles.metricLbl}>SETS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{record.totalReps}</Text>
              <Text style={styles.metricLbl}>REPS</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{formatLoad(record.totalVolumeKg)}</Text>
              <Text style={styles.metricLbl}>VOLUME</Text>
            </View>
          </View>

          {/* Exercises Performed */}
          <View style={styles.exercisesList}>
            {record.exerciseSummaries.map((ex, i) => (
              <Text key={i} style={styles.exerciseSummaryText}>
                • {ex.name} ({ex.setsCompleted} sets · max {formatLoad(ex.maxLoadKg)})
              </Text>
            ))}
          </View>
        </SystemPanel>
      ))}

      {/* Clear History Button */}
      <SystemButton
        label="CLEAR WORKOUT ARCHIVES"
        variant="secondary"
        onPress={handleClearHistory}
        style={styles.clearBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.s4,
  },
  loadingContainer: {
    padding: SPACING.s5,
    alignItems: 'center',
    gap: SPACING.s2,
  },
  loadingText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    color: COLORS.tx3,
  },
  emptyContainer: {
    paddingVertical: SPACING.s4,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 1.5,
    color: COLORS.tx2,
    marginBottom: SPACING.s1,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx3,
    textAlign: 'center',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s2,
  },
  dateText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  durationText: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.c2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginVertical: SPACING.s1,
    paddingVertical: SPACING.s2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.lineSubtle,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  metricLbl: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.tx3,
    marginTop: 2,
  },
  exercisesList: {
    marginTop: SPACING.s2,
    gap: 3,
  },
  exerciseSummaryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  clearBtn: {
    marginTop: SPACING.s2,
  },
});
