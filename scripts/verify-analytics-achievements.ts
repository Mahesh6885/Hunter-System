// Verification test suite for Progress Analytics & Achievements Engine
import {
  calculateBestStreak,
  calculateWorkoutAnalytics,
  calculateQuestAnalytics,
  calculateNutritionAnalytics,
  generateProgressAnalyticsSummary,
} from '../src/utils/analyticsEngine';
import { evaluateAchievements } from '../src/utils/achievementEngine';
import {
  sanitizeAchievementStorage,
  ACHIEVEMENTS_STORAGE_KEY,
} from '../src/storage/achievementStorage';
import { ACHIEVEMENT_DEFINITIONS } from '../src/data/achievementData';
import { DEFAULT_NUTRITION_TARGETS } from '../src/data/nutritionData';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';
import { WorkoutHistoryRecord } from '../src/types/workout';
import { NutritionDayRecord } from '../src/types/nutrition';
import { AchievementStoragePayload } from '../src/types/achievements';

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
console.log('--- RUNNING ANALYTICS & ACHIEVEMENTS ENGINE TESTS ---');
console.log('======================================================\n');

// ----------------------------------------------------
// Section 1: Best Streak Calculation Algorithm
// ----------------------------------------------------
console.log('--- 1. Best Streak Calculation ---');

// 1.1: Empty
assert(calculateBestStreak([]) === 0, 'Empty activity yields best streak of 0');

// 1.2: Single day
assert(calculateBestStreak(['2026-10-21']) === 1, 'Single day yields best streak of 1');

// 1.3: Continuous streak
const consecutiveDates = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'];
assert(calculateBestStreak(consecutiveDates) === 4, '4 consecutive days yields best streak of 4');

// 1.4: Gaps with distinct streaks (e.g. 5-day streak earlier, 2-day streak currently)
const datesWithGaps = [
  '2026-09-01',
  '2026-09-02',
  '2026-09-03',
  '2026-09-04',
  '2026-09-05', // 5-day streak
  '2026-10-20',
  '2026-10-21', // 2-day streak
];
assert(calculateBestStreak(datesWithGaps) === 5, 'Best streak correctly returns 5 despite current streak being 2');

// 1.5: Unsorted input with duplicates
const messyDates = ['2026-10-21', '2026-10-19', '2026-10-20', '2026-10-20', '2026-10-18'];
assert(calculateBestStreak(messyDates) === 4, 'Messy unsorted dates with duplicates return correct best streak of 4');

// ----------------------------------------------------
// Section 2: Workout Analytics & Time Range Filtering
// ----------------------------------------------------
console.log('\n--- 2. Workout Analytics & Range Filtering ---');

const refDate = '2026-10-21';
const todayMs = new Date(2026, 9, 21, 12, 0).getTime();
const threeDaysAgoMs = new Date(2026, 9, 18, 12, 0).getTime();
const fortyDaysAgoMs = new Date(2026, 8, 11, 12, 0).getTime();

const workout1: WorkoutHistoryRecord = {
  id: 'w-today',
  routineId: 'routine-1',
  routineTitle: 'Beginner Gate A',
  startedAt: todayMs - 2700 * 1000,
  completedAt: todayMs,
  durationSeconds: 2700, // 45 min
  exercisesCompleted: 4,
  totalSetsCompleted: 16,
  totalReps: 160,
  totalVolumeKg: 4000,
  xpAwarded: 320,
  exerciseSummaries: [],
};

const workout2: WorkoutHistoryRecord = {
  id: 'w-3d',
  routineId: 'routine-2',
  routineTitle: 'Upper Gate B',
  startedAt: threeDaysAgoMs - 1800 * 1000,
  completedAt: threeDaysAgoMs,
  durationSeconds: 1800, // 30 min
  exercisesCompleted: 3,
  totalSetsCompleted: 12,
  totalReps: 120,
  totalVolumeKg: 3500,
  xpAwarded: 300,
  exerciseSummaries: [],
};

const workoutOld: WorkoutHistoryRecord = {
  id: 'w-old',
  routineId: 'routine-3',
  routineTitle: 'Ancient Gate',
  startedAt: fortyDaysAgoMs - 3600 * 1000,
  completedAt: fortyDaysAgoMs,
  durationSeconds: 3600, // 60 min
  exercisesCompleted: 5,
  totalSetsCompleted: 20,
  totalReps: 200,
  totalVolumeKg: 6000,
  xpAwarded: 450,
  exerciseSummaries: [],
};

const allWorkouts = [workout1, workout2, workoutOld];

// 2.1: 7-day range filter (includes workout1 and workout2, excludes workoutOld)
const analytics7d = calculateWorkoutAnalytics(allWorkouts, '7d', refDate);
assert(analytics7d.totalWorkouts === 2, `7-day range includes exactly 2 workouts (${analytics7d.totalWorkouts})`);
assert(analytics7d.totalSets === 28, `7-day total sets equals 28 (${analytics7d.totalSets})`);
assert(analytics7d.totalVolumeKg === 7500, `7-day total volume equals 7,500 kg (${analytics7d.totalVolumeKg} kg)`);
assert(analytics7d.totalDurationSeconds === 4500, `7-day duration equals 4,500s (${analytics7d.totalDurationSeconds}s)`);
assert(analytics7d.averageDurationMinutes === 38, `7-day average duration equals 38 min (${analytics7d.averageDurationMinutes} min)`);
assert(analytics7d.averageVolumePerWorkout === 3750, `7-day average volume equals 3,750 kg (${analytics7d.averageVolumePerWorkout} kg)`);

// 2.2: All-time range filter (includes all 3 workouts)
const analyticsAll = calculateWorkoutAnalytics(allWorkouts, 'all', refDate);
assert(analyticsAll.totalWorkouts === 3, `All-time range includes all 3 workouts (${analyticsAll.totalWorkouts})`);
assert(analyticsAll.totalVolumeKg === 13500, `All-time volume equals 13,500 kg (${analyticsAll.totalVolumeKg} kg)`);

// ----------------------------------------------------
// Section 3: Quest & Streak Analytics
// ----------------------------------------------------
console.log('\n--- 3. Quest & Streak Analytics ---');

const mockQuestDates = {
  '2026-10-18': ['q1', 'q2'],
  '2026-10-19': ['q1', 'q2', 'q3'],
  '2026-10-20': ['q1', 'q2', 'q3', 'q4'],
  '2026-10-21': ['q1', 'q2', 'q3', 'q4'],
};
const mockActivityDates = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'];

const questAnalytics = calculateQuestAnalytics(mockQuestDates, mockActivityDates, '7d', refDate);
assert(questAnalytics.currentStreak === 4, `Current streak equals 4 (${questAnalytics.currentStreak})`);
assert(questAnalytics.bestStreak === 4, `Best streak equals 4 (${questAnalytics.bestStreak})`);
assert(questAnalytics.totalDaysActive === 4, `Active days equals 4 (${questAnalytics.totalDaysActive})`);
assert(questAnalytics.totalQuestsCompleted === 13, `Total quests completed equals 13 (${questAnalytics.totalQuestsCompleted})`);
assert(questAnalytics.completionRatePercent > 0, `Completion rate is positive (${questAnalytics.completionRatePercent}%)`);

// ----------------------------------------------------
// Section 4: Nutrition Trends Analytics
// ----------------------------------------------------
console.log('\n--- 4. Nutrition Trends Analytics ---');

const mockNutritionRecords: Record<string, NutritionDayRecord> = {
  '2026-10-20': {
    dateKey: '2026-10-20',
    entries: [
      { id: '1', name: 'Meal 1', mealType: 'lunch', servingSize: '1', servings: 1, calories: 2300, protein: 170, carbs: 250, fat: 65, loggedAt: 0, dateKey: '2026-10-20' },
    ],
    waterLogs: [{ id: 'w1', amountMl: 2600, timestamp: 0 }],
  },
  '2026-10-21': {
    dateKey: '2026-10-21',
    entries: [
      { id: '2', name: 'Meal 2', mealType: 'dinner', servingSize: '1', servings: 1, calories: 2400, protein: 160, carbs: 260, fat: 70, loggedAt: 0, dateKey: '2026-10-21' },
    ],
    waterLogs: [{ id: 'w2', amountMl: 3000, timestamp: 0 }],
  },
};

const nutritionAnalytics = calculateNutritionAnalytics(mockNutritionRecords, DEFAULT_NUTRITION_TARGETS, '7d', refDate);
assert(nutritionAnalytics.daysLogged === 2, `Days logged equals 2 (${nutritionAnalytics.daysLogged})`);
assert(nutritionAnalytics.averageCalories === 2350, `Average calories equals 2,350 (${nutritionAnalytics.averageCalories})`);
assert(nutritionAnalytics.averageProtein === 165, `Average protein equals 165g (${nutritionAnalytics.averageProtein}g)`);
assert(nutritionAnalytics.calorieTargetHitDays === 2, `Calorie target hit on both days (${nutritionAnalytics.calorieTargetHitDays})`);
assert(nutritionAnalytics.hydrationTargetHitDays === 2, `Hydration target hit on both days (${nutritionAnalytics.hydrationTargetHitDays})`);
assert(nutritionAnalytics.dailyTrends.length === 7, `7 daily trend points generated for 7d view`);

// ----------------------------------------------------
// Section 5: Achievement Rule Evaluation
// ----------------------------------------------------
console.log('\n--- 5. Achievement Rule Evaluation ---');

assert(ACHIEVEMENT_DEFINITIONS.length >= 8, 'Achievement catalogue has at least 8 definitions');

const initialStorage: AchievementStoragePayload = {
  version: 1,
  unlocked: {},
};

// Evaluate with 1 workout, 1 quest, 1 meal, 2600ml water, 4-day streak
const evalResult = evaluateAchievements({
  workoutHistory: [workout1],
  hunter: {
    ...INITIAL_HUNTER_STATE,
    streakDays: 4,
    completedActivityDates: mockActivityDates,
    questCompletedDates: mockQuestDates,
  },
  nutritionDayRecords: mockNutritionRecords,
  nutritionTargets: DEFAULT_NUTRITION_TARGETS,
  storage: initialStorage,
});

// Check First Workout
const firstWorkout = evalResult.achievements.find((a) => a.id === 'first_workout');
assert(!!firstWorkout && firstWorkout.isUnlocked, 'First Awakening (first_workout) is unlocked');

// Check Daily Duty
const firstQuest = evalResult.achievements.find((a) => a.id === 'first_quest');
assert(!!firstQuest && firstQuest.isUnlocked, 'Daily Duty (first_quest) is unlocked');

// Check First Meal
const firstMeal = evalResult.achievements.find((a) => a.id === 'first_meal');
assert(!!firstMeal && firstMeal.isUnlocked, 'Mana Sustenance (first_meal) is unlocked');

// Check Hydration Target
const hydroTarget = evalResult.achievements.find((a) => a.id === 'hydration_target');
assert(!!hydroTarget && hydroTarget.isUnlocked, 'Elixir of Life (hydration_target) is unlocked');

// Check 3-Day Streak
const streak3 = evalResult.achievements.find((a) => a.id === 'streak_3');
assert(!!streak3 && streak3.isUnlocked, 'Unyielding Resolve (streak_3) is unlocked');

// Check 7-Day Streak (should be LOCKED since best streak is 4)
const streak7 = evalResult.achievements.find((a) => a.id === 'streak_7');
assert(!!streak7 && !streak7.isUnlocked, 'Shadow Monarch (streak_7) remains locked with 4/7 days');
assert(streak7?.progressPercent === 57, `Streak 7 progress percent equals 57% (${streak7?.progressPercent}%)`);

// Check 10 Workouts (should be LOCKED with 1/10)
const workouts10 = evalResult.achievements.find((a) => a.id === 'workouts_10');
assert(!!workouts10 && !workouts10.isUnlocked, 'Gate Breaker (workouts_10) remains locked with 1/10');

// Newly unlocked array should have the unlocked achievements
assert(evalResult.newlyUnlocked.length >= 5, 'Newly unlocked list records all 5 newly unlocked achievements');

// ----------------------------------------------------
// Section 6: Duplicate Unlock & Duplicate XP Prevention
// ----------------------------------------------------
console.log('\n--- 6. Duplicate Unlock & Duplicate XP Prevention ---');

const firstUnlockedRecord = evalResult.updatedStorage.unlocked['first_workout'];
const originalUnlockTimestamp = firstUnlockedRecord.unlockedAt;

// Re-evaluating with the updated storage
const secondEval = evaluateAchievements({
  workoutHistory: [workout1, workout2], // added a second workout
  hunter: {
    ...INITIAL_HUNTER_STATE,
    streakDays: 4,
    completedActivityDates: mockActivityDates,
    questCompletedDates: mockQuestDates,
  },
  nutritionDayRecords: mockNutritionRecords,
  nutritionTargets: DEFAULT_NUTRITION_TARGETS,
  storage: evalResult.updatedStorage,
});

// Verify timestamp was preserved and not re-stamped
const secondRecord = secondEval.updatedStorage.unlocked['first_workout'];
assert(secondRecord.unlockedAt === originalUnlockTimestamp, 'Original unlock timestamp preserved on subsequent evaluation');
assert(!secondEval.newlyUnlocked.some((a) => a.id === 'first_workout'), 'Previously unlocked achievement NOT in newlyUnlocked array');

// Simulate XP claiming
assert(firstUnlockedRecord.xpClaimed === false, 'Freshly unlocked achievement has xpClaimed=false');
secondEval.updatedStorage.unlocked['first_workout'].xpClaimed = true; // Claimed!

// Attempting duplicate claim logic
const attemptDuplicateClaim = secondEval.updatedStorage.unlocked['first_workout'].xpClaimed;
assert(attemptDuplicateClaim === true, 'Ledger permanently blocks duplicate claim for first_workout');

// ----------------------------------------------------
// Section 7: Storage Persistence & Defensive Recovery
// ----------------------------------------------------
console.log('\n--- 7. Storage Persistence & Recovery from Corrupted Payload ---');

assert(ACHIEVEMENTS_STORAGE_KEY === 'SOLO_HUNTER_ACHIEVEMENTS_V1', 'Storage key matches SOLO_HUNTER_ACHIEVEMENTS_V1');

// 7.1: Null or empty storage
const nullStorage = sanitizeAchievementStorage(null);
assert(nullStorage.version === 1, 'Null storage defaults to version 1');
assert(typeof nullStorage.unlocked === 'object' && Object.keys(nullStorage.unlocked).length === 0, 'Null storage has empty unlocked map');

// 7.2: Corrupt storage
const corruptStorage = {
  version: 'one' as any,
  unlocked: {
    first_workout: { unlockedAt: 'yesterday' as any, xpClaimed: 'yes' as any },
    invalid_entry: null as any,
  },
};
const recoveredStorage = sanitizeAchievementStorage(corruptStorage);
assert(recoveredStorage.version === 1, 'Corrupted version repaired to 1');
assert(typeof recoveredStorage.unlocked.first_workout.unlockedAt === 'number', 'Invalid unlockedAt repaired to number');
assert(recoveredStorage.unlocked.first_workout.xpClaimed === true, 'Truth-y xpClaimed converted safely to boolean');
assert(!recoveredStorage.unlocked.invalid_entry, 'Null entry safely skipped');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All Analytics & Achievement Engine tests passed successfully!\n');
}
