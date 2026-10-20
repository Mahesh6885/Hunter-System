import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme';
import { SystemIcon, IconName } from './SystemIcon';
import { HunterState } from '../../types/hunter';

interface TabItem {
  id: HunterState['activeScreen'];
  label: string;
  icon: IconName;
}

const TABS: TabItem[] = [
  { id: 'dash', label: 'System', icon: 'dash' },
  { id: 'quests', label: 'Quests', icon: 'quests' },
  { id: 'lib', label: 'Train', icon: 'lib' },
  { id: 'status', label: 'Status', icon: 'status' },
  { id: 'more', label: 'More', icon: 'more' },
];

interface HunterNavBarProps {
  activeTab: HunterState['activeScreen'];
  onSelectTab: (tab: HunterState['activeScreen']) => void;
}

export const HunterNavBar: React.FC<HunterNavBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}>
            
            {/* Active Top Glowing Indicator */}
            {isActive && <View style={styles.activeIndicator} />}

            <SystemIcon
              name={tab.icon}
              size={20}
              color={isActive ? COLORS.c2 : COLORS.tx3}
            />

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}>
              {tab.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: '#05080D',
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    paddingVertical: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: -1,
    width: '50%',
    height: 2,
    backgroundColor: COLORS.c1,
    shadowColor: COLORS.c1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: COLORS.c2,
  },
  tabLabelInactive: {
    color: COLORS.tx3,
  },
});
