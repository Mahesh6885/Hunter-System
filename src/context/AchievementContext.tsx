import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Achievement, AchievementStoragePayload } from '../types/achievements';
import { loadAchievementStorage, saveAchievementStorage } from '../storage/achievementStorage';
import { evaluateAchievements } from '../utils/achievementEngine';
import { useHunter } from './HunterContext';
import { useWorkout } from './WorkoutContext';
import { useNutrition } from './NutritionContext';

interface AchievementContextType {
  isLoaded: boolean;
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  totalXpClaimed: number;
  claimAchievementXp: (id: string) => Promise<{ success: boolean; xpAwarded: number }>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hunter, addXP } = useHunter();
  const { history: workoutHistory } = useWorkout();
  const { targets: nutritionTargets, dayRecords: nutritionDayRecords } = useNutrition();

  const [isLoaded, setIsLoaded] = useState(false);
  const [storage, setStorage] = useState<AchievementStoragePayload>({
    version: 1,
    unlocked: {},
  });
  const claimingIdsRef = useRef<Set<string>>(new Set());

  // 1. Initial hydration from storage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await loadAchievementStorage();
        if (isMounted) {
          setStorage(stored);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('[AchievementContext] Hydration error:', err);
        if (isMounted) setIsLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Evaluate achievements whenever hunter, workouts, or targets update
  const evaluationResult = useMemo(() => {
    return evaluateAchievements({
      workoutHistory,
      hunter,
      nutritionDayRecords,
      nutritionTargets,
      storage,
    });
  }, [workoutHistory, hunter, nutritionDayRecords, nutritionTargets, storage]);

  // If new achievements were unlocked during evaluation, persist to storage
  useEffect(() => {
    if (evaluationResult.newlyUnlocked.length > 0) {
      setStorage(evaluationResult.updatedStorage);
      saveAchievementStorage(evaluationResult.updatedStorage);
    }
  }, [evaluationResult.newlyUnlocked, evaluationResult.updatedStorage]);

  // 3. Claim XP for an unlocked achievement
  const claimAchievementXp = useCallback(
    async (id: string): Promise<{ success: boolean; xpAwarded: number }> => {
      if (claimingIdsRef.current.has(id)) {
        return { success: false, xpAwarded: 0 };
      }

      const achievement = evaluationResult.achievements.find((a) => a.id === id);
      if (!achievement || !achievement.isUnlocked) {
        return { success: false, xpAwarded: 0 };
      }

      // Check if already claimed
      const existingRecord = storage.unlocked[id];
      if (existingRecord?.xpClaimed) {
        return { success: false, xpAwarded: 0 };
      }

      claimingIdsRef.current.add(id);
      try {
        // Mark claimed and persist
        const updatedStorage: AchievementStoragePayload = {
          ...storage,
          unlocked: {
            ...storage.unlocked,
            [id]: {
              unlockedAt: existingRecord?.unlockedAt || Date.now(),
              xpClaimed: true,
            },
          },
        };

        setStorage(updatedStorage);
        await saveAchievementStorage(updatedStorage);

        // Award XP to hunter
        addXP(achievement.xpReward);

        return { success: true, xpAwarded: achievement.xpReward };
      } finally {
        claimingIdsRef.current.delete(id);
      }
    },
    [evaluationResult.achievements, storage, addXP]
  );

  const unlockedCount = useMemo(() => {
    return evaluationResult.achievements.filter((a) => a.isUnlocked).length;
  }, [evaluationResult.achievements]);

  const totalCount = evaluationResult.achievements.length;

  const totalXpClaimed = useMemo(() => {
    return evaluationResult.achievements
      .filter((a) => a.isUnlocked && a.xpClaimed)
      .reduce((acc, a) => acc + a.xpReward, 0);
  }, [evaluationResult.achievements]);

  const value = useMemo(
    () => ({
      isLoaded,
      achievements: evaluationResult.achievements,
      unlockedCount,
      totalCount,
      totalXpClaimed,
      claimAchievementXp,
    }),
    [
      isLoaded,
      evaluationResult.achievements,
      unlockedCount,
      totalCount,
      totalXpClaimed,
      claimAchievementXp,
    ]
  );

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
};

export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
