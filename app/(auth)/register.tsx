import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { api } from '../../services/api';
import RegisterScreen from '../../screens/auth/RegisterScreen';

type UserRole = 'candidate' | 'recruiter' | null;

export default function RegisterRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const selectedRole: UserRole = (role as UserRole) || 'candidate';

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.push({
      pathname: '/(auth)/login',
      params: { role: role || 'candidate' },
    });
  };

  const handleRegisterSuccess = () => {
    // Clear RTK Query cache to ensure fresh data for the newly registered user
    dispatch(api.util.resetApiState());
    // Auth state change will trigger redirect in root layout
  };

  return (
    <RegisterScreen
      role={selectedRole}
      onBack={handleBack}
      onLogin={handleLogin}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
