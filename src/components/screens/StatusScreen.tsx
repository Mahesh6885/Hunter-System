import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { HunterAvatar } from '../common/HunterAvatar';
import { RankBadge } from '../common/RankBadge';
import { ProgressBar } from '../common/ProgressBar';
import { SystemBadge } from '../common/SystemBadge';
import { HunterState, HunterAttributes } from '../../types/hunter';

interface StatusScreenProps {
  hunter: HunterState;
  onAllocatePoint: (attr: keyof HunterAttributes) => void;
}

const ATTRIBUTES_CONFIG: Array<{ key: keyof HunterAttributes; label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'agility', label: 'Agility' },
  { key: 'vitality', label: 'Vitality' },
  { key: 'discipline', label: 'Discipline' },
];

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

export const StatusScreen: React.FC<StatusScreenProps> = ({
  hunter,
  onAllocatePoint,
}) => {
  const xpPercent = (hunter.xp / hunter.maxXP) * 100;

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* Hunter Status Overview */}
      <SystemPanel title="Hunter Status">
        <View style={styles.profileRow}>
          <HunterAvatar size={56} />
          <View style={styles.nameGroup}>
            <Text style={styles.hunterName}>{hunter.name}</Text>
            <Text style={styles.hunterSub}>
              Level {hunter.level} · Rank {hunter.rank}
            </Text>
          </View>
          <RankBadge rank={hunter.rank} size={44} />
        </View>

        <View style={styles.separator} />

        <ProgressBar progress={xpPercent} height={6} />
        <Text style={styles.xpText}>
          {hunter.xp.toLocaleString()} / {hunter.maxXP.toLocaleString()} XP
        </Text>
      </SystemPanel>

      {/* Attributes & Point Allocation */}
      <SystemPanel title="Attributes">
        <View style={styles.pointsHeaderRow}>
          <Text style={styles.pointsLabel}>Available stat points</Text>
          <Text style={styles.pointsValue}>{hunter.statPoints}</Text>
        </View>

        {ATTRIBUTES_CONFIG.map(({ key, label }) => {
          const value = hunter.attributes[key];
          const canAdd = hunter.statPoints > 0 && value < 100;

          return (
            <View key={key} style={styles.statAllocRow}>
              <View style={styles.statMeterGroup}>
                <View style={styles.statTextRow}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={styles.statNum}>{value}</Text>
                </View>
                <ProgressBar progress={value} height={6} />
              </View>

              <Pressable
                disabled={!canAdd}
                onPress={() => onAllocatePoint(key)}
                style={({ pressed }) => [
                  styles.plusButton,
                  !canAdd && styles.plusButtonDisabled,
                  pressed && canAdd && styles.plusButtonPressed,
                ]}>
                <Text style={[styles.plusText, !canAdd && styles.plusTextDisabled]}>
                  +
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.disclaimerText}>
          System stats represent fitness discipline benchmarks.
        </Text>
      </SystemPanel>

      {/* Rank Progression Path */}
      <SystemPanel title="Rank Path">
        <View style={styles.rankPathRow}>
          {RANKS.map((r) => {
            const isCurrent = r === hunter.rank;
            const isUnlocked = r <= hunter.rank;
            return (
              <View key={r} style={[styles.rankStep, !isUnlocked && styles.rankStepLocked]}>
                <Text
                  style={[
                    styles.rankLetter,
                    isCurrent && styles.rankLetterCurrent,
                    !isUnlocked && styles.rankLetterInactive,
                  ]}>
                  {r}
                </Text>
              </View>
            );
          })}
        </View>
      </SystemPanel>

      {/* Titles */}
      <SystemPanel title="Titles">
        <View style={styles.titlesRow}>
          <SystemBadge label="Early Riser" color={COLORS.c1} />
          <SystemBadge label="Iron Will" color={COLORS.rare} />
        </View>
      </SystemPanel>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s3,
  },
  nameGroup: {
    flex: 1,
  },
  hunterName: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.tx,
    fontWeight: '700',
  },
  hunterSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: SPACING.s3,
  },
  xpText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    marginTop: 6,
  },
  pointsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s3,
  },
  pointsLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
  },
  pointsValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.c2,
    fontWeight: '700',
  },
  statAllocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s3,
    marginBottom: SPACING.s3,
  },
  statMeterGroup: {
    flex: 1,
  },
  statTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
  },
  statNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 191, 255, 0.05)',
  },
  plusButtonPressed: {
    backgroundColor: COLORS.chipBgActive,
    borderColor: COLORS.c1,
  },
  plusButtonDisabled: {
    opacity: 0.3,
  },
  plusText: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.c2,
    lineHeight: 22,
  },
  plusTextDisabled: {
    color: COLORS.tx3,
  },
  disclaimerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
    marginTop: SPACING.s1,
  },
  rankPathRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.s2,
  },
  rankStep: {
    alignItems: 'center',
  },
  rankStepLocked: {
    opacity: 0.35,
  },
  rankLetter: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: COLORS.tx,
  },
  rankLetterCurrent: {
    color: COLORS.c2,
    fontWeight: '700',
  },
  rankLetterInactive: {
    color: COLORS.tx3,
  },
  titlesRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    flexWrap: 'wrap',
    paddingVertical: SPACING.s1,
  },
});
