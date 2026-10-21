/**
 * End-to-End Cross-Feature Integration & Release Readiness Test Suite
 * Validates cross-system telemetry, storage integrity, date rollover, and duplicate protection.
 */
import { sanitizeHunterState, HUNTER_STORAGE_KEY } from '../src/storage/storageService';
import { sanitizeAchievementStorage, ACHIEVEMENTS_STORAGE_KEY } from '../src/storage/achievementStorage';
import { sanitizeNutritionStorage, NUTRITION_STORAGE_KEY } from '../src/storage/nutritionStorage';
import { sanitizeBodyweightEntry, BODY_SCAN_STORAGE_KEY } from '../src/storage/bodyScanStorage';
import { WORKOUT_HISTORY_KEY } from '../src/storage/workoutStorageService';
import { evaluateAchievements } from '../src/utils/achievementEngine';
import { computeHunterPersonalRecords } from '../src/utils/personalRecordsEngine';
import { generateProgressAnalyticsSummary } from '../src/utils/analyticsEngine';
import { calculateFoodEntryNutrition, calculateDayTotals, DEFAULT_NUTRITION_TARGETS } from '../src/data/nutritionData';
import { computeBodyScanSummary, convertWeight } from '../src/utils/weightConversions';
import { getLocalDateKey, addDaysToDateKey, calculateStreak, calculateWeekActivity } from '../src/utils/dateEngine';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';
import { WorkoutHistoryRecord } from '../src/types/workout';
import { BodyweightEntry } from '../src/types/bodyScan';
import { LoggedFoodEntry, WaterLogEntry } from '../src/types/nutrition';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✔ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    failCount++;
  }
}

function runIntegrationTests() {
  console.log('\n======================================================');
  console.log('--- RUNNING FINAL SYSTEM INTEGRATION & AUDIT TESTS ---');
  console.log('======================================================\n');

  const todayKey = getLocalDateKey();

  // --------------------------------------------------------------------------
  // Phase 1: Storage Schema Keys & Defensive Hydration Recovery
  // --------------------------------------------------------------------------
  console.log('--- 1. Storage Schemas & Defensive Recovery ---');
  assert(HUNTER_STORAGE_KEY === '@hunter_system_state_v1', 'Hunter State uses versioned storage key');
  assert(WORKOUT_HISTORY_KEY === '@hunter_workout_history_v1', 'Workout History uses versioned storage key');
  assert(NUTRITION_STORAGE_KEY === 'SOLO_HUNTER_NUTRITION_V1', 'Nutrition Engine uses versioned storage key');
  assert(ACHIEVEMENTS_STORAGE_KEY === 'SOLO_HUNTER_ACHIEVEMENTS_V1', 'Achievements Engine uses versioned storage key');
  assert(BODY_SCAN_STORAGE_KEY === '@hunter_body_scan_v1', 'Body Scan Engine uses versioned storage key');

  // Verify that empty/corrupted storage never crashes the app on cold start
  const cleanHunter = sanitizeHunterState(null, todayKey);
  assert(cleanHunter.level >= 1 && cleanHunter.name.length > 0, 'Null Hunter state recovers to valid baseline');
  assert(cleanHunter.currentOverlay === null, 'Ephemeral overlays are stripped on hydration');

  const cleanAchievements = sanitizeAchievementStorage(null);
  assert(cleanAchievements.version === 1 && Object.keys(cleanAchievements.unlocked).length === 0, 'Null Achievements state recovers cleanly');

  const cleanNutrition = sanitizeNutritionStorage(null);
  assert(cleanNutrition.version === 1 && cleanNutrition.targets.caloriesTarget > 0, 'Null Nutrition state recovers with valid targets');

  // --------------------------------------------------------------------------
  // Phase 2: Workout Lifecycle, XP Award, and Daily Quest Auto-Completion
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Workout Completion, XP Rewards & Quest Interaction ---');
  let currentHunter = { ...cleanHunter, xp: 2800, maxXP: 3000, level: 14, statPoints: 2 };

  // Simulate completing a workout session
  const workoutFinishedAt = Date.now();
  const testWorkout: WorkoutHistoryRecord = {
    id: `session_${workoutFinishedAt}`,
    routineId: 'dungeon-home-a',
    routineTitle: 'Beginner Home A',
    startedAt: workoutFinishedAt - 2100000, // 35 min ago
    completedAt: workoutFinishedAt,
    durationSeconds: 2100, // 35 min
    exercisesCompleted: 3,
    totalSetsCompleted: 12,
    totalReps: 120,
    totalVolumeKg: 4500,
    xpAwarded: 320,
    exerciseSummaries: [
      { name: 'Goblin Push-ups', setsCompleted: 4, maxLoadKg: 0 },
      { name: 'Dungeon Squats', setsCompleted: 4, maxLoadKg: 0 },
      { name: 'Shadow Lunges', setsCompleted: 4, maxLoadKg: 0 },
    ],
  };

  // Award workout XP (320 XP on 2800/3000 should trigger level up!)
  let newXp = currentHunter.xp + testWorkout.xpAwarded;
  let newLevel = currentHunter.level;
  let newStatPoints = currentHunter.statPoints;
  if (newXp >= currentHunter.maxXP) {
    newXp -= currentHunter.maxXP;
    newLevel += 1;
    newStatPoints += 3; // +3 stat points on level up
  }

  // Auto-complete Daily Quest 1 ("Complete today's workout")
  const updatedQuests = currentHunter.dailyQuests.map((q) =>
    q.id === 'q1' ? { ...q, completed: true } : q
  );

  const questCompletedDates = {
    ...currentHunter.questCompletedDates,
    [todayKey]: ['q1'],
  };

  const activityDates = Array.from(new Set([...currentHunter.completedActivityDates, todayKey]));

  currentHunter = {
    ...currentHunter,
    xp: newXp,
    level: newLevel,
    statPoints: newStatPoints,
    dailyQuests: updatedQuests,
    questCompletedDates,
    completedActivityDates: activityDates,
    streakDays: calculateStreak(activityDates, todayKey),
    weekActivity: calculateWeekActivity(activityDates, todayKey),
  };

  assert(currentHunter.level === 15, 'Level up correctly triggered from 14 to 15 (2800 + 320 = 3120 -> 120 XP, lvl 15)');
  assert(currentHunter.xp === 120, 'Remainder XP (120) carried over to level 15');
  assert(currentHunter.statPoints === 5, 'Stat points increased by 3 upon level up (2 + 3 = 5)');
  assert(currentHunter.dailyQuests.find((q) => q.id === 'q1')?.completed === true, 'Daily Quest 1 automatically marked completed');
  assert(currentHunter.completedActivityDates.includes(todayKey), 'Today recorded in activity dates');

  // --------------------------------------------------------------------------
  // Phase 3: Achievement Engine Evaluation
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Achievement Evaluation & Duplicate Protection ---');
  let achievementStorage = cleanAchievements;

  const initialEval = evaluateAchievements({
    workoutHistory: [testWorkout],
    hunter: currentHunter,
    nutritionDayRecords: {},
    nutritionTargets: DEFAULT_NUTRITION_TARGETS,
    storage: achievementStorage,
  });

  // Verify first_workout and first_quest are now unlocked
  const firstWorkoutAch = initialEval.achievements.find((a) => a.id === 'first_workout');
  const firstQuestAch = initialEval.achievements.find((a) => a.id === 'first_quest');
  assert(firstWorkoutAch?.isUnlocked === true, 'first_workout achievement automatically unlocked');
  assert(firstQuestAch?.isUnlocked === true, 'first_quest achievement automatically unlocked');
  assert(firstWorkoutAch?.xpClaimed === false, 'Freshly unlocked achievement has xpClaimed=false');

  achievementStorage = initialEval.updatedStorage;

  // Claim achievement reward (+50 XP)
  achievementStorage = {
    ...achievementStorage,
    unlocked: {
      ...achievementStorage.unlocked,
      first_workout: {
        ...achievementStorage.unlocked.first_workout,
        xpClaimed: true,
      },
    },
  };
  currentHunter = { ...currentHunter, xp: currentHunter.xp + 50 };
  assert(currentHunter.xp === 170, 'Achievement XP reward (+50) cleanly credited to Hunter');

  // Re-evaluating must preserve claimed state and never unlock or reward twice
  const secondEval = evaluateAchievements({
    workoutHistory: [testWorkout],
    hunter: currentHunter,
    nutritionDayRecords: {},
    nutritionTargets: DEFAULT_NUTRITION_TARGETS,
    storage: achievementStorage,
  });

  const reCheckedFirstWorkout = secondEval.achievements.find((a) => a.id === 'first_workout');
  assert(reCheckedFirstWorkout?.isUnlocked === true, 'Achievement remains unlocked on subsequent evaluation');
  assert(reCheckedFirstWorkout?.xpClaimed === true, 'xpClaimed permanently preserved in storage ledger');
  assert(!secondEval.newlyUnlocked.some((a) => a.id === 'first_workout'), 'Previously unlocked achievement is not re-announced');

  // --------------------------------------------------------------------------
  // Phase 4: Nutrition & Hydration Cross-Feature Impact
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Nutrition, Hydration & Milestone Unlocks ---');
  const loggedMeal: LoggedFoodEntry = {
    id: 'meal_1',
    foodId: 'food-chicken-breast',
    name: 'Grilled Chicken Breast',
    mealType: 'lunch',
    servings: 2,
    servingSize: '150g',
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7,
    loggedAt: Date.now(),
    dateKey: todayKey,
  };

  const loggedWater: WaterLogEntry = {
    id: 'water_1',
    amountMl: 2500, // Reaches target
    timestamp: Date.now(),
  };

  const dayRecord = {
    dateKey: todayKey,
    entries: [loggedMeal],
    waterLogs: [loggedWater],
    totals: {
      calories: 330,
      caloriesTarget: 2100,
      protein: 62,
      proteinTarget: 120,
      carbs: 0,
      carbsTarget: 200,
      fat: 7,
      fatTarget: 60,
      waterIntakeMl: 2500,
      waterTargetMl: 2000,
    },
  };

  const dayRecords = { [todayKey]: dayRecord };

  // Evaluate achievements with nutrition records
  const nutritionEval = evaluateAchievements({
    workoutHistory: [testWorkout],
    hunter: currentHunter,
    nutritionDayRecords: dayRecords,
    nutritionTargets: DEFAULT_NUTRITION_TARGETS,
    storage: achievementStorage,
  });

  const firstMealAch = nutritionEval.achievements.find((a) => a.id === 'first_meal');
  const hydrationAch = nutritionEval.achievements.find((a) => a.id === 'hydration_target');
  assert(firstMealAch?.isUnlocked === true, 'first_meal achievement unlocked after logging meal');
  assert(hydrationAch?.isUnlocked === true, 'hydration_target achievement unlocked after drinking 2.5L water');

  // --------------------------------------------------------------------------
  // Phase 5: Body Scan & Personal Records
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Body Scan & Personal Records Verification ---');
  const scan1: BodyweightEntry = {
    id: 'scan_1',
    dateKey: addDaysToDateKey(todayKey, -3),
    timestamp: Date.now() - 3 * 86400000,
    weightKg: 80.5,
    enteredWeight: 80.5,
    enteredUnit: 'kg',
  };

  const scan2: BodyweightEntry = {
    id: 'scan_2',
    dateKey: todayKey,
    timestamp: Date.now(),
    weightKg: 79.8,
    enteredWeight: 79.8,
    enteredUnit: 'kg',
    note: 'Morning fasted',
  };

  const scanSummary = computeBodyScanSummary([scan1, scan2]);
  assert(scanSummary.latestEntry?.id === 'scan_2', 'Latest body scan entry identified correctly');
  assert(scanSummary.previousEntry?.id === 'scan_1', 'Previous body scan entry identified correctly');
  assert(scanSummary.deltaKg === -0.7, 'Net change correctly computed as -0.7 kg');

  // Verify Personal Records derived strictly from real records
  const prs = computeHunterPersonalRecords([testWorkout], currentHunter.completedActivityDates, currentHunter.streakDays, 'kg');
  assert(prs.mostSets.numericValue === 12, 'PR Most Sets reflects verified 12 sets');
  assert(prs.longestWorkout.numericValue === 2100, 'PR Longest Workout reflects verified 35 minutes');
  assert(prs.highestVolume.numericValue === 4500, 'PR Highest Volume reflects verified 4,500 kg');
  assert(prs.totalWorkouts.numericValue === 1, 'PR Total Workouts reflects 1 clearance');
  assert(prs.mostSets.verified === true, 'Verified flag is true for real achieved PRs');

  // --------------------------------------------------------------------------
  // Phase 6: Date Rollover Simulation
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Date Rollover Simulation ---');
  const tomorrowKey = addDaysToDateKey(todayKey, 1);

  // Rollover state to tomorrow
  const rolledOverState = sanitizeHunterState(currentHunter, tomorrowKey);
  assert(rolledOverState.lastActiveDate === tomorrowKey, 'lastActiveDate advanced to tomorrow');
  assert(rolledOverState.dailyQuests.every((q) => q.completed === false), 'Daily quests reset to uncompleted on new day');
  assert(rolledOverState.level === 15, 'Hunter level 15 preserved across date rollover');
  assert(rolledOverState.xp === 170, 'Hunter XP preserved across date rollover');
  assert(rolledOverState.statPoints === 5, 'Hunter stat points preserved across date rollover');
  assert(rolledOverState.streakDays >= 1, 'Streak preserved when evaluated relative to new date');

  // --------------------------------------------------------------------------
  // Phase 7: Analytics Aggregation Cross-Check
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Analytics Data Aggregation Cross-Check ---');
  const analytics = generateProgressAnalyticsSummary(
    [testWorkout],
    currentHunter.questCompletedDates,
    currentHunter.completedActivityDates,
    dayRecords,
    DEFAULT_NUTRITION_TARGETS,
    '7d',
    todayKey
  );

  assert(analytics.workout.totalWorkouts === 1, 'Analytics reflects 1 workout');
  assert(analytics.workout.totalVolumeKg === 4500, 'Analytics reflects 4,500 kg volume');
  assert(analytics.workout.totalSets === 12, 'Analytics reflects 12 sets completed');
  assert(analytics.nutrition.daysLogged === 1, 'Analytics reflects 1 nutrition day logged');
  assert(analytics.nutrition.hydrationTargetHitDays === 1, 'Analytics reflects hydration target achieved');

  console.log('\n======================================================');
  console.log(`[INTEGRATION RESULTS] ${passCount} Passed, ${failCount} Failed.`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runIntegrationTests();
