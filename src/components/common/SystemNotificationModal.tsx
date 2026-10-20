import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { COLORS, SPACING, FONTS } from '../../theme';
import { SystemPanel } from './SystemPanel';
import { SystemButton } from './SystemButton';
import { RankBadge } from './RankBadge';
import { HunterState } from '../../types/hunter';
import { NOTIFICATIONS } from '../../data/mockData';

interface SystemNotificationModalProps {
  overlay: HunterState['currentOverlay'];
  hunter: HunterState;
  onClose: () => void;
}

export const SystemNotificationModal: React.FC<SystemNotificationModalProps> = ({
  overlay,
  hunter,
  onClose,
}) => {
  if (!overlay) return null;

  return (
    <Modal
      transparent
      visible={!!overlay}
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <SystemPanel hot contentStyle={styles.panelInner}>
            {overlay === 'lvl' && (
              <View style={styles.centerAlign}>
                <Text style={styles.systemBadgeText}>SYSTEM NOTIFICATION</Text>
                <Text style={styles.bigTitle}>LEVEL UP</Text>
                <Text style={styles.levelTransition}>
                  {hunter.level - 1} → {hunter.level}
                </Text>
                <Text style={styles.subReward}>
                  +320 XP · Reward: Title “Iron Will”
                </Text>
                <SystemButton
                  label="CONTINUE"
                  onPress={onClose}
                  style={styles.actionBtn}
                />
              </View>
            )}

            {overlay === 'rank' && (
              <View style={styles.centerAlign}>
                <Text style={styles.systemBadgeText}>RANK PROMOTION</Text>
                <View style={styles.rankBadgeContainer}>
                  <RankBadge rank="C" size={54} />
                </View>
                <Text style={styles.levelTransition}>D → C</Text>
                <Text style={styles.subReward}>
                  System rank evaluation preview. Keep training to unlock.
                </Text>
                <SystemButton
                  label="CONTINUE"
                  onPress={onClose}
                  style={styles.actionBtn}
                />
              </View>
            )}

            {overlay === 'notif' && (
              <View>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle}>SYSTEM NOTIFICATIONS</Text>
                </View>
                {NOTIFICATIONS.map((notif, index) => (
                  <View key={index} style={styles.notifItem}>
                    <Text style={styles.notifItemText}>{notif}</Text>
                  </View>
                ))}
                <SystemButton
                  label="CLOSE"
                  variant="secondary"
                  onPress={onClose}
                  style={styles.actionBtn}
                />
              </View>
            )}
          </SystemPanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s4,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
  },
  panelInner: {
    padding: SPACING.s5,
  },
  centerAlign: {
    alignItems: 'center',
  },
  systemBadgeText: {
    fontFamily: FONTS.displayMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.tx3,
    marginBottom: SPACING.s2,
    textAlign: 'center',
  },
  bigTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 32,
    letterSpacing: 3,
    color: COLORS.c2,
    textShadowColor: 'rgba(57, 191, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginVertical: SPACING.s2,
    textAlign: 'center',
    fontWeight: '700',
  },
  levelTransition: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    letterSpacing: 1.5,
    color: COLORS.tx,
    marginVertical: SPACING.s1,
    textAlign: 'center',
  },
  subReward: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx2,
    marginVertical: SPACING.s3,
    textAlign: 'center',
  },
  rankBadgeContainer: {
    marginVertical: SPACING.s4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingBottom: SPACING.s2,
    marginBottom: SPACING.s3,
  },
  notifTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 13,
    letterSpacing: 1.6,
    color: COLORS.c1,
  },
  notifItem: {
    paddingVertical: SPACING.s3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lineSubtle,
  },
  notifItemText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.tx,
  },
  actionBtn: {
    marginTop: SPACING.s4,
  },
});
