import {
  AnalyticsTimeRange,
  DayNutritionTrendPoint,
  NutritionAnalytics,
  ProgressAnalyticsSummary,
  QuestStreakAnalytics,
  WorkoutAnalytics,
} from '../types/analytics';
import { WorkoutHistoryRecord } from '../types/workout';
import { DailyNutritionTargets, NutritionDayRecord } from '../types/nutrition';
import {
  addDaysToDateKey,
  calculateStreak,
  getDaysDifference,
  getLocalDateKey,
  isValidDateKey,
} from './dateEngine';

/**
 * Calculates the all-time best (longest) streak achieved across all completed activity dates.
 */
export function calculateBestStreak(completedDates: string[]): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) {
    return 0;
  }

  const validUniqueDates = Array.from(new Set(completedDates.filter(isValidDateKey))).sort();
  if (validUniqueDates.length === 0) return 0;
  if (validUniqueDates.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < validUniqueDates.length; i++) {
    const prevDate = validUniqueDates[i - 1];
    const currDate = validUniqueDates[i];
    const diff = getDaysDifference(prevDate, currDate);

    if (diff === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diff > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Computes the starting date key for a given analytics time range.
 */
export function getStartDateForRange(
  range: AnalyticsTimeRange,
  referenceDateKey: string = getLocalDateKey()
): string | null {
  if (range === '7d') {
    return addDaysToDateKey(referenceDateKey, -6);
  }
  if (range === '30d') {
    return addDaysToDateKey(referenceDateKey, -29);
  }
  return null;
}

/**
 * Calculates workout analytics metrics for a given time range.
 */
export function calculateWorkoutAnalytics(
  history: WorkoutHistoryRecord[],
  range: AnalyticsTimeRange = '7d',
  referenceDateKey: string = getLocalDateKey()
): WorkoutAnalytics {
  const safeHistory = Array.isArray(history) ? history : [];
  const startDate = getStartDateForRange(range, referenceDateKey);

  const filtered = safeHistory.filter((record) => {
    if (!record || typeof record.completedAt !== 'number') return false;
    if (!startDate) return true;
    const recordDate = getLocalDateKey(record.completedAt);
    return recordDate >= startDate && recordDate <= referenceDateKey;
  });

  let totalSets = 0;
  let totalReps = 0;
  let totalVolumeKg = 0;
  let totalDurationSeconds = 0;
  const workoutsByDate: Record<string, number> = {};

  for (const w of filtered) {
    totalSets += typeof w.totalSetsCompleted === 'number' && !isNaN(w.totalSetsCompleted) ? w.totalSetsCompleted : 0;
    totalReps += typeof w.totalReps === 'number' && !isNaN(w.totalReps) ? w.totalReps : 0;
    totalVolumeKg += typeof w.totalVolumeKg === 'number' && !isNaN(w.totalVolumeKg) ? w.totalVolumeKg : 0;
    totalDurationSeconds += typeof w.durationSeconds === 'number' && !isNaN(w.durationSeconds) ? w.durationSeconds : 0;

    const dateKey = getLocalDateKey(w.completedAt);
    workoutsByDate[dateKey] = (workoutsByDate[dateKey] || 0) + 1;
  }

  const totalWorkouts = filtered.length;
  const averageDurationMinutes =
    totalWorkouts > 0 ? Math.round(totalDurationSeconds / totalWorkouts / 60) : 0;
  const averageVolumePerWorkout =
    totalWorkouts > 0 ? Math.round(totalVolumeKg / totalWorkouts) : 0;

  return {
    totalWorkouts,
    totalSets,
    totalReps,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalDurationSeconds,
    averageDurationMinutes,
    averageVolumePerWorkout,
    workoutsByDate,
  };
}

/**
 * Calculates quest completion and streak analytics.
 */
export function calculateQuestAnalytics(
  questCompletedDates: Record<string, string[]>,
  completedActivityDates: string[],
  range: AnalyticsTimeRange = '7d',
  referenceDateKey: string = getLocalDateKey()
): QuestStreakAnalytics {
  const safeActivityDates = Array.isArray(completedActivityDates) ? completedActivityDates : [];
  const safeQuestDates = questCompletedDates && typeof questCompletedDates === 'object' ? questCompletedDates : {};

  const currentStreak = calculateStreak(safeActivityDates, referenceDateKey);
  const bestStreak = Math.max(currentStreak, calculateBestStreak(safeActivityDates));

  const startDate = getStartDateForRange(range, referenceDateKey);

  const activeDatesInRange = safeActivityDates.filter((d) => {
    if (!isValidDateKey(d)) return false;
    if (!startDate) return true;
    return d >= startDate && d <= referenceDateKey;
  });

  let totalQuestsCompleted = 0;
  for (const [dateKey, questIds] of Object.entries(safeQuestDates)) {
    if (!isValidDateKey(dateKey)) continue;
    if (startDate && (dateKey < startDate || dateKey > referenceDateKey)) continue;
    if (Array.isArray(questIds)) {
      totalQuestsCompleted += questIds.length;
    }
  }

  // 4 standard daily quests per active day
  const daysCount = activeDatesInRange.length;
  const maxPossibleQuests = Math.max(1, daysCount * 4);
  const completionRatePercent =
    daysCount > 0 ? Math.min(100, Math.round((totalQuestsCompleted / maxPossibleQuests) * 100)) : 0;

  return {
    currentStreak,
    bestStreak,
    totalDaysActive: daysCount,
    totalQuestsCompleted,
    completionRatePercent,
  };
}

/**
 * Calculates nutrition trends and adherence metrics.
 */
export function calculateNutritionAnalytics(
  dayRecords: Record<string, NutritionDayRecord>,
  targets: DailyNutritionTargets,
  range: AnalyticsTimeRange = '7d',
  referenceDateKey: string = getLocalDateKey()
): NutritionAnalytics {
  const safeRecords = dayRecords && typeof dayRecords === 'object' ? dayRecords : {};
  const numDays = range === '7d' ? 7 : range === '30d' ? 30 : 14;

  const dailyTrends: DayNutritionTrendPoint[] = [];

  let sumCalories = 0;
  let sumProtein = 0;
  let sumWater = 0;
  let daysWithData = 0;
  let calorieTargetHitDays = 0;
  let hydrationTargetHitDays = 0;

  for (let i = numDays - 1; i >= 0; i--) {
    const dayKey = addDaysToDateKey(referenceDateKey, -i);
    const dayData = safeRecords[dayKey];

    const [y, m, d] = dayKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayLabel = dateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric' });

    let cal = 0;
    let prot = 0;
    let water = 0;

    if (dayData) {
      if (Array.isArray(dayData.entries)) {
        for (const e of dayData.entries) {
          cal += typeof e.calories === 'number' && !isNaN(e.calories) ? e.calories : 0;
          prot += typeof e.protein === 'number' && !isNaN(e.protein) ? e.protein : 0;
        }
      }
      if (Array.isArray(dayData.waterLogs)) {
        for (const w of dayData.waterLogs) {
          water += typeof w.amountMl === 'number' && !isNaN(w.amountMl) ? w.amountMl : 0;
        }
      }
    }

    cal = Math.round(cal);
    prot = Math.round(prot * 10) / 10;
    water = Math.round(water);

    if (cal > 0 || water > 0) {
      daysWithData++;
      sumCalories += cal;
      sumProtein += prot;
      sumWater += water;

      if (cal >= targets.caloriesTarget * 0.9 && cal <= targets.caloriesTarget * 1.15) {
        calorieTargetHitDays++;
      }
      if (water >= targets.waterTargetMl) {
        hydrationTargetHitDays++;
      }
    }

    dailyTrends.push({
      dateKey: dayKey,
      dayLabel,
      calories: cal,
      caloriesTarget: targets.caloriesTarget,
      protein: prot,
      proteinTarget: targets.proteinTarget,
      waterMl: water,
      waterTargetMl: targets.waterTargetMl,
    });
  }

  const averageCalories = daysWithData > 0 ? Math.round(sumCalories / daysWithData) : 0;
  const averageProtein = daysWithData > 0 ? Math.round((sumProtein / daysWithData) * 10) / 10 : 0;
  const averageWaterMl = daysWithData > 0 ? Math.round(sumWater / daysWithData) : 0;

  return {
    daysLogged: daysWithData,
    averageCalories,
    averageProtein,
    averageWaterMl,
    calorieTargetHitDays,
    hydrationTargetHitDays,
    dailyTrends,
  };
}

/**
 * Generates the full analytics summary report for a given time range.
 */
export function generateProgressAnalyticsSummary(
  history: WorkoutHistoryRecord[],
  questCompletedDates: Record<string, string[]>,
  completedActivityDates: string[],
  dayRecords: Record<string, NutritionDayRecord>,
  targets: DailyNutritionTargets,
  range: AnalyticsTimeRange = '7d',
  referenceDateKey: string = getLocalDateKey()
): ProgressAnalyticsSummary {
  return {
    timeRange: range,
    workout: calculateWorkoutAnalytics(history, range, referenceDateKey),
    questStreak: calculateQuestAnalytics(questCompletedDates, completedActivityDates, range, referenceDateKey),
    nutrition: calculateNutritionAnalytics(dayRecords, targets, range, referenceDateKey),
  };
}
