import { useRouter } from 'expo-router';
import SubscriptionSuccessScreen from '../../../screens/candidate/subscription/SubscriptionSuccessScreen';

export default function SubscriptionSuccessRoute() {
  const router = useRouter();

  return (
    <SubscriptionSuccessScreen
      onContinue={() => router.replace('/(candidate)/(tabs)/home' as any)}
    />
  );
}
