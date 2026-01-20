import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { api } from '../../services/api';
import LoginScreen from '../../screens/auth/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const handleBack = () => {
    router.back();
  };

  const handleSignUp = () => {
    router.push({
      pathname: '/(auth)/register',
      params: { role: role || 'candidate' },
    });
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleLoginSuccess = () => {
    // Clear RTK Query cache to ensure fresh data for the newly logged in user
    dispatch(api.util.resetApiState());
    // Auth state change will trigger redirect in root layout
  };

  return (
    <LoginScreen
      onBack={handleBack}
      onSignUp={handleSignUp}
      onForgotPassword={handleForgotPassword}
      onLoginSuccess={handleLoginSuccess}
      showOAuth={true}
      role={(role as 'candidate' | 'recruiter') || undefined}
    />
  );
}
