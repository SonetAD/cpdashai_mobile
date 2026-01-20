import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { api } from '../../services/api';
import RegisterScreen from '../../screens/auth/RegisterScreen';

type UserRole = 'candidate' | 'recruiter' | null;

export default function RegisterRoute() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { role } = useLocalSearchParams<{ role?: string }>();

  // Ensure role is properly typed - useLocalSearchParams can return string | string[]
  const roleParam = Array.isArray(role) ? role[0] : role;
  const selectedRole: UserRole = (roleParam === 'recruiter' ? 'recruiter' : roleParam === 'candidate' ? 'candidate' : null) || 'candidate';
  console.log('RegisterRoute: role param =', role, ', selectedRole =', selectedRole);

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
