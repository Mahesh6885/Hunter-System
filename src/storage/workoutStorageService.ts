import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutHistoryRecord } from '../types/workout';

export const WORKOUT_HISTORY_KEY = '@hunter_workout_history_v1';

/**
 * Validates and sanitizes a single WorkoutHistoryRecord.
 */
function sanitizeWorkoutRecord(raw: any): WorkoutHistoryRecord | null {
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
    exerciseSummaries: Array.isArray(raw.exerciseSummaries)
      ? raw.exerciseSummaries.map((s: any) => ({
          name: typeof s?.name === 'string' ? s.name : 'Exercise',
          setsCompleted: typeof s?.setsCompleted === 'number' ? s.setsCompleted : 0,
          maxLoadKg: typeof s?.maxLoadKg === 'number' ? s.maxLoadKg : 0,
        }))
      : [],
  };
}

/**
 * Loads workout history from AsyncStorage.
 * Handles missing, empty, or corrupted data gracefully.
 */
export async function loadWorkoutHistory(): Promise<WorkoutHistoryRecord[]> {
  try {
    const rawJson = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
    if (!rawJson) return [];

    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    const sanitizedRecords: WorkoutHistoryRecord[] = [];
    for (const item of parsed) {
      const sanitized = sanitizeWorkoutRecord(item);
      if (sanitized) sanitizedRecords.push(sanitized);
    }

    return sanitizedRecords.sort((a, b) => b.completedAt - a.completedAt);
  } catch (error) {
    console.warn('[Workout Storage] Failed to load history, returning empty list:', error);
    return [];
  }
}

/**
 * Saves a completed workout record to local history.
 * Prepends the newest record and caps history to 100 entries.
 */
export async function saveWorkoutSession(record: WorkoutHistoryRecord): Promise<boolean> {
  try {
    const sanitized = sanitizeWorkoutRecord(record);
    if (!sanitized) return false;

    const existing = await loadWorkoutHistory();
    // Prevent duplicate entries for the same session ID
    const filtered = existing.filter((item) => item.id !== sanitized.id);
    const updated = [sanitized, ...filtered].slice(0, 100);

    await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('[Workout Storage] Failed to persist workout record:', error);
    return false;
  }
}

/**
 * Clears all workout history records.
 */
export async function clearWorkoutHistory(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(WORKOUT_HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('[Workout Storage] Failed to clear history:', error);
    return false;
  }
}
