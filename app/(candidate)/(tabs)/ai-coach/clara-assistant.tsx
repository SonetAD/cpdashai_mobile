import { useRouter } from 'expo-router';
import AIClaraAssistantScreen from '../../../../screens/candidate/aiCoach/AIClaraAssistantScreen';

export default function ClaraAssistantRoute() {
  const router = useRouter();

  return (
    <AIClaraAssistantScreen
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
