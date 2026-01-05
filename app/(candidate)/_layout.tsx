import { useEffect, useRef } from 'react';
import { Redirect, Slot } from 'expo-router';
import { useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import { RootState } from '../../store/store';
import { useLazySyncSubscriptionStatusQuery } from '../../services/api';

export default function CandidateLayout() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [syncSubscriptionStatus] = useLazySyncSubscriptionStatusQuery();
  const appState = useRef(AppState.currentState);
  const hasSyncedOnMount = useRef(false);

  // Auto-sync subscription status on app open and when app comes to foreground
  useEffect(() => {
    if (!isAuthenticated) return;

    // Sync on initial mount
    if (!hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true;
      syncSubscriptionStatus().catch((error) => {
        console.error('Error syncing subscription status on mount:', error);
      });
    }

    // Sync when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        syncSubscriptionStatus().catch((error) => {
          console.error('Error syncing subscription status on foreground:', error);
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, syncSubscriptionStatus]);

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  // Redirect recruiters to their dashboard
  if (user?.role === 'recruiter') {
    return <Redirect href="/(recruiter)/(tabs)/home" />;
  }

  return <Slot />;
}
