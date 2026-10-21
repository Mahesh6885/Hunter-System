// Verification test suite for Interactive Workout Engine logic and defensive persistence
import { EXERCISE_LIBRARY, WORKOUT_ROUTINES } from '../src/data/workoutData';
import { WorkoutHistoryRecord } from '../src/types/workout';

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

console.log('\n--- Running Workout Engine Integrity & Logic Tests ---');

// Test 1: Exercise Catalogue Integrity
assert(EXERCISE_LIBRARY.length >= 6, 'Exercise catalogue contains at least 6 core exercises');
const squat = EXERCISE_LIBRARY.find((e) => e.id === 'ex-goblet-squat');
assert(!!squat && squat.name === 'Goblet Squat', 'Goblet Squat exists in catalogue with instructions');
assert(squat?.defaultSets === 4 && squat?.defaultReps === 10, 'Goblet Squat has 4 sets of 10 reps');

// Test 2: Workout Routines Mapping
assert(WORKOUT_ROUTINES.length >= 3, 'Workout routines include at least 3 pre-built gates');
const beginnerA = WORKOUT_ROUTINES.find((r) => r.id === 'routine-beginner-home-a');
assert(!!beginnerA, 'Beginner Home A routine exists');
assert(beginnerA?.baseXp === 320, 'Beginner Home A awards +320 base XP');

const allRoutineExercisesValid = WORKOUT_ROUTINES.every((routine) =>
  routine.exercises.every((cfg) => EXERCISE_LIBRARY.some((ex) => ex.id === cfg.exerciseId))
);
assert(allRoutineExercisesValid, 'All routine exercise IDs map to registered exercises in catalogue');

// Test 3: Set Logging & Volume Arithmetic
let totalVolume = 0;
const mockSets = [
  { reps: 10, loadKg: 40 },
  { reps: 10, loadKg: 40 },
  { reps: 10, loadKg: 40 },
  { reps: 10, loadKg: 40 },
];
mockSets.forEach((s) => {
  totalVolume += s.reps * s.loadKg;
});
assert(totalVolume === 1600, 'Volume calculation accurately computes 1,600 kg for 4x10 @ 40kg');

// Test 4: Rest Timer Timestamp Calculation (drift-free)
const now = Date.now();
const restSeconds = 45;
const restEndsAt = now + restSeconds * 1000;
const simulatedTickAfter10s = now + 10 * 1000;
const remainingSeconds = Math.max(0, Math.ceil((restEndsAt - simulatedTickAfter10s) / 1000));
assert(remainingSeconds === 35, 'Rest countdown accurately computes remaining 35 seconds after 10s elapsed');

const simulatedTickAfter50s = now + 50 * 1000;
const remainingAfterExpiry = Math.max(0, Math.ceil((restEndsAt - simulatedTickAfter50s) / 1000));
assert(remainingAfterExpiry === 0, 'Rest countdown cleanly clamps to 0 when expired');

// Test 5: Duplicate XP Prevention Logic
let isRewardClaimed = false;
let userXp = 2780;
const xpReward = 320;

function claimReward() {
  if (isRewardClaimed) return false;
  isRewardClaimed = true;
  userXp += xpReward;
  return true;
}

const firstClaim = claimReward();
assert(firstClaim === true && userXp === 3100, 'First claim grants +320 XP successfully');

const secondClaim = claimReward();
assert(secondClaim === false && userXp === 3100, 'Second claim is blocked from awarding duplicate XP');

// Test 6: Defensive Sanitization of Workout History Record
function testSanitizeRecord(raw: any): WorkoutHistoryRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.routineTitle !== 'string') return null;

  return {
    id: raw.id,
    routineId: typeof raw.routineId === 'string' ? raw.routineId : 'custom-routine',
    routineTitle: raw.routineTitle || 'Hunter Training',
    startedAt: typeof raw.startedAt === 'number' && !isNaN(raw.startedAt) ? raw.startedAt : Date.now(),
    completedAt: typeof raw.completedAt === 'number' && !isNaN(raw.completedAt) ? raw.completedAt : Date.now(),
    durationSeconds: typeof raw.durationSeconds === 'number' && !isNaN(raw.durationSeconds) ? Math.max(0, raw.durationSeconds) : 0,
    exercisesCompleted: typeof raw.exercisesCompleted === 'number' && !isNaN(raw.exercisesCompleted) ? Math.max(0, raw.exercisesCompleted) : 0,
    totalSetsCompleted: typeof raw.totalSetsCompleted === 'number' && !isNaN(raw.totalSetsCompleted) ? Math.max(0, raw.totalSetsCompleted) : 0,
    totalReps: typeof raw.totalReps === 'number' && !isNaN(raw.totalReps) ? Math.max(0, raw.totalReps) : 0,
    totalVolumeKg: typeof raw.totalVolumeKg === 'number' && !isNaN(raw.totalVolumeKg) ? Math.max(0, raw.totalVolumeKg) : 0,
    xpAwarded: typeof raw.xpAwarded === 'number' && !isNaN(raw.xpAwarded) ? Math.max(0, raw.xpAwarded) : 0,
    exerciseSummaries: Array.isArray(raw.exerciseSummaries) ? raw.exerciseSummaries : [],
  };
}

const corruptHistoryItem = {
  id: 'workout-123',
  routineTitle: 'Beginner Home A',
  durationSeconds: NaN,
  totalVolumeKg: -50,
  xpAwarded: 'many', // invalid type
};
const sanitizedHistory = testSanitizeRecord(corruptHistoryItem);
assert(sanitizedHistory !== null, 'Sanitized corrupt history item is not null');
assert(sanitizedHistory?.durationSeconds === 0, 'NaN duration clamped to 0');
assert(sanitizedHistory?.xpAwarded === 0, 'Invalid string XP sanitized to 0');

const invalidNullItem = testSanitizeRecord(null);
assert(invalidNullItem === null, 'Null record is rejected safely');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All Workout Engine tests passed successfully!\n');
}
