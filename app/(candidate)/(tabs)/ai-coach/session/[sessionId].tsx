import { useRouter, useLocalSearchParams } from 'expo-router';
import ActiveInterviewSessionScreen from '../../../../../screens/candidate/aiCoach/ActiveInterviewSessionScreen';

export default function ActiveSessionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId: string;
    mode?: string;
    questionsJson?: string;
    sessionJson?: string;
  }>();

  const questions = params.questionsJson ? JSON.parse(params.questionsJson) : [];
  const session = params.sessionJson ? JSON.parse(params.sessionJson) : undefined;

  return (
    <ActiveInterviewSessionScreen
      sessionId={params.sessionId || ''}
      mode={(params.mode as 'text' | 'voice') || 'text'}
      initialQuestions={questions}
      initialSession={session}
      onComplete={(completedSessionId) => {
        router.replace({
          pathname: '/(candidate)/(tabs)/ai-coach/results/[sessionId]',
          params: { sessionId: completedSessionId },
        } as any);
      }}
      onExit={() => router.replace('/(candidate)/(tabs)/ai-coach' as any)}
    />
  );
}
