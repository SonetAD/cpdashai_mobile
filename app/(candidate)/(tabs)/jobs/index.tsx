import React from 'react';
import { useRouter } from 'expo-router';
import JobsScreen from '../../../../screens/candidate/dashboard/JobsScreen';

export default function JobsRoute() {
  const router = useRouter();

  return (
    <JobsScreen
      onJobPress={(jobId) => router.push(`/(candidate)/(tabs)/jobs/${jobId}` as any)}
      onApplicationTrackerPress={() => router.push('/(candidate)/(tabs)/jobs/application-tracker' as any)}
      onNotificationPress={() => router.push('/(candidate)/notifications' as any)}
      onProfilePress={() => router.push('/(candidate)/(tabs)/profile' as any)}
    />
  );
}
