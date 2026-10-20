import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemBadge } from '../common/SystemBadge';
import { SystemButton } from '../common/SystemButton';

interface Exercise {
  name: string;
  muscle: string;
  equipment: string;
  difficulty: string;
}

const EXERCISES: Exercise[] = [
  { name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', difficulty: 'Beginner' },
  { name: 'Push-Up', muscle: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { name: 'Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', difficulty: 'Intermediate' },
  { name: 'Band Pull-Apart', muscle: 'Shoulders', equipment: 'Band', difficulty: 'Beginner' },
  { name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner' },
  { name: 'Lat Pulldown', muscle: 'Back', equipment: 'Gym', difficulty: 'Intermediate' },
];

const FILTERS = ['All', 'Legs', 'Chest', 'Back', 'Core'];

interface TrainScreenProps {
  onStartRoutine?: () => void;
}

export const TrainScreen: React.FC<TrainScreenProps> = ({ onStartRoutine }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredExercises = EXERCISES.filter(
    (ex) => activeFilter === 'All' || ex.muscle === activeFilter
  );

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>WORKOUT LIBRARY</Text>

      {/* Filter Chips */}
      <View style={styles.chipsRow}>
        {FILTERS.map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.chip, isSelected && styles.chipActive]}>
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {filter.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Exercise List Panel */}
      <SystemPanel title="Exercises">
        {filteredExercises.map((exercise, index) => (
          <View
            key={exercise.name}
            style={[
              styles.exerciseItem,
              index === filteredExercises.length - 1 && styles.lastItem,
            ]}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>
                {exercise.muscle} · {exercise.equipment} · 3 × 10
              </Text>
            </View>
            <SystemBadge label={exercise.difficulty} color={COLORS.tx2} />
          </View>
        ))}
      </SystemPanel>

      {/* Start Routine CTA */}
      <SystemButton
        label="START BEGINNER HOME A"
        onPress={() => onStartRoutine?.()}
        style={styles.ctaButton}
      />
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
    flexWrap: 'wrap',
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
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  exerciseMeta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    marginTop: 2,
  },
  ctaButton: {
    marginTop: SPACING.s2,
  },
});
