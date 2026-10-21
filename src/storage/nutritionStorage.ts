import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyNutritionTargets,
  FoodItem,
  LoggedFoodEntry,
  NutritionDayRecord,
  NutritionStoragePayload,
  WaterLogEntry,
} from '../types/nutrition';
import { DEFAULT_NUTRITION_TARGETS } from '../data/nutritionData';
import { isValidDateKey } from '../utils/dateEngine';

export const NUTRITION_STORAGE_KEY = 'SOLO_HUNTER_NUTRITION_V1';

/**
 * Defensively sanitizes raw parsed nutrition payload.
 * Recovers safely from malformed, missing, or corrupted data.
 */
export function sanitizeNutritionStorage(raw: unknown): NutritionStoragePayload {
  if (!raw || typeof raw !== 'object') {
    return {
      version: 1,
      targets: { ...DEFAULT_NUTRITION_TARGETS },
      customFoods: [],
      dayRecords: {},
    };
  }

  const rawObj = raw as Record<string, any>;

  // 1. Sanitize Targets
  const rawTargets = rawObj.targets && typeof rawObj.targets === 'object' ? rawObj.targets : {};
  const targets: DailyNutritionTargets = {
    caloriesTarget:
      typeof rawTargets.caloriesTarget === 'number' && !isNaN(rawTargets.caloriesTarget) && rawTargets.caloriesTarget > 0
        ? Math.round(rawTargets.caloriesTarget)
        : DEFAULT_NUTRITION_TARGETS.caloriesTarget,
    proteinTarget:
      typeof rawTargets.proteinTarget === 'number' && !isNaN(rawTargets.proteinTarget) && rawTargets.proteinTarget > 0
        ? Math.round(rawTargets.proteinTarget)
        : DEFAULT_NUTRITION_TARGETS.proteinTarget,
    carbsTarget:
      typeof rawTargets.carbsTarget === 'number' && !isNaN(rawTargets.carbsTarget) && rawTargets.carbsTarget > 0
        ? Math.round(rawTargets.carbsTarget)
        : DEFAULT_NUTRITION_TARGETS.carbsTarget,
    fatTarget:
      typeof rawTargets.fatTarget === 'number' && !isNaN(rawTargets.fatTarget) && rawTargets.fatTarget > 0
        ? Math.round(rawTargets.fatTarget)
        : DEFAULT_NUTRITION_TARGETS.fatTarget,
    waterTargetMl:
      typeof rawTargets.waterTargetMl === 'number' && !isNaN(rawTargets.waterTargetMl) && rawTargets.waterTargetMl > 0
        ? Math.round(rawTargets.waterTargetMl)
        : DEFAULT_NUTRITION_TARGETS.waterTargetMl,
  };

  // 2. Sanitize Custom Foods
  const customFoods: FoodItem[] = [];
  if (Array.isArray(rawObj.customFoods)) {
    for (const food of rawObj.customFoods) {
      if (food && typeof food === 'object' && typeof food.id === 'string' && typeof food.name === 'string') {
        customFoods.push({
          id: food.id,
          name: food.name.trim() || 'Custom Food',
          servingSize: typeof food.servingSize === 'string' && food.servingSize.trim() ? food.servingSize : '1 serving',
          calories: typeof food.calories === 'number' && !isNaN(food.calories) ? Math.max(0, Math.round(food.calories)) : 0,
          protein: typeof food.protein === 'number' && !isNaN(food.protein) ? Math.max(0, Math.round(food.protein * 10) / 10) : 0,
          carbs: typeof food.carbs === 'number' && !isNaN(food.carbs) ? Math.max(0, Math.round(food.carbs * 10) / 10) : 0,
          fat: typeof food.fat === 'number' && !isNaN(food.fat) ? Math.max(0, Math.round(food.fat * 10) / 10) : 0,
          isCustom: true,
        });
      }
    }
  }

  // 3. Sanitize Day Records (keyed by YYYY-MM-DD)
  const dayRecords: Record<string, NutritionDayRecord> = {};
  if (rawObj.dayRecords && typeof rawObj.dayRecords === 'object') {
    for (const [dateKey, rawDay] of Object.entries(rawObj.dayRecords)) {
      if (!isValidDateKey(dateKey) || !rawDay || typeof rawDay !== 'object') {
        continue;
      }

      const dayObj = rawDay as Record<string, any>;
      const entries: LoggedFoodEntry[] = [];
      if (Array.isArray(dayObj.entries)) {
        for (const e of dayObj.entries) {
          if (e && typeof e === 'object' && typeof e.id === 'string' && typeof e.name === 'string') {
            const mealType = ['breakfast', 'lunch', 'dinner', 'snack'].includes(e.mealType)
              ? e.mealType
              : 'snack';
            const servings = typeof e.servings === 'number' && !isNaN(e.servings) && e.servings > 0
              ? e.servings
              : 1;

            entries.push({
              id: e.id,
              foodId: typeof e.foodId === 'string' ? e.foodId : undefined,
              name: e.name.trim() || 'Food Item',
              mealType,
              servingSize: typeof e.servingSize === 'string' && e.servingSize.trim() ? e.servingSize : '1 serving',
              servings,
              calories: typeof e.calories === 'number' && !isNaN(e.calories) ? Math.max(0, Math.round(e.calories)) : 0,
              protein: typeof e.protein === 'number' && !isNaN(e.protein) ? Math.max(0, Math.round(e.protein * 10) / 10) : 0,
              carbs: typeof e.carbs === 'number' && !isNaN(e.carbs) ? Math.max(0, Math.round(e.carbs * 10) / 10) : 0,
              fat: typeof e.fat === 'number' && !isNaN(e.fat) ? Math.max(0, Math.round(e.fat * 10) / 10) : 0,
              loggedAt: typeof e.loggedAt === 'number' && !isNaN(e.loggedAt) ? e.loggedAt : Date.now(),
              dateKey,
            });
          }
        }
      }

      const waterLogs: WaterLogEntry[] = [];
      if (Array.isArray(dayObj.waterLogs)) {
        for (const w of dayObj.waterLogs) {
          if (w && typeof w === 'object' && typeof w.id === 'string') {
            const amountMl = typeof w.amountMl === 'number' && !isNaN(w.amountMl) && w.amountMl > 0
              ? Math.round(w.amountMl)
              : 0;
            if (amountMl > 0) {
              waterLogs.push({
                id: w.id,
                amountMl,
                timestamp: typeof w.timestamp === 'number' && !isNaN(w.timestamp) ? w.timestamp : Date.now(),
              });
            }
          }
        }
      }

      dayRecords[dateKey] = {
        dateKey,
        entries,
        waterLogs,
      };
    }
  }

  return {
    version: 1,
    targets,
    customFoods,
    dayRecords,
  };
}

/**
 * Loads nutrition and hydration state from AsyncStorage.
 */
export async function loadNutritionStorage(): Promise<NutritionStoragePayload> {
  try {
    const raw = await AsyncStorage.getItem(NUTRITION_STORAGE_KEY);
    if (!raw) {
      return sanitizeNutritionStorage(null);
    }
    const parsed = JSON.parse(raw);
    return sanitizeNutritionStorage(parsed);
  } catch (error) {
    console.warn('[NutritionStorage] Failed to load data, using default state:', error);
    return sanitizeNutritionStorage(null);
  }
}

/**
 * Saves nutrition and hydration state to AsyncStorage.
 */
export async function saveNutritionStorage(payload: NutritionStoragePayload): Promise<boolean> {
  try {
    const sanitized = sanitizeNutritionStorage(payload);
    await AsyncStorage.setItem(NUTRITION_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.error('[NutritionStorage] Failed to save state:', error);
    return false;
  }
}

/**
 * Resets nutrition state.
 */
export async function clearNutritionStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NUTRITION_STORAGE_KEY);
  } catch (error) {
    console.error('[NutritionStorage] Failed to clear storage:', error);
  }
}
