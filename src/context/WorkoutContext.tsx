import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Exercise,
  WorkoutRoutine,
  ActiveExerciseSession,
  CompletedSet,
  WorkoutHistoryRecord,
} from '../types/workout';
import { EXERCISE_LIBRARY, WORKOUT_ROUTINES } from '../data/workoutData';
import { loadWorkoutHistory, saveWorkoutSession } from '../storage/workoutStorageService';
import { useHunter } from './HunterContext';
import { getLocalDateKey } from '../utils/dateEngine';

export interface WorkoutSessionState {
  id: string;
  routine: WorkoutRoutine;
  exercises: ActiveExerciseSession[];
  currentExerciseIndex: number;
  currentSetIndex: number; // 1-indexed
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isRestActive: boolean;
  restRemainingSeconds: number;
  status: 'idle' | 'active' | 'completed';
  completedSummary: WorkoutHistoryRecord | null;
  isRewardClaimed: boolean;
}

interface WorkoutContextType {
  session: WorkoutSessionState;
  history: WorkoutHistoryRecord[];
  isHistoryLoading: boolean;
  startWorkout: (routine?: WorkoutRoutine) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  adjustReps: (delta: number) => void;
  adjustLoad: (delta: number) => void;
  logCurrentSet: () => void;
  skipRestTimer: () => void;
  addRestSeconds: (seconds: number) => void;
  skipExercise: () => void;
  finishWorkoutEarly: () => void;
  discardWorkout: () => void;
  claimWorkoutRewards: () => Promise<void>;
  refreshHistory: () => Promise<void>;
}

const DEFAULT_ROUTINE = WORKOUT_ROUTINES[0];

const INITIAL_SESSION_STATE: WorkoutSessionState = {
  id: '',
  routine: DEFAULT_ROUTINE,
  exercises: [],
  currentExerciseIndex: 0,
  currentSetIndex: 1,
  elapsedSeconds: 0,
  isRunning: false,
  isPaused: false,
  isRestActive: false,
  restRemainingSeconds: 0,
  status: 'idle',
  completedSummary: null,
  isRewardClaimed: false,
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addXP, completeWorkoutQuest } = useHunter();
  const [session, setSession] = useState<WorkoutSessionState>(INITIAL_SESSION_STATE);
  const [history, setHistory] = useState<WorkoutHistoryRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);

  // Background-accurate timestamp tracking refs
  const sessionStartTimeRef = useRef<number>(0);
  const accumulatedPausedMsRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const restEndsAtRef = useRef<number>(0);

  // Load history on mount
  const refreshHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const records = await loadWorkoutHistory();
      setHistory(records);
    } catch (err) {
      console.warn('[WorkoutContext] Failed to load workout history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Master Clock: Elapsed Time & Rest Countdown (Runs every second when active)
  useEffect(() => {
    if (session.status !== 'active' || !session.isRunning || session.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsedMs = now - sessionStartTimeRef.current - accumulatedPausedMsRef.current;
      const calculatedElapsedSeconds = Math.max(0, Math.floor(totalElapsedMs / 1000));

      let updatedRestRemaining = 0;
      let isRestStillActive = false;

      if (restEndsAtRef.current > 0) {
        const remainingMs = restEndsAtRef.current - now;
        if (remainingMs > 0) {
          updatedRestRemaining = Math.ceil(remainingMs / 1000);
          isRestStillActive = true;
        } else {
          restEndsAtRef.current = 0;
          updatedRestRemaining = 0;
          isRestStillActive = false;
        }
      }

      setSession((prev) => ({
        ...prev,
        elapsedSeconds: calculatedElapsedSeconds,
        restRemainingSeconds: updatedRestRemaining,
        isRestActive: isRestStillActive,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [session.status, session.isRunning, session.isPaused]);

  // Start a new workout session
  const startWorkout = useCallback((selectedRoutine?: WorkoutRoutine) => {
    const routine = selectedRoutine || WORKOUT_ROUTINES[0];

    const preparedExercises: ActiveExerciseSession[] = routine.exercises.map((cfg) => {
      const exercise = EXERCISE_LIBRARY.find((e) => e.id === cfg.exerciseId) || {
        id: cfg.exerciseId,
        name: 'Exercise',
        muscle: 'Full Body',
        equipment: 'Bodyweight',
        difficulty: 'Beginner',
        defaultSets: cfg.targetSets,
        defaultReps: cfg.targetReps,
        defaultLoadKg: cfg.targetLoadKg,
        defaultRestSeconds: 45,
        instructions: 'Follow exercise form carefully.',
      };

      return {
        exercise,
        targetSets: cfg.targetSets,
        currentReps: cfg.targetReps,
        currentLoadKg: cfg.targetLoadKg,
        completedSets: [],
      };
    });

    const now = Date.now();
    sessionStartTimeRef.current = now;
    accumulatedPausedMsRef.current = 0;
    pauseStartTimeRef.current = 0;
    restEndsAtRef.current = 0;

    const newSessionId = `workout-${now}-${Math.random().toString(36).substring(2, 7)}`;

    setSession({
      id: newSessionId,
      routine,
      exercises: preparedExercises,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false,
      isRestActive: false,
      restRemainingSeconds: 0,
      status: 'active',
      completedSummary: null,
      isRewardClaimed: false,
    });
  }, []);

  // Pause workout timer
  const pauseWorkout = useCallback(() => {
    if (session.status !== 'active' || session.isPaused) return;
    pauseStartTimeRef.current = Date.now();
    setSession((prev) => ({ ...prev, isPaused: true }));
  }, [session.status, session.isPaused]);

  // Resume workout timer
  const resumeWorkout = useCallback(() => {
    if (session.status !== 'active' || !session.isPaused) return;
    const now = Date.now();
    if (pauseStartTimeRef.current > 0) {
      const pausedDuration = now - pauseStartTimeRef.current;
      accumulatedPausedMsRef.current += pausedDuration;
      // Adjust rest countdown end timestamp by paused duration
      if (restEndsAtRef.current > 0) {
        restEndsAtRef.current += pausedDuration;
      }
    }
    pauseStartTimeRef.current = 0;
    setSession((prev) => ({ ...prev, isPaused: false }));
  }, [session.status, session.isPaused]);

  // Adjust target reps for current exercise
  const adjustReps = useCallback((delta: number) => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;
      const current = prev.exercises[prev.currentExerciseIndex];
      if (!current) return prev;

      const newReps = Math.max(1, Math.min(999, current.currentReps + delta));
      const updatedExercises = [...prev.exercises];
      updatedExercises[prev.currentExerciseIndex] = {
        ...current,
        currentReps: newReps,
      };

      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  // Adjust load / weight for current exercise
  const adjustLoad = useCallback((delta: number) => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;
      const current = prev.exercises[prev.currentExerciseIndex];
      if (!current) return prev;

      const newLoad = Math.max(0, Math.min(999, current.currentLoadKg + delta));
      const updatedExercises = [...prev.exercises];
      updatedExercises[prev.currentExerciseIndex] = {
        ...current,
        currentLoadKg: newLoad,
      };

      return { ...prev, exercises: updatedExercises };
    });
  }, []);

  // Helper to compile final summary record
  const generateSummaryRecord = (
    currentSession: WorkoutSessionState,
    completedAt: number
  ): WorkoutHistoryRecord => {
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let completedExercisesCount = 0;

    const summaries = currentSession.exercises.map((ex) => {
      const setsCount = ex.completedSets.length;
      if (setsCount > 0) completedExercisesCount++;

      let maxLoad = 0;
      ex.completedSets.forEach((s) => {
        totalSets++;
        totalReps += s.reps;
        totalVolume += s.reps * s.loadKg;
        if (s.loadKg > maxLoad) maxLoad = s.loadKg;
      });

      return {
        name: ex.exercise.name,
        setsCompleted: setsCount,
        maxLoadKg: maxLoad,
      };
    });

    // Reward formula: Base routine XP scaled by completion ratio (min 50 XP)
    const totalTargetSets = currentSession.exercises.reduce((acc, curr) => acc + curr.targetSets, 0);
    const completionRatio = totalTargetSets > 0 ? Math.min(1, totalSets / totalTargetSets) : 1;
    const xpReward = Math.max(50, Math.round(currentSession.routine.baseXp * completionRatio));

    return {
      id: currentSession.id,
      routineId: currentSession.routine.id,
      routineTitle: currentSession.routine.title,
      startedAt: sessionStartTimeRef.current,
      completedAt,
      durationSeconds: currentSession.elapsedSeconds,
      exercisesCompleted: completedExercisesCount,
      totalSetsCompleted: totalSets,
      totalReps,
      totalVolumeKg: totalVolume,
      xpAwarded: xpReward,
      exerciseSummaries: summaries,
    };
  };

  // Log completed set
  const logCurrentSet = useCallback(() => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;
      const currentEx = prev.exercises[prev.currentExerciseIndex];
      if (!currentEx) return prev;

      const newSet: CompletedSet = {
        setNumber: prev.currentSetIndex,
        reps: currentEx.currentReps,
        loadKg: currentEx.currentLoadKg,
        completedAt: Date.now(),
      };

      const updatedCompletedSets = [...currentEx.completedSets, newSet];
      const updatedExercises = [...prev.exercises];
      updatedExercises[prev.currentExerciseIndex] = {
        ...currentEx,
        completedSets: updatedCompletedSets,
      };

      // Start rest countdown (e.g. 45s or exercise default)
      const restSeconds = currentEx.exercise.defaultRestSeconds || 45;
      restEndsAtRef.current = Date.now() + restSeconds * 1000;

      // Check if more sets remain for this exercise
      if (prev.currentSetIndex < currentEx.targetSets) {
        return {
          ...prev,
          exercises: updatedExercises,
          currentSetIndex: prev.currentSetIndex + 1,
          isRestActive: true,
          restRemainingSeconds: restSeconds,
        };
      }

      // Check if more exercises remain in this routine
      if (prev.currentExerciseIndex < prev.exercises.length - 1) {
        const nextIdx = prev.currentExerciseIndex + 1;
        const nextEx = updatedExercises[nextIdx];

        return {
          ...prev,
          exercises: updatedExercises,
          currentExerciseIndex: nextIdx,
          currentSetIndex: 1,
          isRestActive: true,
          restRemainingSeconds: restSeconds,
        };
      }

      // ALL EXERCISES AND SETS COMPLETED!
      const now = Date.now();
      restEndsAtRef.current = 0;

      const summary = generateSummaryRecord(
        { ...prev, exercises: updatedExercises },
        now
      );

      return {
        ...prev,
        exercises: updatedExercises,
        isRunning: false,
        isRestActive: false,
        restRemainingSeconds: 0,
        status: 'completed',
        completedSummary: summary,
        isRewardClaimed: false,
      };
    });
  }, []);

  // Skip rest timer
  const skipRestTimer = useCallback(() => {
    restEndsAtRef.current = 0;
    setSession((prev) => ({
      ...prev,
      isRestActive: false,
      restRemainingSeconds: 0,
    }));
  }, []);

  // Add extra seconds to rest timer (e.g. +15s)
  const addRestSeconds = useCallback((seconds: number) => {
    if (restEndsAtRef.current > 0) {
      restEndsAtRef.current += seconds * 1000;
    } else {
      restEndsAtRef.current = Date.now() + seconds * 1000;
    }
    const remaining = Math.max(0, Math.ceil((restEndsAtRef.current - Date.now()) / 1000));
    setSession((prev) => ({
      ...prev,
      isRestActive: true,
      restRemainingSeconds: remaining,
    }));
  }, []);

  // Skip to next exercise
  const skipExercise = useCallback(() => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;

      if (prev.currentExerciseIndex < prev.exercises.length - 1) {
        const nextIdx = prev.currentExerciseIndex + 1;
        return {
          ...prev,
          currentExerciseIndex: nextIdx,
          currentSetIndex: 1,
          isRestActive: false,
          restRemainingSeconds: 0,
        };
      }

      // If skipping the last exercise, finish workout with whatever was logged
      const now = Date.now();
      const summary = generateSummaryRecord(prev, now);
      return {
        ...prev,
        isRunning: false,
        isRestActive: false,
        restRemainingSeconds: 0,
        status: 'completed',
        completedSummary: summary,
        isRewardClaimed: false,
      };
    });
  }, []);

  // Finish workout early
  const finishWorkoutEarly = useCallback(() => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;
      const now = Date.now();
      const summary = generateSummaryRecord(prev, now);
      return {
        ...prev,
        isRunning: false,
        isRestActive: false,
        restRemainingSeconds: 0,
        status: 'completed',
        completedSummary: summary,
        isRewardClaimed: false,
      };
    });
  }, []);

  // Discard workout
  const discardWorkout = useCallback(() => {
    restEndsAtRef.current = 0;
    setSession(INITIAL_SESSION_STATE);
  }, []);

  // Claim XP rewards and persist to history
  const claimWorkoutRewards = useCallback(async () => {
    if (session.status !== 'completed' || !session.completedSummary || session.isRewardClaimed) {
      return;
    }

    const summary = session.completedSummary;

    // 1. Mark claimed to prevent double rewards
    setSession((prev) => ({ ...prev, isRewardClaimed: true }));

    // 2. Award XP through HunterContext
    addXP(summary.xpAwarded);

    // 3. Mark Daily Quest 1 ("Complete today's workout") as complete if workout occurred on today's calendar date
    const workoutDateKey = getLocalDateKey(summary.completedAt);
    completeWorkoutQuest(workoutDateKey);

    // 4. Persist to Workout History storage
    await saveWorkoutSession(summary);

    // 5. Refresh history list
    await refreshHistory();

    // 6. Reset session back to idle
    setSession(INITIAL_SESSION_STATE);
  }, [session, addXP, completeWorkoutQuest, refreshHistory]);

  return (
    <WorkoutContext.Provider
      value={{
        session,
        history,
        isHistoryLoading,
        startWorkout,
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
        claimWorkoutRewards,
        refreshHistory,
      }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
