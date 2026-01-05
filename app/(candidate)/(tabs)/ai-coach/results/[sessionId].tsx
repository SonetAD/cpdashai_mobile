import { useRouter, useLocalSearchParams } from 'expo-router';
import SessionResultsScreen from '../../../../../screens/candidate/aiCoach/SessionResultsScreen';

export default function SessionResultsRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  return (
    <SessionResultsScreen
      sessionId={sessionId || ''}
      onBack={() => router.back()}
      onStartNewSession={() => router.replace('/(candidate)/(tabs)/ai-coach' as any)}
    />
  );
}
