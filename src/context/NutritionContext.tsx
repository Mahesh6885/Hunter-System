import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  DailyNutritionTargets,
  DailyNutritionTotals,
  FoodItem,
  LoggedFoodEntry,
  MealType,
  NutritionDayRecord,
  NutritionStoragePayload,
  WaterLogEntry,
} from '../types/nutrition';
import {
  DEFAULT_NUTRITION_TARGETS,
  SAMPLE_FOOD_CATALOGUE,
  calculateDayTotals,
  calculateFoodEntryNutrition,
} from '../data/nutritionData';
import {
  loadNutritionStorage,
  saveNutritionStorage,
} from '../storage/nutritionStorage';
import { getLocalDateKey } from '../utils/dateEngine';

interface NutritionContextType {
  isLoaded: boolean;
  currentDateKey: string;
  todayDateKey: string;
  targets: DailyNutritionTargets;
  customFoods: FoodItem[];
  catalogue: FoodItem[];
  dayRecord: NutritionDayRecord;
  dayRecords: Record<string, NutritionDayRecord>;
  totals: DailyNutritionTotals;
  setCurrentDateKey: (dateKey: string) => void;
  goToToday: () => void;
  // Food actions
  addFoodEntry: (
    mealType: MealType,
    food: Pick<FoodItem, 'name' | 'servingSize' | 'calories' | 'protein' | 'carbs' | 'fat'> & { id?: string },
    servings: number
  ) => void;
  editFoodEntry: (
    entryId: string,
    updates: {
      servings?: number;
      name?: string;
      servingSize?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }
  ) => void;
  deleteFoodEntry: (entryId: string) => void;
  // Custom Food actions
  addCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => void;
  deleteCustomFood: (foodId: string) => void;
  // Hydration actions
  addWater: (amountMl: number) => void;
  removeWaterLog: (logId: string) => void;
  updateWaterLog: (logId: string, newAmountMl: number) => void;
  // Target configuration
  updateTargets: (newTargets: Partial<DailyNutritionTargets>) => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [todayDateKey, setTodayDateKey] = useState<string>(getLocalDateKey());
  const [currentDateKey, setCurrentDateKey] = useState<string>(getLocalDateKey());

  const [targets, setTargets] = useState<DailyNutritionTargets>(DEFAULT_NUTRITION_TARGETS);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [dayRecords, setDayRecords] = useState<Record<string, NutritionDayRecord>>({});

  // 1. Initial hydration from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await loadNutritionStorage();
        if (isMounted) {
          setTargets(stored.targets);
          setCustomFoods(stored.customFoods);
          setDayRecords(stored.dayRecords);
          const today = getLocalDateKey();
          setTodayDateKey(today);
          setCurrentDateKey(today);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('[NutritionContext] Hydration error:', err);
        if (isMounted) setIsLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Handle app foregrounding & midnight rollover
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const freshToday = getLocalDateKey();
        setTodayDateKey((prevToday) => {
          if (prevToday !== freshToday) {
            // Rollover occurred
            setCurrentDateKey(freshToday);
            return freshToday;
          }
          return prevToday;
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 3. Save helper that updates storage
  const persistChanges = useCallback(
    (newTargets: DailyNutritionTargets, newCustomFoods: FoodItem[], newDayRecords: Record<string, NutritionDayRecord>) => {
      const payload: NutritionStoragePayload = {
        version: 1,
        targets: newTargets,
        customFoods: newCustomFoods,
        dayRecords: newDayRecords,
      };
      saveNutritionStorage(payload);
    },
    []
  );

  // Active day record for currentDateKey
  const activeDayRecord: NutritionDayRecord = useMemo(() => {
    return (
      dayRecords[currentDateKey] || {
        dateKey: currentDateKey,
        entries: [],
        waterLogs: [],
      }
    );
  }, [dayRecords, currentDateKey]);

  // Combined catalogue (sample whole foods + user custom foods)
  const catalogue: FoodItem[] = useMemo(() => {
    return [...customFoods, ...SAMPLE_FOOD_CATALOGUE];
  }, [customFoods]);

  // Computed totals for current date key
  const totals: DailyNutritionTotals = useMemo(() => {
    return calculateDayTotals(
      activeDayRecord.entries,
      activeDayRecord.waterLogs,
      targets,
      currentDateKey
    );
  }, [activeDayRecord, targets, currentDateKey]);

  // Food Entry Actions
  const addFoodEntry = useCallback(
    (
      mealType: MealType,
      food: Pick<FoodItem, 'name' | 'servingSize' | 'calories' | 'protein' | 'carbs' | 'fat'> & { id?: string },
      servings: number
    ) => {
      const safeServings = typeof servings === 'number' && !isNaN(servings) && servings > 0 ? servings : 1;
      const computed = calculateFoodEntryNutrition(food, safeServings);

      const newEntry: LoggedFoodEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        foodId: food.id,
        name: food.name.trim() || 'Food Item',
        mealType,
        servingSize: food.servingSize || '1 serving',
        servings: safeServings,
        calories: computed.calories,
        protein: computed.protein,
        carbs: computed.carbs,
        fat: computed.fat,
        loggedAt: Date.now(),
        dateKey: currentDateKey,
      };

      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey] || {
          dateKey: currentDateKey,
          entries: [],
          waterLogs: [],
        };
        const updatedDay: NutritionDayRecord = {
          ...existingDay,
          entries: [newEntry, ...existingDay.entries],
        };
        const nextRecords = { ...prev, [currentDateKey]: updatedDay };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  const editFoodEntry = useCallback(
    (
      entryId: string,
      updates: {
        servings?: number;
        name?: string;
        servingSize?: string;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
      }
    ) => {
      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey];
        if (!existingDay) return prev;

        const updatedEntries = existingDay.entries.map((entry) => {
          if (entry.id !== entryId) return entry;

          const newServings =
            typeof updates.servings === 'number' && !isNaN(updates.servings) && updates.servings > 0
              ? updates.servings
              : entry.servings;

          // If calories/macros explicitly passed, use them; otherwise scale if servings changed
          const scaleMultiplier = updates.servings ? updates.servings / entry.servings : 1;

          const calories =
            typeof updates.calories === 'number' && !isNaN(updates.calories) && updates.calories >= 0
              ? Math.round(updates.calories)
              : Math.max(0, Math.round(entry.calories * scaleMultiplier));

          const protein =
            typeof updates.protein === 'number' && !isNaN(updates.protein) && updates.protein >= 0
              ? Math.round(updates.protein * 10) / 10
              : Math.max(0, Math.round(entry.protein * scaleMultiplier * 10) / 10);

          const carbs =
            typeof updates.carbs === 'number' && !isNaN(updates.carbs) && updates.carbs >= 0
              ? Math.round(updates.carbs * 10) / 10
              : Math.max(0, Math.round(entry.carbs * scaleMultiplier * 10) / 10);

          const fat =
            typeof updates.fat === 'number' && !isNaN(updates.fat) && updates.fat >= 0
              ? Math.round(updates.fat * 10) / 10
              : Math.max(0, Math.round(entry.fat * scaleMultiplier * 10) / 10);

          return {
            ...entry,
            name: updates.name?.trim() || entry.name,
            servingSize: updates.servingSize?.trim() || entry.servingSize,
            servings: newServings,
            calories,
            protein,
            carbs,
            fat,
          };
        });

        const nextRecords = {
          ...prev,
          [currentDateKey]: {
            ...existingDay,
            entries: updatedEntries,
          },
        };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  const deleteFoodEntry = useCallback(
    (entryId: string) => {
      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey];
        if (!existingDay) return prev;

        const updatedEntries = existingDay.entries.filter((e) => e.id !== entryId);
        const nextRecords = {
          ...prev,
          [currentDateKey]: {
            ...existingDay,
            entries: updatedEntries,
          },
        };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  // Custom Food Actions
  const addCustomFood = useCallback(
    (food: Omit<FoodItem, 'id' | 'isCustom'>) => {
      const newFood: FoodItem = {
        id: `custom-food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: food.name.trim() || 'Custom Food',
        servingSize: food.servingSize.trim() || '1 serving',
        calories: Math.max(0, Math.round(food.calories || 0)),
        protein: Math.max(0, Math.round((food.protein || 0) * 10) / 10),
        carbs: Math.max(0, Math.round((food.carbs || 0) * 10) / 10),
        fat: Math.max(0, Math.round((food.fat || 0) * 10) / 10),
        isCustom: true,
      };

      setCustomFoods((prev) => {
        const updated = [newFood, ...prev];
        persistChanges(targets, updated, dayRecords);
        return updated;
      });
    },
    [targets, dayRecords, persistChanges]
  );

  const deleteCustomFood = useCallback(
    (foodId: string) => {
      setCustomFoods((prev) => {
        const updated = prev.filter((f) => f.id !== foodId);
        persistChanges(targets, updated, dayRecords);
        return updated;
      });
    },
    [targets, dayRecords, persistChanges]
  );

  // Hydration Actions
  const addWater = useCallback(
    (amountMl: number) => {
      if (typeof amountMl !== 'number' || isNaN(amountMl) || amountMl <= 0) return;

      const newLog: WaterLogEntry = {
        id: `water-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        amountMl: Math.round(amountMl),
        timestamp: Date.now(),
      };

      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey] || {
          dateKey: currentDateKey,
          entries: [],
          waterLogs: [],
        };
        const nextRecords = {
          ...prev,
          [currentDateKey]: {
            ...existingDay,
            waterLogs: [newLog, ...existingDay.waterLogs],
          },
        };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  const removeWaterLog = useCallback(
    (logId: string) => {
      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey];
        if (!existingDay) return prev;

        const nextRecords = {
          ...prev,
          [currentDateKey]: {
            ...existingDay,
            waterLogs: existingDay.waterLogs.filter((w) => w.id !== logId),
          },
        };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  const updateWaterLog = useCallback(
    (logId: string, newAmountMl: number) => {
      if (typeof newAmountMl !== 'number' || isNaN(newAmountMl) || newAmountMl <= 0) return;

      setDayRecords((prev) => {
        const existingDay = prev[currentDateKey];
        if (!existingDay) return prev;

        const nextRecords = {
          ...prev,
          [currentDateKey]: {
            ...existingDay,
            waterLogs: existingDay.waterLogs.map((w) =>
              w.id === logId ? { ...w, amountMl: Math.round(newAmountMl) } : w
            ),
          },
        };
        persistChanges(targets, customFoods, nextRecords);
        return nextRecords;
      });
    },
    [currentDateKey, targets, customFoods, persistChanges]
  );

  // Target Configuration
  const updateTargets = useCallback(
    (newTargets: Partial<DailyNutritionTargets>) => {
      setTargets((prev) => {
        const updated: DailyNutritionTargets = {
          caloriesTarget:
            typeof newTargets.caloriesTarget === 'number' && !isNaN(newTargets.caloriesTarget) && newTargets.caloriesTarget > 0
              ? Math.round(newTargets.caloriesTarget)
              : prev.caloriesTarget,
          proteinTarget:
            typeof newTargets.proteinTarget === 'number' && !isNaN(newTargets.proteinTarget) && newTargets.proteinTarget > 0
              ? Math.round(newTargets.proteinTarget)
              : prev.proteinTarget,
          carbsTarget:
            typeof newTargets.carbsTarget === 'number' && !isNaN(newTargets.carbsTarget) && newTargets.carbsTarget > 0
              ? Math.round(newTargets.carbsTarget)
              : prev.carbsTarget,
          fatTarget:
            typeof newTargets.fatTarget === 'number' && !isNaN(newTargets.fatTarget) && newTargets.fatTarget > 0
              ? Math.round(newTargets.fatTarget)
              : prev.fatTarget,
          waterTargetMl:
            typeof newTargets.waterTargetMl === 'number' && !isNaN(newTargets.waterTargetMl) && newTargets.waterTargetMl > 0
              ? Math.round(newTargets.waterTargetMl)
              : prev.waterTargetMl,
        };
        persistChanges(updated, customFoods, dayRecords);
        return updated;
      });
    },
    [customFoods, dayRecords, persistChanges]
  );

  const goToToday = useCallback(() => {
    const today = getLocalDateKey();
    setCurrentDateKey(today);
  }, []);

  const value = useMemo(
    () => ({
      isLoaded,
      currentDateKey,
      todayDateKey,
      targets,
      customFoods,
      catalogue,
      dayRecord: activeDayRecord,
      dayRecords,
      totals,
      setCurrentDateKey,
      goToToday,
      addFoodEntry,
      editFoodEntry,
      deleteFoodEntry,
      addCustomFood,
      deleteCustomFood,
      addWater,
      removeWaterLog,
      updateWaterLog,
      updateTargets,
    }),
    [
      isLoaded,
      currentDateKey,
      todayDateKey,
      targets,
      customFoods,
      catalogue,
      activeDayRecord,
      dayRecords,
      totals,
      goToToday,
      addFoodEntry,
      editFoodEntry,
      deleteFoodEntry,
      addCustomFood,
      deleteCustomFood,
      addWater,
      removeWaterLog,
      updateWaterLog,
      updateTargets,
    ]
  );

  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
};

export const useNutrition = (): NutritionContextType => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};
