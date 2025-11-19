import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Dimensions, View, StyleSheet } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor, RootState } from './store/store';
import { useAppDispatch } from './store/hooks';
import { logout as logoutAction, updateTokens } from './store/slices/authSlice';
import { useVerifyTokenQuery, useRefreshTokenMutation, useLogoutMutation } from './services/api';
import { getAccessToken, getRefreshToken, clearTokens, storeTokens } from './utils/authUtils';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CreateAccountScreen from './screens/auth/CreateAccountScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LoginScreen from './screens/auth/LoginScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import CandidateDashboard from './screens/candidate/dashboard/dashboard';
import RecruiterDashboard from './screens/recruiter/dashboard/dashboard';
import { SkeletonLoader } from './components/SkeletonLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#437EF4',
  },
});

type Screen = 'splash' | 'onboarding' | 'createAccount' | 'register' | 'login' | 'forgotPassword' | 'dashboard';
type UserRole = 'candidate' | 'recruiter' | null;

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedInitialNavigation, setHasCompletedInitialNavigation] = useState(false);

  // Simple fade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasVerified, setHasVerified] = useState(false);

  const dispatch = useAppDispatch();
  const { isAuthenticated, user, token, refreshToken: reduxRefreshToken } = useSelector((state: RootState) => state.auth);
  const [refreshToken] = useRefreshTokenMutation();
  const [logout] = useLogoutMutation();

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        setHasCompletedOnboarding(onboardingCompleted === 'true');
        console.log('Onboarding completed:', onboardingCompleted === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboardingStatus();
  }, []);

  // Token verification on app startup (runs AFTER Redux Persist rehydration)
  useEffect(() => {
    // Only verify once on app startup
    if (hasVerified) {
      return;
    }
    const verifyAuthStatus = async () => {
      console.log('=== Starting Auth Verification ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('token exists:', !!token);

      setHasVerified(true);

      try {
        // If user is authenticated in Redux, verify the token
        if (isAuthenticated && token) {
          console.log('User appears authenticated, verifying stored token...');

          // Get tokens from secure storage
          const storedAccessToken = await getAccessToken();
          const storedRefreshToken = await getRefreshToken();

          console.log('Stored access token exists:', !!storedAccessToken);
          console.log('Stored refresh token exists:', !!storedRefreshToken);

          if (!storedAccessToken || !storedRefreshToken) {
            console.log('No tokens found in secure storage, logging out');
            dispatch(logoutAction());
            setIsVerifying(false);
            return;
          }

          // Try to verify the token with backend
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
              // Token is invalid, try to refresh
              console.log('Token invalid, attempting refresh...');

              const refreshResult = await refreshToken({
                refreshToken: storedRefreshToken,
              }).unwrap();

              if (refreshResult.refreshToken.__typename === 'RefreshTokenSuccessType') {
                console.log('Token refreshed successfully');

                // Store new tokens in SecureStore
                await storeTokens(
                  refreshResult.refreshToken.accessToken,
                  refreshResult.refreshToken.refreshToken
                );

                // Update Redux state
                dispatch(updateTokens({
                  token: refreshResult.refreshToken.accessToken,
                  refreshToken: refreshResult.refreshToken.refreshToken,
                }));
                setIsVerifying(false);
              } else {
                console.log('Token refresh failed, logging out');
                dispatch(logoutAction());
                setIsVerifying(false);
              }
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            // Try refresh as fallback
            try {
              const refreshResult = await refreshToken({
                refreshToken: storedRefreshToken,
              }).unwrap();

              if (refreshResult.refreshToken.__typename === 'RefreshTokenSuccessType') {
                console.log('Token refreshed successfully after verification error');

                // Store new tokens in SecureStore
                await storeTokens(
                  refreshResult.refreshToken.accessToken,
                  refreshResult.refreshToken.refreshToken
                );

                // Update Redux state
                dispatch(updateTokens({
                  token: refreshResult.refreshToken.accessToken,
                  refreshToken: refreshResult.refreshToken.refreshToken,
                }));
              } else {
                dispatch(logoutAction());
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              dispatch(logoutAction());
            }
            setIsVerifying(false);
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

    // Small delay to ensure Redux Persist has rehydrated
    const timer = setTimeout(() => {
      verifyAuthStatus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, token]);

  useEffect(() => {
    // Only navigate after verification is complete and only once
    if (!isVerifying && !hasCompletedInitialNavigation) {
      const timer = setTimeout(() => {
        // Check if user is authenticated, navigate to dashboard if so
        if (isAuthenticated && user) {
          setCurrentScreen('dashboard');
        } else {
          // If not authenticated, check onboarding status
          if (hasCompletedOnboarding) {
            setCurrentScreen('createAccount');
          } else {
            setCurrentScreen('onboarding');
          }
        }
        setHasCompletedInitialNavigation(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, isVerifying, hasCompletedOnboarding, hasCompletedInitialNavigation]);

  const handleScreenChange = (newScreen: Screen, isBack: boolean = false) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setShowSkeleton(true);

    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change screen while showing skeleton
      setCurrentScreen(newScreen);

      // Small delay to show skeleton loading
      setTimeout(() => {
        setShowSkeleton(false);

        // Fade in new screen
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      }, 300); // Skeleton shows for 300ms
    });
  };

  const handleOnboardingFinish = async () => {
    // Mark onboarding as completed
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    try {
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      setHasCompletedOnboarding(true);
      console.log('Onboarding marked as completed');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    handleScreenChange('createAccount');
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    handleScreenChange('register');
  };

  const handleBackToCreateAccount = () => {
    handleScreenChange('createAccount', true);
  };

  const handleGoToLogin = () => {
    handleScreenChange('login');
  };

  const handleBackToLogin = () => {
    handleScreenChange('login', true);
  };

  const handleGoToRegister = () => {
    handleScreenChange('register');
  };

  const handleGoToForgotPassword = () => {
    handleScreenChange('forgotPassword');
  };

  const handleLoginSuccess = () => {
    handleScreenChange('dashboard');
  };

  const handleLogout = async () => {
    try {
      // Call backend logout mutation
      console.log('Logging out...');
      await logout().unwrap();
      console.log('Backend logout successful');
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with local logout even if backend fails
    }

    // Clear tokens from secure storage
    await clearTokens();

    // Clear Redux state
    dispatch(logoutAction());

    // Navigate to create account screen
    handleScreenChange('createAccount', true);
  };

  const renderScreen = (screen: Screen) => {
    const style = {
      flex: 1,
      opacity: fadeAnim,
    };

    let statusBarStyle: 'light' | 'dark' = 'dark';
    let content: React.ReactNode = null;

    switch (screen) {
      case 'splash':
        statusBarStyle = 'light';
        content = <SplashScreen />;
        break;
      case 'onboarding':
        statusBarStyle = 'dark';
        content = <OnboardingScreen onFinish={handleOnboardingFinish} />;
        break;
      case 'createAccount':
        statusBarStyle = 'light';
        content = <CreateAccountScreen onRoleSelect={handleRoleSelect} />;
        break;
      case 'login':
        content = (
          <LoginScreen
            onBack={handleBackToCreateAccount}
            onSignUp={handleGoToRegister}
            onForgotPassword={handleGoToForgotPassword}
            onLoginSuccess={handleLoginSuccess}
          />
        );
        break;
      case 'forgotPassword':
        content = (
          <ForgotPasswordScreen
            onBack={handleBackToLogin}
          />
        );
        break;
      case 'dashboard':
        console.log('Dashboard - User role:', user?.role);
        console.log('Dashboard - Is recruiter:', user?.role === 'recruiter');
        const Dashboard = user?.role === 'recruiter' ? RecruiterDashboard : CandidateDashboard;
        const userName = user?.email?.split('@')[0] || 'User';
        console.log('Dashboard - Rendering:', user?.role === 'recruiter' ? 'RecruiterDashboard' : 'CandidateDashboard');
        content = <Dashboard userName={userName} onLogout={handleLogout} />;
        break;
      case 'register':
        content = (
          <RegisterScreen
            role={selectedRole}
            onBack={handleBackToCreateAccount}
            onLogin={handleGoToLogin}
          />
        );
        break;
    }

    return (
      <Animated.View style={style}>
        <StatusBar style={statusBarStyle} />
        {content}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {showSkeleton ? (
        <SkeletonLoader type={currentScreen === 'dashboard' ? 'dashboard' : currentScreen === 'onboarding' ? 'auth' : 'auth'} />
      ) : (
        renderScreen(currentScreen)
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#437EF4' }}>
      <Provider store={store}>
        <PersistGate
          loading={<SplashScreen />}
          persistor={persistor}
          onBeforeLift={() => {
            console.log('Redux Persist: Rehydration complete');
          }}
        >
          <AppContent />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
