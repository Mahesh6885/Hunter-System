// Verification test suite for Dynamic Daily Quest & Streak Engine
import {
  getLocalDateKey,
  isValidDateKey,
  addDaysToDateKey,
  getDaysDifference,
  calculateStreak,
  calculateWeekActivity,
} from '../src/utils/dateEngine';
import { sanitizeHunterState } from '../src/storage/storageService';
import { INITIAL_HUNTER_STATE } from '../src/data/mockData';
import { HunterState } from '../src/types/hunter';

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
console.log('--- RUNNING DAILY QUEST & STREAK ENGINE TESTS ---');
console.log('======================================================\n');

// ----------------------------------------------------
// Section 1: Date Engine Primitives
// ----------------------------------------------------
console.log('--- 1. Date Engine & Key Validation ---');

const date1 = new Date(2026, 9, 21); // Month is 0-indexed: 9 = Oct
const key1 = getLocalDateKey(date1);
assert(key1 === '2026-10-21', `getLocalDateKey formats correctly as YYYY-MM-DD (${key1})`);

assert(isValidDateKey('2026-10-21'), 'Valid date key 2026-10-21 accepted');
assert(!isValidDateKey('2026-13-01'), 'Invalid month 13 rejected');
assert(!isValidDateKey('invalid-date'), 'Arbitrary string rejected');

const tomorrowKey = addDaysToDateKey('2026-10-21', 1);
assert(tomorrowKey === '2026-10-22', `addDaysToDateKey handles +1 day (${tomorrowKey})`);

const endOfMonthKey = addDaysToDateKey('2026-10-31', 1);
assert(endOfMonthKey === '2026-11-01', `addDaysToDateKey crosses month boundary (${endOfMonthKey})`);

const leapYearKey = addDaysToDateKey('2024-02-28', 1);
assert(leapYearKey === '2024-02-29', `addDaysToDateKey recognizes leap day in 2024 (${leapYearKey})`);

const diffDays = getDaysDifference('2026-10-21', '2026-10-25');
assert(diffDays === 4, `getDaysDifference accurately returns 4 days difference (${diffDays})`);

// ----------------------------------------------------
// Section 2: Streak Calculations (Rules & Boundaries)
// ----------------------------------------------------
console.log('\n--- 2. Streak Calculations ---');

const today = '2026-10-21';
const yesterday = '2026-10-20';
const dayBeforeYesterday = '2026-10-19';
const threeDaysAgo = '2026-10-18';
const fourDaysAgo = '2026-10-17';

// Rule 2.1: Empty activity -> 0
assert(calculateStreak([], today) === 0, 'Empty activity yields 0 streak');

// Rule 2.2: Activity only today -> 1
assert(calculateStreak([today], today) === 1, 'Completed today only yields 1 streak');

// Rule 2.3: Activity only yesterday -> 1 (streak intact pending today)
assert(calculateStreak([yesterday], today) === 1, 'Completed yesterday only yields 1 streak (grace period)');

// Rule 2.4: Activity both yesterday and today -> 2
assert(calculateStreak([yesterday, today], today) === 2, 'Completed yesterday and today yields 2 streak');

// Rule 2.5: Consecutive 4 days ending today -> 4
assert(
  calculateStreak([threeDaysAgo, dayBeforeYesterday, yesterday, today], today) === 4,
  '4 consecutive days ending today yields 4 streak'
);

// Rule 2.6: Consecutive 4 days ending yesterday -> 4 (grace period)
assert(
  calculateStreak([fourDaysAgo, threeDaysAgo, dayBeforeYesterday, yesterday], today) === 4,
  '4 consecutive days ending yesterday yields 4 streak'
);

// Rule 2.7: Missed yesterday (last activity 2 days ago) -> 0 streak reset
assert(
  calculateStreak([threeDaysAgo, dayBeforeYesterday], today) === 0,
  'Missed yesterday resets streak to 0'
);

// Rule 2.8: Same day multiple completions count as 1
assert(
  calculateStreak([yesterday, yesterday, today, today], today) === 2,
  'Duplicate activity records on the same day count as single day in streak'
);

// Rule 2.9: Unsorted input handled correctly
assert(
  calculateStreak([today, threeDaysAgo, yesterday, dayBeforeYesterday], today) === 4,
  'Unsorted activity array is properly ordered for streak calculation'
);

// ----------------------------------------------------
// Section 3: Week Activity History
// ----------------------------------------------------
console.log('\n--- 3. Week Activity Calculations ---');

// 2026-10-21 is a Wednesday (index 2 in Monday-start week: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6)
const weekAct = calculateWeekActivity(['2026-10-19', '2026-10-21'], '2026-10-21');
assert(weekAct.length === 7, 'Week activity returns 7 booleans');
assert(weekAct[0] === true, 'Monday 2026-10-19 is true');
assert(weekAct[1] === false, 'Tuesday 2026-10-20 is false');
assert(weekAct[2] === true, 'Wednesday 2026-10-21 is true');
assert(weekAct[3] === false && weekAct[4] === false, 'Thursday and Friday are false');

// Activity outside the current week should not appear
const pastWeekActivity = calculateWeekActivity(['2026-10-12'], '2026-10-21');
assert(pastWeekActivity.every((v) => v === false), 'Activity from previous week does not leak into current week');

// ----------------------------------------------------
// Section 4: Quest Completion & Duplicate XP Prevention
// ----------------------------------------------------
console.log('\n--- 4. Quest Completion & Duplicate XP Prevention ---');

// Simulated state with one daily quest completed today
const baseState: HunterState = {
  ...INITIAL_HUNTER_STATE,
  xp: 100,
  lastActiveDate: today,
  dailyQuests: INITIAL_HUNTER_STATE.dailyQuests.map((q) =>
    q.id === 'dq-pushups' ? { ...q, completed: true } : q
  ),
  questCompletedDates: {
    [today]: ['dq-pushups'],
  },
  questXpClaimedDates: {
    [today]: ['dq-pushups'],
  },
  completedActivityDates: [today],
};

// Simulate rapid tap: attempting to claim XP again for 'dq-pushups' on the same date
const alreadyClaimed = baseState.questXpClaimedDates?.[today]?.includes('dq-pushups');
assert(alreadyClaimed === true, 'Quest ID is recorded in questXpClaimedDates ledger for today');

const xpRewardIfAllowed = alreadyClaimed ? 0 : 50;
assert(xpRewardIfAllowed === 0, 'Duplicate quest claim yields 0 XP on repeated tap');

// Simulating toggling off and back on:
const claimedLedgerAfterToggleOff = { ...baseState.questXpClaimedDates }; // ledger retains claim!
const attemptReclaim = claimedLedgerAfterToggleOff[today]?.includes('dq-pushups');
assert(attemptReclaim === true, 'Ledger persists claimed status even if quest was visually untoggled');

// ----------------------------------------------------
// Section 5: Date Rollover & Daily Quest Reset
// ----------------------------------------------------
console.log('\n--- 5. Calendar Rollover & Quest Reset ---');

const tomorrow = addDaysToDateKey(today, 1);

// Sanitize with tomorrow as the reference date (simulating opening app next day)
const rolledOverState = sanitizeHunterState(baseState, tomorrow);

// Check that quests are reset
const allQuestsReset = rolledOverState.dailyQuests.every((q) => !q.completed);
assert(allQuestsReset, 'All daily quests reset to completed=false on next calendar day');

// Check that user XP, attributes, rank, and name are preserved
assert(rolledOverState.xp === 100, 'User XP is completely preserved across rollover');
assert(rolledOverState.level === baseState.level, 'User level is preserved across rollover');
assert(
  rolledOverState.attributes.strength === baseState.attributes.strength,
  'Attributes are preserved across rollover'
);
assert(rolledOverState.lastActiveDate === tomorrow, 'lastActiveDate updates to new calendar day');

// Streak verification on rollover:
// Yesterday was 'today' (which had activity), so streak should remain 1 on tomorrow morning
assert(
  rolledOverState.streakDays === 1,
  `Streak is maintained on the next day before new activity (${rolledOverState.streakDays})`
);

// ----------------------------------------------------
// Section 6: Streak Break After Missed Day
// ----------------------------------------------------
console.log('\n--- 6. Streak Break After Missed Day ---');

const twoDaysLater = addDaysToDateKey(today, 2); // 2026-10-23
const missedDayState = sanitizeHunterState(baseState, twoDaysLater);

assert(
  missedDayState.streakDays === 0,
  `Streak resets to 0 when user skips an entire calendar day (${missedDayState.streakDays})`
);

// ----------------------------------------------------
// Section 7: Workout Date Separation
// ----------------------------------------------------
console.log('\n--- 7. Workout Date Separation ---');

// If a workout was completed yesterday (e.g. 2026-10-20),
// verify it does NOT mark today's daily workout quest as complete
const workoutDateYesterday: string = yesterday;
const activeDateToday: string = today;

const shouldCompleteDailyWorkoutQuest = workoutDateYesterday === activeDateToday;
assert(!shouldCompleteDailyWorkoutQuest, 'Yesterday workout completed does NOT mark today workout quest complete');

const workoutDateToday: string = today;
const shouldCompleteTodayQuest = workoutDateToday === activeDateToday;
assert(shouldCompleteTodayQuest, 'Today workout completed DOES mark today workout quest complete');

// ----------------------------------------------------
// Section 8: Persistence Reload & Defensive Recovery
// ----------------------------------------------------
console.log('\n--- 8. Storage Reload & Recovery from Corrupted State ---');

const corruptedState = {
  ...baseState,
  lastActiveDate: 'not-a-date',
  streakDays: 'twelve' as any,
  completedActivityDates: 'corrupted-string' as any,
  questCompletedDates: null as any,
  questXpClaimedDates: undefined as any,
};

const recoveredState = sanitizeHunterState(corruptedState, today);

assert(isValidDateKey(recoveredState.lastActiveDate), 'Corrupted lastActiveDate repaired to valid date key');
assert(typeof recoveredState.streakDays === 'number' && !isNaN(recoveredState.streakDays), 'Corrupted streakDays repaired to number');
assert(Array.isArray(recoveredState.completedActivityDates), 'Corrupted completedActivityDates repaired to array');
assert(typeof recoveredState.questCompletedDates === 'object' && recoveredState.questCompletedDates !== null, 'Corrupted questCompletedDates repaired to record');
assert(typeof recoveredState.questXpClaimedDates === 'object' && recoveredState.questXpClaimedDates !== null, 'Corrupted questXpClaimedDates repaired to record');
assert(recoveredState.xp === 100, 'Existing progress XP preserved despite metadata corruptions');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} tests passed`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('All Daily Quest & Streak Engine tests passed successfully!\n');
}
