import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CandidateDetailRoute() {
  const router = useRouter();
  const { candidateId } = useLocalSearchParams<{ candidateId: string }>();

  // For now, redirect back to talent screen since candidate details
  // are handled internally by TalentScreen
  useEffect(() => {
    router.replace('/(recruiter)/(tabs)/talent' as any);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
      <ActivityIndicator size="large" color="#437EF4" />
      <Text className="text-gray-500 mt-4">Loading candidate {candidateId}...</Text>
    </SafeAreaView>
  );
}
