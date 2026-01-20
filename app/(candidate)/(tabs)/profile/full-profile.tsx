import { useRouter } from 'expo-router';
import FullProfileScreen from '../../../../screens/candidate/profile/FullProfileScreen';

export default function FullProfileRoute() {
  const router = useRouter();

  return (
    <FullProfileScreen
      activeTab="profile"
      onTabChange={(tabId) => {
        const routes: Record<string, string> = {
          home: '/(candidate)/(tabs)/home',
          jobs: '/(candidate)/(tabs)/jobs',
          aiCoach: '/(candidate)/(tabs)/ai-coach',
          profile: '/(candidate)/(tabs)/profile/full-profile',
        };
        // Use replace for tab changes to avoid stacking
        router.replace(routes[tabId] as any);
      }}
      onBack={() => router.back()}
      onSearchNavigate={(route) => router.push(route as any)}
      showBackButton={false}
      onNotificationPress={() => router.push('/(candidate)/notifications' as any)}
      onProfilePress={() => router.push('/(candidate)/(tabs)/profile' as any)}
    />
  );
}
