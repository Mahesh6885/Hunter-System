import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { FoodItem, MealType } from '../../types/nutrition';
import { calculateFoodEntryNutrition } from '../../data/nutritionData';

interface AddFoodModalProps {
  visible: boolean;
  mealType: MealType;
  catalogue: FoodItem[];
  onAddFood: (
    mealType: MealType,
    food: Pick<FoodItem, 'name' | 'servingSize' | 'calories' | 'protein' | 'carbs' | 'fat'> & { id?: string },
    servings: number
  ) => void;
  onSaveCustomFood: (food: Omit<FoodItem, 'id' | 'isCustom'>) => void;
  onClose: () => void;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  visible,
  mealType,
  catalogue,
  onAddFood,
  onSaveCustomFood,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'custom'>('catalogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servingsStr, setServingsStr] = useState('1');

  // Custom Food Form State
  const [customName, setCustomName] = useState('');
  const [customServingSize, setCustomServingSize] = useState('1 serving');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customServingsStr, setCustomServingsStr] = useState('1');
  const [saveToCatalogue, setSaveToCatalogue] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter catalogue
  const filteredCatalogue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter((item) => item.name.toLowerCase().includes(q));
  }, [catalogue, searchQuery]);

  const parsedServings = useMemo(() => {
    const s = parseFloat(servingsStr);
    return isNaN(s) || s <= 0 ? 1 : s;
  }, [servingsStr]);

  const liveCalculatedNutrition = useMemo(() => {
    if (!selectedFood) return null;
    return calculateFoodEntryNutrition(selectedFood, parsedServings);
  }, [selectedFood, parsedServings]);

  const handleAdjustServings = (delta: number) => {
    const current = parseFloat(servingsStr) || 1;
    const next = Math.max(0.25, Math.round((current + delta) * 100) / 100);
    setServingsStr(String(next));
  };

  const handleLogFromCatalogue = () => {
    if (!selectedFood) {
      setFormError('Please select a food from the catalogue.');
      return;
    }
    const servings = parseFloat(servingsStr);
    if (isNaN(servings) || servings <= 0) {
      setFormError('Servings must be a positive number greater than 0.');
      return;
    }

    onAddFood(mealType, selectedFood, servings);
    handleClose();
  };

  const handleLogCustomFood = () => {
    if (!customName.trim()) {
      setFormError('Food name is required.');
      return;
    }

    const cal = parseInt(customCalories.trim(), 10);
    const prot = parseFloat(customProtein.trim());
    const carb = parseFloat(customCarbs.trim());
    const fat = parseFloat(customFat.trim());
    const servings = parseFloat(customServingsStr.trim());

    if (isNaN(cal) || cal < 0) {
      setFormError('Calories must be a valid non-negative number.');
      return;
    }
    if (isNaN(prot) || prot < 0) {
      setFormError('Protein must be a valid non-negative number.');
      return;
    }
    if (isNaN(carb) || carb < 0) {
      setFormError('Carbs must be a valid non-negative number.');
      return;
    }
    if (isNaN(fat) || fat < 0) {
      setFormError('Fat must be a valid non-negative number.');
      return;
    }
    if (isNaN(servings) || servings <= 0) {
      setFormError('Servings must be a positive number greater than 0.');
      return;
    }

    const foodData = {
      name: customName.trim(),
      servingSize: customServingSize.trim() || '1 serving',
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: fat,
    };

    if (saveToCatalogue) {
      onSaveCustomFood(foodData);
    }

    onAddFood(mealType, foodData, servings);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFood(null);
    setSearchQuery('');
    setServingsStr('1');
    setCustomName('');
    setCustomServingSize('1 serving');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    setCustomServingsStr('1');
    setFormError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <SystemPanel title={`LOG ${mealType.toUpperCase()}`} hot>
            {/* Top Tab Switcher */}
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => {
                  setActiveTab('catalogue');
                  setFormError(null);
                }}
                style={[styles.tabBtn, activeTab === 'catalogue' && styles.tabBtnActive]}>
                <Text style={[styles.tabBtnText, activeTab === 'catalogue' && styles.tabBtnTextActive]}>
                  FOOD CATALOGUE
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setActiveTab('custom');
                  setFormError(null);
                }}
                style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}>
                <Text style={[styles.tabBtnText, activeTab === 'custom' && styles.tabBtnTextActive]}>
                  CUSTOM ENTRY
                </Text>
              </Pressable>
            </View>

            {formError && <Text style={styles.errorBanner}>⚠ {formError}</Text>}

            {activeTab === 'catalogue' ? (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
                {/* Search Input */}
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(q) => {
                    setSearchQuery(q);
                    setFormError(null);
                  }}
                  placeholder="Search whole foods or custom recipes..."
                  placeholderTextColor={COLORS.tx3}
                />

                {/* Selected Food Servings Adjuster */}
                {selectedFood && (
                  <View style={styles.selectedBox}>
                    <View style={styles.selectedHeader}>
                      <Text style={styles.selectedTitle}>{selectedFood.name}</Text>
                      <Pressable onPress={() => setSelectedFood(null)}>
                        <Text style={styles.clearBtnText}>✕ CLEAR</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.selectedSub}>{selectedFood.servingSize}</Text>

                    {/* Stepper & Servings Input */}
                    <View style={styles.servingsControlRow}>
                      <Text style={styles.servingsLabel}>SERVINGS:</Text>
                      <View style={styles.stepperGroup}>
                        <Pressable style={styles.stepperBtn} onPress={() => handleAdjustServings(-0.5)}>
                          <Text style={styles.stepperBtnText}>-0.5</Text>
                        </Pressable>
                        <TextInput
                          style={styles.servingsInput}
                          keyboardType="numeric"
                          value={servingsStr}
                          onChangeText={(v) => {
                            setServingsStr(v);
                            setFormError(null);
                          }}
                        />
                        <Pressable style={styles.stepperBtn} onPress={() => handleAdjustServings(0.5)}>
                          <Text style={styles.stepperBtnText}>+0.5</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Live Calculated Macros */}
                    {liveCalculatedNutrition && (
                      <View style={styles.liveMacroRow}>
                        <View style={styles.macroPill}>
                          <Text style={styles.macroPillNum}>{liveCalculatedNutrition.calories}</Text>
                          <Text style={styles.macroPillLabel}>KCAL</Text>
                        </View>
                        <View style={styles.macroPill}>
                          <Text style={styles.macroPillNum}>{liveCalculatedNutrition.protein}g</Text>
                          <Text style={styles.macroPillLabel}>PROT</Text>
                        </View>
                        <View style={styles.macroPill}>
                          <Text style={styles.macroPillNum}>{liveCalculatedNutrition.carbs}g</Text>
                          <Text style={styles.macroPillLabel}>CARB</Text>
                        </View>
                        <View style={styles.macroPill}>
                          <Text style={styles.macroPillNum}>{liveCalculatedNutrition.fat}g</Text>
                          <Text style={styles.macroPillLabel}>FAT</Text>
                        </View>
                      </View>
                    )}

                    <SystemButton
                      label={`LOG ${liveCalculatedNutrition?.calories || 0} KCAL TO ${mealType.toUpperCase()}`}
                      variant="primary"
                      onPress={handleLogFromCatalogue}
                      style={styles.actionBtn}
                    />
                  </View>
                )}

                {/* Food List */}
                <Text style={styles.catalogueHeader}>SELECT FOOD ITEM ({filteredCatalogue.length}):</Text>
                {filteredCatalogue.map((food) => {
                  const isSelected = selectedFood?.id === food.id;
                  return (
                    <Pressable
                      key={food.id}
                      onPress={() => {
                        setSelectedFood(food);
                        setFormError(null);
                      }}
                      style={[styles.foodCard, isSelected && styles.foodCardSelected]}>
                      <View style={styles.foodCardLeft}>
                        <Text style={[styles.foodCardName, isSelected && styles.foodCardNameSelected]}>
                          {food.name}
                        </Text>
                        <Text style={styles.foodCardSize}>{food.servingSize}</Text>
                      </View>
                      <View style={styles.foodCardRight}>
                        <Text style={styles.foodCardCalories}>{food.calories} kcal</Text>
                        <Text style={styles.foodCardMacros}>
                          P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              /* Custom Food Tab */
              <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
                <View style={styles.formRow}>
                  <Text style={styles.fieldLabel}>FOOD NAME *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={customName}
                    onChangeText={(v) => {
                      setCustomName(v);
                      setFormError(null);
                    }}
                    placeholder="e.g. Scrambled Eggs with Avocado"
                    placeholderTextColor={COLORS.tx3}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.fieldLabel}>SERVING SIZE DESCRIPTION</Text>
                  <TextInput
                    style={styles.formInput}
                    value={customServingSize}
                    onChangeText={setCustomServingSize}
                    placeholder="e.g. 1 plate / 200g"
                    placeholderTextColor={COLORS.tx3}
                  />
                </View>

                {/* 2x2 Macro Grid */}
                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>CALORIES (KCAL) *</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={customCalories}
                      onChangeText={(v) => {
                        setCustomCalories(v);
                        setFormError(null);
                      }}
                      placeholder="350"
                      placeholderTextColor={COLORS.tx3}
                    />
                  </View>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>PROTEIN (G) *</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={customProtein}
                      onChangeText={(v) => {
                        setCustomProtein(v);
                        setFormError(null);
                      }}
                      placeholder="28"
                      placeholderTextColor={COLORS.tx3}
                    />
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>CARBS (G) *</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={customCarbs}
                      onChangeText={(v) => {
                        setCustomCarbs(v);
                        setFormError(null);
                      }}
                      placeholder="15"
                      placeholderTextColor={COLORS.tx3}
                    />
                  </View>
                  <View style={styles.gridCol}>
                    <Text style={styles.fieldLabel}>FAT (G) *</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={customFat}
                      onChangeText={(v) => {
                        setCustomFat(v);
                        setFormError(null);
                      }}
                      placeholder="12"
                      placeholderTextColor={COLORS.tx3}
                    />
                  </View>
                </View>

                {/* Servings */}
                <View style={styles.formRow}>
                  <Text style={styles.fieldLabel}>NUMBER OF SERVINGS TO LOG</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={customServingsStr}
                    onChangeText={(v) => {
                      setCustomServingsStr(v);
                      setFormError(null);
                    }}
                    placeholder="1"
                    placeholderTextColor={COLORS.tx3}
                  />
                </View>

                {/* Save to Catalogue Checkbox */}
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => setSaveToCatalogue((prev) => !prev)}>
                  <View style={[styles.checkboxBox, saveToCatalogue && styles.checkboxBoxChecked]}>
                    {saveToCatalogue && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Save this food to my reusable saved list</Text>
                </Pressable>

                <SystemButton
                  label={`LOG CUSTOM FOOD TO ${mealType.toUpperCase()}`}
                  variant="primary"
                  onPress={handleLogCustomFood}
                  style={styles.actionBtn}
                />
              </ScrollView>
            )}

            <View style={styles.footerRow}>
              <SystemButton
                label="CLOSE"
                variant="secondary"
                onPress={handleClose}
                style={styles.closeBtn}
              />
            </View>
          </SystemPanel>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s2,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: SPACING.s2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.s1,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.c1,
  },
  tabBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 12,
    letterSpacing: 1.2,
    color: COLORS.tx3,
  },
  tabBtnTextActive: {
    color: COLORS.c1,
  },
  tabContent: {
    maxHeight: 400,
  },
  errorBanner: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.err,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
    padding: SPACING.s1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.err,
    marginBottom: SPACING.s1,
  },
  searchInput: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    color: COLORS.tx,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    paddingHorizontal: SPACING.s2,
    paddingVertical: SPACING.s1,
    marginBottom: SPACING.s2,
  },
  selectedBox: {
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.c1,
    padding: SPACING.s2,
    marginBottom: SPACING.s2,
    borderRadius: 4,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.c1,
    flex: 1,
  },
  clearBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  selectedSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
    marginBottom: SPACING.s1,
  },
  servingsControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.s1,
  },
  servingsLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.tx,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    backgroundColor: 'rgba(20, 40, 65, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  stepperBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.c2,
  },
  servingsInput: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.c1,
    color: COLORS.tx,
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    width: 48,
    textAlign: 'center',
    paddingVertical: 2,
    marginHorizontal: 4,
  },
  liveMacroRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: SPACING.s1,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 35, 0.9)',
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  macroPillNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.tx,
  },
  macroPillLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 9,
    color: COLORS.tx3,
  },
  actionBtn: {
    marginTop: SPACING.s1,
  },
  catalogueHeader: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.tx3,
    marginBottom: SPACING.s1,
  },
  foodCard: {
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: SPACING.s2,
    marginBottom: 6,
    borderRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodCardSelected: {
    borderColor: COLORS.c1,
    backgroundColor: 'rgba(57, 191, 255, 0.1)',
  },
  foodCardLeft: {
    flex: 1,
  },
  foodCardName: {
    fontFamily: FONTS.displayMedium,
    fontSize: 13,
    color: COLORS.tx,
  },
  foodCardNameSelected: {
    color: COLORS.c1,
  },
  foodCardSize: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  foodCardRight: {
    alignItems: 'flex-end',
  },
  foodCardCalories: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.c2,
  },
  foodCardMacros: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  formRow: {
    marginBottom: SPACING.s2,
  },
  fieldLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.c2,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    color: COLORS.tx,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    paddingHorizontal: SPACING.s2,
    paddingVertical: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginBottom: SPACING.s2,
  },
  gridCol: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.s1,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: 'rgba(10, 20, 32, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 2,
  },
  checkboxBoxChecked: {
    borderColor: COLORS.c1,
    backgroundColor: 'rgba(57, 191, 255, 0.2)',
  },
  checkmark: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.c1,
  },
  checkboxLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
  },
  footerRow: {
    marginTop: SPACING.s2,
  },
  closeBtn: {
    width: '100%',
  },
});
