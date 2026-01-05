import { useRouter } from 'expo-router';
import RecruiterJobsScreen from '../../../../screens/recruiter/dashboard/RecruiterJobsScreen';

export default function RecruiterJobsRoute() {
  const router = useRouter();

  return (
    <RecruiterJobsScreen
      onBack={() => router.back()}
      onCreateJob={() => router.push('/(recruiter)/(tabs)/home/create-job' as any)}
      onEditJob={(jobId) => router.push({
        pathname: '/(recruiter)/(tabs)/home/create-job',
        params: { jobId },
      } as any)}
      onViewApplications={(jobId) => router.push({
        pathname: '/(recruiter)/(tabs)/home/applications/[jobId]',
        params: { jobId },
      } as any)}
    />
  );
}
