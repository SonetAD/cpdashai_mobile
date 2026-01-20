import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import CVBuilderScreen from '../../screens/candidate/dashboard/CVBuilderScreen';
import { useUpdateOnboardingStepMutation } from '../../services/api';

export default function CVBuilderRoute() {
  const router = useRouter();
  const { resumeId, source } = useLocalSearchParams<{
    resumeId?: string;
    source?: 'onboarding' | 'jobs';
  }>();
  const [updateOnboardingStep] = useUpdateOnboardingStepMutation();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Go back to the previous screen
    router.back();
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (source === 'onboarding') {
      // Mark CV upload step as complete and go to dashboard
      try {
        await updateOnboardingStep({ step: 'cv', completed: true });
      } catch (error) {
        console.error('Error updating onboarding step:', error);
      }
      // Navigate to candidate dashboard
      router.replace('/(candidate)/(tabs)/home');
    } else {
      // Go back to CV Manager (jobs)
      router.back();
    }
  };

  return (
    <CVBuilderScreen
      onBack={handleBack}
      onComplete={handleComplete}
      resumeId={resumeId}
    />
  );
}
