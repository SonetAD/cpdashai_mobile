import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import CVUploadOnboardingScreen from '../../screens/auth/CVUploadOnboardingScreen';

export default function CVUpload() {
  const router = useRouter();

  // Handle hardware back button - go to profile-setup only
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Navigate back to profile-setup instead of going further back to login
      router.replace('/(auth)/profile-setup');
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [router]);

  const handleComplete = () => {
    // Navigate to candidate dashboard
    router.replace('/(candidate)/(tabs)/home');
  };

  const handleCreateCV = () => {
    // Navigate to CV builder to create resume (outside tabs, no navbar)
    // The onboarding step will be marked complete when user actually creates/saves their CV
    router.push('/(candidate)/cv-builder?source=onboarding');
  };

  const handleBack = () => {
    // Navigate back to profile-setup (can't use router.back() since we used replace)
    router.replace('/(auth)/profile-setup');
  };

  return (
    <CVUploadOnboardingScreen
      onComplete={handleComplete}
      onCreateCV={handleCreateCV}
      onBack={handleBack} // Always show back button as per Figma design
    />
  );
}
