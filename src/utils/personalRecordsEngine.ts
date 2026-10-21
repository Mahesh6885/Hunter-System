import { WorkoutHistoryRecord } from '../types/workout';
import { HunterPersonalRecords, PersonalRecordItem } from '../types/personalRecords';
import { calculateBestStreak } from './analyticsEngine';
import { convertWeight } from './weightConversions';

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes verified Hunter Personal Records strictly from saved workout history and activity dates.
 * Never estimates or invents unearned milestones.
 */
export function computeHunterPersonalRecords(
  workoutHistory: WorkoutHistoryRecord[],
  completedActivityDates: string[],
  currentStreakDays: number,
  unit: 'kg' | 'lb' = 'kg'
): HunterPersonalRecords {
  const verifiedWorkouts = (workoutHistory || []).filter(
    (w) => w && typeof w === 'object' && typeof w.id === 'string'
  );

  // 1. Most completed sets in a single workout
  let maxSetsRecord: WorkoutHistoryRecord | null = null;
  for (const w of verifiedWorkouts) {
    const sets = typeof w.totalSetsCompleted === 'number' ? w.totalSetsCompleted : 0;
    if (!maxSetsRecord || sets > (maxSetsRecord.totalSetsCompleted || 0)) {
      maxSetsRecord = w;
    }
  }

  const mostSetsVal = maxSetsRecord ? (maxSetsRecord.totalSetsCompleted || 0) : 0;
  const mostSets: PersonalRecordItem = {
    key: 'mostSets',
    title: 'PEAK SET VOLUME',
    metricLabel: 'Most Sets in a Dungeon',
    displayValue: `${mostSetsVal} sets`,
    numericValue: mostSetsVal,
    unit: 'sets',
    achievedDateKey: maxSetsRecord ? formatDate(maxSetsRecord.completedAt) : undefined,
    workoutTitle: maxSetsRecord ? maxSetsRecord.routineTitle : undefined,
    description: 'Highest count of exercise sets completed in a single dungeon raid.',
    verified: mostSetsVal > 0,
  };

  // 2. Longest completed workout
  let longestRecord: WorkoutHistoryRecord | null = null;
  for (const w of verifiedWorkouts) {
    const dur = typeof w.durationSeconds === 'number' ? w.durationSeconds : 0;
    if (!longestRecord || dur > (longestRecord.durationSeconds || 0)) {
      longestRecord = w;
    }
  }

  const longestSeconds = longestRecord ? (longestRecord.durationSeconds || 0) : 0;
  const longestWorkout: PersonalRecordItem = {
    key: 'longestWorkout',
    title: 'LONGEST COMBAT DURATION',
    metricLabel: 'Longest Workout Session',
    displayValue: formatDuration(longestSeconds),
    numericValue: longestSeconds,
    unit: 'seconds',
    achievedDateKey: longestRecord ? formatDate(longestRecord.completedAt) : undefined,
    workoutTitle: longestRecord ? longestRecord.routineTitle : undefined,
    description: 'Longest continuous verified training session completed.',
    verified: longestSeconds > 0,
  };

  // 3. Highest recorded training volume in a single workout
  let highestVolumeRecord: WorkoutHistoryRecord | null = null;
  for (const w of verifiedWorkouts) {
    const vol = typeof w.totalVolumeKg === 'number' ? w.totalVolumeKg : 0;
    if (!highestVolumeRecord || vol > (highestVolumeRecord.totalVolumeKg || 0)) {
      highestVolumeRecord = w;
    }
  }

  const highestVolKg = highestVolumeRecord ? (highestVolumeRecord.totalVolumeKg || 0) : 0;
  const displayVol = unit === 'lb' ? convertWeight(highestVolKg, 'kg', 'lb') : highestVolKg;
  const highestVolume: PersonalRecordItem = {
    key: 'highestVolume',
    title: 'PEAK TONNAGE LOAD',
    metricLabel: 'Highest Single-Session Volume',
    displayValue: `${Math.round(displayVol).toLocaleString()} ${unit}`,
    numericValue: highestVolKg,
    unit,
    achievedDateKey: highestVolumeRecord ? formatDate(highestVolumeRecord.completedAt) : undefined,
    workoutTitle: highestVolumeRecord ? highestVolumeRecord.routineTitle : undefined,
    description: 'Highest cumulative weight load (weight × reps) conquered in a single workout.',
    verified: highestVolKg > 0,
  };

  // 4. Total completed workouts
  const totalWorkoutsCount = verifiedWorkouts.length;
  const totalWorkouts: PersonalRecordItem = {
    key: 'totalWorkouts',
    title: 'DUNGEON CLEARANCES',
    metricLabel: 'Total Completed Workouts',
    displayValue: `${totalWorkoutsCount} raids`,
    numericValue: totalWorkoutsCount,
    unit: 'workouts',
    description: 'Total number of fully completed and archived dungeon training sessions.',
    verified: totalWorkoutsCount > 0,
  };

  // 5. Total completed sets
  const totalSetsCount = verifiedWorkouts.reduce(
    (sum, w) => sum + (typeof w.totalSetsCompleted === 'number' ? w.totalSetsCompleted : 0),
    0
  );
  const totalSets: PersonalRecordItem = {
    key: 'totalSets',
    title: 'LIFETIME SET CONQUEST',
    metricLabel: 'Total Completed Sets',
    displayValue: `${totalSetsCount} sets`,
    numericValue: totalSetsCount,
    unit: 'sets',
    description: 'Sum total of every exercise set successfully performed across all workouts.',
    verified: totalSetsCount > 0,
  };

  // 6. Best streak
  const bestStreakDays = calculateBestStreak(completedActivityDates || []);
  const bestStreak: PersonalRecordItem = {
    key: 'bestStreak',
    title: 'MONARCH OF CONSISTENCY',
    metricLabel: 'All-Time Best Streak',
    displayValue: `${bestStreakDays} days`,
    numericValue: bestStreakDays,
    unit: 'days',
    description: 'Longest uninterrupted sequence of consecutive calendar days with verified activity.',
    verified: bestStreakDays > 0,
  };

  // 7. Current streak
  const currentStreakVal = typeof currentStreakDays === 'number' ? Math.max(0, currentStreakDays) : 0;
  const currentStreak: PersonalRecordItem = {
    key: 'currentStreak',
    title: 'ACTIVE MOMENTUM',
    metricLabel: 'Current Active Streak',
    displayValue: `${currentStreakVal} days`,
    numericValue: currentStreakVal,
    unit: 'days',
    description: 'Active consecutive training day streak extending through today or yesterday.',
    verified: currentStreakVal > 0,
  };

  return {
    mostSets,
    longestWorkout,
    highestVolume,
    totalWorkouts,
    totalSets,
    bestStreak,
    currentStreak,
  };
}
