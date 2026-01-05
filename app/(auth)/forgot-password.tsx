import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../../screens/auth/ForgotPasswordScreen';

export default function ForgotPasswordRoute() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return <ForgotPasswordScreen onBack={handleBack} />;
}
