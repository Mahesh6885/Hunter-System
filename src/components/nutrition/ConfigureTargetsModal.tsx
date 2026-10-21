import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { DailyNutritionTargets } from '../../types/nutrition';

interface ConfigureTargetsModalProps {
  visible: boolean;
  currentTargets: DailyNutritionTargets;
  onSave: (targets: Partial<DailyNutritionTargets>) => void;
  onClose: () => void;
}

export const ConfigureTargetsModal: React.FC<ConfigureTargetsModalProps> = ({
  visible,
  currentTargets,
  onSave,
  onClose,
}) => {
  const [calories, setCalories] = useState(String(currentTargets.caloriesTarget));
  const [protein, setProtein] = useState(String(currentTargets.proteinTarget));
  const [carbs, setCarbs] = useState(String(currentTargets.carbsTarget));
  const [fat, setFat] = useState(String(currentTargets.fatTarget));
  const [water, setWater] = useState(String(currentTargets.waterTargetMl));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCalories(String(currentTargets.caloriesTarget));
      setProtein(String(currentTargets.proteinTarget));
      setCarbs(String(currentTargets.carbsTarget));
      setFat(String(currentTargets.fatTarget));
      setWater(String(currentTargets.waterTargetMl));
      setError(null);
    }
  }, [visible, currentTargets]);

  const handleSave = () => {
    const numCal = parseInt(calories.trim(), 10);
    const numProt = parseFloat(protein.trim());
    const numCarb = parseFloat(carbs.trim());
    const numFat = parseFloat(fat.trim());
    const numWater = parseInt(water.trim(), 10);

    if (isNaN(numCal) || numCal < 500 || numCal > 10000) {
      setError('Calories target must be between 500 and 10,000 kcal.');
      return;
    }
    if (isNaN(numProt) || numProt < 10 || numProt > 500) {
      setError('Protein target must be between 10 and 500 g.');
      return;
    }
    if (isNaN(numCarb) || numCarb < 0 || numCarb > 1000) {
      setError('Carbs target must be between 0 and 1,000 g.');
      return;
    }
    if (isNaN(numFat) || numFat < 0 || numFat > 400) {
      setError('Fat target must be between 0 and 400 g.');
      return;
    }
    if (isNaN(numWater) || numWater < 500 || numWater > 15000) {
      setError('Water target must be between 500 and 15,000 ml.');
      return;
    }

    onSave({
      caloriesTarget: numCal,
      proteinTarget: numProt,
      carbsTarget: numCarb,
      fatTarget: numFat,
      waterTargetMl: numWater,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <SystemPanel title="CONFIGURE DAILY NUTRITION TARGETS" hot>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.subtitle}>
                Define personalized daily caloric and macronutrient objectives for your hunter profile.
              </Text>

              {error && <Text style={styles.errorText}>⚠ {error}</Text>}

              {/* Calorie Target */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DAILY CALORIES (KCAL)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={(val) => {
                    setCalories(val);
                    setError(null);
                  }}
                  placeholder="2400"
                  placeholderTextColor={COLORS.tx3}
                />
              </View>

              {/* Protein Target */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PROTEIN TARGET (G)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={(val) => {
                    setProtein(val);
                    setError(null);
                  }}
                  placeholder="160"
                  placeholderTextColor={COLORS.tx3}
                />
              </View>

              {/* Carbs Target */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CARBOHYDRATES TARGET (G)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={(val) => {
                    setCarbs(val);
                    setError(null);
                  }}
                  placeholder="260"
                  placeholderTextColor={COLORS.tx3}
                />
              </View>

              {/* Fat Target */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FAT TARGET (G)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={(val) => {
                    setFat(val);
                    setError(null);
                  }}
                  placeholder="70"
                  placeholderTextColor={COLORS.tx3}
                />
              </View>

              {/* Water Target */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DAILY WATER TARGET (ML)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={water}
                  onChangeText={(val) => {
                    setWater(val);
                    setError(null);
                  }}
                  placeholder="2500"
                  placeholderTextColor={COLORS.tx3}
                />
              </View>

              <View style={styles.buttonRow}>
                <SystemButton
                  label="CANCEL"
                  variant="secondary"
                  onPress={onClose}
                  style={styles.btnHalf}
                />
                <SystemButton
                  label="SAVE TARGETS"
                  variant="primary"
                  onPress={handleSave}
                  style={styles.btnHalf}
                />
              </View>
            </ScrollView>
          </SystemPanel>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s4,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingVertical: SPACING.s1,
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.tx2,
    marginBottom: SPACING.s4,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.err,
    marginBottom: SPACING.s2,
    backgroundColor: 'rgba(255, 60, 60, 0.1)',
    padding: SPACING.s1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.err,
  },
  fieldGroup: {
    marginBottom: SPACING.s3,
  },
  fieldLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: COLORS.c2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    color: COLORS.tx,
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    paddingHorizontal: SPACING.s3,
    paddingVertical: SPACING.s2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s3,
  },
  btnHalf: {
    flex: 1,
  },
});
