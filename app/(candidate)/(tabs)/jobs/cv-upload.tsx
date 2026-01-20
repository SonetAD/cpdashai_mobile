import React from 'react';
import { useRouter } from 'expo-router';
import { useGetMyProfileQuery } from '../../../../services/api';
import CVUploadScreen from '../../../../screens/candidate/dashboard/CVUploadScreen';

export default function CVUploadRoute() {
  const router = useRouter();
  const { data: profileData } = useGetMyProfileQuery();

  // Get profile picture URL
  const profileImageUrl = profileData?.myProfile?.profilePicture || undefined;

  return (
    <CVUploadScreen
      onBack={() => router.back()}
      onCreateCV={() => router.push('/(candidate)/cv-builder?source=jobs' as any)}
      onEditCV={(resumeId) => router.push({
        pathname: '/(candidate)/cv-builder',
        params: { resumeId, source: 'jobs' },
      } as any)}
      onViewPricing={() => router.push('/(candidate)/subscription/pricing' as any)}
      onNavigateToProfile={() => router.push('/(candidate)/(tabs)/profile/full-profile' as any)}
      onViewAllResumes={() => router.push('/(candidate)/resumes' as any)}
      onSearch={() => {
        // Navigate to search or open search modal
      }}
      onNotifications={() => router.push('/(candidate)/notifications' as any)}
      profileImageUrl={profileImageUrl}
    />
  );
}
