import React, { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useHunter } from '../context/HunterContext';
import { Header } from '../components/common/Header';
import { HunterNavBar } from '../components/common/HunterNavBar';
import { SystemNotificationModal } from '../components/common/SystemNotificationModal';
import { DashboardScreen } from '../components/dashboard/DashboardScreen';
import { QuestsScreen } from '../components/screens/QuestsScreen';
import { TrainScreen } from '../components/screens/TrainScreen';
import { StatusScreen } from '../components/screens/StatusScreen';
import { MoreScreen } from '../components/screens/MoreScreen';
import { NutritionScreen } from '../components/screens/NutritionScreen';
import { AnalyticsScreen } from '../components/screens/AnalyticsScreen';
import { AchievementsScreen } from '../components/screens/AchievementsScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';
import { BodyScanScreen } from '../components/screens/BodyScanScreen';

export default function MainApp() {
  const {
    hunter,
    setActiveScreen,
    setOverlay,
    closeOverlay,
    allocateAttributePoint,
  } = useHunter();

  // Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      // 1. Close open modal overlay first if active
      if (hunter.currentOverlay !== null) {
        closeOverlay();
        return true;
      }

      // 2. Step back from tertiary/secondary screens
      if (hunter.activeScreen === 'bodyScan') {
        setActiveScreen('analytics');
        return true;
      }
      if (
        hunter.activeScreen === 'analytics' ||
        hunter.activeScreen === 'achievements' ||
        hunter.activeScreen === 'profile'
      ) {
        setActiveScreen('more');
        return true;
      }
      if (hunter.activeScreen === 'nutrition') {
        setActiveScreen('dash');
        return true;
      }

      // 3. From main tab screens (quests, train, status, more), return to dash
      if (hunter.activeScreen !== 'dash') {
        setActiveScreen('dash');
        return true;
      }

      // 4. On dashboard with no overlays, allow standard Android exit
      return false;
    };

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => backSubscription.remove();
  }, [hunter.currentOverlay, hunter.activeScreen, closeOverlay, setActiveScreen]);

  const renderActiveScreen = () => {
    switch (hunter.activeScreen) {
      case 'dash':
        return <DashboardScreen />;
      case 'quests':
        return <QuestsScreen />;
      case 'lib':
        return <TrainScreen />;
      case 'status':
        return (
          <StatusScreen
            hunter={hunter}
            onAllocatePoint={allocateAttributePoint}
            onOpenProfile={() => setActiveScreen('profile')}
          />
        );
      case 'more':
        return (
          <MoreScreen
            onPreviewRank={() => setOverlay('rank')}
          />
        );
      case 'nutrition':
        return (
          <NutritionScreen
            onBack={() => setActiveScreen('dash')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsScreen
            onBack={() => setActiveScreen('more')}
            onOpenAchievements={() => setActiveScreen('achievements')}
            onOpenBodyScan={() => setActiveScreen('bodyScan')}
          />
        );
      case 'achievements':
        return (
          <AchievementsScreen
            onBack={() => setActiveScreen('more')}
            onOpenAnalytics={() => setActiveScreen('analytics')}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setActiveScreen('more')}
            onOpenBodyScan={() => setActiveScreen('bodyScan')}
            onOpenStatus={() => setActiveScreen('status')}
            onOpenAchievements={() => setActiveScreen('achievements')}
          />
        );
      case 'bodyScan':
        return (
          <BodyScanScreen
            onBack={() => setActiveScreen('analytics')}
          />
        );
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <Header
        onPressNotifications={() => setOverlay('notif')}
        hasUnreadNotifications={true}
      />

      {/* Main Screen Body */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Bottom Cybernetic Navigation Bar */}
      <HunterNavBar
        activeTab={hunter.activeScreen}
        onSelectTab={setActiveScreen}
      />

      {/* Global System Overlay (Level up, Rank promo, Notifications) */}
      <SystemNotificationModal
        overlay={hunter.currentOverlay}
        hunter={hunter}
        onClose={closeOverlay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
