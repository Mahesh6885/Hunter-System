/**
 * Nutrition and Hydration Engine Types for Solo Leveling Fitness RPG
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  servingSize: string; // e.g. "100g", "1 cup", "1 scoop"
  calories: number; // kcal per serving
  protein: number; // grams per serving
  carbs: number; // grams per serving
  fat: number; // grams per serving
  isCustom?: boolean; // true if created by user
}

export interface LoggedFoodEntry {
  id: string;
  foodId?: string;
  name: string;
  mealType: MealType;
  servingSize: string;
  servings: number; // positive multiplier, e.g. 1, 1.5, 2
  calories: number; // total for logged servings
  protein: number; // total grams
  carbs: number; // total grams
  fat: number; // total grams
  loggedAt: number; // epoch timestamp ms
  dateKey: string; // 'YYYY-MM-DD'
}

export interface WaterLogEntry {
  id: string;
  amountMl: number; // positive ml
  timestamp: number; // epoch ms
}

export interface DailyNutritionTargets {
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTargetMl: number;
}

export interface NutritionDayRecord {
  dateKey: string; // 'YYYY-MM-DD'
  entries: LoggedFoodEntry[];
  waterLogs: WaterLogEntry[];
}

export interface DailyNutritionTotals {
  dateKey: string;
  calories: number;
  caloriesTarget: number;
  remainingCalories: number;
  caloriePercent: number;

  protein: number;
  proteinTarget: number;
  remainingProtein: number;
  proteinPercent: number;

  carbs: number;
  carbsTarget: number;
  remainingCarbs: number;
  carbsPercent: number;

  fat: number;
  fatTarget: number;
  remainingFat: number;
  fatPercent: number;

  waterIntakeMl: number;
  waterTargetMl: number;
  remainingWaterMl: number;
  waterPercent: number;

  entryCount: number;
}

export interface NutritionStoragePayload {
  version: number;
  targets: DailyNutritionTargets;
  customFoods: FoodItem[];
  dayRecords: Record<string, NutritionDayRecord>;
}
