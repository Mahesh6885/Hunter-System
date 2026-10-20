import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { SystemButton } from '../common/SystemButton';

interface MoreScreenProps {
  onPreviewRank?: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onPreviewRank }) => {
  const MORE_SECTIONS = [
    { title: 'Nutrition & Meals', description: 'Log macro targets and track hydration.' },
    { title: 'Progress & Analytics', description: 'Volume progression and body composition.' },
    { title: 'Achievements & Trophies', description: 'Dungeon gates, streaks, and milestone badges.' },
    { title: 'Profile & Settings', description: 'Hunter identity, units, sound, and motion controls.' },
  ];

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      <Text style={styles.screenHeading}>MORE</Text>

      {MORE_SECTIONS.map((section, index) => (
        <SystemPanel key={index} title={section.title}>
          <Text style={styles.sectionDesc}>{section.description}</Text>
          <SystemButton
            label="OPEN"
            variant="secondary"
            onPress={() => onPreviewRank?.()}
            style={styles.openBtn}
          />
        </SystemPanel>
      ))}

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
    marginBottom: SPACING.s3,
  },
  openBtn: {
    width: '100%',
  },
  previewBtn: {
    marginTop: SPACING.s3,
  },
});
