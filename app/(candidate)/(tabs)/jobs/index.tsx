import { useRouter } from 'expo-router';
import JobsScreen from '../../../../screens/candidate/dashboard/JobsScreen';

export default function JobsRoute() {
  const router = useRouter();

  return (
    <JobsScreen
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
      onAIAssistantPress={() => router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any)}
      onJobPress={(jobId) => router.push(`/(candidate)/(tabs)/jobs/${jobId}` as any)}
      onApplicationTrackerPress={() => router.push('/(candidate)/(tabs)/jobs/application-tracker' as any)}
      onCVUploadPress={() => router.push('/(candidate)/(tabs)/jobs/cv-upload' as any)}
      onSearchNavigate={(route) => router.push(route as any)}
    />
  );
}
