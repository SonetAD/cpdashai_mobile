import { useEffect, useCallback } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Tabs, usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CandidateNavBar from '../../../components/CandidateNavBar';

export default function CandidateTabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  // Map pathname to tab id
  const getActiveTab = (): string => {
    if (pathname.includes('/jobs')) return 'jobs';
    if (pathname.includes('/ai-coach')) return 'aiCoach';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  // Check if we're on a sub-screen (not on a tab index)
  const isOnSubScreen = useCallback(() => {
    // segments example: ['(candidate)', '(tabs)', 'jobs', 'cv-upload']
    // If there are more than 3 segments, we're on a sub-screen
    const tabSegments = segments.slice(2); // Remove '(candidate)' and '(tabs)'
    return tabSegments.length > 1;
  }, [segments]);

  // Get the parent route for current screen
  const getParentRoute = useCallback(() => {
    const currentTab = getActiveTab();

    // Special cases for nested screens
    if (pathname.includes('/cv-builder')) {
      return '/(candidate)/(tabs)/jobs/cv-upload';
    }

    // Default: go to tab index
    const tabRoutes: Record<string, string> = {
      jobs: '/(candidate)/(tabs)/jobs',
      aiCoach: '/(candidate)/(tabs)/ai-coach',
      profile: '/(candidate)/(tabs)/profile',
      home: '/(candidate)/(tabs)/home',
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
        router.replace('/(candidate)/(tabs)/home' as any);
        return true; // Prevent default behavior
      }

      // On home tab, let the default back behavior happen (exit app)
      return false;
    });

    return () => backHandler.remove();
  }, [pathname, segments, isOnSubScreen, getParentRoute]);

  const handleTabPress = (tabId: string) => {
    const routes: Record<string, string> = {
      home: '/(candidate)/(tabs)/home',
      jobs: '/(candidate)/(tabs)/jobs',
      aiCoach: '/(candidate)/(tabs)/ai-coach',
      profile: '/(candidate)/(tabs)/profile',
    };
    // Use replace to avoid adding to back stack when switching tabs
    router.replace(routes[tabId] as any);
  };

  const handleAIAssistantPress = () => {
    // Navigate to Clara assistant - use push since it's a sub-screen
    router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any);
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
        <Tabs.Screen name="ai-coach" options={{ title: 'AI Coach' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>

      {/* Custom floating tab bar */}
      <CandidateNavBar
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
