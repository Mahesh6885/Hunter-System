export type WeightUnit = 'kg' | 'lb';

export interface BodyweightEntry {
  id: string;              // Unique identifier (UUID or timestamp-based)
  dateKey: string;         // Calendar date 'YYYY-MM-DD'
  timestamp: number;       // Unix timestamp (ms)
  weightKg: number;        // Canonical weight in kilograms (rounded to 2 decimal places)
  enteredWeight: number;   // Exactly what user typed
  enteredUnit: WeightUnit; // 'kg' | 'lb'
  note?: string;           // Optional note, e.g., 'Fasted morning weigh-in'
}

export interface BodyScanSummary {
  latestEntry: BodyweightEntry | null;
  previousEntry: BodyweightEntry | null;
  deltaKg: number | null;     // latest.weightKg - previous.weightKg (negative = weight loss)
  minWeightKg: number;
  maxWeightKg: number;
  averageWeightKg: number;
  totalEntriesCount: number;
}

export type BodyScanTimeFilter = '7d' | '30d' | 'all';
