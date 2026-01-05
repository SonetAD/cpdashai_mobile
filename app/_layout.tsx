import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { store, persistor, RootState } from '../store/store';
import { useAppDispatch } from '../store/hooks';
import { logout as logoutAction, updateTokens } from '../store/slices/authSlice';
import { api, useRefreshTokenMutation } from '../services/api';
import { getAccessToken, getRefreshToken, clearTokens, storeTokens } from '../utils/authUtils';
import { AlertProvider } from '../contexts/AlertContext';
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
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);

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

    console.log('Navigation check:', { isAuthenticated, userRole: user?.role, segments, inAuthGroup });

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated and not in auth group - redirect to splash
      console.log('Redirecting to splash...');
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but still in auth group - redirect to appropriate dashboard
      console.log('Authenticated, redirecting to dashboard...');
      if (user?.role === 'recruiter') {
        router.replace('/(recruiter)/(tabs)/home');
      } else {
        router.replace('/(candidate)/(tabs)/home');
      }
    } else if (isAuthenticated && user?.role === 'recruiter' && inCandidateGroup) {
      // Recruiter trying to access candidate routes
      router.replace('/(recruiter)/(tabs)/home');
    } else if (isAuthenticated && user?.role !== 'recruiter' && inRecruiterGroup) {
      // Candidate trying to access recruiter routes
      router.replace('/(candidate)/(tabs)/home');
    }
  }, [isAuthenticated, user, segments, isVerifying]);

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
              <StatusBar style="light" />
              <AuthNavigator />
            </AlertProvider>
          </StripeProvider>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
