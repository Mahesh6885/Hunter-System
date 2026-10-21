import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AchievementStoragePayload,
  AchievementUnlockRecord,
} from '../types/achievements';

export const ACHIEVEMENTS_STORAGE_KEY = 'SOLO_HUNTER_ACHIEVEMENTS_V1';

/**
 * Defensively sanitizes raw achievement storage payload.
 */
export function sanitizeAchievementStorage(raw: unknown): AchievementStoragePayload {
  if (!raw || typeof raw !== 'object') {
    return {
      version: 1,
      unlocked: {},
    };
  }

  const rawObj = raw as Record<string, any>;
  const unlocked: Record<string, AchievementUnlockRecord> = {};

  if (rawObj.unlocked && typeof rawObj.unlocked === 'object') {
    for (const [id, rec] of Object.entries(rawObj.unlocked)) {
      if (typeof id === 'string' && rec && typeof rec === 'object') {
        const recObj = rec as Record<string, any>;
        const unlockedAt =
          typeof recObj.unlockedAt === 'number' && !isNaN(recObj.unlockedAt)
            ? recObj.unlockedAt
            : Date.now();
        const xpClaimed = Boolean(recObj.xpClaimed);

        unlocked[id] = {
          unlockedAt,
          xpClaimed,
        };
      }
    }
  }

  return {
    version: 1,
    unlocked,
  };
}

/**
 * Loads unlocked achievements from AsyncStorage.
 */
export async function loadAchievementStorage(): Promise<AchievementStoragePayload> {
  try {
    const raw = await AsyncStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) {
      return sanitizeAchievementStorage(null);
    }
    const parsed = JSON.parse(raw);
    return sanitizeAchievementStorage(parsed);
  } catch (error) {
    console.warn('[AchievementStorage] Failed to load achievements, fallback to default:', error);
    return sanitizeAchievementStorage(null);
  }
}

/**
 * Saves unlocked achievements to AsyncStorage.
 */
export async function saveAchievementStorage(payload: AchievementStoragePayload): Promise<boolean> {
  try {
    const sanitized = sanitizeAchievementStorage(payload);
    await AsyncStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(sanitized));
    return true;
  } catch (error) {
    console.error('[AchievementStorage] Failed to save achievements:', error);
    return false;
  }
}

/**
 * Resets achievements storage.
 */
export async function clearAchievementStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
  } catch (error) {
    console.error('[AchievementStorage] Failed to clear achievements:', error);
  }
}
