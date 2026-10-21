export type MuscleGroup = 'Legs' | 'Chest' | 'Back' | 'Shoulders' | 'Core' | 'Arms' | 'Full Body';
export type EquipmentType = 'Bodyweight' | 'Dumbbell' | 'Barbell' | 'Band' | 'Gym' | 'Kettlebell';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: EquipmentType;
  difficulty: DifficultyLevel;
  defaultSets: number;
  defaultReps: number;
  defaultLoadKg: number; // 0 indicates bodyweight (BW)
  defaultRestSeconds: number;
  instructions: string;
}

export interface RoutineExerciseConfig {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetLoadKg: number;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  baseXp: number;
  exercises: RoutineExerciseConfig[];
}

export interface CompletedSet {
  setNumber: number;
  reps: number;
  loadKg: number;
  completedAt: number;
}

export interface ActiveExerciseSession {
  exercise: Exercise;
  targetSets: number;
  currentReps: number;
  currentLoadKg: number;
  completedSets: CompletedSet[];
}

export interface WorkoutHistoryRecord {
  id: string;
  routineId: string;
  routineTitle: string;
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  exercisesCompleted: number;
  totalSetsCompleted: number;
  totalReps: number;
  totalVolumeKg: number;
  xpAwarded: number;
  exerciseSummaries: Array<{
    name: string;
    setsCompleted: number;
    maxLoadKg: number;
  }>;
}
