import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';
import { TrainingPreview } from '../../types/hunter';

interface TodayTrainingCardProps {
  training: TrainingPreview;
  onViewTraining: () => void;
}

export const TodayTrainingCard: React.FC<TodayTrainingCardProps> = ({
  training,
  onViewTraining,
}) => {
  return (
    <SystemPanel title="Today’s Training">
      <View style={styles.contentRow}>
        <View style={styles.textGroup}>
          <Text style={styles.routineTitle}>{training.title}</Text>
          <Text style={styles.routineDetails}>
            {training.durationMinutes} min · {training.exerciseCount} exercises
          </Text>
        </View>

        <SystemButton
          label="VIEW"
          variant="secondary"
          onPress={onViewTraining}
          style={styles.viewButton}
        />
      </View>
    </SystemPanel>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.s1,
  },
  textGroup: {
    flex: 1,
  },
  routineTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    letterSpacing: 0.8,
    color: COLORS.tx,
    fontWeight: '700',
  },
  routineDetails: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginTop: 2,
  },
  viewButton: {
    minWidth: 80,
  },
});
