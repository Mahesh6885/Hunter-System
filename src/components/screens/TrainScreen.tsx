import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemBadge } from '../common/SystemBadge';
import { SystemButton } from '../common/SystemButton';
import { EXERCISE_LIBRARY, WORKOUT_ROUTINES } from '../../data/workoutData';
import { Exercise, WorkoutRoutine } from '../../types/workout';
import { useWorkout } from '../../context/WorkoutContext';
import { ActiveWorkoutScreen } from '../workout/ActiveWorkoutScreen';
import { WorkoutCompleteScreen } from '../workout/WorkoutCompleteScreen';
import { WorkoutHistoryView } from '../workout/WorkoutHistoryView';

const FILTERS = ['All', 'Legs', 'Chest', 'Back', 'Shoulders', 'Core'];

type TrainTab = 'routines' | 'history';

export const TrainScreen: React.FC = () => {
  const { session, startWorkout, history } = useWorkout();
  const [activeTab, setActiveTab] = useState<TrainTab>('routines');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // If workout session is active or completed, delegate directly to the workout screens
  if (session.status === 'active') {
    return <ActiveWorkoutScreen />;
  }

  if (session.status === 'completed') {
    return <WorkoutCompleteScreen />;
  }

  // Filter exercises
  const filteredExercises = EXERCISE_LIBRARY.filter((ex) => {
    const matchesFilter = activeFilter === 'All' || ex.muscle === activeFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* Top Header & Sub-Tab Switcher */}
      <View style={styles.tabSwitcherRow}>
        <Pressable
          onPress={() => setActiveTab('routines')}
          style={[styles.subTabBtn, activeTab === 'routines' && styles.subTabBtnActive]}>
          <Text style={[styles.subTabBtnText, activeTab === 'routines' && styles.subTabBtnTextActive]}>
            ROUTINES & LIBRARY
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('history')}
          style={[styles.subTabBtn, activeTab === 'history' && styles.subTabBtnActive]}>
          <Text style={[styles.subTabBtnText, activeTab === 'history' && styles.subTabBtnTextActive]}>
            ARCHIVES ({history.length})
          </Text>
        </Pressable>
      </View>

      {/* Render History Tab */}
      {activeTab === 'history' && <WorkoutHistoryView />}

      {/* Render Routines & Exercise Library Tab */}
      {activeTab === 'routines' && (
        <>
          {/* Section 1: Pre-Configured Workout Routines */}
          <Text style={styles.sectionHeader}>HUNTER RAID GATES</Text>
          {WORKOUT_ROUTINES.map((routine) => (
            <SystemPanel
              key={routine.id}
              title={routine.title}
              hot={routine.id === 'routine-beginner-home-a'}
              headerRight={<SystemBadge label={`+${routine.baseXp} XP`} color={COLORS.warn} />}>
              <Text style={styles.routineDesc}>{routine.description}</Text>
              
              <View style={styles.routineMetaRow}>
                <Text style={styles.routineMetaText}>
                  Est. {routine.durationMinutes} min · {routine.exercises.length} exercises
                </Text>
                <SystemBadge label="RANK D" color={COLORS.c1} />
              </View>

              <SystemButton
                label={`ENTER GATE (${routine.title.toUpperCase()})`}
                onPress={() => startWorkout(routine)}
                style={styles.startRoutineBtn}
              />
            </SystemPanel>
          ))}

          {/* Section 2: Exercise Library with Search & Filters */}
          <Text style={[styles.sectionHeader, { marginTop: SPACING.s4 }]}>
            EXERCISE DATABASE ({filteredExercises.length})
          </Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises by name, muscle, or gear..."
              placeholderTextColor={COLORS.tx3}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Category Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}>
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
          </ScrollView>

          {/* Exercise Items List */}
          <SystemPanel title="Exercise Catalogue">
            {filteredExercises.length === 0 ? (
              <Text style={styles.emptyText}>No exercises match your query.</Text>
            ) : (
              filteredExercises.map((exercise, index) => {
                const isExpanded = expandedExerciseId === exercise.id;
                return (
                  <View
                    key={exercise.id}
                    style={[
                      styles.exerciseItem,
                      index === filteredExercises.length - 1 && styles.lastItem,
                    ]}>
                    <Pressable
                      onPress={() => toggleExpand(exercise.id)}
                      style={styles.exerciseHeaderRow}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseMeta}>
                          {exercise.muscle} · {exercise.equipment} · {exercise.defaultSets} × {exercise.defaultReps}
                        </Text>
                      </View>
                      <View style={styles.badgeGroup}>
                        <SystemBadge label={exercise.difficulty} color={COLORS.tx2} />
                        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>
                    </Pressable>

                    {/* Expanded Instructions */}
                    {isExpanded && (
                      <View style={styles.instructionsContainer}>
                        <Text style={styles.instructionsHeading}>HUNTER FORM INSTRUCTIONS:</Text>
                        <Text style={styles.instructionsText}>{exercise.instructions}</Text>
                        <Text style={styles.defaultRestText}>
                          Default Rest: {exercise.defaultRestSeconds}s · Default Load: {exercise.defaultLoadKg ? `${exercise.defaultLoadKg} kg` : 'Bodyweight (BW)'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </SystemPanel>
        </>
      )}
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
    paddingTop: SPACING.s2,
    paddingBottom: SPACING.s5,
  },
  tabSwitcherRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: SPACING.s3,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: SPACING.s2 + 2,
    alignItems: 'center',
    position: 'relative',
  },
  subTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.c1,
  },
  subTabBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: COLORS.tx3,
  },
  subTabBtnTextActive: {
    color: COLORS.c2,
  },
  sectionHeader: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 1.6,
    color: COLORS.tx,
    marginBottom: SPACING.s2,
  },
  routineDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginBottom: SPACING.s2,
  },
  routineMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s3,
  },
  routineMetaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
  },
  startRoutineBtn: {
    minHeight: 46,
  },
  searchContainer: {
    marginBottom: SPACING.s3,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(57, 191, 255, 0.04)',
    color: COLORS.tx,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    paddingHorizontal: SPACING.s3,
  },
  chipsRow: {
    gap: SPACING.s2,
    paddingBottom: SPACING.s3,
  },
  chip: {
    minHeight: 36,
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
    fontSize: 12,
    letterSpacing: 1,
    color: COLORS.tx2,
  },
  chipTextActive: {
    color: COLORS.c2,
  },
  exerciseItem: {
    paddingVertical: SPACING.s3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s2,
  },
  expandIcon: {
    color: COLORS.c1,
    fontSize: 10,
  },
  instructionsContainer: {
    marginTop: SPACING.s2,
    paddingTop: SPACING.s2,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
    backgroundColor: 'rgba(57, 191, 255, 0.03)',
    padding: SPACING.s2,
  },
  instructionsHeading: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.c1,
    marginBottom: 4,
  },
  instructionsText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx2,
    lineHeight: 18,
  },
  defaultRestText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx3,
    paddingVertical: SPACING.s3,
    textAlign: 'center',
  },
});
