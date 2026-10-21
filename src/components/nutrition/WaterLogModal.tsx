import React, { useState } from 'react';
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
import { WaterLogEntry } from '../../types/nutrition';

interface WaterLogModalProps {
  visible: boolean;
  waterLogs: WaterLogEntry[];
  totalWaterMl: number;
  waterTargetMl: number;
  onAddWater: (amountMl: number) => void;
  onRemoveWaterLog: (logId: string) => void;
  onClose: () => void;
}

export const WaterLogModal: React.FC<WaterLogModalProps> = ({
  visible,
  waterLogs,
  totalWaterMl,
  waterTargetMl,
  onAddWater,
  onRemoveWaterLog,
  onClose,
}) => {
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddCustom = () => {
    const ml = parseInt(customAmount.trim(), 10);
    if (isNaN(ml) || ml <= 0) {
      setError('Please enter a valid positive water volume in ml.');
      return;
    }
    if (ml > 5000) {
      setError('Single intake volume cannot exceed 5,000 ml.');
      return;
    }

    onAddWater(ml);
    setCustomAmount('');
    setError(null);
  };

  const handleQuickAdd = (ml: number) => {
    onAddWater(ml);
    setError(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <SystemPanel title="HYDRATION PROTOCOL // WATER LOGS" hot>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Header */}
              <View style={styles.statusBox}>
                <Text style={styles.statusBigNum}>{totalWaterMl} ML</Text>
                <Text style={styles.statusTargetLabel}>CURRENT INTAKE / {waterTargetMl} ML TARGET</Text>
              </View>

              {/* Quick Add Presets */}
              <Text style={styles.sectionLabel}>QUICK LOG PRESETS:</Text>
              <View style={styles.presetRow}>
                <Pressable style={styles.presetBtn} onPress={() => handleQuickAdd(250)}>
                  <Text style={styles.presetBtnText}>+250 ML</Text>
                  <Text style={styles.presetBtnSub}>Glass</Text>
                </Pressable>
                <Pressable style={styles.presetBtn} onPress={() => handleQuickAdd(500)}>
                  <Text style={styles.presetBtnText}>+500 ML</Text>
                  <Text style={styles.presetBtnSub}>Bottle</Text>
                </Pressable>
                <Pressable style={styles.presetBtn} onPress={() => handleQuickAdd(1000)}>
                  <Text style={styles.presetBtnText}>+1000 ML</Text>
                  <Text style={styles.presetBtnSub}>Flask</Text>
                </Pressable>
              </View>

              {/* Custom Amount Input */}
              <Text style={styles.sectionLabel}>CUSTOM INTAKE:</Text>
              {error && <Text style={styles.errorText}>⚠ {error}</Text>}
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={(v) => {
                    setCustomAmount(v);
                    setError(null);
                  }}
                  placeholder="e.g. 350 ml"
                  placeholderTextColor={COLORS.tx3}
                />
                <SystemButton
                  label="LOG ML"
                  variant="primary"
                  onPress={handleAddCustom}
                  style={styles.customBtn}
                />
              </View>

              {/* Recent Water Logs */}
              <Text style={styles.sectionLabel}>TODAY'S INTAKE LOGS ({waterLogs.length}):</Text>
              {waterLogs.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No water logged yet for this cycle.</Text>
                </View>
              ) : (
                waterLogs.map((log) => {
                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View>
                        <Text style={styles.logAmount}>+{log.amountMl} ml</Text>
                        <Text style={styles.logTime}>Logged at {timeStr}</Text>
                      </View>
                      <Pressable
                        style={styles.deleteBtn}
                        onPress={() => onRemoveWaterLog(log.id)}>
                        <Text style={styles.deleteBtnText}>✕ REMOVE</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}

              <View style={styles.footerRow}>
                <SystemButton
                  label="DONE"
                  variant="secondary"
                  onPress={onClose}
                  style={styles.doneBtn}
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
  statusBox: {
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.c1,
    borderRadius: 4,
    padding: SPACING.s2,
    alignItems: 'center',
    marginBottom: SPACING.s3,
  },
  statusBigNum: {
    fontFamily: FONTS.displayBold,
    fontSize: 24,
    color: COLORS.c1,
  },
  statusTargetLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx2,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.tx3,
    marginBottom: 6,
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.s1,
    marginBottom: SPACING.s3,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 45, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    paddingVertical: SPACING.s2,
    alignItems: 'center',
  },
  presetBtnText: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.c2,
  },
  presetBtnSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
    marginTop: 2,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.err,
    marginBottom: 4,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: SPACING.s1,
    marginBottom: SPACING.s3,
  },
  customInput: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    color: COLORS.tx,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    paddingHorizontal: SPACING.s2,
  },
  customBtn: {
    minWidth: 100,
  },
  emptyBox: {
    padding: SPACING.s2,
    alignItems: 'center',
    marginBottom: SPACING.s3,
  },
  emptyText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.tx3,
    fontStyle: 'italic',
  },
  logCard: {
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    padding: SPACING.s1,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logAmount: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    color: COLORS.tx,
  },
  logTime: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.err,
  },
  footerRow: {
    marginTop: SPACING.s2,
  },
  doneBtn: {
    width: '100%',
  },
});
