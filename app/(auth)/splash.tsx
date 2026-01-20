import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import SplashScreen from '../../screens/SplashScreen';

export default function SplashRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const checkAndNavigate = async () => {
      // Wait for splash animation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Don't navigate if component unmounted or user already navigated away
      if (!isMounted.current) return;

      // Check current route - if not on splash anymore, don't navigate
      // This prevents overriding navigation done by _layout.tsx AuthNavigator
      const currentPath = segments.join('/');
      if (!currentPath.includes('splash')) {
        console.log('Splash: User already navigated away, skipping redirect');
        return;
      }

      if (isAuthenticated && user) {
        // User is authenticated - AuthNavigator in _layout.tsx will handle
        // onboarding status check and redirect to appropriate screen
        // We don't redirect here to avoid bypassing onboarding flow
        console.log('Splash: User authenticated, letting AuthNavigator handle routing');
        // Don't do anything - let _layout.tsx handle it
      } else {
        // Check onboarding status for unauthenticated users
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
    };

    checkAndNavigate();
  }, [isAuthenticated, user, segments]);

  return <SplashScreen />;
}
