import React, { useState, useEffect } from 'react';
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
import { LoggedFoodEntry } from '../../types/nutrition';

interface EditFoodModalProps {
  visible: boolean;
  entry: LoggedFoodEntry | null;
  onSave: (
    entryId: string,
    updates: {
      servings?: number;
      name?: string;
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    }
  ) => void;
  onDelete: (entryId: string) => void;
  onClose: () => void;
}

export const EditFoodModal: React.FC<EditFoodModalProps> = ({
  visible,
  entry,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [servings, setServings] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && entry) {
      setName(entry.name);
      setServings(String(entry.servings));
      setCalories(String(entry.calories));
      setProtein(String(entry.protein));
      setCarbs(String(entry.carbs));
      setFat(String(entry.fat));
      setError(null);
    }
  }, [visible, entry]);

  if (!entry) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setError('Food name cannot be empty.');
      return;
    }

    const s = parseFloat(servings.trim());
    const cal = parseInt(calories.trim(), 10);
    const prot = parseFloat(protein.trim());
    const carb = parseFloat(carbs.trim());
    const f = parseFloat(fat.trim());

    if (isNaN(s) || s <= 0) {
      setError('Servings must be a positive number.');
      return;
    }
    if (isNaN(cal) || cal < 0) {
      setError('Calories must be a valid non-negative number.');
      return;
    }
    if (isNaN(prot) || prot < 0) {
      setError('Protein must be non-negative.');
      return;
    }
    if (isNaN(carb) || carb < 0) {
      setError('Carbs must be non-negative.');
      return;
    }
    if (isNaN(f) || f < 0) {
      setError('Fat must be non-negative.');
      return;
    }

    onSave(entry.id, {
      name: name.trim(),
      servings: s,
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: f,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <SystemPanel title="EDIT LOGGED FOOD ITEM" hot>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.subtitle}>
                Modify servings or nutritional values for this logged entry.
              </Text>

              {error && <Text style={styles.errorText}>⚠ {error}</Text>}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FOOD NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setError(null);
                  }}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>SERVINGS (MULTIPLIER)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={servings}
                  onChangeText={(v) => {
                    setServings(v);
                    setError(null);
                  }}
                />
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>CALORIES (KCAL)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={calories}
                    onChangeText={(v) => {
                      setCalories(v);
                      setError(null);
                    }}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>PROTEIN (G)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={protein}
                    onChangeText={(v) => {
                      setProtein(v);
                      setError(null);
                    }}
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>CARBS (G)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={carbs}
                    onChangeText={(v) => {
                      setCarbs(v);
                      setError(null);
                    }}
                  />
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.fieldLabel}>FAT (G)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={fat}
                    onChangeText={(v) => {
                      setFat(v);
                      setError(null);
                    }}
                  />
                </View>
              </View>

              <View style={styles.buttonRow}>
                <SystemButton
                  label="DELETE ENTRY"
                  variant="secondary"
                  onPress={handleDelete}
                  style={[styles.btnHalf, styles.deleteBtn]}
                />
                <SystemButton
                  label="SAVE CHANGES"
                  variant="primary"
                  onPress={handleSave}
                  style={styles.btnHalf}
                />
              </View>

              <Pressable style={styles.cancelLink} onPress={onClose}>
                <Text style={styles.cancelLinkText}>CANCEL</Text>
              </Pressable>
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
    backgroundColor: 'rgba(5, 10, 18, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s4,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx2,
    marginBottom: SPACING.s2,
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
    marginBottom: SPACING.s2,
  },
  fieldLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.c2,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    color: COLORS.tx,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
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
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s3,
  },
  btnHalf: {
    flex: 1,
  },
  deleteBtn: {
    borderColor: COLORS.err,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: SPACING.s2,
    marginTop: SPACING.s1,
  },
  cancelLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
});
