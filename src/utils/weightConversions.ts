import { BodyweightEntry, BodyScanSummary, BodyScanTimeFilter, WeightUnit } from '../types/bodyScan';
import { getLocalDateKey, addDaysToDateKey } from './dateEngine';

export const KG_TO_LB_FACTOR = 2.20462262185;
export const LB_TO_KG_FACTOR = 0.45359237;

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 400;

export const MIN_WEIGHT_LB = 44;
export const MAX_WEIGHT_LB = 880;

/**
 * Converts kg to lb rounded to 1 decimal place.
 */
export function kgToLb(kg: number): number {
  if (typeof kg !== 'number' || isNaN(kg)) return 0;
  return Number((kg * KG_TO_LB_FACTOR).toFixed(1));
}

/**
 * Converts lb to kg rounded to 2 decimal places.
 */
export function lbToKg(lb: number): number {
  if (typeof lb !== 'number' || isNaN(lb)) return 0;
  return Number((lb * LB_TO_KG_FACTOR).toFixed(2));
}

/**
 * Converts a weight from source unit to target unit.
 */
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'kg' && toUnit === 'lb') return kgToLb(weight);
  return lbToKg(weight);
}

/**
 * Validates whether an entered weight value is within biologically plausible bounds.
 */
export function validateWeightInput(
  value: number | string,
  unit: WeightUnit
): { valid: boolean; error?: string; weightKg?: number; enteredWeight?: number } {
  const numeric = typeof value === 'string' ? parseFloat(value.trim()) : value;

  if (typeof numeric !== 'number' || isNaN(numeric)) {
    return { valid: false, error: 'Please enter a valid numeric weight.' };
  }

  if (unit === 'kg') {
    if (numeric < MIN_WEIGHT_KG || numeric > MAX_WEIGHT_KG) {
      return {
        valid: false,
        error: `Weight must be between ${MIN_WEIGHT_KG} kg and ${MAX_WEIGHT_KG} kg.`,
      };
    }
    return {
      valid: true,
      weightKg: Number(numeric.toFixed(2)),
      enteredWeight: Number(numeric.toFixed(2)),
    };
  } else {
    if (numeric < MIN_WEIGHT_LB || numeric > MAX_WEIGHT_LB) {
      return {
        valid: false,
        error: `Weight must be between ${MIN_WEIGHT_LB} lb and ${MAX_WEIGHT_LB} lb.`,
      };
    }
    return {
      valid: true,
      weightKg: lbToKg(numeric),
      enteredWeight: Number(numeric.toFixed(1)),
    };
  }
}

/**
 * Formats weight in kilograms into the desired display unit.
 */
export function formatWeight(weightKg: number, targetUnit: WeightUnit): string {
  if (typeof weightKg !== 'number' || isNaN(weightKg)) return `-- ${targetUnit}`;
  if (targetUnit === 'kg') {
    return `${weightKg.toFixed(1)} kg`;
  }
  return `${kgToLb(weightKg).toFixed(1)} lb`;
}

/**
 * Formats weight delta with leading + / - symbol.
 */
export function formatWeightDelta(deltaKg: number | null, targetUnit: WeightUnit): string {
  if (deltaKg === null || typeof deltaKg !== 'number' || isNaN(deltaKg)) {
    return '0.0';
  }
  const deltaValue = targetUnit === 'kg' ? deltaKg : deltaKg * KG_TO_LB_FACTOR;
  const prefix = deltaValue > 0 ? '+' : deltaValue < 0 ? '' : '±';
  return `${prefix}${deltaValue.toFixed(1)} ${targetUnit}`;
}

/**
 * Computes summary statistics across a set of bodyweight entries.
 */
export function computeBodyScanSummary(entries: BodyweightEntry[]): BodyScanSummary {
  if (!entries || entries.length === 0) {
    return {
      latestEntry: null,
      previousEntry: null,
      deltaKg: null,
      minWeightKg: 0,
      maxWeightKg: 0,
      averageWeightKg: 0,
      totalEntriesCount: 0,
    };
  }

  // Sort by timestamp descending (newest first)
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  const latestEntry = sorted[0];
  const previousEntry = sorted.length > 1 ? sorted[1] : null;

  const deltaKg = previousEntry !== null
    ? Number((latestEntry.weightKg - previousEntry.weightKg).toFixed(2))
    : null;

  const weights = sorted.map((e) => e.weightKg);
  const minWeightKg = Math.min(...weights);
  const maxWeightKg = Math.max(...weights);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const averageWeightKg = Number((sum / weights.length).toFixed(2));

  return {
    latestEntry,
    previousEntry,
    deltaKg,
    minWeightKg,
    maxWeightKg,
    averageWeightKg,
    totalEntriesCount: sorted.length,
  };
}

/**
 * Filters bodyweight entries by time window (7d, 30d, all).
 */
export function filterBodyScanEntries(
  entries: BodyweightEntry[],
  timeFilter: BodyScanTimeFilter,
  referenceDateKey?: string
): BodyweightEntry[] {
  if (!entries || entries.length === 0) return [];
  if (timeFilter === 'all') {
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  }

  const todayKey = referenceDateKey || getLocalDateKey();
  const daysBack = timeFilter === '7d' ? 7 : 30;
  const cutoffDateKey = addDaysToDateKey(todayKey, -daysBack);

  return entries
    .filter((e) => e.dateKey >= cutoffDateKey && e.dateKey <= todayKey)
    .sort((a, b) => b.timestamp - a.timestamp);
}
