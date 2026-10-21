import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { ProgressBar } from '../common/ProgressBar';
import { NutritionOverview } from '../../types/hunter';

interface NutritionCardProps {
  nutrition: NutritionOverview;
  onOpenNutrition?: () => void;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  nutrition,
  onOpenNutrition,
}) => {
  const caloriePercent = Math.round((nutrition.calories / nutrition.caloriesTarget) * 100);

  return (
    <SystemPanel
      title="Nutrition"
      headerRight={
        <Pressable
          onPress={onOpenNutrition}
          style={({ pressed }) => [styles.openBtn, pressed && styles.openBtnPressed]}>
          <Text style={styles.openBtnText}>OPEN</Text>
        </Pressable>
      }>
      {/* 2-Column Stat Grid */}
      <View style={styles.grid2}>
        <View style={styles.statCell}>
          <Text style={styles.cellNumber}>
            {nutrition.calories.toLocaleString()}
          </Text>
          <Text style={styles.cellLabel}>
            KCAL / {nutrition.caloriesTarget.toLocaleString()}
          </Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.cellNumber}>{nutrition.protein} g</Text>
          <Text style={styles.cellLabel}>
            PROTEIN / {nutrition.proteinTarget}
          </Text>
        </View>
      </View>

      {/* Calorie Intake Bar */}
      <ProgressBar
        progress={caloriePercent}
        height={6}
        style={styles.macroBar}
      />

      {/* Macros Footer */}
      <View style={styles.macroRow}>
        <Text style={styles.macroText}>Carbs {nutrition.carbs} g</Text>
        <Text style={styles.macroText}>Fat {nutrition.fat} g</Text>
        {nutrition.waterIntakeMl !== undefined && (
          <Text style={styles.macroText}>Water {nutrition.waterIntakeMl} ml</Text>
        )}
      </View>
    </SystemPanel>
  );
};

const styles = StyleSheet.create({
  openBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  openBtnPressed: {
    opacity: 0.6,
  },
  openBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: COLORS.c2,
    fontWeight: '700',
  },
  grid2: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginBottom: SPACING.s2,
  },
  statCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: SPACING.s2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(57, 191, 255, 0.03)',
  },
  cellNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: COLORS.tx,
    fontWeight: '700',
  },
  cellLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    color: COLORS.tx3,
    marginTop: 2,
  },
  macroBar: {
    marginVertical: SPACING.s1,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  macroText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
  },
});
