import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { useHunter } from '../../context/HunterContext';
import { useNutrition } from '../../context/NutritionContext';

interface MoreScreenProps {
  onPreviewRank?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onPreviewRank }) => {
  const {
    hunter,
    setActiveScreen,
    toggleReducedMotion,
    toggleSound,
    toggleUnit,
    resetProgress,
  } = useHunter();
  const { totals: nutritionTotals } = useNutrition();

  const handleReset = () => {
    Alert.alert(
      'SYSTEM RESET',
      'Are you sure you want to reset all hunter progress, stats, and quests back to the initial state?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'RESET ALL PROGRESS',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>MORE</Text>

      {/* Profile & Settings (Persisted locally) */}
      <SystemPanel title="Settings & Preferences">
        {/* Units Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Text style={styles.settingTitle}>Units of Measure</Text>
            <Text style={styles.settingDesc}>Currently: {hunter.unit.toUpperCase()}</Text>
          </View>
          <SystemButton
            label={`SWITCH TO ${hunter.unit === 'kg' ? 'LB' : 'KG'}`}
            variant="secondary"
            onPress={toggleUnit}
            style={styles.toggleBtn}
          />
        </View>

        {/* Sound Toggle */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Text style={styles.settingTitle}>Sound Effects</Text>
            <Text style={styles.settingDesc}>
              {hunter.soundEnabled ? 'Enabled' : 'Muted'}
            </Text>
          </View>
          <SystemButton
            label={hunter.soundEnabled ? 'MUTE' : 'ENABLE'}
            variant="secondary"
            onPress={toggleSound}
            style={styles.toggleBtn}
          />
        </View>

        {/* Reduced Motion */}
        <View style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Text style={styles.settingTitle}>Reduced Motion</Text>
            <Text style={styles.settingDesc}>
              {hunter.reducedMotion ? 'Active' : 'Standard animations'}
            </Text>
          </View>
          <SystemButton
            label={hunter.reducedMotion ? 'DISABLE' : 'ENABLE'}
            variant="secondary"
            onPress={toggleReducedMotion}
            style={styles.toggleBtn}
          />
        </View>

        {/* Reset Progress */}
        <View style={[styles.settingItem, styles.lastSettingItem]}>
          <View style={styles.settingLabelGroup}>
            <Text style={styles.settingTitle}>Reset Progress</Text>
            <Text style={styles.settingDesc}>Clear storage & restore initial mock data</Text>
          </View>
          <SystemButton
            label="RESET"
            variant="secondary"
            onPress={handleReset}
            style={styles.toggleBtn}
          />
        </View>

        <Text style={styles.persistedHint}>
          ✓ All settings and progress are automatically saved to local device storage.
        </Text>
      </SystemPanel>

      {/* Other System Sections */}
      <SystemPanel title="Nutrition & Meals" headerRight={
        <SystemButton
          label="OPEN"
          variant="secondary"
          onPress={() => setActiveScreen('nutrition')}
          style={{ minWidth: 60, paddingVertical: 4 }}
        />
      }>
        <Text style={styles.sectionDesc}>
          Today: {nutritionTotals.calories} / {nutritionTotals.caloriesTarget} kcal · Protein {nutritionTotals.protein}g · Water {nutritionTotals.waterIntakeMl} ml
        </Text>
      </SystemPanel>

      <SystemPanel title="Progress & Analytics">
        <Text style={styles.sectionDesc}>
          Current streak: {hunter.streakDays} consecutive days · Level {hunter.level} Hunter
        </Text>
      </SystemPanel>

      <SystemPanel title="Achievements & Trophies">
        <Text style={styles.sectionDesc}>
          Unlocked: First Gate, 7-Day Streak, Iron Will
        </Text>
      </SystemPanel>

      <SystemButton
        label="PREVIEW RANK PROMOTION MODAL"
        onPress={() => onPreviewRank?.()}
        style={styles.previewBtn}
      />
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
    paddingBottom: SPACING.s5,
  },
  screenHeading: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    letterSpacing: 1.5,
    color: COLORS.tx,
    marginVertical: SPACING.s3,
    fontWeight: '700',
  },
  sectionDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginBottom: SPACING.s1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s2 + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
    gap: SPACING.s2,
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingLabelGroup: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.tx,
  },
  settingDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    marginTop: 2,
  },
  toggleBtn: {
    minWidth: 100,
    minHeight: 38,
    paddingHorizontal: SPACING.s2,
  },
  persistedHint: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.ok,
    marginTop: SPACING.s2,
  },
  previewBtn: {
    marginTop: SPACING.s3,
  },
});
