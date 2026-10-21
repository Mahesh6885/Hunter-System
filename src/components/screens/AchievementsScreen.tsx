import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemBadge } from '../common/SystemBadge';
import { SystemButton } from '../common/SystemButton';
import { ProgressBar } from '../common/ProgressBar';
import { useAchievements } from '../../context/AchievementContext';
import { AchievementCategory } from '../../types/achievements';
import { getLocalDateKey } from '../../utils/dateEngine';

interface AchievementsScreenProps {
  onBack: () => void;
  onOpenAnalytics?: () => void;
}

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'workout', label: 'DUNGEON' },
  { id: 'streak', label: 'STREAKS' },
  { id: 'nutrition', label: 'NUTRITION' },
  { id: 'system', label: 'SYSTEM' },
];

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  onBack,
  onOpenAnalytics,
}) => {
  const {
    achievements,
    unlockedCount,
    totalCount,
    totalXpClaimed,
    claimAchievementXp,
  } = useAchievements();

  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const filteredAchievements = achievements.filter((a) => {
    if (activeCategory === 'all') return true;
    return a.category === activeCategory;
  });

  const completionPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const handleClaim = async (id: string) => {
    await claimAchievementXp(id);
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* 1. Header Navigation */}
      <View style={styles.topNavRow}>
        <Pressable onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBtnText}>← BACK</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTag}>SYSTEM AWARDS // TROPHIES</Text>
          <Text style={styles.headerMainTitle}>HUNTER ACHIEVEMENTS</Text>
        </View>

        {onOpenAnalytics && (
          <Pressable onPress={onOpenAnalytics} style={styles.navBtn}>
            <Text style={styles.navBtnText}>ANALYTICS 📊</Text>
          </Pressable>
        )}
      </View>

      {/* 2. Achievement Summary Panel */}
      <SystemPanel title="ACHIEVEMENT SYNCHRONIZATION" hot>
        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <Text style={styles.unlockedBigNum}>{unlockedCount} / {totalCount}</Text>
            <Text style={styles.unlockedSub}>ACHIEVEMENTS UNLOCKED ({completionPercent}%)</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.xpBigNum}>+{totalXpClaimed} XP</Text>
            <Text style={styles.xpSub}>CLAIMED FROM SYSTEM</Text>
          </View>
        </View>

        <ProgressBar progress={completionPercent} height={8} style={styles.summaryBar} />
      </SystemPanel>

      {/* 3. Category Filter Tabs */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.categoryTab, isActive && styles.categoryTabActive]}>
              <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4. Achievements Cards List */}
      <View style={styles.achievementsList}>
        {filteredAchievements.map((item) => {
          const unlockedDateStr = item.unlockedAt
            ? getLocalDateKey(item.unlockedAt)
            : null;

          return (
            <View
              key={item.id}
              style={[
                styles.achievementCard,
                item.isUnlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked,
              ]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.titleGroup}>
                  <Text style={[styles.cardTitle, item.isUnlocked && styles.cardTitleUnlocked]}>
                    {item.title.toUpperCase()}
                  </Text>
                  <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                </View>

                {item.isUnlocked ? (
                  <SystemBadge label="UNLOCKED" color={COLORS.ok} />
                ) : (
                  <SystemBadge label="LOCKED" color={COLORS.tx3} />
                )}
              </View>

              <Text style={styles.cardDesc}>{item.description}</Text>

              {/* Progress Bar & Status */}
              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>
                    Progress: {item.currentValue} / {item.targetValue}
                  </Text>
                  <Text style={styles.progressPercentText}>{item.progressPercent}%</Text>
                </View>
                <ProgressBar
                  progress={item.progressPercent}
                  height={5}
                  style={styles.cardBar}
                />
              </View>

              {/* Footer: Claim XP or Unlock Date */}
              <View style={styles.cardFooterRow}>
                <View style={styles.rewardPill}>
                  <Text style={styles.rewardText}>+{item.xpReward} XP</Text>
                </View>

                {item.isUnlocked ? (
                  item.xpClaimed ? (
                    <Text style={styles.claimedText}>CLAIMED ✓ ({unlockedDateStr})</Text>
                  ) : (
                    <SystemButton
                      label="CLAIM XP"
                      variant="primary"
                      onPress={() => handleClaim(item.id)}
                      style={styles.claimBtn}
                    />
                  )
                ) : (
                  <Text style={styles.lockedHintText}>Condition Pending</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: SPACING.s2,
    paddingBottom: SPACING.s6 * 2,
    gap: SPACING.s2,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s1,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
  },
  navBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.c1,
    letterSpacing: 1.1,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTag: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.c2,
    letterSpacing: 1.5,
  },
  headerMainTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.tx,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s1,
  },
  summaryLeft: {
    flex: 1,
  },
  unlockedBigNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: COLORS.c1,
  },
  unlockedSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  xpBigNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.warn,
  },
  xpSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  summaryBar: {
    marginTop: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 20, 32, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 2,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 2,
  },
  categoryTabActive: {
    backgroundColor: 'rgba(57, 191, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.c1,
  },
  categoryTabText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.tx3,
    letterSpacing: 0.8,
  },
  categoryTabTextActive: {
    color: COLORS.c1,
  },
  achievementsList: {
    gap: SPACING.s2,
  },
  achievementCard: {
    backgroundColor: 'rgba(10, 20, 32, 0.75)',
    borderWidth: 1,
    borderRadius: 4,
    padding: SPACING.s2,
  },
  achievementCardUnlocked: {
    borderColor: COLORS.c1,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
  },
  achievementCardLocked: {
    borderColor: COLORS.line,
    opacity: 0.85,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleGroup: {
    flex: 1,
    marginRight: SPACING.s2,
  },
  cardTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.tx,
    letterSpacing: 0.8,
  },
  cardTitleUnlocked: {
    color: COLORS.c2,
  },
  cardCategory: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  cardDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
    lineHeight: 16,
    marginVertical: 4,
  },
  progressSection: {
    marginVertical: SPACING.s1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  progressPercentText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.tx2,
  },
  cardBar: {
    width: '100%',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(57, 191, 255, 0.1)',
  },
  rewardPill: {
    backgroundColor: 'rgba(255, 198, 109, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.warn,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rewardText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.warn,
  },
  claimBtn: {
    minWidth: 80,
    paddingVertical: 4,
  },
  claimedText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.ok,
  },
  lockedHintText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
    fontStyle: 'italic',
  },
});
