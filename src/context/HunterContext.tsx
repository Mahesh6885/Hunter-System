import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { HunterState, HunterAttributes, DailyQuestItem } from '../types/hunter';
import { INITIAL_HUNTER_STATE } from '../data/mockData';
import { loadHunterState, saveHunterState, clearHunterState, sanitizeHunterState } from '../storage/storageService';
import {
  getLocalDateKey,
  calculateStreak,
  calculateWeekActivity,
} from '../utils/dateEngine';

interface HunterContextType {
  hunter: HunterState;
  isHydrated: boolean;
  toggleDailyQuest: (id: string) => void;
  completeWorkoutQuest: (workoutDateKey: string) => void;
  allocateAttributePoint: (attribute: keyof HunterAttributes) => void;
  setActiveScreen: (screen: HunterState['activeScreen']) => void;
  setOverlay: (overlay: HunterState['currentOverlay']) => void;
  closeOverlay: () => void;
  addXP: (amount: number) => void;
  toggleReducedMotion: () => void;
  toggleSound: () => void;
  toggleUnit: () => void;
  updateProfile: (updates: { name?: string; title?: string; avatarId?: string }) => void;
  resetProgress: () => Promise<void>;
  checkDateRollover: () => void;
  completedQuestsCount: number;
  allDailyQuestsComplete: boolean;
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hunter, setHunter] = useState<HunterState>(INITIAL_HUNTER_STATE);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Restore state from AsyncStorage on initial launch
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const savedState = await loadHunterState();
        if (isMounted) {
          setHunter(savedState);
          setIsHydrated(true);
        }
      } catch (err) {
        console.warn('[HunterContext] Error during hydration, keeping initial state:', err);
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist state changes to AsyncStorage whenever hunter updates (only after initial hydration)
  useEffect(() => {
    if (isHydrated) {
      saveHunterState(hunter);
    }
  }, [hunter, isHydrated]);

  // Check date rollover when app comes back to foreground
  const checkDateRollover = useCallback(() => {
    const today = getLocalDateKey();
    setHunter((prev) => {
      if (prev.lastActiveDate === today) {
        return prev;
      }
      // Date rolled over to a new calendar day
      return sanitizeHunterState(prev, today);
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkDateRollover();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkDateRollover]);

  // Toggle daily quest completion with strict single-claim XP guard
  const toggleDailyQuest = useCallback((id: string) => {
    const today = getLocalDateKey();

    setHunter((prev) => {
      const targetQuest = prev.dailyQuests.find((q) => q.id === id);
      if (!targetQuest) return prev;

      const isNowCompleted = !targetQuest.completed;
      const updatedQuests = prev.dailyQuests.map((q) =>
        q.id === id ? { ...q, completed: isNowCompleted } : q
      );

      // Ledger tracking for today
      const todayCompletedQuests = new Set(prev.questCompletedDates[today] || []);
      const todayClaimedXp = new Set(prev.questXpClaimedDates[today] || []);

      let newXp = prev.xp;
      let newLevel = prev.level;
      let overlay = prev.currentOverlay;

      if (isNowCompleted) {
        todayCompletedQuests.add(id);

        // Check if XP for this quest on this calendar date was already claimed
        if (!todayClaimedXp.has(id)) {
          todayClaimedXp.add(id);
          newXp += targetQuest.xpReward;

          if (newXp >= prev.maxXP) {
            newXp -= prev.maxXP;
            newLevel += 1;
            overlay = 'lvl';
          }
        }
      } else {
        todayCompletedQuests.delete(id);
        // Do not deduct claimed XP, but keep it in claimed ledger so repeated toggling cannot farm XP
      }

      // Record activity date if completed
      const updatedActivityDates = isNowCompleted
        ? Array.from(new Set([...prev.completedActivityDates, today]))
        : prev.completedActivityDates;

      const streakDays = calculateStreak(updatedActivityDates, today);
      const weekActivity = calculateWeekActivity(updatedActivityDates, today);

      return {
        ...prev,
        dailyQuests: updatedQuests,
        xp: newXp,
        level: newLevel,
        currentOverlay: overlay,
        streakDays,
        weekActivity,
        lastActiveDate: today,
        questCompletedDates: {
          ...prev.questCompletedDates,
          [today]: Array.from(todayCompletedQuests),
        },
        questXpClaimedDates: {
          ...prev.questXpClaimedDates,
          [today]: Array.from(todayClaimedXp),
        },
        completedActivityDates: updatedActivityDates,
      };
    });
  }, []);

  // Completes the daily workout quest only if the workout occurred on the local calendar date of today
  const completeWorkoutQuest = useCallback((workoutDateKey: string) => {
    const today = getLocalDateKey();

    setHunter((prev) => {
      // Record activity on the workout's actual completion date
      const updatedActivityDates = Array.from(new Set([...prev.completedActivityDates, workoutDateKey]));
      const streakDays = calculateStreak(updatedActivityDates, today);
      const weekActivity = calculateWeekActivity(updatedActivityDates, today);

      // If workout was completed yesterday or on another date, do NOT mark today's quest complete
      if (workoutDateKey !== today) {
        return {
          ...prev,
          completedActivityDates: updatedActivityDates,
          streakDays,
          weekActivity,
        };
      }

      // Workout occurred TODAY: mark quest 0 ("q1" - "Complete today's workout") as completed
      const workoutQuest = prev.dailyQuests[0];
      if (!workoutQuest) return prev;

      const todayCompletedQuests = new Set(prev.questCompletedDates[today] || []);
      const todayClaimedXp = new Set(prev.questXpClaimedDates[today] || []);

      todayCompletedQuests.add(workoutQuest.id);

      let newXp = prev.xp;
      let newLevel = prev.level;
      let overlay = prev.currentOverlay;

      if (!todayClaimedXp.has(workoutQuest.id)) {
        todayClaimedXp.add(workoutQuest.id);
        newXp += workoutQuest.xpReward;

        if (newXp >= prev.maxXP) {
          newXp -= prev.maxXP;
          newLevel += 1;
          overlay = 'lvl';
        }
      }

      const updatedQuests = prev.dailyQuests.map((q) =>
        q.id === workoutQuest.id ? { ...q, completed: true } : q
      );

      return {
        ...prev,
        dailyQuests: updatedQuests,
        xp: newXp,
        level: newLevel,
        currentOverlay: overlay,
        streakDays,
        weekActivity,
        lastActiveDate: today,
        questCompletedDates: {
          ...prev.questCompletedDates,
          [today]: Array.from(todayCompletedQuests),
        },
        questXpClaimedDates: {
          ...prev.questXpClaimedDates,
          [today]: Array.from(todayClaimedXp),
        },
        completedActivityDates: updatedActivityDates,
      };
    });
  }, []);

  const allocateAttributePoint = useCallback((attribute: keyof HunterAttributes) => {
    setHunter((prev) => {
      if (prev.statPoints <= 0 || prev.attributes[attribute] >= 100) return prev;
      return {
        ...prev,
        statPoints: prev.statPoints - 1,
        attributes: {
          ...prev.attributes,
          [attribute]: prev.attributes[attribute] + 1,
        },
      };
    });
  }, []);

  const setActiveScreen = useCallback((screen: HunterState['activeScreen']) => {
    setHunter((prev) => ({
      ...prev,
      activeScreen: screen,
      currentOverlay: null,
    }));
  }, []);

  const setOverlay = useCallback((overlay: HunterState['currentOverlay']) => {
    setHunter((prev) => ({ ...prev, currentOverlay: overlay }));
  }, []);

  const closeOverlay = useCallback(() => {
    setHunter((prev) => ({ ...prev, currentOverlay: null }));
  }, []);

  const addXP = useCallback((amount: number) => {
    setHunter((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let overlay = prev.currentOverlay;
      if (newXp >= prev.maxXP) {
        newXp -= prev.maxXP;
        newLevel += 1;
        overlay = 'lvl';
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentOverlay: overlay,
      };
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setHunter((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  }, []);

  const toggleSound = useCallback(() => {
    setHunter((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleUnit = useCallback(() => {
    setHunter((prev) => ({ ...prev, unit: prev.unit === 'kg' ? 'lb' : 'kg' }));
  }, []);

  const updateProfile = useCallback((updates: { name?: string; title?: string; avatarId?: string }) => {
    setHunter((prev) => {
      const nextName = typeof updates.name === 'string' && updates.name.trim() ? updates.name.trim() : prev.name;
      const nextTitle = typeof updates.title === 'string' && updates.title.trim() ? updates.title.trim() : prev.title;
      const nextAvatar = typeof updates.avatarId === 'string' && updates.avatarId.trim() ? updates.avatarId.trim() : prev.avatarId;
      return {
        ...prev,
        name: nextName,
        title: nextTitle,
        avatarId: nextAvatar,
      };
    });
  }, []);

  const resetProgress = useCallback(async () => {
    await clearHunterState();
    setHunter(sanitizeHunterState(null));
  }, []);

  const completedQuestsCount = useMemo(() => {
    return hunter.dailyQuests.filter((q) => q.completed).length;
  }, [hunter.dailyQuests]);

  const allDailyQuestsComplete = useMemo(() => {
    return completedQuestsCount === hunter.dailyQuests.length && hunter.dailyQuests.length > 0;
  }, [completedQuestsCount, hunter.dailyQuests]);

  return (
    <HunterContext.Provider
      value={{
        hunter,
        isHydrated,
        toggleDailyQuest,
        completeWorkoutQuest,
        allocateAttributePoint,
        setActiveScreen,
        setOverlay,
        closeOverlay,
        addXP,
        toggleReducedMotion,
        toggleSound,
        toggleUnit,
        updateProfile,
        resetProgress,
        checkDateRollover,
        completedQuestsCount,
        allDailyQuestsComplete,
      }}>
      {children}
    </HunterContext.Provider>
  );
};

export const useHunter = (): HunterContextType => {
  const context = useContext(HunterContext);
  if (!context) {
    throw new Error('useHunter must be used within a HunterProvider');
  }
  return context;
};
