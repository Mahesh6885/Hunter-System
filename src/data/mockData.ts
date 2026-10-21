import { HunterState } from '../types/hunter';
import { getLocalDateKey, addDaysToDateKey, calculateStreak, calculateWeekActivity } from '../utils/dateEngine';

const todayKey = getLocalDateKey();

// Generate past 12 consecutive active days ending yesterday to establish baseline
const initialCompletedDates: string[] = [];
for (let i = 12; i >= 1; i--) {
  initialCompletedDates.push(addDaysToDateKey(todayKey, -i));
}

const initialStreak = calculateStreak(initialCompletedDates, todayKey);
const initialWeek = calculateWeekActivity(initialCompletedDates, todayKey);

export const INITIAL_HUNTER_STATE: HunterState = {
  name: 'ARJUN',
  rank: 'D',
  level: 14,
  xp: 2780,
  maxXP: 3000,
  streakDays: initialStreak,
  weekActivity: initialWeek,
  attributes: {
    strength: 42,
    endurance: 35,
    agility: 28,
    vitality: 39,
    discipline: 51,
  },
  statPoints: 3,
  dailyQuests: [
    {
      id: 'q1',
      label: 'Complete today’s workout',
      completed: false,
      xpReward: 50,
    },
    {
      id: 'q2',
      label: 'Reach 120 g protein',
      completed: false,
      xpReward: 50,
    },
    {
      id: 'q3',
      label: 'Drink 2 L of water',
      completed: false,
      xpReward: 50,
    },
  ],
  training: {
    title: 'Beginner Home A',
    durationMinutes: 35,
    exerciseCount: 3,
  },
  nutrition: {
    calories: 1640,
    caloriesTarget: 2100,
    protein: 92,
    proteinTarget: 120,
    carbs: 180,
    fat: 48,
  },
  activeScreen: 'dash',
  currentOverlay: null,
  reducedMotion: false,
  soundEnabled: true,
  unit: 'kg',
  lastActiveDate: todayKey,
  questCompletedDates: {},
  questXpClaimedDates: {},
  completedActivityDates: initialCompletedDates,
  title: 'Shadow Initiate',
  avatarId: 'monarch',
};

export const NOTIFICATIONS = [
  'New daily quest available',
  'Workout completed: +320 XP',
  'Weekly dungeon summary ready',
];
