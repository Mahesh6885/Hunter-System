import React, { createContext, useContext, useState, useMemo } from 'react';
import { HunterState, HunterAttributes } from '../types/hunter';
import { INITIAL_HUNTER_STATE } from '../data/mockData';

interface HunterContextType {
  hunter: HunterState;
  toggleDailyQuest: (id: string) => void;
  allocateAttributePoint: (attribute: keyof HunterAttributes) => void;
  setActiveScreen: (screen: HunterState['activeScreen']) => void;
  setOverlay: (overlay: HunterState['currentOverlay']) => void;
  closeOverlay: () => void;
  addXP: (amount: number) => void;
  completedQuestsCount: number;
  allDailyQuestsComplete: boolean;
}

const HunterContext = createContext<HunterContextType | undefined>(undefined);

export const HunterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hunter, setHunter] = useState<HunterState>(INITIAL_HUNTER_STATE);

  const toggleDailyQuest = (id: string) => {
    setHunter((prev) => {
      const updatedQuests = prev.dailyQuests.map((q) => {
        if (q.id === id) {
          return { ...q, completed: !q.completed };
        }
        return q;
      });

      // Calculate XP change
      const targetQuest = prev.dailyQuests.find((q) => q.id === id);
      const isCompleting = targetQuest ? !targetQuest.completed : false;
      const xpDelta = targetQuest ? (isCompleting ? targetQuest.xpReward : -targetQuest.xpReward) : 0;
      
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
  };

  const allocateAttributePoint = (attribute: keyof HunterAttributes) => {
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
  };

  const setActiveScreen = (screen: HunterState['activeScreen']) => {
    setHunter((prev) => ({
      ...prev,
      activeScreen: screen,
      currentOverlay: null,
    }));
  };

  const setOverlay = (overlay: HunterState['currentOverlay']) => {
    setHunter((prev) => ({ ...prev, currentOverlay: overlay }));
  };

  const closeOverlay = () => {
    setHunter((prev) => ({ ...prev, currentOverlay: null }));
  };

  const addXP = (amount: number) => {
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
  };

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
        toggleDailyQuest,
        allocateAttributePoint,
        setActiveScreen,
        setOverlay,
        closeOverlay,
        addXP,
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
