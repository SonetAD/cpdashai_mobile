import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import ProfileSetupScreen from '../../screens/auth/ProfileSetupScreen';

export default function ProfileSetup() {
  const router = useRouter();

  // Prevent hardware back button from going back to subscription/login
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      // User must complete profile setup
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleComplete = () => {
    router.replace('/(auth)/cv-upload');
  };

  return (
    <ProfileSetupScreen
      onComplete={handleComplete}
      onBack={undefined} // No back button - subscription gate is mandatory
    />
  );
}
