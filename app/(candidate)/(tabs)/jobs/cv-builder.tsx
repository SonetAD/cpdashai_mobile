import { useRouter, useLocalSearchParams } from 'expo-router';
import CVBuilderScreen from '../../../../screens/candidate/dashboard/CVBuilderScreen';

export default function CVBuilderRoute() {
  const router = useRouter();
  const { resumeId } = useLocalSearchParams<{ resumeId?: string }>();

  return (
    <CVBuilderScreen
      activeTab="jobs"
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
      resumeId={resumeId}
    />
  );
}
