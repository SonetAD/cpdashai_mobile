/**
 * Career Dashboard Route
 *
 * Route handler for the career dashboard screen.
 */

import { useRouter } from 'expo-router';
import CareerDashboardScreen from '../../screens/candidate/dashboard/CareerDashboardScreen';

export default function CareerDashboardRoute() {
  const router = useRouter();

  return (
    <CareerDashboardScreen
      onBack={() => router.back()}
      activeTab="home"
      onTabChange={(tabId) => {
        if (tabId === 'home') {
          router.push('/(candidate)/(tabs)/home' as any);
        } else if (tabId === 'jobs') {
          router.push('/(candidate)/(tabs)/jobs' as any);
        } else if (tabId === 'aiCoach') {
          router.push('/(candidate)/(tabs)/ai-coach' as any);
        } else if (tabId === 'profile') {
          router.push('/(candidate)/(tabs)/profile' as any);
        }
      }}
      onNotificationPress={() => router.push('/(candidate)/notifications' as any)}
      onProfilePress={() => router.push('/(candidate)/(tabs)/profile' as any)}
    />
  );
}
