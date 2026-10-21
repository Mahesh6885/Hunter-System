export interface PersonalRecordItem {
  key: 'mostSets' | 'longestWorkout' | 'highestVolume' | 'totalWorkouts' | 'totalSets' | 'bestStreak' | 'currentStreak';
  title: string;
  metricLabel: string;
  displayValue: string;
  numericValue: number;
  unit?: string;
  achievedDateKey?: string;
  workoutTitle?: string;
  description: string;
  verified: boolean;
}

export interface HunterPersonalRecords {
  mostSets: PersonalRecordItem;
  longestWorkout: PersonalRecordItem;
  highestVolume: PersonalRecordItem;
  totalWorkouts: PersonalRecordItem;
  totalSets: PersonalRecordItem;
  bestStreak: PersonalRecordItem;
  currentStreak: PersonalRecordItem;
}
