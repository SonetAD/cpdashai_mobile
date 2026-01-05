import { useRouter, useLocalSearchParams } from 'expo-router';
import CreateEditJobPostingScreen from '../../../../screens/recruiter/dashboard/CreateEditJobPostingScreen';

export default function CreateJobRoute() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  return (
    <CreateEditJobPostingScreen
      jobId={jobId}
      onBack={() => router.back()}
      onSuccess={() => router.replace('/(recruiter)/(tabs)/home/jobs' as any)}
    />
  );
}
