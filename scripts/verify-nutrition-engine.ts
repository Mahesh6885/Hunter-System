// Verification test suite for Nutrition & Hydration Engine
import {
  calculateFoodEntryNutrition,
  calculateDayTotals,
  DEFAULT_NUTRITION_TARGETS,
  SAMPLE_FOOD_CATALOGUE,
} from '../src/data/nutritionData';
import {
  sanitizeNutritionStorage,
  NUTRITION_STORAGE_KEY,
} from '../src/storage/nutritionStorage';
import { sanitizeHunterState } from '../src/storage/storageService';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';
import { FoodItem, LoggedFoodEntry, WaterLogEntry } from '../src/types/nutrition';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n======================================================');
console.log('--- RUNNING NUTRITION & HYDRATION ENGINE TESTS ---');
console.log('======================================================\n');

// ----------------------------------------------------
// Section 1: Single & Multiple Serving Calculations
// ----------------------------------------------------
console.log('--- 1. Nutrition Serving Calculations ---');

const chicken: FoodItem = {
  id: 'test-chicken',
  name: 'Chicken Breast',
  servingSize: '100g',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
};

// 1.1: Single serving (1.0)
const singleServing = calculateFoodEntryNutrition(chicken, 1);
assert(singleServing.calories === 165, 'Single serving calories equals 165');
assert(singleServing.protein === 31, 'Single serving protein equals 31g');
assert(singleServing.carbs === 0, 'Single serving carbs equals 0g');
assert(singleServing.fat === 3.6, 'Single serving fat equals 3.6g');

// 1.2: Half serving (0.5)
const halfServing = calculateFoodEntryNutrition(chicken, 0.5);
assert(halfServing.calories === 83, `Half serving calories correctly rounded to 83 (${halfServing.calories})`);
assert(halfServing.protein === 15.5, `Half serving protein correctly equals 15.5g (${halfServing.protein})`);
assert(halfServing.fat === 1.8, `Half serving fat correctly equals 1.8g (${halfServing.fat})`);

// 1.3: Multiple servings (2.5)
const multiServing = calculateFoodEntryNutrition(chicken, 2.5);
assert(multiServing.calories === 413, `2.5 servings calories correctly rounded to 413 (${multiServing.calories})`);
assert(multiServing.protein === 77.5, `2.5 servings protein correctly equals 77.5g (${multiServing.protein})`);
assert(multiServing.fat === 9, `2.5 servings fat correctly equals 9g (${multiServing.fat})`);

// ----------------------------------------------------
// Section 2: Invalid Numeric Input Handling
// ----------------------------------------------------
console.log('\n--- 2. Invalid & Negative Numeric Inputs Handling ---');

// Fallback to 1 serving if 0, negative, or NaN passed
const zeroServings = calculateFoodEntryNutrition(chicken, 0);
assert(zeroServings.calories === 165, '0 servings falls back safely to 1 serving');

const negativeServings = calculateFoodEntryNutrition(chicken, -2);
assert(negativeServings.calories === 165, 'Negative servings falls back safely to 1 serving');

const nanServings = calculateFoodEntryNutrition(chicken, NaN);
assert(nanServings.calories === 165, 'NaN servings falls back safely to 1 serving');

// Negative base food values clamped to >= 0
const corruptFood = { calories: -200, protein: -30, carbs: NaN, fat: -10 };
const sanitizedFoodCalc = calculateFoodEntryNutrition(corruptFood, 1);
assert(sanitizedFoodCalc.calories === 0, 'Negative calories clamped to 0');
assert(sanitizedFoodCalc.protein === 0, 'Negative protein clamped to 0');
assert(sanitizedFoodCalc.carbs === 0, 'NaN carbs sanitized to 0');
assert(sanitizedFoodCalc.fat === 0, 'Negative fat clamped to 0');

// ----------------------------------------------------
// Section 3: Food Entries & Daily Totals Calculation
// ----------------------------------------------------
console.log('\n--- 3. Daily Food Totals & Macro Calculations ---');

const dateA = '2026-10-21';

const entry1: LoggedFoodEntry = {
  id: 'e1',
  name: 'Oats with Whey',
  mealType: 'breakfast',
  servingSize: '1 bowl',
  servings: 1,
  calories: 350,
  protein: 30,
  carbs: 45,
  fat: 5,
  loggedAt: Date.now(),
  dateKey: dateA,
};

const entry2: LoggedFoodEntry = {
  id: 'e2',
  name: 'Chicken Rice Bowl',
  mealType: 'lunch',
  servingSize: '1 plate',
  servings: 1.5,
  calories: 550,
  protein: 48,
  carbs: 65,
  fat: 8,
  loggedAt: Date.now(),
  dateKey: dateA,
};

const entry3: LoggedFoodEntry = {
  id: 'e3',
  name: 'Greek Yogurt & Almonds',
  mealType: 'snack',
  servingSize: '1 cup',
  servings: 1,
  calories: 220,
  protein: 20,
  carbs: 10,
  fat: 11,
  loggedAt: Date.now(),
  dateKey: dateA,
};

const dayEntries = [entry1, entry2, entry3];
const dayTotals = calculateDayTotals(dayEntries, [], DEFAULT_NUTRITION_TARGETS, dateA);

// Expected calories: 350 + 550 + 220 = 1120
assert(dayTotals.calories === 1120, `Total calories accurately computed (${dayTotals.calories} kcal)`);
// Expected protein: 30 + 48 + 20 = 98
assert(dayTotals.protein === 98, `Total protein accurately computed (${dayTotals.protein}g)`);
// Expected carbs: 45 + 65 + 10 = 120
assert(dayTotals.carbs === 120, `Total carbs accurately computed (${dayTotals.carbs}g)`);
// Expected fat: 5 + 8 + 11 = 24
assert(dayTotals.fat === 24, `Total fat accurately computed (${dayTotals.fat}g)`);

// Remaining values based on default targets (2400 kcal, 160g P, 260g C, 70g F)
assert(dayTotals.remainingCalories === 1280, `Remaining calories accurately computed (${dayTotals.remainingCalories} kcal)`);
assert(dayTotals.remainingProtein === 62, `Remaining protein accurately computed (${dayTotals.remainingProtein}g)`);
assert(dayTotals.remainingCarbs === 140, `Remaining carbs accurately computed (${dayTotals.remainingCarbs}g)`);
assert(dayTotals.remainingFat === 46, `Remaining fat accurately computed (${dayTotals.remainingFat}g)`);
assert(dayTotals.entryCount === 3, `Entry count equals 3 (${dayTotals.entryCount})`);

// ----------------------------------------------------
// Section 4: Target Surpassing & Clamping
// ----------------------------------------------------
console.log('\n--- 4. Target Surpassing & Non-Negative Clamping ---');

const surplusEntry: LoggedFoodEntry = {
  id: 'e-feast',
  name: 'Beast Feast',
  mealType: 'dinner',
  servingSize: 'Mega platter',
  servings: 1,
  calories: 3000,
  protein: 250,
  carbs: 350,
  fat: 100,
  loggedAt: Date.now(),
  dateKey: dateA,
};

const surplusTotals = calculateDayTotals([surplusEntry], [], DEFAULT_NUTRITION_TARGETS, dateA);
assert(surplusTotals.remainingCalories === 0, 'Remaining calories clamped to 0 when target exceeded');
assert(surplusTotals.remainingProtein === 0, 'Remaining protein clamped to 0 when target exceeded');
assert(surplusTotals.caloriePercent > 100, 'Calorie percentage reflects > 100% when surplus consumed');

// ----------------------------------------------------
// Section 5: Hydration Addition, Deletion & Correction
// ----------------------------------------------------
console.log('\n--- 5. Hydration Addition, Deletion & Correction ---');

const water1: WaterLogEntry = { id: 'w1', amountMl: 250, timestamp: Date.now() };
const water2: WaterLogEntry = { id: 'w2', amountMl: 500, timestamp: Date.now() + 1000 };
const water3: WaterLogEntry = { id: 'w3', amountMl: 750, timestamp: Date.now() + 2000 };

let waterLogs = [water1, water2, water3];
let hydroTotals = calculateDayTotals([], waterLogs, DEFAULT_NUTRITION_TARGETS, dateA);
assert(hydroTotals.waterIntakeMl === 1500, `Initial water logs sum to 1,500 ml (${hydroTotals.waterIntakeMl} ml)`);
assert(hydroTotals.remainingWaterMl === 1000, `Remaining water equals 1,000 ml (${hydroTotals.remainingWaterMl} ml)`);

// Correct accidental entry by removing water3 (750ml)
waterLogs = waterLogs.filter((w) => w.id !== 'w3');
hydroTotals = calculateDayTotals([], waterLogs, DEFAULT_NUTRITION_TARGETS, dateA);
assert(hydroTotals.waterIntakeMl === 750, `Water corrected after removing entry down to 750 ml (${hydroTotals.waterIntakeMl} ml)`);
assert(hydroTotals.remainingWaterMl === 1750, `Remaining water adjusted to 1,750 ml (${hydroTotals.remainingWaterMl} ml)`);

// Adjust entry amount
waterLogs = waterLogs.map((w) => (w.id === 'w2' ? { ...w, amountMl: 1000 } : w));
hydroTotals = calculateDayTotals([], waterLogs, DEFAULT_NUTRITION_TARGETS, dateA);
assert(hydroTotals.waterIntakeMl === 1250, `Water adjusted to 1,250 ml after modifying entry (${hydroTotals.waterIntakeMl} ml)`);

// ----------------------------------------------------
// Section 6: Date Separation (No Bleed Between Days)
// ----------------------------------------------------
console.log('\n--- 6. Date Separation (No Bleed Between Days) ---');

const dateB = '2026-10-22';
const dayAData = {
  dateKey: dateA,
  entries: dayEntries,
  waterLogs: [water1, water2],
};

const dayBData = {
  dateKey: dateB,
  entries: [],
  waterLogs: [],
};

const totalsA = calculateDayTotals(dayAData.entries, dayAData.waterLogs, DEFAULT_NUTRITION_TARGETS, dateA);
const totalsB = calculateDayTotals(dayBData.entries, dayBData.waterLogs, DEFAULT_NUTRITION_TARGETS, dateB);

assert(totalsA.calories === 1120, 'Date A retains its 1,120 calories');
assert(totalsA.waterIntakeMl === 750, 'Date A retains its 750 ml water');
assert(totalsB.calories === 0, 'Date B starts completely fresh with 0 calories');
assert(totalsB.waterIntakeMl === 0, 'Date B starts completely fresh with 0 ml water');
assert(totalsB.remainingCalories === DEFAULT_NUTRITION_TARGETS.caloriesTarget, 'Date B has full calorie target remaining');

// ----------------------------------------------------
// Section 7: Storage Persistence & Corrupted Data Recovery
// ----------------------------------------------------
console.log('\n--- 7. Storage Persistence & Recovery from Corrupted Payload ---');

assert(NUTRITION_STORAGE_KEY === 'SOLO_HUNTER_NUTRITION_V1', 'Storage key matches SOLO_HUNTER_NUTRITION_V1');

// 7.1: Null or empty storage payload
const nullState = sanitizeNutritionStorage(null);
assert(nullState.version === 1, 'Null state initializes with version 1');
assert(nullState.targets.caloriesTarget === DEFAULT_NUTRITION_TARGETS.caloriesTarget, 'Null state uses default calories target');
assert(Array.isArray(nullState.customFoods) && nullState.customFoods.length === 0, 'Null state initializes empty custom foods');
assert(typeof nullState.dayRecords === 'object', 'Null state initializes dayRecords object');

// 7.2: Corrupted payload recovery
const corruptStorage = {
  version: 'one' as any,
  targets: {
    caloriesTarget: -500,
    proteinTarget: NaN,
    carbsTarget: 'high' as any,
    fatTarget: undefined,
    waterTargetMl: 0,
  },
  customFoods: 'not-an-array' as any,
  dayRecords: {
    'invalid-date': { entries: 'corrupted' as any },
    '2026-10-21': {
      dateKey: '2026-10-21',
      entries: [
        { id: 'c1', name: 'Valid Item', mealType: 'breakfast', servings: 2, calories: 400, protein: 30, carbs: 40, fat: 10 },
        { id: 'c2', name: 'Corrupt Item', mealType: 'invalid-meal' as any, servings: -1, calories: -50, protein: NaN, carbs: 0, fat: 0 },
      ],
      waterLogs: [
        { id: 'w1', amountMl: 500, timestamp: 123456 },
        { id: 'w2', amountMl: -250, timestamp: NaN },
      ],
    },
  },
};

const recovered = sanitizeNutritionStorage(corruptStorage);
assert(recovered.targets.caloriesTarget === DEFAULT_NUTRITION_TARGETS.caloriesTarget, 'Negative calorie target recovered to default');
assert(recovered.targets.proteinTarget === DEFAULT_NUTRITION_TARGETS.proteinTarget, 'NaN protein target recovered to default');
assert(Array.isArray(recovered.customFoods), 'Corrupted customFoods recovered to array');
assert(!recovered.dayRecords['invalid-date'], 'Invalid date key rejected from dayRecords');

const recoveredDay = recovered.dayRecords['2026-10-21'];
assert(!!recoveredDay, 'Valid date key 2026-10-21 preserved in dayRecords');
assert(recoveredDay.entries.length === 2, 'Both entries parsed and sanitized');
assert(recoveredDay.entries[1].mealType === 'snack', 'Invalid mealType sanitized to snack');
assert(recoveredDay.entries[1].servings === 1, 'Negative servings sanitized to 1');
assert(recoveredDay.entries[1].calories === 0, 'Negative calories clamped to 0');
assert(recoveredDay.waterLogs.length === 1, 'Negative water log dropped safely');
assert(recoveredDay.waterLogs[0].amountMl === 500, 'Valid 500ml water log retained');

// ----------------------------------------------------
// Section 8: Preservation of Hunter State & Workout Integrity
// ----------------------------------------------------
console.log('\n--- 8. Preservation of Hunter State & Workout Archives ---');

// Verify that sanitizing HunterState is unaffected by nutrition storage
const hunterState = sanitizeHunterState(INITIAL_HUNTER_STATE, dateA);
assert(hunterState.level === INITIAL_HUNTER_STATE.level, 'Hunter level preserved');
assert(hunterState.attributes.strength === INITIAL_HUNTER_STATE.attributes.strength, 'Hunter attributes preserved');
assert(hunterState.streakDays === INITIAL_HUNTER_STATE.streakDays, 'Hunter streak preserved');
assert(Array.isArray(hunterState.dailyQuests), 'Hunter daily quests preserved');

// Verify Sample Food Catalogue
assert(SAMPLE_FOOD_CATALOGUE.length >= 10, 'Sample food catalogue contains at least 10 whole foods');
const eggItem = SAMPLE_FOOD_CATALOGUE.find((f) => f.id === 'food-whole-eggs');
assert(!!eggItem && eggItem.protein === 12, 'Whole Eggs entry exists with 12g protein per serving');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All Nutrition & Hydration Engine tests passed successfully!\n');
}
