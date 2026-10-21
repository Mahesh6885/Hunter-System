import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { SystemBadge } from '../common/SystemBadge';
import { useHunter } from '../../context/HunterContext';
import { useBodyScan } from '../../context/BodyScanContext';
import { BodyScanTimeFilter, BodyweightEntry, WeightUnit } from '../../types/bodyScan';
import {
  formatWeight,
  formatWeightDelta,
  filterBodyScanEntries,
  convertWeight,
} from '../../utils/weightConversions';
import { getLocalDateKey } from '../../utils/dateEngine';

interface BodyScanScreenProps {
  onBack: () => void;
}

const TIME_FILTERS: { id: BodyScanTimeFilter; label: string }[] = [
  { id: '7d', label: '7 DAYS' },
  { id: '30d', label: '30 DAYS' },
  { id: 'all', label: 'ALL TIME' },
];

export const BodyScanScreen: React.FC<BodyScanScreenProps> = ({ onBack }) => {
  const { hunter, toggleUnit } = useHunter();
  const {
    entries,
    summary,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useBodyScan();

  const [activeFilter, setActiveFilter] = useState<BodyScanTimeFilter>('7d');

  // Entry modal state (for both Add and Edit)
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [inputWeight, setInputWeight] = useState('');
  const [inputUnit, setInputUnit] = useState<WeightUnit>(hunter.unit);
  const [inputNote, setInputNote] = useState('');
  const [inputDate, setInputDate] = useState(getLocalDateKey());
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered records according to time window
  const filteredEntries = useMemo(() => {
    return filterBodyScanEntries(entries, activeFilter);
  }, [entries, activeFilter]);

  // Chronological entries for visual trend bars (oldest to newest, max 10 points)
  const trendPoints = useMemo(() => {
    return [...filteredEntries].sort((a, b) => a.timestamp - b.timestamp).slice(-10);
  }, [filteredEntries]);

  // Open modal for new entry
  const handleOpenAdd = () => {
    setEditingEntryId(null);
    setInputWeight(summary.latestEntry ? String(summary.latestEntry.enteredWeight) : '');
    setInputUnit(hunter.unit);
    setInputNote('');
    setInputDate(getLocalDateKey());
    setFormError(null);
    setModalVisible(true);
  };

  // Open modal for editing existing entry
  const handleOpenEdit = (entry: BodyweightEntry) => {
    setEditingEntryId(entry.id);
    setInputWeight(String(entry.enteredWeight));
    setInputUnit(entry.enteredUnit);
    setInputNote(entry.note || '');
    setInputDate(entry.dateKey);
    setFormError(null);
    setModalVisible(true);
  };

  const handleSaveEntry = async () => {
    setFormError(null);
    if (!inputWeight.trim()) {
      setFormError('Please enter a weight measurement.');
      return;
    }

    if (editingEntryId) {
      const res = await updateMeasurement(editingEntryId, inputWeight, inputUnit, inputNote);
      if (!res.success) {
        setFormError(res.error || 'Failed to update measurement.');
        return;
      }
    } else {
      const res = await addMeasurement(inputWeight, inputUnit, inputDate, inputNote);
      if (!res.success) {
        setFormError(res.error || 'Failed to record measurement.');
        return;
      }
    }

    setModalVisible(false);
  };

  const handleDeleteEntry = (entry: BodyweightEntry) => {
    Alert.alert(
      'DELETE BODY SCAN RECORD',
      `Delete entry of ${formatWeight(entry.weightKg, hunter.unit)} on ${entry.dateKey}?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            await deleteMeasurement(entry.id);
          },
        },
      ]
    );
  };

  const minInTrend = trendPoints.length > 0 ? Math.min(...trendPoints.map((p) => p.weightKg)) : 0;
  const maxInTrend = trendPoints.length > 0 ? Math.max(...trendPoints.map((p) => p.weightKg)) : 0;
  const weightSpan = Math.max(1, maxInTrend - minInTrend);

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      {/* 1. Header Navigation */}
      <View style={styles.topNavRow}>
        <Pressable onPress={onBack} style={styles.navBtn}>
          <Text style={styles.navBtnText}>← BACK</Text>
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTag}>SYSTEM BIOMETRICS</Text>
          <Text style={styles.headerMainTitle}>BODY SCAN TELEMETRY</Text>
        </View>

        <Pressable onPress={handleOpenAdd} style={[styles.navBtn, styles.navBtnAction]}>
          <Text style={[styles.navBtnText, styles.navBtnActionText]}>+ LOG SCAN</Text>
        </Pressable>
      </View>

      {/* 2. Key Telemetry Overview Panel */}
      <SystemPanel title="CURRENT BIOMETRIC MASS" hot>
        {summary.latestEntry ? (
          <View style={styles.summaryOverview}>
            <View style={styles.mainMetricRow}>
              <View style={styles.mainMetricLeft}>
                <Text style={styles.metricLabel}>
                  LATEST MEASUREMENT ({summary.latestEntry.dateKey})
                </Text>
                <Text style={styles.metricBig}>
                  {formatWeight(summary.latestEntry.weightKg, hunter.unit)}
                </Text>
              </View>

              {summary.deltaKg !== null && (
                <View style={styles.deltaBox}>
                  <Text style={styles.metricLabel}>CHANGE</Text>
                  <Text
                    style={[
                      styles.deltaBig,
                      summary.deltaKg > 0 ? styles.deltaUp : styles.deltaDown,
                    ]}>
                    {formatWeightDelta(summary.deltaKg, hunter.unit)}
                  </Text>
                  <Text style={styles.deltaSub}>vs previous scan</Text>
                </View>
              )}
            </View>

            {/* Sub-metrics */}
            <View style={styles.metricTriGrid}>
              <View style={styles.subMetricCell}>
                <Text style={styles.subMetricLabel}>PREVIOUS</Text>
                <Text style={styles.subMetricVal}>
                  {summary.previousEntry
                    ? formatWeight(summary.previousEntry.weightKg, hunter.unit)
                    : '--'}
                </Text>
              </View>

              <View style={styles.subMetricCell}>
                <Text style={styles.subMetricLabel}>AVERAGE</Text>
                <Text style={styles.subMetricVal}>
                  {formatWeight(summary.averageWeightKg, hunter.unit)}
                </Text>
              </View>

              <View style={styles.subMetricCell}>
                <Text style={styles.subMetricLabel}>TOTAL SCANS</Text>
                <Text style={[styles.subMetricVal, { color: COLORS.c1 }]}>
                  {summary.totalEntriesCount}
                </Text>
              </View>
            </View>

            {/* Unit Toggle Quick Action */}
            <View style={styles.unitToggleRow}>
              <Text style={styles.unitHint}>Displaying in {hunter.unit.toUpperCase()}</Text>
              <Pressable onPress={toggleUnit} style={styles.unitToggleBtn}>
                <Text style={styles.unitToggleText}>
                  SWITCH TO {hunter.unit === 'kg' ? 'LB' : 'KG'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>NO BIOMETRIC MEASUREMENTS LOGGED</Text>
            <Text style={styles.emptyDesc}>
              Track your physical bodyweight locally and securely. Biometrics are stored on-device and never inferred or fabricated.
            </Text>
            <SystemButton
              label="+ RECORD FIRST BODY SCAN"
              onPress={handleOpenAdd}
              style={{ marginTop: SPACING.s2 }}
            />
          </View>
        )}
      </SystemPanel>

      {/* 3. Time Filter Switcher */}
      <View style={styles.filterRow}>
        {TIME_FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}>
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 4. Historical Trend Visualizer */}
      <SystemPanel title="WEIGHT TRAJECTORY GRAPH">
        {trendPoints.length >= 2 ? (
          <View style={styles.trendContainer}>
            <View style={styles.trendBarRow}>
              {trendPoints.map((pt) => {
                // Scale bar height between 25% and 95%
                const heightPercent = 25 + ((pt.weightKg - minInTrend) / weightSpan) * 70;
                const displayVal = hunter.unit === 'lb'
                  ? convertWeight(pt.weightKg, 'kg', 'lb').toFixed(1)
                  : pt.weightKg.toFixed(1);

                return (
                  <View key={pt.id} style={styles.barCol}>
                    <Text style={styles.barTopLabel}>{displayVal}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.max(10, Math.min(100, heightPercent))}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.barDateLabel}>{pt.dateKey.substring(5)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.trendFootnote}>
              Range: {formatWeight(minInTrend, hunter.unit)} — {formatWeight(maxInTrend, hunter.unit)}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyTrendBox}>
            <Text style={styles.emptyTrendText}>
              Log at least 2 measurements to view the trajectory graph.
            </Text>
          </View>
        )}
      </SystemPanel>

      {/* 5. Measurement Records Log */}
      <SystemPanel title={`TELEMETRY LOG (${filteredEntries.length})`}>
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyListBox}>
            <Text style={styles.emptyListText}>No body scan records in this timeframe.</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {filteredEntries.map((entry, index) => {
              const prev = index + 1 < filteredEntries.length ? filteredEntries[index + 1] : null;
              const delta = prev ? entry.weightKg - prev.weightKg : null;

              return (
                <View key={entry.id} style={styles.logCard}>
                  <View style={styles.logLeft}>
                    <Text style={styles.logDate}>{entry.dateKey}</Text>
                    <Text style={styles.logWeight}>
                      {formatWeight(entry.weightKg, hunter.unit)}
                    </Text>
                    {entry.note && <Text style={styles.logNote}>"{entry.note}"</Text>}
                  </View>

                  <View style={styles.logRight}>
                    {delta !== null ? (
                      <Text
                        style={[
                          styles.logDelta,
                          delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaNeutral,
                        ]}>
                        {formatWeightDelta(delta, hunter.unit)}
                      </Text>
                    ) : (
                      <Text style={styles.logDeltaNeutral}>BASELINE</Text>
                    )}

                    <View style={styles.logActions}>
                      <Pressable onPress={() => handleOpenEdit(entry)} style={styles.actionBtn}>
                        <Text style={styles.actionBtnText}>EDIT</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDeleteEntry(entry)} style={styles.actionBtn}>
                        <Text style={[styles.actionBtnText, { color: COLORS.err }]}>DEL</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </SystemPanel>

      {/* Add / Edit Entry Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>
              {editingEntryId ? 'EDIT BODY SCAN RECORD' : 'LOG NEW BODY SCAN'}
            </Text>
            <Text style={styles.modalSub}>
              Physical metrics are strictly recorded locally. No body fat is estimated from weight alone.
            </Text>

            {/* Error Message */}
            {formError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {formError}</Text>
              </View>
            )}

            {/* Weight Input & Unit Selector */}
            <Text style={styles.fieldLabel}>BODYWEIGHT</Text>
            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightTextInput}
                value={inputWeight}
                onChangeText={setInputWeight}
                keyboardType="decimal-pad"
                placeholder={inputUnit === 'kg' ? 'e.g. 78.5' : 'e.g. 173.0'}
                placeholderTextColor={COLORS.tx3}
                autoFocus
              />

              <View style={styles.unitToggleGroup}>
                <Pressable
                  onPress={() => setInputUnit('kg')}
                  style={[styles.unitChoiceBtn, inputUnit === 'kg' && styles.unitChoiceBtnActive]}>
                  <Text
                    style={[
                      styles.unitChoiceText,
                      inputUnit === 'kg' && styles.unitChoiceTextActive,
                    ]}>
                    KG
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setInputUnit('lb')}
                  style={[styles.unitChoiceBtn, inputUnit === 'lb' && styles.unitChoiceBtnActive]}>
                  <Text
                    style={[
                      styles.unitChoiceText,
                      inputUnit === 'lb' && styles.unitChoiceTextActive,
                    ]}>
                    LB
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Date Input */}
            <Text style={styles.fieldLabel}>DATE (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              value={inputDate}
              onChangeText={setInputDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.tx3}
            />

            {/* Optional Note */}
            <Text style={styles.fieldLabel}>OPTIONAL NOTE</Text>
            <TextInput
              style={styles.textInput}
              value={inputNote}
              onChangeText={setInputNote}
              placeholder="e.g. Fasted morning scan, post-workout"
              placeholderTextColor={COLORS.tx3}
              maxLength={50}
            />

            {/* Modal Buttons */}
            <View style={styles.modalBtnRow}>
              <SystemButton
                label="CANCEL"
                variant="secondary"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <SystemButton
                label={editingEntryId ? 'UPDATE RECORD' : 'SAVE SCAN'}
                onPress={handleSaveEntry}
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
  navBtnAction: {
    backgroundColor: COLORS.c1,
    borderColor: COLORS.c1,
  },
  navBtnActionText: {
    color: COLORS.bg,
    fontFamily: FONTS.displayBold,
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
  summaryOverview: {
    gap: SPACING.s2,
  },
  mainMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainMetricLeft: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  metricBig: {
    fontFamily: FONTS.displayBold,
    fontSize: 26,
    color: COLORS.c1,
    marginTop: 2,
  },
  deltaBox: {
    alignItems: 'flex-end',
  },
  deltaBig: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    marginTop: 2,
  },
  deltaUp: {
    color: COLORS.c1,
  },
  deltaDown: {
    color: COLORS.ok,
  },
  deltaSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  metricTriGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s2,
    justifyContent: 'space-between',
  },
  subMetricCell: {
    alignItems: 'center',
    flex: 1,
  },
  subMetricLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 8,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  subMetricVal: {
    fontFamily: FONTS.displayBold,
    fontSize: 14,
    color: COLORS.tx,
    marginTop: 2,
  },
  unitToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  unitHint: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  unitToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 3,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
  },
  unitToggleText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.c1,
  },
  emptyContainer: {
    padding: SPACING.s3,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.tx2,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
    textAlign: 'center',
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 20, 32, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.s1,
    alignItems: 'center',
    borderRadius: 2,
  },
  filterTabActive: {
    backgroundColor: 'rgba(57, 191, 255, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.c1,
  },
  filterTabText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 11,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  filterTabTextActive: {
    color: COLORS.c1,
  },
  trendContainer: {
    gap: SPACING.s1,
  },
  trendBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 8,
    color: COLORS.tx3,
    marginBottom: 2,
  },
  barTrack: {
    width: 14,
    height: 70,
    backgroundColor: 'rgba(5, 10, 18, 0.8)',
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.c1,
    borderRadius: 2,
  },
  barDateLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 8,
    color: COLORS.tx2,
    marginTop: 4,
  },
  trendFootnote: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
    textAlign: 'center',
  },
  emptyTrendBox: {
    padding: SPACING.s3,
    alignItems: 'center',
  },
  emptyTrendText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  emptyListBox: {
    padding: SPACING.s3,
    alignItems: 'center',
  },
  emptyListText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.tx3,
  },
  logList: {
    gap: SPACING.s1,
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 20, 32, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s2,
  },
  logLeft: {
    flex: 1,
  },
  logDate: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.tx3,
  },
  logWeight: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: COLORS.tx,
    marginTop: 1,
  },
  logNote: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.c2,
    fontStyle: 'italic',
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logDelta: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
  },
  logDeltaNeutral: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.tx3,
    letterSpacing: 1,
  },
  deltaNeutral: {
    color: COLORS.tx3,
  },
  logActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(57, 191, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 2,
  },
  actionBtnText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 9,
    color: COLORS.c1,
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
  errorBox: {
    backgroundColor: 'rgba(255, 77, 106, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.err,
    borderRadius: 4,
    padding: SPACING.s1,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.err,
  },
  fieldLabel: {
    fontFamily: FONTS.displayMedium,
    fontSize: 10,
    color: COLORS.c2,
    letterSpacing: 1,
    marginTop: 4,
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
  },
  weightTextInput: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: SPACING.s2,
    color: COLORS.tx,
    fontFamily: FONTS.displayBold,
    fontSize: 18,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    overflow: 'hidden',
  },
  unitChoiceBtn: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 20, 32, 0.9)',
  },
  unitChoiceBtnActive: {
    backgroundColor: COLORS.c1,
  },
  unitChoiceText: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    color: COLORS.tx3,
  },
  unitChoiceTextActive: {
    color: COLORS.bg,
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
  modalBtnRow: {
    flexDirection: 'row',
    gap: SPACING.s2,
    marginTop: SPACING.s2,
  },
});
