import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { useWorkout } from '../../context/WorkoutContext';
import { useHunter } from '../../context/HunterContext';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const ActiveWorkoutScreen: React.FC = () => {
  const {
    session,
    pauseWorkout,
    resumeWorkout,
    adjustReps,
    adjustLoad,
    logCurrentSet,
    skipRestTimer,
    addRestSeconds,
    skipExercise,
    finishWorkoutEarly,
    discardWorkout,
  } = useWorkout();

  const { hunter } = useHunter();

  const currentExerciseData = session.exercises[session.currentExerciseIndex];
  if (!currentExerciseData) return null;

  const { exercise, targetSets, currentReps, currentLoadKg, completedSets } = currentExerciseData;
  const isLastExercise = session.currentExerciseIndex === session.exercises.length - 1;
  const nextExercise = !isLastExercise ? session.exercises[session.currentExerciseIndex + 1]?.exercise : null;

  const handleDiscard = () => {
    Alert.alert(
      'ABORT DUNGEON RAID?',
      'Are you sure you want to discard this workout? Unsaved progress will be lost and no XP will be awarded.',
      [
        { text: 'CONTINUE TRAINING', style: 'cancel' },
        { text: 'DISCARD SESSION', style: 'destructive', onPress: discardWorkout },
      ]
    );
  };

  const handleFinishEarly = () => {
    Alert.alert(
      'FINISH WORKOUT NOW?',
      'Complete the raid early with the sets you have finished so far?',
      [
        { text: 'CANCEL', style: 'cancel' },
        { text: 'FINISH & CLAIM', onPress: finishWorkoutEarly },
      ]
    );
  };

  const formatLoad = (kg: number) => {
    if (kg <= 0) return 'BW';
    if (hunter.unit === 'lb') {
      return `${Math.round(kg * 2.20462)} lb`;
    }
    return `${kg} kg`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Main Active Exercise Panel */}
      <SystemPanel hot>
        {/* Step Indicator */}
        <View style={styles.headerInfoRow}>
          <Text style={styles.mutedText}>
            EXERCISE {session.currentExerciseIndex + 1} OF {session.exercises.length}
          </Text>
          <Text style={styles.nextText}>
            NEXT: {nextExercise ? nextExercise.name.toUpperCase() : 'FINISH RAID'}
          </Text>
        </View>

        {/* Exercise Name */}
        <Text style={styles.exerciseTitle}>{exercise.name.toUpperCase()}</Text>

        {/* Segmented Set Indicators */}
        <View style={styles.setSegmentsRow}>
          {Array.from({ length: targetSets }).map((_, idx) => {
            const isCompleted = idx < completedSets.length;
            const isCurrent = idx === completedSets.length;
            return (
              <View
                key={idx}
                style={[
                  styles.setSegment,
                  isCompleted && styles.setSegmentCompleted,
                  isCurrent && styles.setSegmentCurrent,
                ]}
              />
            );
          })}
        </View>

        {/* 3 Metrics: SET, REPS, LOAD */}
        <View style={styles.metricsGrid}>
          {/* Cell 1: SET */}
          <View style={styles.metricCell}>
            <Text style={styles.metricNumber}>
              {session.currentSetIndex}/{targetSets}
            </Text>
            <Text style={styles.metricLabel}>SET</Text>
          </View>

          {/* Cell 2: REPS with quick adjuster */}
          <View style={styles.metricCell}>
            <View style={styles.cellAdjusterRow}>
              <Pressable onPress={() => adjustReps(-1)} style={styles.adjustBtn}>
                <Text style={styles.adjustBtnText}>-</Text>
              </Pressable>
              <Text style={styles.metricNumber}>{currentReps}</Text>
              <Pressable onPress={() => adjustReps(1)} style={styles.adjustBtn}>
                <Text style={styles.adjustBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.metricLabel}>REPS</Text>
          </View>

          {/* Cell 3: LOAD with quick adjuster */}
          <View style={styles.metricCell}>
            <View style={styles.cellAdjusterRow}>
              <Pressable onPress={() => adjustLoad(-2)} style={styles.adjustBtn}>
                <Text style={styles.adjustBtnText}>-</Text>
              </Pressable>
              <Text style={styles.metricNumber}>{formatLoad(currentLoadKg)}</Text>
              <Pressable onPress={() => adjustLoad(2)} style={styles.adjustBtn}>
                <Text style={styles.adjustBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.metricLabel}>LOAD</Text>
          </View>
        </View>

        {/* Previous Set Info */}
        <View style={styles.prevSetRow}>
          <Text style={styles.prevSetText}>
            {completedSets.length > 0
              ? `Previous: Set ${completedSets.length} · ${completedSets[completedSets.length - 1].reps} reps × ${formatLoad(completedSets[completedSets.length - 1].loadKg)}`
              : `Target: ${targetSets} sets × ${currentReps} reps · Form: ${exercise.instructions.slice(0, 50)}...`}
          </Text>
        </View>
      </SystemPanel>

      {/* 2. Timer & Rest Period Panel */}
      <SystemPanel title="Mission Timer">
        <View style={styles.timerRow}>
          {/* Workout Elapsed Time */}
          <View>
            <Text style={styles.elapsedLabel}>TOTAL ELAPSED</Text>
            <Text style={styles.elapsedTimer}>{formatTimer(session.elapsedSeconds)}</Text>
          </View>

          {/* Rest Countdown if active */}
          {session.isRestActive ? (
            <View style={styles.restBanner}>
              <Text style={styles.restLabel}>REST COUNTDOWN</Text>
              <Text style={styles.restTimer}>{session.restRemainingSeconds}s</Text>
            </View>
          ) : (
            <View style={styles.restReadyBanner}>
              <Text style={styles.restReadyText}>READY FOR SET {session.currentSetIndex}</Text>
            </View>
          )}
        </View>

        {/* Rest Controls if Rest is Active */}
        {session.isRestActive && (
          <View style={styles.restControlsRow}>
            <Pressable onPress={() => addRestSeconds(15)} style={styles.restActionBtn}>
              <Text style={styles.restActionText}>+15 SEC</Text>
            </Pressable>
            <Pressable onPress={skipRestTimer} style={styles.restActionBtn}>
              <Text style={styles.restActionText}>SKIP REST</Text>
            </Pressable>
          </View>
        )}

        {/* Secondary Timer Actions */}
        <View style={styles.timerActionsRow}>
          <SystemButton
            label={session.isPaused ? 'RESUME' : 'PAUSE'}
            variant="secondary"
            onPress={session.isPaused ? resumeWorkout : pauseWorkout}
            style={styles.halfBtn}
          />
          <SystemButton
            label="SKIP EXERCISE"
            variant="secondary"
            onPress={skipExercise}
            style={styles.halfBtn}
          />
        </View>
      </SystemPanel>

      {/* 3. Primary Set Logging Button */}
      <SystemButton
        label={`LOG SET (${session.currentSetIndex} / ${targetSets})`}
        onPress={logCurrentSet}
        style={styles.logSetButton}
      />

      {/* 4. Workout Session Management Actions */}
      <View style={styles.footerActionsRow}>
        <SystemButton
          label="FINISH EARLY"
          variant="secondary"
          onPress={handleFinishEarly}
          style={styles.halfBtn}
        />
        <SystemButton
          label="DISCARD"
          variant="secondary"
          onPress={handleDiscard}
          style={styles.halfBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: SPACING.s4,
    paddingTop: SPACING.s2,
    paddingBottom: SPACING.s5,
  },
  headerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s1,
  },
  mutedText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  nextText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.c2,
    letterSpacing: 1,
  },
  exerciseTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    letterSpacing: 1.2,
    color: COLORS.tx,
    fontWeight: '700',
    marginVertical: 4,
  },
  setSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: SPACING.s2,
  },
  setSegment: {
    flex: 1,
    height: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(57, 191, 255, 0.05)',
  },
  setSegmentCompleted: {
    backgroundColor: COLORS.ok,
    borderColor: '#8BFEC4',
  },
  setSegmentCurrent: {
    borderColor: COLORS.c2,
    backgroundColor: 'rgba(57, 191, 255, 0.25)',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginVertical: SPACING.s2,
  },
  metricCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: SPACING.s2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(57, 191, 255, 0.03)',
  },
  cellAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  adjustBtn: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 191, 255, 0.1)',
  },
  adjustBtnText: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.c2,
    lineHeight: 16,
  },
  metricNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: COLORS.tx,
    fontWeight: '700',
  },
  metricLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.tx3,
    marginTop: 2,
  },
  prevSetRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSubtle,
    paddingTop: SPACING.s2,
    marginTop: SPACING.s1,
  },
  prevSetText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.s1,
  },
  elapsedLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.tx3,
  },
  elapsedTimer: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: COLORS.tx,
    fontWeight: '700',
  },
  restBanner: {
    alignItems: 'flex-end',
  },
  restLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.warn,
  },
  restTimer: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: COLORS.warn,
    fontWeight: '700',
  },
  restReadyBanner: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.ok,
    backgroundColor: 'rgba(84, 230, 161, 0.08)',
  },
  restReadyText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.ok,
  },
  restControlsRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s2,
  },
  restActionBtn: {
    flex: 1,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.warn,
    backgroundColor: 'rgba(255, 198, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restActionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.warn,
  },
  timerActionsRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s3,
  },
  halfBtn: {
    flex: 1,
    minHeight: 40,
  },
  logSetButton: {
    marginVertical: SPACING.s3,
  },
  footerActionsRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s1,
  },
});
