import { useRouter } from 'expo-router';
import PricingScreen from '../../../screens/candidate/subscription/PricingScreen';

export default function PricingRoute() {
  const router = useRouter();

  return (
    <PricingScreen
      activeTab="home"
      onTabChange={(tabId) => {
        router.dismiss();
        const routes: Record<string, string> = {
          home: '/(candidate)/(tabs)/home',
          jobs: '/(candidate)/(tabs)/jobs',
          aiCoach: '/(candidate)/(tabs)/ai-coach',
          profile: '/(candidate)/(tabs)/profile',
        };
        router.push(routes[tabId] as any);
      }}
      onBack={() => router.back()}
    />
  );
}
