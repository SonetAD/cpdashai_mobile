import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../../../store/slices/authSlice';
import { api } from '../../../../services/api';
import { clearTokens } from '../../../../utils/authUtils';
import nativeGoogleSignIn from '../../../../services/nativeGoogleSignIn';
import ProfileScreen from '../../../../screens/candidate/profile/ProfileScreen';

export default function ProfileRoute() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // Sign out from Google
      await nativeGoogleSignIn.signOut();
    } catch (error) {
      console.error('Google sign-out error:', error);
    }

    // Clear tokens
    await clearTokens();

    // Clear Redux state
    dispatch(logoutAction());

    // Clear RTK Query cache
    dispatch(api.util.resetApiState());

    // Auth state change will redirect to splash via root layout
  };

  return (
    <ProfileScreen
      activeTab="profile"
      onTabChange={(tabId) => {
        const routes: Record<string, string> = {
          home: '/(candidate)/(tabs)/home',
          jobs: '/(candidate)/(tabs)/jobs',
          aiCoach: '/(candidate)/(tabs)/ai-coach',
          profile: '/(candidate)/(tabs)/profile',
        };
        // Use replace for tab changes to avoid stacking
        router.replace(routes[tabId] as any);
      }}
      onAIAssistantPress={() => router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any)}
      onLogout={handleLogout}
      onViewPricing={() => router.push('/(candidate)/subscription/pricing' as any)}
      onViewBillingHistory={() => router.push('/(candidate)/subscription/billing-history' as any)}
      onViewFullProfile={() => router.push('/(candidate)/(tabs)/profile/full-profile' as any)}
      onSearchNavigate={(route) => router.push(route as any)}
    />
  );
}
