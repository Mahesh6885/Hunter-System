/**
 * Verification test suite for Hunter Profile, Personal Records, and Body Scan Engine.
 */
import {
  kgToLb,
  lbToKg,
  convertWeight,
  validateWeightInput,
  formatWeight,
  formatWeightDelta,
  computeBodyScanSummary,
  filterBodyScanEntries,
} from '../src/utils/weightConversions';
import {
  sanitizeBodyweightEntry,
  BODY_SCAN_STORAGE_KEY,
} from '../src/storage/bodyScanStorage';
import { computeHunterPersonalRecords } from '../src/utils/personalRecordsEngine';
import { BodyweightEntry } from '../src/types/bodyScan';
import { WorkoutHistoryRecord } from '../src/types/workout';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';
import { sanitizeHunterState } from '../src/storage/storageService';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✔ ${testName}`);
    passCount++;
  } else {
    console.error(`  ✖ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    failCount++;
  }
}

function runProfileBodyScanTests() {
  console.log('\n[PROFILE & BODY SCAN SUITE] Testing Weight Conversions, CRUD, PRs, and Profile Engine...\n');

  // --- 1. Weight Unit Conversions ---
  console.log('1. Weight Conversions & Formatting:');
  const kgVal = 80;
  const lbVal = kgToLb(kgVal);
  assert(lbVal === 176.4, '80 kg converts accurately to 176.4 lb');

  const roundTripKg = lbToKg(lbVal);
  assert(Math.abs(roundTripKg - 80) < 0.1, 'Round-trip conversion (80kg -> lb -> kg) is preserved within 0.1 kg');

  assert(convertWeight(100, 'kg', 'kg') === 100, 'Same-unit convertWeight returns identical value');
  assert(convertWeight(100, 'kg', 'lb') === 220.5, 'convertWeight kg to lb converts accurately');
  assert(convertWeight(220.5, 'lb', 'kg') === 100.02, 'convertWeight lb to kg converts accurately');

  assert(formatWeight(75.25, 'kg') === '75.2 kg' || formatWeight(75.25, 'kg') === '75.3 kg', 'formatWeight formats kg to 1 decimal place');
  assert(formatWeight(75, 'lb') === '165.3 lb', 'formatWeight formats lb accurately');

  assert(formatWeightDelta(1.5, 'kg') === '+1.5 kg', 'formatWeightDelta adds + for positive delta');
  assert(formatWeightDelta(-0.8, 'kg') === '-0.8 kg', 'formatWeightDelta preserves - for negative delta');
  assert(formatWeightDelta(0, 'kg') === '±0.0 kg', 'formatWeightDelta formats 0 with ±');
  assert(formatWeightDelta(null, 'kg') === '0.0', 'formatWeightDelta handles null safely');

  // --- 2. Weight Input Validation ---
  console.log('\n2. Weight Input Validation:');
  const validKg = validateWeightInput('78.5', 'kg');
  assert(validKg.valid && validKg.weightKg === 78.5, 'Valid kg input (78.5) accepted');

  const validLb = validateWeightInput('175', 'lb');
  assert(validLb.valid && validLb.weightKg !== undefined && Math.abs(validLb.weightKg - 79.38) < 0.1, 'Valid lb input (175) accepted and converted to kg');

  const invalidLowKg = validateWeightInput(15, 'kg');
  assert(!invalidLowKg.valid && !!invalidLowKg.error, 'Rejects below biological min (<20kg)');

  const invalidHighKg = validateWeightInput(450, 'kg');
  assert(!invalidHighKg.valid && !!invalidHighKg.error, 'Rejects above biological max (>400kg)');

  const invalidLowLb = validateWeightInput(30, 'lb');
  assert(!invalidLowLb.valid && !!invalidLowLb.error, 'Rejects below biological min (<44lb)');

  const invalidHighLb = validateWeightInput(1000, 'lb');
  assert(!invalidHighLb.valid && !!invalidHighLb.error, 'Rejects above biological max (>880lb)');

  const nonNumeric = validateWeightInput('abc', 'kg');
  assert(!nonNumeric.valid && !!nonNumeric.error, 'Rejects non-numeric string input');

  // --- 3. Body Scan Sanitization & Recovery ---
  console.log('\n3. Body Scan Sanitization & Recovery:');
  assert(sanitizeBodyweightEntry(null) === null, 'Sanitizes null to null');
  assert(sanitizeBodyweightEntry({}) === null, 'Sanitizes empty object to null');
  assert(sanitizeBodyweightEntry({ weightKg: 'corrupt' }) === null, 'Sanitizes corrupt weight to null');

  const sanitizedNormal = sanitizeBodyweightEntry({
    id: 'scan-1',
    dateKey: '2026-10-20',
    timestamp: 1729400000000,
    weightKg: 82.5,
    enteredWeight: 82.5,
    enteredUnit: 'kg',
    note: '  Morning weigh-in  ',
  });
  assert(sanitizedNormal !== null && sanitizedNormal.id === 'scan-1', 'Valid entry sanitized cleanly');
  assert(sanitizedNormal?.note === 'Morning weigh-in', 'Sanitizer trims notes');

  const sanitizedLbEntry = sanitizeBodyweightEntry({
    dateKey: '2026-10-21',
    enteredWeight: 176.4,
    enteredUnit: 'lb',
  });
  assert(sanitizedLbEntry !== null && Math.abs(sanitizedLbEntry.weightKg - 80) < 0.1, 'Infers weightKg from enteredWeight and enteredUnit');

  // --- 4. Summary & Historical Trend Engine ---
  console.log('\n4. Summary & Historical Trends:');
  const emptySummary = computeBodyScanSummary([]);
  assert(emptySummary.latestEntry === null && emptySummary.totalEntriesCount === 0, 'Empty list yields clean empty summary');
  assert(emptySummary.deltaKg === null && emptySummary.averageWeightKg === 0, 'Empty summary has null delta');

  const testEntries: BodyweightEntry[] = [
    {
      id: 'e1',
      dateKey: '2026-10-15',
      timestamp: 1000,
      weightKg: 80.0,
      enteredWeight: 80.0,
      enteredUnit: 'kg',
    },
    {
      id: 'e2',
      dateKey: '2026-10-18',
      timestamp: 2000,
      weightKg: 79.5,
      enteredWeight: 79.5,
      enteredUnit: 'kg',
    },
    {
      id: 'e3',
      dateKey: '2026-10-20',
      timestamp: 3000,
      weightKg: 79.0,
      enteredWeight: 79.0,
      enteredUnit: 'kg',
    },
  ];

  const summary = computeBodyScanSummary(testEntries);
  assert(summary.latestEntry?.id === 'e3', 'Latest entry is newest by timestamp (e3)');
  assert(summary.previousEntry?.id === 'e2', 'Previous entry is second newest (e2)');
  assert(summary.deltaKg === -0.5, 'Delta is accurately calculated (79.0 - 79.5 = -0.5 kg)');
  assert(summary.minWeightKg === 79.0 && summary.maxWeightKg === 80.0, 'Min and Max weights calculated correctly');
  assert(summary.averageWeightKg === 79.5, 'Average weight calculated correctly (79.5 kg)');
  assert(summary.totalEntriesCount === 3, 'Total entries count is 3');

  // Filtering
  const filtered7d = filterBodyScanEntries(testEntries, '7d', '2026-10-20');
  assert(filtered7d.length === 3, 'All 3 entries fall within 7 days of 2026-10-20');

  const filteredCutoff = filterBodyScanEntries(testEntries, '7d', '2026-10-30');
  assert(filteredCutoff.length === 0, 'Entries older than 7 days from reference date are excluded');

  // --- 5. Verified Personal Records Engine ---
  console.log('\n5. Verified Personal Records Engine:');
  const emptyPRs = computeHunterPersonalRecords([], [], 0, 'kg');
  assert(!emptyPRs.mostSets.verified && emptyPRs.mostSets.numericValue === 0, 'Empty workouts yield unverified 0 sets PR');
  assert(!emptyPRs.longestWorkout.verified && emptyPRs.longestWorkout.numericValue === 0, 'Empty workouts yield unverified 0 duration PR');
  assert(!emptyPRs.highestVolume.verified && emptyPRs.highestVolume.numericValue === 0, 'Empty workouts yield unverified 0 volume PR');
  assert(emptyPRs.totalWorkouts.numericValue === 0, 'Total workouts is 0');

  const sampleWorkouts: WorkoutHistoryRecord[] = [
    {
      id: 'w1',
      routineId: 'r1',
      routineTitle: 'Dungeon Raid Alpha',
      startedAt: 1000000,
      completedAt: 1001800,
      durationSeconds: 1800, // 30m
      exercisesCompleted: 3,
      totalSetsCompleted: 9,
      totalReps: 90,
      totalVolumeKg: 3600,
      xpAwarded: 150,
      exerciseSummaries: [],
    },
    {
      id: 'w2',
      routineId: 'r2',
      routineTitle: 'Shadow Monarch Trial',
      startedAt: 2000000,
      completedAt: 2003600,
      durationSeconds: 3600, // 60m
      exercisesCompleted: 4,
      totalSetsCompleted: 16,
      totalReps: 160,
      totalVolumeKg: 8500,
      xpAwarded: 300,
      exerciseSummaries: [],
    },
    {
      id: 'w3',
      routineId: 'r3',
      routineTitle: 'Agility Gate',
      startedAt: 3000000,
      completedAt: 3001200,
      durationSeconds: 1200, // 20m
      exercisesCompleted: 3,
      totalSetsCompleted: 12,
      totalReps: 120,
      totalVolumeKg: 2000,
      xpAwarded: 100,
      exerciseSummaries: [],
    },
  ];

  const activityDates = ['2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'];
  const populatedPRs = computeHunterPersonalRecords(sampleWorkouts, activityDates, 4, 'kg');

  assert(populatedPRs.mostSets.verified && populatedPRs.mostSets.numericValue === 16, 'Most sets correctly identifies 16 sets from w2');
  assert(populatedPRs.mostSets.workoutTitle === 'Shadow Monarch Trial', 'Records title of workout where PR was set');
  assert(populatedPRs.longestWorkout.verified && populatedPRs.longestWorkout.numericValue === 3600, 'Longest workout correctly identifies 3600s (60m)');
  assert(populatedPRs.highestVolume.verified && populatedPRs.highestVolume.numericValue === 8500, 'Highest volume correctly identifies 8,500 kg');
  assert(populatedPRs.totalWorkouts.numericValue === 3, 'Total workouts sums to 3');
  assert(populatedPRs.totalSets.numericValue === 37, 'Total sets correctly sums 9 + 16 + 12 = 37');
  assert(populatedPRs.bestStreak.numericValue === 4, 'Best streak correctly calculates 4 consecutive days');
  assert(populatedPRs.currentStreak.numericValue === 4, 'Current streak matches active streak');

  // In lb mode
  const lbPRs = computeHunterPersonalRecords(sampleWorkouts, activityDates, 4, 'lb');
  assert(lbPRs.highestVolume.unit === 'lb', 'Volume PR correctly formatted in lb');

  // --- 6. Hunter State Sanitization & Customization ---
  console.log('\n6. Hunter State Customization & Backwards Compatibility:');
  const baseState = sanitizeHunterState(null);
  assert(baseState.title === 'Shadow Initiate', 'Default title initialized to Shadow Initiate');
  assert(baseState.avatarId === 'monarch', 'Default avatarId initialized to monarch');

  const customState = sanitizeHunterState({
    ...INITIAL_HUNTER_STATE,
    title: 'Monarch of Shadows',
    avatarId: 'daggers',
  });
  assert(customState.title === 'Monarch of Shadows', 'Custom title preserved across sanitization');
  assert(customState.avatarId === 'daggers', 'Custom avatarId preserved across sanitization');

  // Corrupted title/avatar falls back safely
  const corruptedCustom = sanitizeHunterState({
    ...INITIAL_HUNTER_STATE,
    title: '',
    avatarId: null,
  });
  assert(corruptedCustom.title === 'Shadow Initiate', 'Empty title falls back safely');
  assert(corruptedCustom.avatarId === 'monarch', 'Null avatar falls back safely');

  // --- 7. Storage Key Integrity ---
  console.log('\n7. Storage Schema Integrity:');
  assert(BODY_SCAN_STORAGE_KEY === '@hunter_body_scan_v1', 'Body scan uses dedicated versioned storage key');

  // Summary
  console.log('\n==================================================');
  console.log(`[PROFILE & BODY SCAN RESULTS] ${passCount} Passed, ${failCount} Failed.`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runProfileBodyScanTests();
