import { useRouter, useLocalSearchParams } from 'expo-router';
import JobDetailsScreen from '../../../../screens/candidate/dashboard/JobDetailsScreenNew';

export default function JobDetailsRoute() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  return (
    <JobDetailsScreen
      jobId={jobId || ''}
      onBack={() => router.back()}
      onNavigateToProfile={() => router.push('/(candidate)/(tabs)/profile/full-profile' as any)}
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
    />
  );
}
