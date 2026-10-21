/**
 * Achievements System Types for Solo Leveling Fitness RPG
 */

export type AchievementCategory = 'workout' | 'streak' | 'nutrition' | 'system';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  xpReward: number;
  targetValue: number;
}

export interface Achievement extends AchievementDefinition {
  currentValue: number;
  progressPercent: number; // 0 to 100
  isUnlocked: boolean;
  unlockedAt?: number; // epoch ms
  xpClaimed: boolean;
}

export interface AchievementUnlockRecord {
  unlockedAt: number;
  xpClaimed: boolean;
}

export interface AchievementStoragePayload {
  version: number;
  unlocked: Record<string, AchievementUnlockRecord>;
}
