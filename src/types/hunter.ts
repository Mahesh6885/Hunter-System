export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface HunterAttributes {
  strength: number;
  endurance: number;
  agility: number;
  vitality: number;
  discipline: number;
}

export interface DailyQuestItem {
  id: string;
  label: string;
  completed: boolean;
  xpReward: number;
}

export interface TrainingPreview {
  title: string;
  durationMinutes: number;
  exerciseCount: number;
}

export interface NutritionOverview {
  calories: number;
  caloriesTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  fat: number;
  waterIntakeMl?: number;
  waterTargetMl?: number;
}

export interface QuestBoardItem {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: 'avail' | 'prog' | 'done' | 'lock';
}

export type QuestCategory = 'Daily' | 'Weekly' | 'Recovery';

export interface HunterState {
  name: string;
  rank: HunterRank;
  level: number;
  xp: number;
  maxXP: number;
  streakDays: number;
  weekActivity: boolean[]; // 7 days (Mon-Sun)
  attributes: HunterAttributes;
  statPoints: number;
  dailyQuests: DailyQuestItem[];
  training: TrainingPreview;
  nutrition: NutritionOverview;
  activeScreen: 'dash' | 'quests' | 'lib' | 'status' | 'more' | 'nutrition' | 'analytics' | 'achievements' | 'profile' | 'bodyScan';
  currentOverlay: 'lvl' | 'rank' | 'notif' | null;
  reducedMotion: boolean;
  soundEnabled: boolean;
  unit: 'kg' | 'lb';
  // Date & Streak Engine Fields
  lastActiveDate: string; // 'YYYY-MM-DD'
  questCompletedDates: Record<string, string[]>; // { 'YYYY-MM-DD': ['q1', 'q2'] }
  questXpClaimedDates: Record<string, string[]>; // { 'YYYY-MM-DD': ['q1'] }
  completedActivityDates: string[]; // List of unique 'YYYY-MM-DD' dates with completed activity
  // Hunter Profile & Customization
  title?: string;
  avatarId?: string;
}
