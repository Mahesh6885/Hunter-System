import AsyncStorage from '@react-native-async-storage/async-storage';
import { BodyweightEntry } from '../types/bodyScan';
import { isValidDateKey, getLocalDateKey } from '../utils/dateEngine';
import { validateWeightInput, convertWeight } from '../utils/weightConversions';

export const BODY_SCAN_STORAGE_KEY = '@hunter_body_scan_v1';

/**
 * Defensively cleans and validates a single BodyweightEntry.
 */
export function sanitizeBodyweightEntry(raw: any): BodyweightEntry | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dateKey = isValidDateKey(raw.dateKey) ? raw.dateKey : getLocalDateKey();
  const timestamp = typeof raw.timestamp === 'number' && !isNaN(raw.timestamp) ? raw.timestamp : Date.now();
  const enteredUnit = raw.enteredUnit === 'lb' ? 'lb' : 'kg';

  // Handle enteredWeight and weightKg
  let enteredWeight = typeof raw.enteredWeight === 'number' && !isNaN(raw.enteredWeight) ? raw.enteredWeight : null;
  let weightKg = typeof raw.weightKg === 'number' && !isNaN(raw.weightKg) ? raw.weightKg : null;

  if (weightKg === null && enteredWeight !== null) {
    weightKg = enteredUnit === 'lb' ? convertWeight(enteredWeight, 'lb', 'kg') : enteredWeight;
  } else if (weightKg !== null && enteredWeight === null) {
    enteredWeight = enteredUnit === 'lb' ? convertWeight(weightKg, 'kg', 'lb') : weightKg;
  } else if (weightKg === null && enteredWeight === null) {
    return null; // Invalid entry missing weight
  }

  // Validate range
  const validation = validateWeightInput(weightKg!, 'kg');
  if (!validation.valid || validation.weightKg === undefined) {
    return null;
  }

  const note = typeof raw.note === 'string' ? raw.note.trim() : undefined;

  return {
    id,
    dateKey,
    timestamp,
    weightKg: validation.weightKg,
    enteredWeight: Number(enteredWeight!.toFixed(1)),
    enteredUnit,
    note: note && note.length > 0 ? note : undefined,
  };
}

/**
 * Loads all bodyweight entries from AsyncStorage.
 * Resilient to corrupt JSON or invalid elements.
 */
export async function loadBodyScanHistory(): Promise<BodyweightEntry[]> {
  try {
    const rawJson = await AsyncStorage.getItem(BODY_SCAN_STORAGE_KEY);
    if (!rawJson) return [];

    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];

    const entries: BodyweightEntry[] = [];
    for (const item of parsed) {
      const sanitized = sanitizeBodyweightEntry(item);
      if (sanitized) {
        entries.push(sanitized);
      }
    }

    // Return sorted newest first
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.warn('[BodyScan Storage] Corrupted or unreadable storage, returning empty list:', error);
    return [];
  }
}

/**
 * Saves a new bodyweight entry to AsyncStorage.
 */
export async function saveBodyweightEntry(
  entryData: Omit<BodyweightEntry, 'id'> & { id?: string }
): Promise<BodyweightEntry | null> {
  try {
    const sanitized = sanitizeBodyweightEntry({
      ...entryData,
      id: entryData.id || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });

    if (!sanitized) return null;

    const existing = await loadBodyScanHistory();
    // Prevent duplicate IDs
    const filtered = existing.filter((item) => item.id !== sanitized.id);
    const updated = [sanitized, ...filtered].sort((a, b) => b.timestamp - a.timestamp);

    await AsyncStorage.setItem(BODY_SCAN_STORAGE_KEY, JSON.stringify(updated));
    return sanitized;
  } catch (error) {
    console.error('[BodyScan Storage] Failed to save entry:', error);
    return null;
  }
}

/**
 * Updates an existing bodyweight entry by ID.
 */
export async function updateBodyweightEntry(
  id: string,
  updates: Partial<Omit<BodyweightEntry, 'id'>>
): Promise<BodyweightEntry | null> {
  try {
    const existing = await loadBodyScanHistory();
    const index = existing.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const target = existing[index];
    const updatedRaw = {
      ...target,
      ...updates,
      id,
    };

    const sanitized = sanitizeBodyweightEntry(updatedRaw);
    if (!sanitized) return null;

    existing[index] = sanitized;
    existing.sort((a, b) => b.timestamp - a.timestamp);

    await AsyncStorage.setItem(BODY_SCAN_STORAGE_KEY, JSON.stringify(existing));
    return sanitized;
  } catch (error) {
    console.error('[BodyScan Storage] Failed to update entry:', error);
    return null;
  }
}

/**
 * Deletes a bodyweight entry by ID.
 */
export async function deleteBodyweightEntry(id: string): Promise<boolean> {
  try {
    const existing = await loadBodyScanHistory();
    const filtered = existing.filter((item) => item.id !== id);
    if (filtered.length === existing.length) {
      return false; // Nothing was deleted
    }

    await AsyncStorage.setItem(BODY_SCAN_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('[BodyScan Storage] Failed to delete entry:', error);
    return false;
  }
}

/**
 * Clears all body scan records.
 */
export async function clearBodyScanHistory(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(BODY_SCAN_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('[BodyScan Storage] Failed to clear history:', error);
    return false;
  }
}
