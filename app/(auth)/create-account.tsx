import { useRouter } from 'expo-router';
import CreateAccountScreen from '../../screens/auth/CreateAccountScreen';

type UserRole = 'candidate' | 'recruiter' | null;

export default function CreateAccountRoute() {
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    // Navigate to register with role parameter
    router.push({
      pathname: '/(auth)/register',
      params: { role: role || 'candidate' },
    });
  };

  return <CreateAccountScreen onRoleSelect={handleRoleSelect} />;
}
