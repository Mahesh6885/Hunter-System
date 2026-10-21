import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { SystemBadge } from '../common/SystemBadge';
import { ProgressBar } from '../common/ProgressBar';
import { RankBadge } from '../common/RankBadge';
import { HunterAvatar, AVATAR_OPTIONS } from '../common/HunterAvatar';
import { useHunter } from '../../context/HunterContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useAchievements } from '../../context/AchievementContext';
import { useBodyScan } from '../../context/BodyScanContext';
import { computeHunterPersonalRecords } from '../../utils/personalRecordsEngine';
import { convertWeight, formatWeight, formatWeightDelta } from '../../utils/weightConversions';

interface ProfileScreenProps {
  onBack: () => void;
  onOpenBodyScan?: () => void;
  onOpenStatus?: () => void;
  onOpenAchievements?: () => void;
}

const HUNTER_TITLES = [
  'Shadow Initiate',
  'Iron Will',
  'Early Riser',
  'Dungeon Raider',
  'Beast Subduer',
  'Monarch of Shadows',
  'Necromancer',
  'S-Rank Sovereign',
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onOpenBodyScan,
  onOpenStatus,
  onOpenAchievements,
}) => {
  const { hunter, updateProfile } = useHunter();
  const { history: workoutHistory } = useWorkout();
  const { unlockedCount, totalCount } = useAchievements();
  const { summary: bodyScanSummary } = useBodyScan();

  // Customization modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [tempName, setTempName] = useState(hunter.name);
  const [tempTitle, setTempTitle] = useState(hunter.title || 'Shadow Initiate');
  const [tempAvatarId, setTempAvatarId] = useState(hunter.avatarId || 'monarch');

  // Compute verified personal records strictly from saved workout history and streaks
  const personalRecords = useMemo(() => {
    return computeHunterPersonalRecords(
      workoutHistory,
      hunter.completedActivityDates || [],
      hunter.streakDays,
      hunter.unit
    );
  }, [workoutHistory, hunter.completedActivityDates, hunter.streakDays, hunter.unit]);

  // Real aggregate career statistics
  const careerStats = useMemo(() => {
    const totalDungeons = workoutHistory.length;
    const totalDurationSecs = workoutHistory.reduce((acc, w) => acc + (w.durationSeconds || 0), 0);
    const totalSets = workoutHistory.reduce((acc, w) => acc + (w.totalSetsCompleted || 0), 0);
    const totalVolumeKg = workoutHistory.reduce((acc, w) => acc + (w.totalVolumeKg || 0), 0);

    const hours = Math.floor(totalDurationSecs / 3600);
    const mins = Math.floor((totalDurationSecs % 3600) / 60);
    const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const displayVolume = hunter.unit === 'lb'
      ? convertWeight(totalVolumeKg, 'kg', 'lb')
      : totalVolumeKg;

    return {
      totalDungeons,
      durationLabel,
      totalSets,
      displayVolume: Math.round(displayVolume).toLocaleString(),
      volumeUnit: hunter.unit,
    };
  }, [workoutHistory, hunter.unit]);

  const xpPercent = Math.min(100, Math.max(0, (hunter.xp / hunter.maxXP) * 100));
  const xpRemaining = Math.max(0, hunter.maxXP - hunter.xp);

  const handleOpenCustomization = () => {
    setTempName(hunter.name);
    setTempTitle(hunter.title || 'Shadow Initiate');
    setTempAvatarId(hunter.avatarId || 'monarch');
    setModalVisible(true);
  };

  const handleSaveCustomization = () => {
    if (!tempName.trim()) {
      Alert.alert('INVALID IDENTITY', 'Hunter codename cannot be empty.');
      return;
    }
    updateProfile({
      name: tempName.trim(),
      title: tempTitle,
      avatarId: tempAvatarId,
    });
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* 1. Header Navigation */}
      <View style={styles.topNavRow}>
        <Pressable onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBtnText}>← BACK</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTag}>SYSTEM VERIFIED IDENTITY</Text>
          <Text style={styles.headerMainTitle}>HUNTER PROFILE</Text>
        </View>

        <Pressable onPress={handleOpenCustomization} style={styles.navBtn}>
          <Text style={styles.navBtnText}>EDIT ⚙</Text>
        </Pressable>
      </View>

      {/* 2. Hunter Identity Card */}
      <SystemPanel title="HUNTER IDENTIFICATION & RANK" hot>
        <View style={styles.identityRow}>
          <Pressable onPress={handleOpenCustomization} style={styles.avatarWrapper}>
            <HunterAvatar size={64} avatarId={hunter.avatarId || 'monarch'} />
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>EDIT</Text>
            </View>
          </Pressable>

          <View style={styles.identityDetails}>
            <View style={styles.titleBadgeRow}>
              <SystemBadge label={hunter.title || 'Shadow Initiate'} color={COLORS.c1} />
              <SystemBadge label={`RANK ${hunter.rank}`} color={COLORS.rare} />
            </View>
            <Text style={styles.hunterName}>{hunter.name}</Text>
            <Text style={styles.hunterLevelText}>LEVEL {hunter.level} HUNTER</Text>
          </View>

          <RankBadge rank={hunter.rank} size={48} />
        </View>

        <View style={styles.divider} />

        {/* XP Progress Bar */}
        <View style={styles.xpBlock}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>SYSTEM XP TO LEVEL {hunter.level + 1}</Text>
            <Text style={styles.xpValue}>
              {hunter.xp.toLocaleString()} / {hunter.maxXP.toLocaleString()} XP
            </Text>
          </View>
          <ProgressBar progress={xpPercent} height={7} />
          <Text style={styles.xpSubtext}>
            {xpRemaining.toLocaleString()} XP needed to trigger next level advancement.
          </Text>
        </View>
      </SystemPanel>

      {/* 3. Verified Career Combat Totals */}
      <SystemPanel title="CAREER TELEMETRY">
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{careerStats.totalDungeons}</Text>
            <Text style={styles.statLabel}>DUNGEONS CLEARED</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{careerStats.durationLabel}</Text>
            <Text style={styles.statLabel}>COMBAT TIME</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{careerStats.totalSets}</Text>
            <Text style={styles.statLabel}>SETS COMPLETED</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statNumber}>{careerStats.displayVolume}</Text>
            <Text style={styles.statLabel}>VOLUME ({careerStats.volumeUnit.toUpperCase()})</Text>
          </View>
        </View>
      </SystemPanel>

      {/* 4. Verified Personal Records (PRs) */}
      <SystemPanel title="VERIFIED PERSONAL RECORDS" hot>
        <Text style={styles.sectionSubtitle}>
          Records calculated exclusively from saved combat sessions. Unverified estimates are strictly excluded.
        </Text>

        <View style={styles.prList}>
          {/* PR 1: Most Sets in a Workout */}
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTitle}>{personalRecords.mostSets.title}</Text>
              <SystemBadge
                label={personalRecords.mostSets.verified ? 'VERIFIED' : 'NO RECORD'}
                color={personalRecords.mostSets.verified ? COLORS.ok : COLORS.tx3}
              />
            </View>
            <Text style={styles.prValue}>{personalRecords.mostSets.displayValue}</Text>
            <Text style={styles.prDesc}>{personalRecords.mostSets.description}</Text>
            {personalRecords.mostSets.workoutTitle && (
              <Text style={styles.prMeta}>
                Session: {personalRecords.mostSets.workoutTitle} · Date: {personalRecords.mostSets.achievedDateKey}
              </Text>
            )}
          </View>

          {/* PR 2: Longest Completed Workout */}
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTitle}>{personalRecords.longestWorkout.title}</Text>
              <SystemBadge
                label={personalRecords.longestWorkout.verified ? 'VERIFIED' : 'NO RECORD'}
                color={personalRecords.longestWorkout.verified ? COLORS.ok : COLORS.tx3}
              />
            </View>
            <Text style={styles.prValue}>{personalRecords.longestWorkout.displayValue}</Text>
            <Text style={styles.prDesc}>{personalRecords.longestWorkout.description}</Text>
            {personalRecords.longestWorkout.workoutTitle && (
              <Text style={styles.prMeta}>
                Session: {personalRecords.longestWorkout.workoutTitle} · Date: {personalRecords.longestWorkout.achievedDateKey}
              </Text>
            )}
          </View>

          {/* PR 3: Highest Recorded Volume */}
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTitle}>{personalRecords.highestVolume.title}</Text>
              <SystemBadge
                label={personalRecords.highestVolume.verified ? 'VERIFIED' : 'NO RECORD'}
                color={personalRecords.highestVolume.verified ? COLORS.ok : COLORS.tx3}
              />
            </View>
            <Text style={styles.prValue}>{personalRecords.highestVolume.displayValue}</Text>
            <Text style={styles.prDesc}>{personalRecords.highestVolume.description}</Text>
            {personalRecords.highestVolume.workoutTitle && (
              <Text style={styles.prMeta}>
                Session: {personalRecords.highestVolume.workoutTitle} · Date: {personalRecords.highestVolume.achievedDateKey}
              </Text>
            )}
          </View>

          {/* PR 4: Consistency Streaks */}
          <View style={styles.prCard}>
            <View style={styles.prHeader}>
              <Text style={styles.prTitle}>MOMENTUM & STREAKS</Text>
              <SystemBadge label="LIFETIME" color={COLORS.c1} />
            </View>
            <View style={styles.streakCompareRow}>
              <View style={styles.streakBox}>
                <Text style={styles.streakSub}>CURRENT ACTIVE</Text>
                <Text style={styles.streakMain}>{personalRecords.currentStreak.displayValue}</Text>
              </View>
              <View style={styles.streakBox}>
                <Text style={styles.streakSub}>ALL-TIME BEST</Text>
                <Text style={[styles.streakMain, { color: COLORS.c1 }]}>
                  {personalRecords.bestStreak.displayValue}
                </Text>
              </View>
            </View>
            <Text style={styles.prDesc}>
              Streaks represent consecutive calendar days with verified quest or training activity.
            </Text>
          </View>
        </View>
      </SystemPanel>

      {/* 5. Biometric Body Scan Status */}
      <SystemPanel
        title="BODY SCAN & WEIGHT TELEMETRY"
        headerRight={
          onOpenBodyScan && (
            <SystemButton
              label="OPEN LOG"
              variant="secondary"
              onPress={onOpenBodyScan}
              style={{ minWidth: 70, paddingVertical: 4 }}
            />
          )
        }>
        {bodyScanSummary.latestEntry ? (
          <View style={styles.bodyScanSnapshot}>
            <View style={styles.weightStatGroup}>
              <Text style={styles.weightLabel}>LATEST WEIGH-IN ({bodyScanSummary.latestEntry.dateKey})</Text>
              <Text style={styles.weightBig}>
                {formatWeight(bodyScanSummary.latestEntry.weightKg, hunter.unit)}
              </Text>
            </View>

            {bodyScanSummary.deltaKg !== null && (
              <View style={styles.deltaBox}>
                <Text style={styles.deltaLabel}>CHANGE</Text>
                <Text
                  style={[
                    styles.deltaValue,
                    bodyScanSummary.deltaKg > 0 ? styles.deltaPlus : styles.deltaMinus,
                  ]}>
                  {formatWeightDelta(bodyScanSummary.deltaKg, hunter.unit)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptySnapshot}>
            <Text style={styles.emptySnapshotText}>No weight measurements logged yet.</Text>
            {onOpenBodyScan && (
              <SystemButton
                label="RECORD FIRST BODY SCAN"
                variant="secondary"
                onPress={onOpenBodyScan}
                style={{ marginTop: SPACING.s2 }}
              />
            )}
          </View>
        )}
      </SystemPanel>

      {/* 6. System Attributes Summary */}
      <SystemPanel
        title="HUNTER ATTRIBUTES"
        headerRight={
          onOpenStatus && (
            <SystemButton
              label="ALLOCATE"
              variant="secondary"
              onPress={onOpenStatus}
              style={{ minWidth: 70, paddingVertical: 4 }}
            />
          )
        }>
        <View style={styles.attributesRow}>
          <Text style={styles.pointsRemaining}>
            Available Stat Points: <Text style={styles.pointsHighlight}>{hunter.statPoints}</Text>
          </Text>
        </View>
        <View style={styles.attrGrid}>
          {Object.entries(hunter.attributes).map(([key, val]) => (
            <View key={key} style={styles.attrItem}>
              <Text style={styles.attrName}>{key.substring(0, 3).toUpperCase()}</Text>
              <Text style={styles.attrVal}>{val}</Text>
            </View>
          ))}
        </View>
      </SystemPanel>

      {/* 7. Achievements & Trophies Summary */}
      <SystemPanel
        title="SYSTEM TROPHIES"
        headerRight={
          onOpenAchievements && (
            <SystemButton
              label="VIEW ALL"
              variant="secondary"
              onPress={onOpenAchievements}
              style={{ minWidth: 70, paddingVertical: 4 }}
            />
          )
        }>
        <View style={styles.achievementSummaryRow}>
          <Text style={styles.achievementCount}>
            {unlockedCount} / {totalCount} UNLOCKED
          </Text>
          <SystemBadge label={`${Math.round((unlockedCount / totalCount) * 100)}% COMPLETE`} color={COLORS.ok} />
        </View>
        <ProgressBar progress={(unlockedCount / totalCount) * 100} height={6} />
      </SystemPanel>

      {/* Profile Customization Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>CUSTOMIZE HUNTER IDENTITY</Text>
            <Text style={styles.modalSub}>Changes are saved locally to your device storage.</Text>

            {/* Codename Input */}
            <Text style={styles.inputLabel}>HUNTER CODENAME</Text>
            <TextInput
              style={styles.textInput}
              value={tempName}
              onChangeText={setTempName}
              maxLength={20}
              placeholderTextColor={COLORS.tx3}
            />

            {/* Avatar Selection */}
            <Text style={styles.inputLabel}>AVATAR CREST</Text>
            <View style={styles.avatarPickerRow}>
              {AVATAR_OPTIONS.map((opt) => {
                const isSelected = tempAvatarId === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setTempAvatarId(opt.id)}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}>
                    <HunterAvatar
                      size={42}
                      avatarId={opt.id}
                      borderColor={isSelected ? COLORS.c1 : COLORS.line}
                    />
                    <Text
                      style={[
                        styles.avatarOptionText,
                        isSelected && styles.avatarOptionTextSelected,
                      ]}>
                      {opt.name.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Title Selection */}
            <Text style={styles.inputLabel}>HUNTER TITLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titlesScroll}>
              <View style={styles.titlesListRow}>
                {HUNTER_TITLES.map((t) => {
                  const isSelected = tempTitle === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTempTitle(t)}
                      style={[styles.titleChoiceChip, isSelected && styles.titleChoiceChipSelected]}>
                      <Text
                        style={[
                          styles.titleChoiceText,
                          isSelected && styles.titleChoiceTextSelected,
                        ]}>
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalActionRow}>
              <SystemButton
                label="CANCEL"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <SystemButton
                label="SAVE IDENTITY"
                onPress={handleSaveCustomization}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.c1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  editBadgeText: {
    fontFamily: FONTS.displayBold,
    fontSize: 8,
    color: COLORS.bg,
  },
  identityDetails: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  hunterName: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.tx,
    letterSpacing: 1.2,
  },
  hunterLevelText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.c2,
    letterSpacing: 1,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: SPACING.s2,
  },
  xpBlock: {
    gap: 4,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  xpValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.c1,
  },
  xpSubtext: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s1,
  },
  statCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s2,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.c1,
  },
  statLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
    marginBottom: SPACING.s2,
  },
  prList: {
    gap: SPACING.s2,
  },
  prCard: {
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s2,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 11,
    color: COLORS.tx,
    letterSpacing: 1.1,
  },
  prValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.c2,
    marginVertical: 2,
  },
  prDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  prMeta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.c1,
    marginTop: 4,
  },
  streakCompareRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginVertical: 4,
  },
  streakBox: {
    flex: 1,
    backgroundColor: 'rgba(5, 12, 20, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s1,
    alignItems: 'center',
  },
  streakSub: {
    fontFamily: FONTS.displayMedium,
    fontSize: 8,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  streakMain: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: COLORS.tx,
    marginTop: 2,
  },
  bodyScanSnapshot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.s1,
  },
  weightStatGroup: {
    flex: 1,
  },
  weightLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  weightBig: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.c1,
    marginTop: 2,
  },
  deltaBox: {
    alignItems: 'flex-end',
  },
  deltaLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  deltaValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    marginTop: 2,
  },
  deltaPlus: {
    color: COLORS.c1,
  },
  deltaMinus: {
    color: COLORS.ok,
  },
  emptySnapshot: {
    paddingVertical: SPACING.s2,
    alignItems: 'center',
  },
  emptySnapshotText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
  },
  attributesRow: {
    marginBottom: SPACING.s1,
  },
  pointsRemaining: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  pointsHighlight: {
    fontFamily: FONTS.displayBold,
    color: COLORS.c1,
  },
  attrGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s2,
  },
  attrItem: {
    alignItems: 'center',
  },
  attrName: {
    fontFamily: FONTS.displayBold,
    fontSize: 10,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  attrVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: COLORS.tx,
    marginTop: 2,
  },
  achievementSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s1,
  },
  achievementCount: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.tx,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 8, 14, 0.85)',
    justifyContent: 'center',
    padding: SPACING.s3,
  },
  modalContent: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.c1,
    borderRadius: 6,
    padding: SPACING.s3,
    gap: SPACING.s2,
  },
  modalHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.tx,
    letterSpacing: 1.2,
  },
  modalSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  inputLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.c2,
    letterSpacing: 1,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s2,
    color: COLORS.tx,
    fontFamily: FONTS.displayMedium,
    fontSize: 13,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  avatarOption: {
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
  },
  avatarOptionSelected: {
    borderColor: COLORS.c1,
    backgroundColor: 'rgba(57, 191, 255, 0.1)',
  },
  avatarOptionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 8,
    color: COLORS.tx3,
    marginTop: 4,
  },
  avatarOptionTextSelected: {
    color: COLORS.c1,
  },
  titlesScroll: {
    maxHeight: 50,
  },
  titlesListRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  titleChoiceChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
  },
  titleChoiceChipSelected: {
    borderColor: COLORS.c1,
    backgroundColor: 'rgba(57, 191, 255, 0.2)',
  },
  titleChoiceText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  titleChoiceTextSelected: {
    color: COLORS.c1,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s2,
  },
});
