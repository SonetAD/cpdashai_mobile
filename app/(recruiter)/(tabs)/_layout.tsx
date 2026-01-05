import { useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Tabs, usePathname, useRouter, useSegments } from 'expo-router';
import RecruiterNavBar from '../../../components/RecruiterNavBar';

export default function RecruiterTabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();

  // Map pathname to tab id
  const getActiveTab = (): string => {
    if (pathname.includes('/talent')) return 'talent';
    if (pathname.includes('/reports')) return 'reports';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  // Check if we're on a sub-screen (not on a tab index)
  const isOnSubScreen = useCallback(() => {
    // segments example: ['(recruiter)', '(tabs)', 'home', 'applications', '123']
    // If there are more than 3 segments, we're on a sub-screen
    const tabSegments = segments.slice(2); // Remove '(recruiter)' and '(tabs)'
    return tabSegments.length > 1;
  }, [segments]);

  // Get the parent route for current screen
  const getParentRoute = useCallback(() => {
    const currentTab = getActiveTab();

    // Default: go to tab index
    const tabRoutes: Record<string, string> = {
      home: '/(recruiter)/(tabs)/home',
      talent: '/(recruiter)/(tabs)/talent',
      reports: '/(recruiter)/(tabs)/reports',
      profile: '/(recruiter)/(tabs)/profile',
    };

    return tabRoutes[currentTab];
  }, [pathname]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentTab = getActiveTab();

      // If on a sub-screen, use router.back() for proper back animation
      if (isOnSubScreen()) {
        router.back();
        return true; // Prevent default behavior
      }

      // If on a tab index (not home), go to home
      if (currentTab !== 'home') {
        router.replace('/(recruiter)/(tabs)/home' as any);
        return true; // Prevent default behavior
      }

      // On home tab, let the default back behavior happen (exit app)
      return false;
    });

    return () => backHandler.remove();
  }, [pathname, segments, isOnSubScreen, getParentRoute]);

  const handleTabPress = (tabId: string) => {
    const routes: Record<string, string> = {
      home: '/(recruiter)/(tabs)/home',
      talent: '/(recruiter)/(tabs)/talent',
      reports: '/(recruiter)/(tabs)/reports',
      profile: '/(recruiter)/(tabs)/profile',
    };
    // Use replace to avoid adding to back stack when switching tabs
    router.replace(routes[tabId] as any);
  };

  const handleAIAssistantPress = () => {
    // Navigate to AI assistant - can be customized for recruiter
    // For now, this could open a recruiter-specific assistant
    router.push('/(recruiter)/(tabs)/home' as any);
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="talent" options={{ title: 'Talent' }} />
        <Tabs.Screen name="reports" options={{ title: 'Reports' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      {/* Custom floating tab bar */}
      <RecruiterNavBar
        activeTab={getActiveTab()}
        onTabPress={handleTabPress}
        onAIAssistantPress={handleAIAssistantPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
});
