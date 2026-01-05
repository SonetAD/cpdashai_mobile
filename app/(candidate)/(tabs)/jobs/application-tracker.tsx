import { useRouter } from 'expo-router';
import ApplicationTrackerScreen from '../../../../screens/candidate/dashboard/ApplicationTrackerScreenNew';

export default function ApplicationTrackerRoute() {
  const router = useRouter();

  return (
    <ApplicationTrackerScreen
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
      onBrowseJobsPress={() => router.push('/(candidate)/(tabs)/jobs' as any)}
      onJobPress={(jobId) => router.push(`/(candidate)/(tabs)/jobs/${jobId}` as any)}
      onSearchNavigate={(route) => router.push(route as any)}
    />
  );
}
