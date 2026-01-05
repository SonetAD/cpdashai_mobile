import { useRouter } from 'expo-router';
import CVUploadScreen from '../../../../screens/candidate/dashboard/CVUploadScreen';

export default function CVUploadRoute() {
  const router = useRouter();

  return (
    <CVUploadScreen
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
      onCreateCV={() => router.push('/(candidate)/(tabs)/jobs/cv-builder' as any)}
      onEditCV={(resumeId) => router.push({
        pathname: '/(candidate)/(tabs)/jobs/cv-builder',
        params: { resumeId },
      } as any)}
      onViewPricing={() => router.push('/(candidate)/subscription/pricing' as any)}
    />
  );
}
