import { useRouter } from 'expo-router';
import AIRayAssistantScreen from '../../../../screens/candidate/aiCoach/AIRayAssistantScreen';

export default function RayAssistantRoute() {
  const router = useRouter();

  return (
    <AIRayAssistantScreen
      activeTab="aiCoach"
      onTabChange={(tabId) => {
        const routes: Record<string, string> = {
          home: '/(candidate)/(tabs)/home',
          jobs: '/(candidate)/(tabs)/jobs',
          aiCoach: '/(candidate)/(tabs)/ai-coach',
          profile: '/(candidate)/(tabs)/profile',
        };
        // Use replace for tab changes to avoid stacking
        router.replace(routes[tabId] as any);
      }}
      onBack={() => router.back()}
      onSearchNavigate={(route) => router.push(route as any)}
    />
  );
}
