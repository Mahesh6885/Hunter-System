import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { HunterState, HunterAttributes } from '../types/hunter';
import { INITIAL_HUNTER_STATE } from '../data/mockData';
import { loadHunterState, saveHunterState, clearHunterState } from '../storage/storageService';

interface HunterContextType {
  hunter: HunterState;
  isHydrated: boolean;
  toggleDailyQuest: (id: string) => void;
  allocateAttributePoint: (attribute: keyof HunterAttributes) => void;
  setActiveScreen: (screen: HunterState['activeScreen']) => void;
  setOverlay: (overlay: HunterState['currentOverlay']) => void;
  closeOverlay: () => void;
  addXP: (amount: number) => void;
  toggleReducedMotion: () => void;
  toggleSound: () => void;
  toggleUnit: () => void;
  resetProgress: () => Promise<void>;
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

  const toggleDailyQuest = useCallback((id: string) => {
    setHunter((prev) => {
      const targetQuest = prev.dailyQuests.find((q) => q.id === id);
      if (!targetQuest) return prev;

      const isNowCompleted = !targetQuest.completed;
      const updatedQuests = prev.dailyQuests.map((q) =>
        q.id === id ? { ...q, completed: isNowCompleted } : q
      );

      const xpDelta = isNowCompleted ? targetQuest.xpReward : -targetQuest.xpReward;
      let newXp = Math.max(0, prev.xp + xpDelta);
      let newLevel = prev.level;
      let overlay = prev.currentOverlay;

      if (newXp >= prev.maxXP) {
        newXp -= prev.maxXP;
        newLevel += 1;
        overlay = 'lvl';
      }

      return {
        ...prev,
        dailyQuests: updatedQuests,
        xp: newXp,
        level: newLevel,
        currentOverlay: overlay,
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

  const resetProgress = useCallback(async () => {
    await clearHunterState();
    setHunter({ ...INITIAL_HUNTER_STATE });
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
        allocateAttributePoint,
        setActiveScreen,
        setOverlay,
        closeOverlay,
        addXP,
        toggleReducedMotion,
        toggleSound,
        toggleUnit,
        resetProgress,
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
