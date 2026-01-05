import { useRouter, useLocalSearchParams } from 'expo-router';
import JobApplicationsScreen from '../../../../../screens/recruiter/dashboard/JobApplicationsScreen';

export default function JobApplicationsRoute() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  return (
    <JobApplicationsScreen
      jobId={jobId || ''}
      onBack={() => router.back()}
    />
  );
}
