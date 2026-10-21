/**
 * Pure date and streak calculation engine for the Hunter System.
 * Operates on local calendar date strings formatted as 'YYYY-MM-DD'.
 */

/**
 * Returns the local calendar date string 'YYYY-MM-DD' for a given Date or timestamp.
 * Avoids UTC timezone shift errors by using local getters.
 */
export function getLocalDateKey(input?: Date | number): string {
  const d = input instanceof Date ? input : typeof input === 'number' ? new Date(input) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates whether a string matches the 'YYYY-MM-DD' calendar format.
 */
export function isValidDateKey(str: unknown): str is string {
  if (typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const testDate = new Date(y, m - 1, d);
  return testDate.getFullYear() === y && testDate.getMonth() + 1 === m && testDate.getDate() === d;
}

/**
 * Adds or subtracts days from a 'YYYY-MM-DD' date key.
 */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

/**
 * Calculates calendar day difference between two date keys (toKey - fromKey).
 */
export function getDaysDifference(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1).getTime();
  const date2 = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates current active streak from an array of completed activity date keys.
 *
 * STREAK RULES:
 * 1. An active streak is the count of consecutive calendar days ending either on today or yesterday.
 * 2. If activity was completed today: streak counts consecutive days ending today.
 * 3. If activity has not yet been completed today:
 *    - If activity was completed yesterday: streak is intact and counts consecutive days ending yesterday.
 *    - If yesterday was missed: streak is 0.
 * 4. Merely opening the app or logging in NEVER increments the streak.
 * 5. Multiple completions on the same date count as 1 day.
 */
export function calculateStreak(completedDates: string[], referenceDateKey: string = getLocalDateKey()): number {
  if (!Array.isArray(completedDates) || completedDates.length === 0) {
    return 0;
  }

  // Deduplicate and filter valid dates
  const uniqueDatesSet = new Set(completedDates.filter(isValidDateKey));
  if (uniqueDatesSet.size === 0) return 0;

  const todayKey = referenceDateKey;
  const yesterdayKey = addDaysToDateKey(todayKey, -1);

  let currentTargetKey: string;

  // Determine starting point for streak count
  if (uniqueDatesSet.has(todayKey)) {
    currentTargetKey = todayKey;
  } else if (uniqueDatesSet.has(yesterdayKey)) {
    currentTargetKey = yesterdayKey;
  } else {
    // Neither today nor yesterday had completed activity -> streak is broken
    return 0;
  }

  let streak = 0;
  while (uniqueDatesSet.has(currentTargetKey)) {
    streak++;
    currentTargetKey = addDaysToDateKey(currentTargetKey, -1);
  }

  return streak;
}

/**
 * Returns a 7-element boolean array representing activity completion for Monday through Sunday
 * of the week containing the referenceDateKey.
 */
export function calculateWeekActivity(completedDates: string[], referenceDateKey: string = getLocalDateKey()): boolean[] {
  const uniqueDatesSet = new Set((completedDates || []).filter(isValidDateKey));

  const [y, m, d] = referenceDateKey.split('-').map(Number);
  const refDate = new Date(y, m - 1, d);

  // In JavaScript: Sunday is 0, Monday is 1, ..., Saturday is 6
  const dayOfWeek = refDate.getDay();
  // Calculate distance from Monday (ISO week: Monday = 0, Sunday = 6)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekResult: boolean[] = [];

  for (let i = 0; i < 7; i++) {
    const dayKey = addDaysToDateKey(referenceDateKey, mondayOffset + i);
    weekResult.push(uniqueDatesSet.has(dayKey));
  }

  return weekResult;
}
