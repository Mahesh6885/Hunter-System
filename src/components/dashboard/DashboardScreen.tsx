import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SPACING } from '../../theme';
import { useHunter } from '../../context/HunterContext';
import { SystemStatusCard } from './SystemStatusCard';
import { DailyQuestCard } from './DailyQuestCard';
import { TodayTrainingCard } from './TodayTrainingCard';
import { AttributesCard } from './AttributesCard';
import { NutritionCard } from './NutritionCard';

export const DashboardScreen: React.FC = () => {
  const {
    hunter,
    toggleDailyQuest,
    setActiveScreen,
    completedQuestsCount,
    allDailyQuestsComplete,
  } = useHunter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      
      {/* 1. System Status Panel */}
      <SystemStatusCard hunter={hunter} />

      {/* 2. Daily Quest Panel (Hot / Glowing) */}
      <DailyQuestCard
        quests={hunter.dailyQuests}
        onToggleQuest={toggleDailyQuest}
        onStartQuest={() => setActiveScreen('lib')}
        isAllComplete={allDailyQuestsComplete}
        completedCount={completedQuestsCount}
      />

      {/* 3. Today's Training Routine */}
      <TodayTrainingCard
        training={hunter.training}
        onViewTraining={() => setActiveScreen('lib')}
      />

      {/* 4. RPG Attributes Panel */}
      <AttributesCard attributes={hunter.attributes} />

      {/* 5. Nutrition & Macros Panel */}
      <NutritionCard
        nutrition={hunter.nutrition}
        onOpenNutrition={() => setActiveScreen('more')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.s4,
    paddingTop: SPACING.s2,
    paddingBottom: SPACING.s5,
  },
});
