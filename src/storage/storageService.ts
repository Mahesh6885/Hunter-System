import AsyncStorage from '@react-native-async-storage/async-storage';
import { HunterState, HunterRank, HunterAttributes, DailyQuestItem } from '../types/hunter';
import { INITIAL_HUNTER_STATE } from '../data/mockData';
import {
  getLocalDateKey,
  isValidDateKey,
  calculateStreak,
  calculateWeekActivity,
} from '../utils/dateEngine';

export const HUNTER_STORAGE_KEY = '@hunter_system_state_v1';

/**
 * Defensively cleans and merges stored state with default fallback values.
 * Handles schema evolution, corrupted values, and local calendar date rollovers.
 */
export function sanitizeHunterState(raw: unknown, referenceDateKey?: string): HunterState {
  const todayKey = referenceDateKey || getLocalDateKey();

  if (!raw || typeof raw !== 'object') {
    return {
      ...INITIAL_HUNTER_STATE,
      lastActiveDate: todayKey,
      streakDays: calculateStreak(INITIAL_HUNTER_STATE.completedActivityDates, todayKey),
      weekActivity: calculateWeekActivity(INITIAL_HUNTER_STATE.completedActivityDates, todayKey),
    };
  }

  const rawObj = raw as Record<string, any>;

  // Validate rank
  const validRanks: HunterRank[] = ['E', 'D', 'C', 'B', 'A', 'S'];
  const rank: HunterRank = validRanks.includes(rawObj.rank)
    ? rawObj.rank
    : INITIAL_HUNTER_STATE.rank;

  // Validate attributes
  const rawAttrs = rawObj.attributes && typeof rawObj.attributes === 'object' ? rawObj.attributes : {};
  const attributes: HunterAttributes = {
    strength: typeof rawAttrs.strength === 'number' && !isNaN(rawAttrs.strength) ? rawAttrs.strength : INITIAL_HUNTER_STATE.attributes.strength,
    endurance: typeof rawAttrs.endurance === 'number' && !isNaN(rawAttrs.endurance) ? rawAttrs.endurance : INITIAL_HUNTER_STATE.attributes.endurance,
    agility: typeof rawAttrs.agility === 'number' && !isNaN(rawAttrs.agility) ? rawAttrs.agility : INITIAL_HUNTER_STATE.attributes.agility,
    vitality: typeof rawAttrs.vitality === 'number' && !isNaN(rawAttrs.vitality) ? rawAttrs.vitality : INITIAL_HUNTER_STATE.attributes.vitality,
    discipline: typeof rawAttrs.discipline === 'number' && !isNaN(rawAttrs.discipline) ? rawAttrs.discipline : INITIAL_HUNTER_STATE.attributes.discipline,
  };

  // Validate date records
  const lastActiveDate = isValidDateKey(rawObj.lastActiveDate)
    ? rawObj.lastActiveDate
    : todayKey;

  const questCompletedDates: Record<string, string[]> =
    rawObj.questCompletedDates && typeof rawObj.questCompletedDates === 'object'
      ? { ...rawObj.questCompletedDates }
      : {};

  const questXpClaimedDates: Record<string, string[]> =
    rawObj.questXpClaimedDates && typeof rawObj.questXpClaimedDates === 'object'
      ? { ...rawObj.questXpClaimedDates }
      : {};

  const completedActivityDates: string[] = Array.isArray(rawObj.completedActivityDates)
    ? Array.from(new Set(rawObj.completedActivityDates.filter(isValidDateKey)))
    : [...INITIAL_HUNTER_STATE.completedActivityDates];

  // Check if calendar date rolled over to a new day
  const isNewDay = lastActiveDate !== todayKey;

  // Base template of daily quests
  const baseQuests = INITIAL_HUNTER_STATE.dailyQuests;

  let dailyQuests: DailyQuestItem[];

  if (isNewDay) {
    // On a new day, daily quests reset to uncompleted
    dailyQuests = baseQuests.map((q) => ({
      ...q,
      completed: false,
    }));
  } else {
    // On the same day, restore quest completion from today's ledger or raw dailyQuests
    const todayCompletedQuestIds = new Set(questCompletedDates[todayKey] || []);
    
    // Also check if rawObj.dailyQuests had completed: true
    if (Array.isArray(rawObj.dailyQuests)) {
      rawObj.dailyQuests.forEach((q: any) => {
        if (q && q.completed && typeof q.id === 'string') {
          todayCompletedQuestIds.add(q.id);
        }
      });
    }

    dailyQuests = baseQuests.map((q, idx) => ({
      id: q.id,
      label: q.label,
      completed: todayCompletedQuestIds.has(q.id),
      xpReward: q.xpReward,
    }));
  }

  // Calculate real streak and week activity relative to todayKey
  const streakDays = calculateStreak(completedActivityDates, todayKey);
  const weekActivity = calculateWeekActivity(completedActivityDates, todayKey);

  // Numbers validation with strict NaN handling and clamping
  const level = typeof rawObj.level === 'number' && !isNaN(rawObj.level)
    ? Math.max(1, rawObj.level)
    : INITIAL_HUNTER_STATE.level;

  const xp = typeof rawObj.xp === 'number' && !isNaN(rawObj.xp)
    ? Math.max(0, rawObj.xp)
    : INITIAL_HUNTER_STATE.xp;

  const maxXP = typeof rawObj.maxXP === 'number' && !isNaN(rawObj.maxXP)
    ? Math.max(100, rawObj.maxXP)
    : INITIAL_HUNTER_STATE.maxXP;

  const statPoints = typeof rawObj.statPoints === 'number' && !isNaN(rawObj.statPoints)
    ? Math.max(0, rawObj.statPoints)
    : INITIAL_HUNTER_STATE.statPoints;

  return {
    ...INITIAL_HUNTER_STATE,
    name: typeof rawObj.name === 'string' && rawObj.name.trim() ? rawObj.name : INITIAL_HUNTER_STATE.name,
    rank,
    level,
    xp,
    maxXP,
    streakDays,
    weekActivity,
    attributes,
    statPoints,
    dailyQuests,
    training: rawObj.training && typeof rawObj.training === 'object' ? rawObj.training : INITIAL_HUNTER_STATE.training,
    nutrition: rawObj.nutrition && typeof rawObj.nutrition === 'object' ? rawObj.nutrition : INITIAL_HUNTER_STATE.nutrition,
    activeScreen: 'dash', // Reset to dashboard on launch
    currentOverlay: null, // Ephemeral state should never persist
    reducedMotion: Boolean(rawObj.reducedMotion),
    soundEnabled: rawObj.soundEnabled !== false,
    unit: rawObj.unit === 'lb' ? 'lb' : 'kg',
    lastActiveDate: todayKey,
    questCompletedDates,
    questXpClaimedDates,
    completedActivityDates,
  };
}

/**
 * Loads Hunter state from local AsyncStorage.
 * Falls back safely to initial mock state if empty or corrupted.
 */
export async function loadHunterState(referenceDateKey?: string): Promise<HunterState> {
  try {
    const rawJson = await AsyncStorage.getItem(HUNTER_STORAGE_KEY);
    if (!rawJson) {
      return sanitizeHunterState(null, referenceDateKey);
    }
    const parsed = JSON.parse(rawJson);
    return sanitizeHunterState(parsed, referenceDateKey);
  } catch (error) {
    console.warn('[Hunter Storage] Failed to load state from storage, falling back to initial state:', error);
    return sanitizeHunterState(null, referenceDateKey);
  }
}

/**
 * Persists Hunter state to local AsyncStorage.
 * Omits ephemeral UI state like overlays.
 */
export async function saveHunterState(state: HunterState): Promise<boolean> {
  try {
    const stateToPersist: HunterState = {
      ...state,
      currentOverlay: null, // Never persist active modals
    };
    await AsyncStorage.setItem(HUNTER_STORAGE_KEY, JSON.stringify(stateToPersist));
    return true;
  } catch (error) {
    console.error('[Hunter Storage] Failed to persist state:', error);
    return false;
  }
}

/**
 * Clears stored Hunter state and resets to initial values.
 */
export async function clearHunterState(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(HUNTER_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('[Hunter Storage] Failed to clear storage:', error);
    return false;
  }
}
