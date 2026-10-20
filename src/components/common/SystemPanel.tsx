import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONTS } from '../../theme';

interface SystemPanelProps {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  hot?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  title,
  headerRight,
  children,
  hot = false,
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.outerContainer, hot && styles.hotContainer, style]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          hot ? 'rgba(57, 191, 255, 0.12)' : 'rgba(57, 191, 255, 0.07)',
          'rgba(10, 20, 32, 0.95)',
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradientContent, contentStyle]}>
        
        {/* Top-Left Corner Bracket */}
        <View style={styles.cornerTopLeft} pointerEvents="none" />
        
        {/* Bottom-Right Corner Bracket */}
        <View style={styles.cornerBottomRight} pointerEvents="none" />

        {/* Panel Header */}
        {title ? (
          <View style={styles.panelHeader}>
            <Text style={styles.headerTitle}>{title.toUpperCase()}</Text>
            {headerRight ? <View>{headerRight}</View> : null}
          </View>
        ) : null}

        {/* Panel Body */}
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.panel,
    marginBottom: SPACING.s3,
    overflow: 'visible',
  },
  hotContainer: {
    borderColor: COLORS.c1,
    shadowColor: COLORS.c1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientContent: {
    padding: SPACING.s3,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 10,
    height: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.c2,
    zIndex: 2,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.c2,
    zIndex: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingBottom: SPACING.s2,
    marginBottom: SPACING.s3,
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: COLORS.c1,
    fontWeight: '700',
  },
});
