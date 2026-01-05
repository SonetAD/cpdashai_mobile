import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../../screens/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    router.replace('/(auth)/create-account');
  };

  return <OnboardingScreen onFinish={handleFinish} />;
}
