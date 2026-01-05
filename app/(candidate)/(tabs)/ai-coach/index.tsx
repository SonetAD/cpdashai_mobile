import { useRouter } from 'expo-router';
import InterviewCoachScreen from '../../../../screens/candidate/aiCoach/InterviewCoachScreen';

export default function AICoachRoute() {
  const router = useRouter();

  return (
    <InterviewCoachScreen
      activeTab="aiCoach"
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
      onAskClara={() => router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any)}
      onAskRay={() => router.push('/(candidate)/(tabs)/ai-coach/ray-assistant' as any)}
      onStartSession={(data) => {
        router.push({
          pathname: '/(candidate)/(tabs)/ai-coach/session/[sessionId]',
          params: {
            sessionId: data.sessionId,
            mode: data.mode,
            questionsJson: JSON.stringify(data.questions),
            sessionJson: JSON.stringify(data.session),
          },
        } as any);
      }}
      onViewSession={(sessionId) => {
        router.push({
          pathname: '/(candidate)/(tabs)/ai-coach/results/[sessionId]',
          params: { sessionId },
        } as any);
      }}
    />
  );
}
