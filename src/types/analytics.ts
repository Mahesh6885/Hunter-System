/**
 * Progress Analytics Types for Solo Leveling Fitness RPG
 */

export type AnalyticsTimeRange = '7d' | '30d' | 'all';

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  totalDurationSeconds: number;
  averageDurationMinutes: number;
  averageVolumePerWorkout: number;
  workoutsByDate: Record<string, number>;
}

export interface QuestStreakAnalytics {
  currentStreak: number;
  bestStreak: number;
  totalDaysActive: number;
  totalQuestsCompleted: number;
  completionRatePercent: number;
}

export interface DayNutritionTrendPoint {
  dateKey: string;
  dayLabel: string; // e.g. "Wed 21"
  calories: number;
  caloriesTarget: number;
  protein: number;
  proteinTarget: number;
  waterMl: number;
  waterTargetMl: number;
}

export interface NutritionAnalytics {
  daysLogged: number;
  averageCalories: number;
  averageProtein: number;
  averageWaterMl: number;
  calorieTargetHitDays: number;
  hydrationTargetHitDays: number;
  dailyTrends: DayNutritionTrendPoint[];
}

export interface ProgressAnalyticsSummary {
  timeRange: AnalyticsTimeRange;
  workout: WorkoutAnalytics;
  questStreak: QuestStreakAnalytics;
  nutrition: NutritionAnalytics;
}
