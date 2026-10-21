import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemBadge } from '../common/SystemBadge';
import { ProgressBar } from '../common/ProgressBar';
import { useHunter } from '../../context/HunterContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useNutrition } from '../../context/NutritionContext';
import { AnalyticsTimeRange } from '../../types/analytics';
import { generateProgressAnalyticsSummary } from '../../utils/analyticsEngine';

interface AnalyticsScreenProps {
  onBack: () => void;
  onOpenAchievements?: () => void;
}

const TIME_RANGES: { id: AnalyticsTimeRange; label: string }[] = [
  { id: '7d', label: '7 DAYS' },
  { id: '30d', label: '30 DAYS' },
  { id: 'all', label: 'ALL TIME' },
];

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  onBack,
  onOpenAchievements,
}) => {
  const { hunter } = useHunter();
  const { history: workoutHistory } = useWorkout();
  const { targets: nutritionTargets, dayRecords } = useNutrition();

  const [activeRange, setActiveRange] = useState<AnalyticsTimeRange>('7d');

  // Compute live analytics summary using real stored records
  const summary = useMemo(() => {
    return generateProgressAnalyticsSummary(
      workoutHistory,
      hunter.questCompletedDates || {},
      hunter.completedActivityDates || [],
      dayRecords,
      nutritionTargets,
      activeRange
    );
  }, [workoutHistory, hunter, dayRecords, nutritionTargets, activeRange]);

  const { workout, questStreak, nutrition } = summary;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* 1. Header Navigation */}
      <View style={styles.topNavRow}>
        <Pressable onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBtnText}>← BACK</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTag}>SYSTEM INTELLIGENCE // ANALYTICS</Text>
          <Text style={styles.headerMainTitle}>HUNTER PERFORMANCE METRICS</Text>
        </View>

        {onOpenAchievements && (
          <Pressable onPress={onOpenAchievements} style={styles.navBtn}>
            <Text style={styles.navBtnText}>TROPHIES 🏆</Text>
          </Pressable>
        )}
      </View>

      {/* 2. Time Range Switcher */}
      <View style={styles.rangeSwitcherRow}>
        {TIME_RANGES.map((r) => {
          const isActive = activeRange === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => setActiveRange(r.id)}
              style={[styles.rangeTab, isActive && styles.rangeTabActive]}>
              <Text style={[styles.rangeTabText, isActive && styles.rangeTabTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 3. Training & Dungeon Analytics Panel */}
      <SystemPanel title="DUNGEON & TRAINING RECAP" hot>
        {workout.totalWorkouts === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>NO TRAINING SESSIONS LOGGED IN THIS PERIOD</Text>
            <Text style={styles.emptyDesc}>
              Clear gates in the Train terminal to record completed sets, volume, and combat duration.
            </Text>
          </View>
        ) : (
          <View>
            {/* 4-Stat Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{workout.totalWorkouts}</Text>
                <Text style={styles.statLabel}>WORKOUTS</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{workout.totalSets}</Text>
                <Text style={styles.statLabel}>SETS LOGGED</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{workout.totalVolumeKg.toLocaleString()}</Text>
                <Text style={styles.statLabel}>TOTAL KG LIFTED</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{Math.round(workout.totalDurationSeconds / 60)}</Text>
                <Text style={styles.statLabel}>MINUTES TRAINED</Text>
              </View>
            </View>

            {/* Averages Row */}
            <View style={styles.averagesRow}>
              <Text style={styles.averagesText}>
                Avg Duration: {workout.averageDurationMinutes} min · Avg Volume: {workout.averageVolumePerWorkout.toLocaleString()} kg / workout
              </Text>
            </View>
          </View>
        )}
      </SystemPanel>

      {/* 4. Discipline, Streaks & Quest Protocol */}
      <SystemPanel title="DISCIPLINE & STREAK PROTOCOL">
        <View style={styles.streakGrid}>
          <View style={styles.streakCell}>
            <Text style={styles.streakBigNum}>{questStreak.currentStreak}</Text>
            <Text style={styles.streakLabel}>CURRENT STREAK (DAYS)</Text>
            <ProgressBar
              progress={Math.min(100, (questStreak.currentStreak / 7) * 100)}
              height={4}
              style={styles.streakBar}
            />
          </View>

          <View style={styles.streakCell}>
            <Text style={[styles.streakBigNum, { color: COLORS.warn }]}>
              {questStreak.bestStreak}
            </Text>
            <Text style={styles.streakLabel}>BEST STREAK RECORD</Text>
            <ProgressBar
              progress={100}
              height={4}
              style={styles.streakBar}
            />
          </View>
        </View>

        {/* Quest Completion Metrics */}
        <View style={styles.questMetricBox}>
          <View style={styles.questMetricRow}>
            <Text style={styles.questMetricLabel}>Daily Quest Completion Rate:</Text>
            <Text style={styles.questMetricVal}>{questStreak.completionRatePercent}%</Text>
          </View>
          <ProgressBar progress={questStreak.completionRatePercent} height={6} style={styles.questBar} />
          <Text style={styles.questSubText}>
            {questStreak.totalQuestsCompleted} quests fulfilled across {questStreak.totalDaysActive} active days.
          </Text>
        </View>
      </SystemPanel>

      {/* 5. Replenishment & Macro Trends */}
      <SystemPanel title="NUTRITION & MACRONUTRIENT TRENDS">
        {nutrition.daysLogged === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>NO NUTRITION INTAKE RECORDED IN THIS TIMEFRAME</Text>
            <Text style={styles.emptyDesc}>
              Log meals in the Replenishment Protocol to populate caloric and macronutrient trends.
            </Text>
          </View>
        ) : (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{nutrition.averageCalories}</Text>
                <Text style={styles.statLabel}>AVG KCAL / DAY</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{nutrition.averageProtein}g</Text>
                <Text style={styles.statLabel}>AVG PROTEIN / DAY</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{nutrition.calorieTargetHitDays}</Text>
                <Text style={styles.statLabel}>TARGET HIT DAYS</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={styles.statNumber}>{nutrition.daysLogged}</Text>
                <Text style={styles.statLabel}>DAYS LOGGED</Text>
              </View>
            </View>

            {/* Daily Caloric Trend Bars */}
            <Text style={styles.trendHeader}>DAILY CALORIC INTAKE VS TARGET:</Text>
            <View style={styles.trendBarsRow}>
              {nutrition.dailyTrends.slice(-7).map((day) => {
                const heightPercent = day.caloriesTarget > 0
                  ? Math.min(100, Math.round((day.calories / day.caloriesTarget) * 100))
                  : 0;
                return (
                  <View key={day.dateKey} style={styles.barCol}>
                    <Text style={styles.barTopLabel}>
                      {day.calories > 0 ? `${day.calories}` : '-'}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.max(4, heightPercent)}%` },
                          heightPercent >= 90 && heightPercent <= 115 ? styles.barFillHit : null,
                        ]}
                      />
                    </View>
                    <Text style={styles.barDayLabel}>{day.dayLabel.split(' ')[0]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </SystemPanel>

      {/* 6. Hydration Discipline Panel */}
      <SystemPanel title="HYDRATION DISCIPLINE">
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{nutrition.averageWaterMl}</Text>
            <Text style={styles.statLabel}>AVG WATER (ML)</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{nutrition.hydrationTargetHitDays}</Text>
            <Text style={styles.statLabel}>TARGET HIT DAYS</Text>
          </View>
        </View>

        {/* Daily Water Trend Bars */}
        <Text style={styles.trendHeader}>HYDRATION INTAKE (LAST 7 DAYS):</Text>
        <View style={styles.trendBarsRow}>
          {nutrition.dailyTrends.slice(-7).map((day) => {
            const heightPercent = day.waterTargetMl > 0
              ? Math.min(100, Math.round((day.waterMl / day.waterTargetMl) * 100))
              : 0;
            return (
              <View key={day.dateKey} style={styles.barCol}>
                <Text style={styles.barTopLabel}>
                  {day.waterMl > 0 ? `${day.waterMl}` : '-'}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.max(4, heightPercent)}%`, backgroundColor: COLORS.c1 },
                    ]}
                  />
                </View>
                <Text style={styles.barDayLabel}>{day.dayLabel.split(' ')[0]}</Text>
              </View>
            );
          })}
        </View>
      </SystemPanel>

      {/* 7. Future Feature: Bodyweight Scan Protocol */}
      <SystemPanel title="BODY SCAN & WEIGHT TRACKING">
        <View style={styles.futureBox}>
          <View style={styles.futureBadgeRow}>
            <SystemBadge label="LOCKED" color={COLORS.tx3} />
            <Text style={styles.futureTag}>PROTOCOL IN DEVELOPMENT</Text>
          </View>
          <Text style={styles.futureTitle}>BIOMETRIC WEIGHT & BODY FAT TELEMETRY</Text>
          <Text style={styles.futureDesc}>
            Body mass and composition tracking will be unlocked in a future System update. No manual weight records exist in current protocol.
          </Text>
        </View>
      </SystemPanel>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.s2,
    paddingBottom: SPACING.s6 * 2,
    gap: SPACING.s2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s1,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
  },
  navBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.c1,
    letterSpacing: 1.1,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTag: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.c2,
    letterSpacing: 1.5,
  },
  headerMainTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.tx,
    letterSpacing: 1,
  },
  rangeSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 20, 32, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 2,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: SPACING.s1,
    alignItems: 'center',
    borderRadius: 2,
  },
  rangeTabActive: {
    backgroundColor: 'rgba(57, 191, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.c1,
  },
  rangeTabText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  rangeTabTextActive: {
    color: COLORS.c1,
  },
  emptyBox: {
    padding: SPACING.s3,
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 32, 0.5)',
    borderRadius: 4,
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 11,
    color: COLORS.tx2,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s1,
    marginBottom: SPACING.s1,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s2,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.c1,
  },
  statLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
    marginTop: 2,
  },
  averagesRow: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  averagesText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
  },
  streakGrid: {
    flexDirection: 'row',
    gap: SPACING.s1,
    marginBottom: SPACING.s2,
  },
  streakCell: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s2,
    alignItems: 'center',
  },
  streakBigNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: COLORS.c2,
  },
  streakLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
    marginTop: 2,
  },
  streakBar: {
    width: '100%',
    marginTop: 6,
  },
  questMetricBox: {
    backgroundColor: 'rgba(10, 20, 32, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s2,
  },
  questMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questMetricLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.tx,
  },
  questMetricVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.c1,
  },
  questBar: {
    marginVertical: SPACING.s1,
  },
  questSubText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  trendHeader: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1.1,
    color: COLORS.tx3,
    marginTop: SPACING.s2,
    marginBottom: SPACING.s1,
  },
  trendBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 8,
    color: COLORS.tx3,
    marginBottom: 2,
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: 'rgba(5, 10, 18, 0.8)',
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.c2,
    borderRadius: 2,
  },
  barFillHit: {
    backgroundColor: COLORS.ok,
  },
  barDayLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    color: COLORS.tx2,
    marginTop: 4,
  },
  futureBox: {
    backgroundColor: 'rgba(5, 10, 18, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s3,
  },
  futureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s1,
    marginBottom: SPACING.s1,
  },
  futureTag: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
    letterSpacing: 1.1,
  },
  futureTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.tx,
    marginBottom: 4,
  },
  futureDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
    lineHeight: 17,
  },
});
