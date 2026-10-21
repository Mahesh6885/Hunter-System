import {
  DailyNutritionTargets,
  DailyNutritionTotals,
  FoodItem,
  LoggedFoodEntry,
  WaterLogEntry,
} from '../types/nutrition';

export const DEFAULT_NUTRITION_TARGETS: DailyNutritionTargets = {
  caloriesTarget: 2400,
  proteinTarget: 160,
  carbsTarget: 260,
  fatTarget: 70,
  waterTargetMl: 2500,
};

export const SAMPLE_FOOD_CATALOGUE: FoodItem[] = [
  {
    id: 'food-chicken-breast',
    name: 'Grilled Chicken Breast',
    servingSize: '100g (cooked)',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    id: 'food-whole-eggs',
    name: 'Whole Eggs',
    servingSize: '2 large eggs (100g)',
    calories: 140,
    protein: 12,
    carbs: 1,
    fat: 10,
  },
  {
    id: 'food-whey-protein',
    name: 'Whey Protein Isolate',
    servingSize: '1 scoop (30g)',
    calories: 120,
    protein: 25,
    carbs: 2,
    fat: 1,
  },
  {
    id: 'food-white-rice',
    name: 'Cooked Jasmine Rice',
    servingSize: '1 cup (158g)',
    calories: 205,
    protein: 4.2,
    carbs: 45,
    fat: 0.4,
  },
  {
    id: 'food-rolled-oats',
    name: 'Rolled Oats (Dry)',
    servingSize: '1/2 cup (40g)',
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 2.5,
  },
  {
    id: 'food-greek-yogurt',
    name: 'Greek Yogurt (0% Fat)',
    servingSize: '1 cup (170g)',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0.5,
  },
  {
    id: 'food-salmon-fillet',
    name: 'Atlantic Salmon Fillet',
    servingSize: '150g (cooked)',
    calories: 280,
    protein: 34,
    carbs: 0,
    fat: 15,
  },
  {
    id: 'food-peanut-butter',
    name: 'Natural Peanut Butter',
    servingSize: '2 tbsp (32g)',
    calories: 190,
    protein: 8,
    carbs: 7,
    fat: 16,
  },
  {
    id: 'food-banana',
    name: 'Fresh Banana',
    servingSize: '1 medium (118g)',
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.3,
  },
  {
    id: 'food-almonds',
    name: 'Raw Whole Almonds',
    servingSize: '1 oz (28g / ~23 nuts)',
    calories: 160,
    protein: 6,
    carbs: 6,
    fat: 14,
  },
  {
    id: 'food-ground-beef',
    name: 'Lean Ground Beef (93/7)',
    servingSize: '100g (cooked)',
    calories: 172,
    protein: 26,
    carbs: 0,
    fat: 7.5,
  },
  {
    id: 'food-sweet-potato',
    name: 'Baked Sweet Potato',
    servingSize: '1 medium (114g)',
    calories: 103,
    protein: 2.3,
    carbs: 24,
    fat: 0.2,
  },
];

/**
 * Calculates total nutrition values for a food item given a serving multiplier.
 * Clamps all values >= 0 and rounds to 1 decimal place (or whole integer for calories).
 */
export function calculateFoodEntryNutrition(
  item: Pick<FoodItem, 'calories' | 'protein' | 'carbs' | 'fat'>,
  servings: number
): { calories: number; protein: number; carbs: number; fat: number } {
  const safeServings = typeof servings === 'number' && !isNaN(servings) && servings > 0 ? servings : 1;

  const rawCal = (item.calories || 0) * safeServings;
  const rawProt = (item.protein || 0) * safeServings;
  const rawCarbs = (item.carbs || 0) * safeServings;
  const rawFat = (item.fat || 0) * safeServings;

  return {
    calories: Math.max(0, Math.round(rawCal)),
    protein: Math.max(0, Math.round(rawProt * 10) / 10),
    carbs: Math.max(0, Math.round(rawCarbs * 10) / 10),
    fat: Math.max(0, Math.round(rawFat * 10) / 10),
  };
}

/**
 * Computes daily totals, remaining targets, and completion percentages.
 */
export function calculateDayTotals(
  entries: LoggedFoodEntry[],
  waterLogs: WaterLogEntry[],
  targets: DailyNutritionTargets,
  dateKey: string
): DailyNutritionTotals {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeWaterLogs = Array.isArray(waterLogs) ? waterLogs : [];

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const entry of safeEntries) {
    totalCalories += typeof entry.calories === 'number' && !isNaN(entry.calories) ? entry.calories : 0;
    totalProtein += typeof entry.protein === 'number' && !isNaN(entry.protein) ? entry.protein : 0;
    totalCarbs += typeof entry.carbs === 'number' && !isNaN(entry.carbs) ? entry.carbs : 0;
    totalFat += typeof entry.fat === 'number' && !isNaN(entry.fat) ? entry.fat : 0;
  }

  let totalWater = 0;
  for (const log of safeWaterLogs) {
    totalWater += typeof log.amountMl === 'number' && !isNaN(log.amountMl) && log.amountMl > 0 ? log.amountMl : 0;
  }

  const calories = Math.round(totalCalories);
  const protein = Math.round(totalProtein * 10) / 10;
  const carbs = Math.round(totalCarbs * 10) / 10;
  const fat = Math.round(totalFat * 10) / 10;
  const waterIntakeMl = Math.round(totalWater);

  const calTarget = Math.max(100, targets.caloriesTarget || DEFAULT_NUTRITION_TARGETS.caloriesTarget);
  const protTarget = Math.max(10, targets.proteinTarget || DEFAULT_NUTRITION_TARGETS.proteinTarget);
  const carbTarget = Math.max(10, targets.carbsTarget || DEFAULT_NUTRITION_TARGETS.carbsTarget);
  const fatTarget = Math.max(5, targets.fatTarget || DEFAULT_NUTRITION_TARGETS.fatTarget);
  const waterTarget = Math.max(250, targets.waterTargetMl || DEFAULT_NUTRITION_TARGETS.waterTargetMl);

  return {
    dateKey,
    calories,
    caloriesTarget: calTarget,
    remainingCalories: Math.max(0, calTarget - calories),
    caloriePercent: Math.min(200, Math.round((calories / calTarget) * 100)),

    protein,
    proteinTarget: protTarget,
    remainingProtein: Math.max(0, Math.round((protTarget - protein) * 10) / 10),
    proteinPercent: Math.min(200, Math.round((protein / protTarget) * 100)),

    carbs,
    carbsTarget: carbTarget,
    remainingCarbs: Math.max(0, Math.round((carbTarget - carbs) * 10) / 10),
    carbsPercent: Math.min(200, Math.round((carbs / carbTarget) * 100)),

    fat,
    fatTarget: fatTarget,
    remainingFat: Math.max(0, Math.round((fatTarget - fat) * 10) / 10),
    fatPercent: Math.min(200, Math.round((fat / fatTarget) * 100)),

    waterIntakeMl,
    waterTargetMl: waterTarget,
    remainingWaterMl: Math.max(0, waterTarget - waterIntakeMl),
    waterPercent: Math.min(200, Math.round((waterIntakeMl / waterTarget) * 100)),

    entryCount: safeEntries.length,
  };
}
