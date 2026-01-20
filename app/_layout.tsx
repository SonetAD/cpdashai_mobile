import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { store, persistor, RootState } from '../store/store';
import { useAppDispatch } from '../store/hooks';
import { logout as logoutAction, updateTokens } from '../store/slices/authSlice';
import { api, useRefreshTokenMutation, useLazyGetOnboardingStatusQuery } from '../services/api';
import { getAccessToken, getRefreshToken, clearTokens, storeTokens } from '../utils/authUtils';
import { AlertProvider } from '../contexts/AlertContext';
import { FeatureGateProvider } from '../contexts/FeatureGateContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { NotificationToastManager } from '../components/notifications';
import SplashScreen from '../screens/SplashScreen';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#437EF4',
  },
});

// Auth navigation guard component
function AuthNavigator() {
  const segments = useSegments();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const [refreshToken] = useRefreshTokenMutation();
  const [getOnboardingStatus] = useLazyGetOnboardingStatusQuery();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Reset onboardingChecked when user logs out so it runs again on next login
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User logged out, resetting onboardingChecked');
      setOnboardingChecked(false);
    }
  }, [isAuthenticated]);

  // Token verification on app startup
  useEffect(() => {
    if (hasVerified) return;

    const verifyAuthStatus = async () => {
      console.log('=== Starting Auth Verification ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token exists:', !!token);

      setHasVerified(true);

      try {
        if (isAuthenticated && token) {
          console.log('User appears authenticated, verifying stored token...');

          const storedAccessToken = await getAccessToken();
          const storedRefreshToken = await getRefreshToken();

          if (!storedAccessToken || !storedRefreshToken) {
            console.log('No tokens found in secure storage, logging out');
            dispatch(logoutAction());
            setIsVerifying(false);
            return;
          }

          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000'}/graphql/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedAccessToken}`,
              },
              body: JSON.stringify({
                query: `
                  query VerifyToken {
                    verifyToken {
                      ... on TokenVerificationSuccessType {
                        __typename
                        valid
                        role
                        user {
                          id
                          email
                          firstName
                          lastName
                          role
                        }
                      }
                      ... on ErrorType {
                        __typename
                        message
                      }
                    }
                  }
                `,
              }),
            });

            const data = await response.json();
            const verifyResult = data.data?.verifyToken;

            if (verifyResult?.__typename === 'TokenVerificationSuccessType' && verifyResult.valid) {
              console.log('Token is valid, user stays logged in');
              setIsVerifying(false);
            } else {
              console.log('Token invalid, attempting refresh...');
              await attemptTokenRefresh(storedRefreshToken);
            }
          } catch (error) {
            console.log('Token verification error, attempting refresh...');
            const storedRefreshToken = await getRefreshToken();
            if (storedRefreshToken) {
              await attemptTokenRefresh(storedRefreshToken);
            } else {
              dispatch(logoutAction());
              setIsVerifying(false);
            }
          }
        } else {
          console.log('User not authenticated, skipping verification');
          setIsVerifying(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsVerifying(false);
      }
    };

    const attemptTokenRefresh = async (storedRefreshToken: string) => {
      try {
        const refreshResult = await refreshToken({
          refreshToken: storedRefreshToken,
        }).unwrap();

        if (refreshResult.refreshToken.__typename === 'RefreshTokenSuccessType') {
          console.log('Token refreshed successfully');
          await storeTokens(
            refreshResult.refreshToken.accessToken,
            refreshResult.refreshToken.refreshToken
          );
          dispatch(updateTokens({
            token: refreshResult.refreshToken.accessToken,
            refreshToken: refreshResult.refreshToken.refreshToken,
          }));
        } else {
          console.log('Token refresh failed, logging out');
          dispatch(logoutAction());
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        dispatch(logoutAction());
      }
      setIsVerifying(false);
    };

    const timer = setTimeout(() => {
      verifyAuthStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, token, hasVerified]);

  // Navigation based on auth state
  useEffect(() => {
    if (isVerifying) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inCandidateGroup = segments[0] === '(candidate)';
    const inRecruiterGroup = segments[0] === '(recruiter)';

    // Check if user is on an onboarding screen
    const currentPath = segments.join('/');
    const isOnOnboardingScreen = currentPath.includes('subscription-gate') ||
                                  currentPath.includes('profile-setup') ||
                                  currentPath.includes('cv-upload');

    // Check if user is on login/register screens (should redirect if authenticated)
    const isOnAuthScreen = currentPath.includes('login') ||
                           currentPath.includes('register') ||
                           currentPath.includes('create-account') ||
                           currentPath.includes('onboarding') ||
                           currentPath.includes('splash');

    console.log('Navigation check:', { isAuthenticated, userRole: user?.role, segments, inAuthGroup, isOnOnboardingScreen, isOnAuthScreen, onboardingChecked });

    // IMPORTANT: If user is on an onboarding screen (subscription-gate, profile-setup, cv-upload),
    // do NOT redirect them - they should only leave via explicit action
    if (isAuthenticated && isOnOnboardingScreen) {
      console.log('User is authenticated and on onboarding screen, not redirecting automatically');
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth group - redirect to splash
      console.log('Redirecting to splash...');
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but in auth group - check where to send them
      console.log('Authenticated and in auth group, checking onboarding status...');

      // For candidates, check onboarding status
      if (user?.role !== 'recruiter') {
        // Only check onboarding if we haven't already or if on auth screens (login/register)
        // This ensures we always redirect properly after login
        if (!onboardingChecked || isOnAuthScreen) {
          console.log('Calling getOnboardingStatus API...');

          getOnboardingStatus()
            .unwrap()
            .then((result) => {
              console.log('GetOnboardingStatus raw result:', JSON.stringify(result));
              const status = result?.onboardingStatus;
              console.log('Onboarding status:', status);

              // Set flag AFTER successful API call
              setOnboardingChecked(true);

              if (status) {
                if (!status.subscriptionComplete) {
                  console.log('Redirecting to subscription gate...');
                  router.replace('/(auth)/subscription-gate');
                } else if (!status.profileSetupComplete) {
                  console.log('Redirecting to profile setup...');
                  router.replace('/(auth)/profile-setup');
                } else if (!status.cvUploadComplete) {
                  console.log('Redirecting to CV upload...');
                  router.replace('/(auth)/cv-upload');
                } else {
                  console.log('Onboarding complete, redirecting to dashboard...');
                  router.replace('/(candidate)/(tabs)/home');
                }
              } else {
                // If no onboarding status returned (new user), start from subscription
                console.log('No onboarding status, starting from subscription gate...');
                router.replace('/(auth)/subscription-gate');
              }
            })
            .catch((error) => {
              console.error('Error checking onboarding status:', error);
              console.error('Error details:', JSON.stringify(error));
              // On error, still set flag but redirect to subscription
              setOnboardingChecked(true);
              router.replace('/(auth)/subscription-gate');
            });
        }
      } else if (user?.role === 'recruiter') {
        // Recruiters go directly to dashboard (no onboarding flow for recruiters yet)
        console.log('Recruiter authenticated, redirecting to recruiter dashboard...');
        router.replace('/(recruiter)/(tabs)/home');
      }
    } else if (isAuthenticated && user?.role === 'recruiter' && inCandidateGroup) {
      // Recruiter trying to access candidate routes
      router.replace('/(recruiter)/(tabs)/home');
    } else if (isAuthenticated && user?.role !== 'recruiter' && inRecruiterGroup) {
      // Candidate trying to access recruiter routes
      router.replace('/(candidate)/(tabs)/home');
    }
  }, [isAuthenticated, user, segments, isVerifying, onboardingChecked]);

  // Show splash while verifying
  if (isVerifying) {
    return <SplashScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 350,
        contentStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Stack.Screen
        name="(auth)"
        options={{
          animation: 'fade',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="(candidate)"
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
      <Stack.Screen
        name="(recruiter)"
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      />
    </Stack>
  );
}

// Root layout with all providers
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <KeyboardProvider>
        <SafeAreaProvider style={styles.container}>
          <Provider store={store}>
            <PersistGate
              loading={<SplashScreen />}
              persistor={persistor}
              onBeforeLift={() => {
                console.log('Redux Persist: Rehydration complete');
              }}
            >
              <StripeProvider
                publishableKey={STRIPE_PUBLISHABLE_KEY}
                merchantIdentifier="merchant.com.chawlasolutions.cpdashai"
                urlScheme="cpdashai"
              >
                <AlertProvider>
                  <FeatureGateProvider>
                    <NotificationProvider>
                      <StatusBar style="light" />
                      <AuthNavigator />
                      <NotificationToastManager />
                    </NotificationProvider>
                  </FeatureGateProvider>
                </AlertProvider>
              </StripeProvider>
            </PersistGate>
          </Provider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
