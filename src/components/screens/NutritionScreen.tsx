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
import { SystemButton } from '../common/SystemButton';
import { SystemBadge } from '../common/SystemBadge';
import { ProgressBar } from '../common/ProgressBar';
import { useNutrition } from '../../context/NutritionContext';
import { AddFoodModal } from '../nutrition/AddFoodModal';
import { EditFoodModal } from '../nutrition/EditFoodModal';
import { ConfigureTargetsModal } from '../nutrition/ConfigureTargetsModal';
import { WaterLogModal } from '../nutrition/WaterLogModal';
import { LoggedFoodEntry, MealType } from '../../types/nutrition';
import { addDaysToDateKey } from '../../utils/dateEngine';

interface NutritionScreenProps {
  onBack: () => void;
}

const MEALS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'BREAKFAST' },
  { type: 'lunch', label: 'LUNCH' },
  { type: 'dinner', label: 'DINNER' },
  { type: 'snack', label: 'SNACKS' },
];

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ onBack }) => {
  const {
    currentDateKey,
    todayDateKey,
    targets,
    catalogue,
    dayRecord,
    totals,
    setCurrentDateKey,
    goToToday,
    addFoodEntry,
    editFoodEntry,
    deleteFoodEntry,
    addCustomFood,
    addWater,
    removeWaterLog,
    updateTargets,
  } = useNutrition();

  // Modals state
  const [activeModalMeal, setActiveModalMeal] = useState<MealType | null>(null);
  const [editingEntry, setEditingEntry] = useState<LoggedFoodEntry | null>(null);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

  const isToday = currentDateKey === todayDateKey;

  const handlePrevDay = () => {
    setCurrentDateKey(addDaysToDateKey(currentDateKey, -1));
  };

  const handleNextDay = () => {
    setCurrentDateKey(addDaysToDateKey(currentDateKey, 1));
  };

  // Group entries by meal type
  const entriesByMeal = (mealType: MealType) => {
    return dayRecord.entries.filter((e) => e.mealType === mealType);
  };

  const getMealSubtotal = (mealType: MealType) => {
    const items = entriesByMeal(mealType);
    let cal = 0;
    let prot = 0;
    for (const item of items) {
      cal += item.calories;
      prot += item.protein;
    }
    return { cal, prot: Math.round(prot * 10) / 10 };
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* 1. Header Navigation Bar */}
      <View style={styles.topNavRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← SYSTEM</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTag}>SYSTEM PROTOCOL // NUTRITION</Text>
          <Text style={styles.headerMainTitle}>NUTRIENT & HYDRATION</Text>
        </View>

        <Pressable onPress={() => setIsTargetsModalOpen(true)} style={styles.targetsBtn}>
          <Text style={styles.targetsBtnText}>TARGETS ⚙</Text>
        </Pressable>
      </View>

      {/* 2. Date Switcher */}
      <View style={styles.dateSwitcherRow}>
        <Pressable onPress={handlePrevDay} style={styles.dateNavBtn}>
          <Text style={styles.dateNavBtnText}>◄ PREV</Text>
        </Pressable>

        <View style={styles.dateCenter}>
          <Text style={styles.dateKeyText}>{currentDateKey}</Text>
          {isToday ? (
            <SystemBadge label="TODAY" color={COLORS.ok} />
          ) : (
            <Pressable onPress={goToToday} style={styles.todayPill}>
              <Text style={styles.todayPillText}>GO TO TODAY</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={handleNextDay} style={styles.dateNavBtn}>
          <Text style={styles.dateNavBtnText}>NEXT ►</Text>
        </Pressable>
      </View>

      {/* 3. Empty State Notice if Day has zero logs */}
      {totals.entryCount === 0 && totals.waterIntakeMl === 0 && (
        <View style={styles.emptyNoticeBox}>
          <Text style={styles.emptyNoticeTitle}>[ SYSTEM NOTICE: NUTRIENT INTAKE PENDING ]</Text>
          <Text style={styles.emptyNoticeDesc}>
            No meals or water logged for cycle {currentDateKey}. Fuel your body to maintain peak physical attributes and accelerate recovery.
          </Text>
        </View>
      )}

      {/* 4. Caloric Intake & Remaining Summary */}
      <SystemPanel title="DAILY CALORIC STATUS" hot>
        <View style={styles.calorieGrid}>
          <View style={styles.calorieMain}>
            <Text style={styles.calorieBigNumber}>{totals.calories.toLocaleString()}</Text>
            <Text style={styles.calorieSubText}>CONSUMED / {totals.caloriesTarget.toLocaleString()} TARGET</Text>
          </View>
          <View style={styles.calorieRemainingBox}>
            <Text style={styles.remainingNumber}>{totals.remainingCalories.toLocaleString()}</Text>
            <Text style={styles.remainingLabel}>KCAL REMAINING</Text>
          </View>
        </View>

        <ProgressBar progress={totals.caloriePercent} height={8} style={styles.calorieBar} />

        <View style={styles.barFooterRow}>
          <Text style={styles.barFooterText}>{totals.caloriePercent}% of daily budget</Text>
          <Text style={styles.barFooterText}>
            {totals.calories > totals.caloriesTarget ? 'Target Surpassed' : `${totals.remainingCalories} kcal left`}
          </Text>
        </View>
      </SystemPanel>

      {/* 5. Macronutrients Breakdown Panel */}
      <SystemPanel title="MACRONUTRIENT BALANCE">
        <View style={styles.macroCardsRow}>
          {/* Protein */}
          <View style={styles.macroCell}>
            <Text style={styles.macroName}>PROTEIN</Text>
            <Text style={styles.macroConsumed}>{totals.protein}g</Text>
            <Text style={styles.macroTarget}>/ {totals.proteinTarget}g</Text>
            <ProgressBar progress={totals.proteinPercent} height={4} style={styles.cellBar} />
            <Text style={styles.macroRemaining}>{totals.remainingProtein}g left</Text>
          </View>

          {/* Carbs */}
          <View style={styles.macroCell}>
            <Text style={styles.macroName}>CARBS</Text>
            <Text style={styles.macroConsumed}>{totals.carbs}g</Text>
            <Text style={styles.macroTarget}>/ {totals.carbsTarget}g</Text>
            <ProgressBar progress={totals.carbsPercent} height={4} style={styles.cellBar} />
            <Text style={styles.macroRemaining}>{totals.remainingCarbs}g left</Text>
          </View>

          {/* Fat */}
          <View style={styles.macroCell}>
            <Text style={styles.macroName}>FAT</Text>
            <Text style={styles.macroConsumed}>{totals.fat}g</Text>
            <Text style={styles.macroTarget}>/ {totals.fatTarget}g</Text>
            <ProgressBar progress={totals.fatPercent} height={4} style={styles.cellBar} />
            <Text style={styles.macroRemaining}>{totals.remainingFat}g left</Text>
          </View>
        </View>
      </SystemPanel>

      {/* 6. Hydration Protocol Panel */}
      <SystemPanel title="HYDRATION PROTOCOL" headerRight={
        <Pressable onPress={() => setIsWaterModalOpen(true)} style={styles.waterLogsLink}>
          <Text style={styles.waterLogsLinkText}>MANAGE / LOGS ({dayRecord.waterLogs.length})</Text>
        </Pressable>
      }>
        <View style={styles.waterRow}>
          <View style={styles.waterLeft}>
            <Text style={styles.waterBigNum}>{totals.waterIntakeMl} ML</Text>
            <Text style={styles.waterSubText}>/ {totals.waterTargetMl} ML ({totals.waterPercent}%)</Text>
          </View>
          <View style={styles.waterRight}>
            <Text style={styles.waterRemainingText}>{totals.remainingWaterMl} ml to target</Text>
          </View>
        </View>

        <ProgressBar progress={totals.waterPercent} height={6} style={styles.waterBar} />

        {/* Quick Add Water Buttons */}
        <View style={styles.waterQuickBtnsRow}>
          <Pressable style={styles.waterQuickBtn} onPress={() => addWater(250)}>
            <Text style={styles.waterQuickBtnText}>+250 ML</Text>
          </Pressable>
          <Pressable style={styles.waterQuickBtn} onPress={() => addWater(500)}>
            <Text style={styles.waterQuickBtnText}>+500 ML</Text>
          </Pressable>
          <Pressable style={styles.waterQuickBtn} onPress={() => addWater(1000)}>
            <Text style={styles.waterQuickBtnText}>+1000 ML</Text>
          </Pressable>
          <Pressable
            style={[styles.waterQuickBtn, styles.waterCustomBtn]}
            onPress={() => setIsWaterModalOpen(true)}>
            <Text style={[styles.waterQuickBtnText, styles.waterCustomBtnText]}>CUSTOM...</Text>
          </Pressable>
        </View>
      </SystemPanel>

      {/* 7. Meal Logging Sections (Breakfast, Lunch, Dinner, Snacks) */}
      {MEALS.map((meal) => {
        const items = entriesByMeal(meal.type);
        const subtotal = getMealSubtotal(meal.type);

        return (
          <SystemPanel
            key={meal.type}
            title={meal.label}
            headerRight={
              <View style={styles.mealHeaderRight}>
                <Text style={styles.mealSubtotalText}>
                  {subtotal.cal} kcal · {subtotal.prot}g P
                </Text>
              </View>
            }>
            {items.length === 0 ? (
              <View style={styles.emptyMealBox}>
                <Text style={styles.emptyMealText}>No food logged for {meal.label.toLowerCase()}.</Text>
                <SystemButton
                  label={`+ LOG ${meal.label}`}
                  variant="secondary"
                  onPress={() => setActiveModalMeal(meal.type)}
                  style={styles.addFoodBtn}
                />
              </View>
            ) : (
              <View style={styles.mealEntriesContainer}>
                {items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setEditingEntry(item)}
                    style={styles.foodItemRow}>
                    <View style={styles.foodItemMain}>
                      <View style={styles.foodItemTop}>
                        <Text style={styles.foodItemName}>{item.name}</Text>
                        <Text style={styles.foodItemCalories}>{item.calories} kcal</Text>
                      </View>
                      <View style={styles.foodItemDetails}>
                        <Text style={styles.foodItemSize}>
                          {item.servings} × {item.servingSize}
                        </Text>
                        <Text style={styles.foodItemMacros}>
                          P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => deleteFoodEntry(item.id)}
                      style={styles.foodItemDeleteBtn}>
                      <Text style={styles.foodItemDeleteText}>✕</Text>
                    </Pressable>
                  </Pressable>
                ))}

                <SystemButton
                  label={`+ ADD TO ${meal.label}`}
                  variant="secondary"
                  onPress={() => setActiveModalMeal(meal.type)}
                  style={styles.addMoreBtn}
                />
              </View>
            )}
          </SystemPanel>
        );
      })}

      {/* Modals */}
      {activeModalMeal && (
        <AddFoodModal
          visible={!!activeModalMeal}
          mealType={activeModalMeal}
          catalogue={catalogue}
          onAddFood={addFoodEntry}
          onSaveCustomFood={addCustomFood}
          onClose={() => setActiveModalMeal(null)}
        />
      )}

      {editingEntry && (
        <EditFoodModal
          visible={!!editingEntry}
          entry={editingEntry}
          onSave={editFoodEntry}
          onDelete={deleteFoodEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}

      <ConfigureTargetsModal
        visible={isTargetsModalOpen}
        currentTargets={targets}
        onSave={updateTargets}
        onClose={() => setIsTargetsModalOpen(false)}
      />

      <WaterLogModal
        visible={isWaterModalOpen}
        waterLogs={dayRecord.waterLogs}
        totalWaterMl={totals.waterIntakeMl}
        waterTargetMl={totals.waterTargetMl}
        onAddWater={addWater}
        onRemoveWaterLog={removeWaterLog}
        onClose={() => setIsWaterModalOpen(false)}
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
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
  },
  backBtnText: {
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
  targetsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(10, 25, 45, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.c2,
    borderRadius: 3,
  },
  targetsBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.c2,
    letterSpacing: 1.1,
  },
  dateSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 20, 32, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s1,
  },
  dateNavBtn: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.s2,
  },
  dateNavBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.c1,
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s1,
  },
  dateKeyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.tx,
  },
  todayPill: {
    backgroundColor: 'rgba(57, 191, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.c1,
  },
  todayPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.c1,
  },
  emptyNoticeBox: {
    backgroundColor: 'rgba(57, 191, 255, 0.05)',
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: COLORS.c2,
    padding: SPACING.s2,
    borderRadius: 3,
  },
  emptyNoticeTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 11,
    color: COLORS.c2,
    marginBottom: 4,
  },
  emptyNoticeDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
    lineHeight: 16,
  },
  calorieGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s1,
  },
  calorieMain: {
    flex: 1,
  },
  calorieBigNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: COLORS.c1,
  },
  calorieSubText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  calorieRemainingBox: {
    alignItems: 'flex-end',
  },
  remainingNumber: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: COLORS.c2,
  },
  remainingLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.tx3,
    letterSpacing: 1.1,
  },
  calorieBar: {
    marginVertical: SPACING.s1,
  },
  barFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  barFooterText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  macroCardsRow: {
    flexDirection: 'row',
    gap: SPACING.s1,
  },
  macroCell: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s1,
    alignItems: 'center',
  },
  macroName: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.c2,
    letterSpacing: 1.2,
  },
  macroConsumed: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: COLORS.tx,
    marginTop: 2,
  },
  macroTarget: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  cellBar: {
    width: '100%',
    marginVertical: 4,
  },
  macroRemaining: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx2,
  },
  waterLogsLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  waterLogsLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.c1,
  },
  waterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  waterBigNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.c1,
  },
  waterSubText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
  },
  waterRight: {
    alignItems: 'flex-end',
  },
  waterRemainingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  waterBar: {
    marginVertical: SPACING.s1,
  },
  waterQuickBtnsRow: {
    flexDirection: 'row',
    gap: SPACING.s1,
    marginTop: 4,
  },
  waterQuickBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 30, 50, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    paddingVertical: 6,
    alignItems: 'center',
  },
  waterQuickBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.c2,
  },
  waterCustomBtn: {
    borderColor: COLORS.c1,
  },
  waterCustomBtnText: {
    color: COLORS.c1,
  },
  mealHeaderRight: {
    alignItems: 'flex-end',
  },
  mealSubtotalText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.c2,
  },
  emptyMealBox: {
    paddingVertical: SPACING.s2,
    alignItems: 'center',
    gap: SPACING.s1,
  },
  emptyMealText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    fontStyle: 'italic',
  },
  addFoodBtn: {
    minWidth: 140,
  },
  mealEntriesContainer: {
    gap: 6,
  },
  foodItemRow: {
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodItemMain: {
    flex: 1,
  },
  foodItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodItemName: {
    fontFamily: FONTS.displayMedium,
    fontSize: 13,
    color: COLORS.tx,
  },
  foodItemCalories: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.c1,
  },
  foodItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  foodItemSize: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  foodItemMacros: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
  },
  foodItemDeleteBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  foodItemDeleteText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.tx3,
  },
  addMoreBtn: {
    marginTop: 4,
  },
});
