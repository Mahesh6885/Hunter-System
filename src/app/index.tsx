import React from 'react';
import { View, StyleSheet } from 'react-native';
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
