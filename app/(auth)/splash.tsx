import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import SplashScreen from '../../screens/SplashScreen';

export default function SplashRoute() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkAndNavigate = async () => {
      // Wait for splash animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (isAuthenticated && user) {
        // User is authenticated - redirect to appropriate dashboard
        if (user.role === 'recruiter') {
          router.replace('/(recruiter)/(tabs)/home');
        } else {
          router.replace('/(candidate)/(tabs)/home');
        }
      } else {
        // Check onboarding status
        try {
          const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
          if (onboardingCompleted === 'true') {
            router.replace('/(auth)/create-account');
          } else {
            router.replace('/(auth)/onboarding');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          router.replace('/(auth)/onboarding');
        }
      }
      setHasChecked(true);
    };

    checkAndNavigate();
  }, [isAuthenticated, user]);

  return <SplashScreen />;
}
