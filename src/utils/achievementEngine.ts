import {
  Achievement,
  AchievementDefinition,
  AchievementStoragePayload,
} from '../types/achievements';
import { ACHIEVEMENT_DEFINITIONS } from '../data/achievementData';
import { WorkoutHistoryRecord } from '../types/workout';
import { HunterState } from '../types/hunter';
import { DailyNutritionTargets, NutritionDayRecord } from '../types/nutrition';
import { calculateBestStreak } from './analyticsEngine';

export interface EvaluationContext {
  workoutHistory: WorkoutHistoryRecord[];
  hunter: HunterState;
  nutritionDayRecords: Record<string, NutritionDayRecord>;
  nutritionTargets: DailyNutritionTargets;
  storage: AchievementStoragePayload;
}

export interface EvaluationResult {
  achievements: Achievement[];
  newlyUnlocked: Achievement[];
  updatedStorage: AchievementStoragePayload;
}

/**
 * Evaluates achievement conditions against real stored records.
 * Unlocks achievements only when rules are satisfied.
 * Never resets already-unlocked achievements or permits duplicate XP grants.
 */
export function evaluateAchievements(ctx: EvaluationContext): EvaluationResult {
  const { workoutHistory, hunter, nutritionDayRecords, nutritionTargets, storage } = ctx;

  const safeWorkouts = Array.isArray(workoutHistory) ? workoutHistory : [];
  const safeActivityDates = Array.isArray(hunter.completedActivityDates) ? hunter.completedActivityDates : [];
  const safeDayRecords = nutritionDayRecords && typeof nutritionDayRecords === 'object' ? nutritionDayRecords : {};

  // Pre-calculated metrics
  const totalWorkouts = safeWorkouts.length;
  let totalSets = 0;
  let totalVolumeKg = 0;
  for (const w of safeWorkouts) {
    totalSets += typeof w.totalSetsCompleted === 'number' && !isNaN(w.totalSetsCompleted) ? w.totalSetsCompleted : 0;
    totalVolumeKg += typeof w.totalVolumeKg === 'number' && !isNaN(w.totalVolumeKg) ? w.totalVolumeKg : 0;
  }

  // Quests count
  let totalQuests = 0;
  if (hunter.questCompletedDates && typeof hunter.questCompletedDates === 'object') {
    for (const qIds of Object.values(hunter.questCompletedDates)) {
      if (Array.isArray(qIds)) totalQuests += qIds.length;
    }
  }
  if (Array.isArray(hunter.dailyQuests)) {
    totalQuests += hunter.dailyQuests.filter((q) => q.completed).length;
  }

  // Nutrition count & water hit check
  let totalMealsLogged = 0;
  let hydrationTargetReached = false;
  for (const day of Object.values(safeDayRecords)) {
    if (day && Array.isArray(day.entries)) {
      totalMealsLogged += day.entries.length;
    }
    if (day && Array.isArray(day.waterLogs)) {
      const waterSum = day.waterLogs.reduce((acc, log) => acc + (log.amountMl || 0), 0);
      if (waterSum >= (nutritionTargets?.waterTargetMl || 2500)) {
        hydrationTargetReached = true;
      }
    }
  }

  // Best streak
  const bestStreak = Math.max(hunter.streakDays || 0, calculateBestStreak(safeActivityDates));

  const nextUnlockedRecord = { ...storage.unlocked };
  const newlyUnlocked: Achievement[] = [];
  const achievements: Achievement[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    let currentValue = 0;

    switch (def.id) {
      case 'first_workout':
        currentValue = totalWorkouts;
        break;
      case 'first_quest':
        currentValue = totalQuests;
        break;
      case 'first_meal':
        currentValue = totalMealsLogged;
        break;
      case 'hydration_target':
        currentValue = hydrationTargetReached ? 1 : 0;
        break;
      case 'streak_3':
        currentValue = bestStreak;
        break;
      case 'streak_7':
        currentValue = bestStreak;
        break;
      case 'workouts_5':
        currentValue = totalWorkouts;
        break;
      case 'workouts_10':
        currentValue = totalWorkouts;
        break;
      case 'sets_50':
        currentValue = totalSets;
        break;
      case 'volume_10k':
        currentValue = Math.round(totalVolumeKg);
        break;
      default:
        currentValue = 0;
        break;
    }

    const previouslyUnlocked = storage.unlocked[def.id];
    const conditionMet = currentValue >= def.targetValue;
    const isUnlocked = Boolean(previouslyUnlocked || conditionMet);

    let unlockedAt: number | undefined = previouslyUnlocked?.unlockedAt;
    let xpClaimed = Boolean(previouslyUnlocked?.xpClaimed);

    if (!previouslyUnlocked && conditionMet) {
      // Newly unlocked!
      unlockedAt = Date.now();
      xpClaimed = false;
      nextUnlockedRecord[def.id] = {
        unlockedAt,
        xpClaimed: false,
      };
    }

    const progressPercent = isUnlocked
      ? 100
      : Math.min(100, Math.round((currentValue / def.targetValue) * 100));

    const achievement: Achievement = {
      ...def,
      currentValue,
      progressPercent,
      isUnlocked,
      unlockedAt,
      xpClaimed,
    };

    if (!previouslyUnlocked && conditionMet) {
      newlyUnlocked.push(achievement);
    }

    achievements.push(achievement);
  }

  return {
    achievements,
    newlyUnlocked,
    updatedStorage: {
      version: 1,
      unlocked: nextUnlockedRecord,
    },
  };
}
