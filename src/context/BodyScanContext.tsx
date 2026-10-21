import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BodyweightEntry, BodyScanSummary, WeightUnit } from '../types/bodyScan';
import {
  loadBodyScanHistory,
  saveBodyweightEntry,
  updateBodyweightEntry,
  deleteBodyweightEntry,
} from '../storage/bodyScanStorage';
import {
  computeBodyScanSummary,
  validateWeightInput,
  convertWeight,
} from '../utils/weightConversions';
import { getLocalDateKey } from '../utils/dateEngine';

interface BodyScanContextType {
  entries: BodyweightEntry[];
  summary: BodyScanSummary;
  isHydrated: boolean;
  addMeasurement: (
    value: number | string,
    unit: WeightUnit,
    dateKey?: string,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateMeasurement: (
    id: string,
    value: number | string,
    unit: WeightUnit,
    note?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteMeasurement: (id: string) => Promise<boolean>;
  refreshMeasurements: () => Promise<void>;
}

const BodyScanContext = createContext<BodyScanContextType | undefined>(undefined);

export const BodyScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<BodyweightEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const refreshMeasurements = useCallback(async () => {
    try {
      const data = await loadBodyScanHistory();
      setEntries(data);
    } catch (err) {
      console.warn('[BodyScanContext] Failed to load body scan data:', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await refreshMeasurements();
      if (isMounted) {
        setIsHydrated(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshMeasurements]);

  const summary = useMemo(() => {
    return computeBodyScanSummary(entries);
  }, [entries]);

  const addMeasurement = useCallback(
    async (
      value: number | string,
      unit: WeightUnit,
      dateKey?: string,
      note?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const validation = validateWeightInput(value, unit);
      if (!validation.valid || validation.weightKg === undefined || validation.enteredWeight === undefined) {
        return { success: false, error: validation.error || 'Invalid weight value.' };
      }

      const entryDateKey = dateKey || getLocalDateKey();
      const saved = await saveBodyweightEntry({
        dateKey: entryDateKey,
        timestamp: Date.now(),
        weightKg: validation.weightKg,
        enteredWeight: validation.enteredWeight,
        enteredUnit: unit,
        note: note && note.trim().length > 0 ? note.trim() : undefined,
      });

      if (!saved) {
        return { success: false, error: 'Failed to save measurement to local storage.' };
      }

      await refreshMeasurements();
      return { success: true };
    },
    [refreshMeasurements]
  );

  const updateMeasurement = useCallback(
    async (
      id: string,
      value: number | string,
      unit: WeightUnit,
      note?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const validation = validateWeightInput(value, unit);
      if (!validation.valid || validation.weightKg === undefined || validation.enteredWeight === undefined) {
        return { success: false, error: validation.error || 'Invalid weight value.' };
      }

      const updated = await updateBodyweightEntry(id, {
        weightKg: validation.weightKg,
        enteredWeight: validation.enteredWeight,
        enteredUnit: unit,
        note: note !== undefined ? (note.trim().length > 0 ? note.trim() : undefined) : undefined,
      });

      if (!updated) {
        return { success: false, error: 'Measurement record not found or update failed.' };
      }

      await refreshMeasurements();
      return { success: true };
    },
    [refreshMeasurements]
  );

  const deleteMeasurement = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await deleteBodyweightEntry(id);
      if (success) {
        await refreshMeasurements();
      }
      return success;
    },
    [refreshMeasurements]
  );

  return (
    <BodyScanContext.Provider
      value={{
        entries,
        summary,
        isHydrated,
        addMeasurement,
        updateMeasurement,
        deleteMeasurement,
        refreshMeasurements,
      }}>
      {children}
    </BodyScanContext.Provider>
  );
};

export const useBodyScan = (): BodyScanContextType => {
  const context = useContext(BodyScanContext);
  if (!context) {
    throw new Error('useBodyScan must be used within a BodyScanProvider');
  }
  return context;
};
