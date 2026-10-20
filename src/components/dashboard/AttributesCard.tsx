import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from '../common/SystemPanel';
import { ProgressBar } from '../common/ProgressBar';
import { HunterAttributes } from '../../types/hunter';

interface AttributesCardProps {
  attributes: HunterAttributes;
}

const ATTRIBUTE_KEYS: Array<{ key: keyof HunterAttributes; label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'agility', label: 'Agility' },
  { key: 'vitality', label: 'Vitality' },
  { key: 'discipline', label: 'Discipline' },
];

export const AttributesCard: React.FC<AttributesCardProps> = ({ attributes }) => {
  return (
    <SystemPanel title="Attributes">
      <View style={styles.container}>
        {ATTRIBUTE_KEYS.map(({ key, label }, index) => {
          const value = attributes[key];
          return (
            <View
              key={key}
              style={[
                styles.attributeRow,
                index === ATTRIBUTE_KEYS.length - 1 && styles.lastRow,
              ]}>
              <View style={styles.labelsRow}>
                <Text style={styles.attrName}>{label}</Text>
                <Text style={styles.attrValue}>{value}</Text>
              </View>
              <ProgressBar progress={value} height={6} />
            </View>
          );
        })}
      </View>
    </SystemPanel>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.s1,
  },
  attributeRow: {
    marginBottom: SPACING.s2 + 2,
  },
  lastRow: {
    marginBottom: 0,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  attrName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
  },
  attrValue: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: COLORS.tx,
  },
});
