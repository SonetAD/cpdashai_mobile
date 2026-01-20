import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import SubscriptionHardgateScreen from '../../screens/auth/SubscriptionHardgateScreen';

export default function SubscriptionGate() {
  const router = useRouter();

  // Prevent hardware back button from going back to login
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return true to prevent default back behavior
      // User must complete subscription or explicitly log out
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleSubscriptionComplete = () => {
    router.replace('/(auth)/profile-setup');
  };

  const handleViewMorePlans = () => {
    // Navigate to full pricing screen with onboarding context
    router.push('/(candidate)/subscription/pricing?fromOnboarding=true');
  };

  return (
    <SubscriptionHardgateScreen
      onSubscriptionComplete={handleSubscriptionComplete}
      onViewMorePlans={handleViewMorePlans}
    />
  );
}
