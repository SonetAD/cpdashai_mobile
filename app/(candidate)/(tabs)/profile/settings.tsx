import { useRouter } from 'expo-router';
import SettingsScreen from '../../../../screens/candidate/profile/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();

  return (
    <SettingsScreen
      activeTab="profile"
      onTabChange={(tabId) => {
        const routes: Record<string, string> = {
          home: '/(candidate)/(tabs)/home',
          jobs: '/(candidate)/(tabs)/jobs',
          aiCoach: '/(candidate)/(tabs)/ai-coach',
          profile: '/(candidate)/(tabs)/profile',
        };
        router.push(routes[tabId] as any);
      }}
      onBack={() => router.back()}
      onViewPricing={() => router.push('/(candidate)/subscription/pricing' as any)}
      onViewBillingHistory={() => router.navigate('/(candidate)/subscription/billing-history' as any)}
    />
  );
}
