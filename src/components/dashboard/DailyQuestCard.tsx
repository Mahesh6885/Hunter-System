import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemBadge } from '../common/SystemBadge';
import { SystemButton } from '../common/SystemButton';
import { DailyQuestItem } from '../../types/hunter';

interface DailyQuestCardProps {
  quests: DailyQuestItem[];
  onToggleQuest: (id: string) => void;
  onStartQuest: () => void;
  isAllComplete: boolean;
  completedCount: number;
}

export const DailyQuestCard: React.FC<DailyQuestCardProps> = ({
  quests,
  onToggleQuest,
  onStartQuest,
  isAllComplete,
  completedCount,
}) => {
  return (
    <SystemPanel
      title="Daily Quest"
      hot
      headerRight={
        <SystemBadge
          label={isAllComplete ? 'Complete' : 'Active'}
          color={isAllComplete ? COLORS.ok : COLORS.c1}
        />
      }>
      {/* Subtitle */}
      <Text style={styles.subtitle}>Prove your discipline today.</Text>

      {/* Quest Checklist */}
      <View style={styles.listContainer}>
        {quests.map((quest) => (
          <Pressable
            key={quest.id}
            onPress={() => onToggleQuest(quest.id)}
            style={({ pressed }) => [styles.questItem, pressed && styles.questItemPressed]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: quest.completed }}
            accessibilityLabel={quest.label}>
            
            {/* Custom Cybernetic Square Checkbox */}
            <View style={[styles.checkbox, quest.completed && styles.checkboxActive]}>
              {quest.completed && (
                <Text style={styles.checkmarkIcon}>✓</Text>
              )}
            </View>

            {/* Quest Label */}
            <Text
              style={[
                styles.questLabel,
                quest.completed && styles.questLabelCompleted,
              ]}>
              {quest.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Progress & XP Reward */}
      <View style={styles.rewardRow}>
        <Text style={styles.progressText}>
          {completedCount}/{quests.length} complete
        </Text>
        <SystemBadge label="+150 XP" color={COLORS.warn} />
      </View>

      {/* Quest Complete Banner */}
      {isAllComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeBannerText}>QUEST COMPLETE</Text>
        </View>
      )}

      {/* Primary Action Button */}
      <SystemButton
        label={isAllComplete ? 'DAILY QUEST COMPLETED' : 'START QUEST'}
        onPress={onStartQuest}
        style={styles.actionButton}
      />
    </SystemPanel>
  );
};

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginBottom: SPACING.s2,
  },
  listContainer: {
    marginVertical: SPACING.s1,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
    gap: SPACING.s3,
    paddingVertical: SPACING.s1,
  },
  questItemPressed: {
    backgroundColor: 'rgba(57, 191, 255, 0.05)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: COLORS.c1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.c1,
  },
  checkmarkIcon: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.bg,
    fontWeight: '900',
  },
  questLabel: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  questLabelCompleted: {
    color: COLORS.tx2,
    textDecorationLine: 'line-through',
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.s2,
  },
  progressText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx3,
  },
  completeBanner: {
    paddingVertical: SPACING.s1,
    marginBottom: SPACING.s2,
    alignItems: 'center',
  },
  completeBannerText: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    letterSpacing: 1.5,
    color: COLORS.ok,
    fontWeight: '700',
  },
  actionButton: {
    marginTop: SPACING.s1,
  },
});
