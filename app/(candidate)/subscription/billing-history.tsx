import { useRouter } from 'expo-router';
import BillingHistoryScreen from '../../../screens/candidate/subscription/BillingHistoryScreen';

export default function BillingHistoryRoute() {
  const router = useRouter();

  return (
    <BillingHistoryScreen
      onBack={() => router.replace('/(candidate)/(tabs)/profile/settings' as any)}
    />
  );
}
