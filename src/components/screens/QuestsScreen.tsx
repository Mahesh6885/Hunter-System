import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { ProgressBar } from '../common/ProgressBar';
import { SystemBadge } from '../common/SystemBadge';
import { QuestCategory } from '../../types/hunter';

interface QuestItemData {
  title: string;
  description: string;
  reward: string;
  status: 'avail' | 'prog' | 'done' | 'lock';
  progress: number;
}

const QUEST_DATA: Record<QuestCategory, QuestItemData[]> = {
  Daily: [
    { title: 'Morning Mobility', description: '10 min stretch routine', reward: '+40 XP', status: 'avail', progress: 0 },
    { title: 'Protein Target', description: 'Log 120 g protein', reward: '+60 XP', status: 'prog', progress: 50 },
    { title: 'Hydration', description: 'Drink 8 glasses of water', reward: '+30 XP', status: 'done', progress: 100 },
  ],
  Weekly: [
    { title: 'Iron Week', description: 'Complete 4 workouts (2/4)', reward: '+300 XP', status: 'prog', progress: 50 },
    { title: 'Early Riser', description: '3 workouts before 8 AM', reward: '+150 XP', status: 'avail', progress: 0 },
    { title: 'Dungeon Gate', description: 'Reach Rank C', reward: '+500 XP', status: 'lock', progress: 0 },
  ],
  Recovery: [
    { title: 'Rest Day Walk', description: '20 min easy walk', reward: '+30 XP', status: 'avail', progress: 0 },
    { title: 'Sleep Window', description: '7+ hours, 3 consecutive nights', reward: '+80 XP', status: 'lock', progress: 0 },
  ],
};

const CATEGORIES: QuestCategory[] = ['Daily', 'Weekly', 'Recovery'];

export const QuestsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<QuestCategory>('Daily');

  const getStatusBadge = (status: QuestItemData['status']) => {
    switch (status) {
      case 'avail':
        return <SystemBadge label="Available" color={COLORS.c1} />;
      case 'prog':
        return <SystemBadge label="In Progress" color={COLORS.warn} />;
      case 'done':
        return <SystemBadge label="Complete" color={COLORS.ok} />;
      case 'lock':
      default:
        return <SystemBadge label="Locked" color={COLORS.tx3} />;
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>QUEST BOARD</Text>

      {/* Category Filter Chips */}
      <View style={styles.chipsRow}>
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[styles.chip, isSelected && styles.chipActive]}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {category.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Quest Cards */}
      {QUEST_DATA[selectedCategory].map((quest, index) => (
        <SystemPanel
          key={index}
          title={quest.title}
          headerRight={getStatusBadge(quest.status)}>
          <Text style={styles.questDesc}>{quest.description}</Text>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardText}>{quest.reward}</Text>
            <Text style={styles.progressText}>
              {quest.status === 'prog'
                ? '50%'
                : quest.status === 'done'
                ? '100%'
                : quest.status === 'lock'
                ? 'Requires Rank C'
                : '0%'}
            </Text>
          </View>
          <ProgressBar
            progress={quest.progress}
            variant={quest.status === 'done' ? 'ok' : quest.status === 'prog' ? 'warn' : 'default'}
            height={6}
          />
        </SystemPanel>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: SPACING.s4,
    paddingBottom: SPACING.s5,
  },
  screenHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    letterSpacing: 1.5,
    color: COLORS.tx,
    marginVertical: SPACING.s3,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginBottom: SPACING.s4,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: SPACING.s3,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: COLORS.c1,
    backgroundColor: COLORS.chipBgActive,
  },
  chipText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 1,
    color: COLORS.tx2,
  },
  chipTextActive: {
    color: COLORS.c2,
  },
  questDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginBottom: SPACING.s2,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardText: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.warn,
  },
  progressText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
  },
});
