import React from 'react';
import { View, Text } from 'react-native';
import { GetCandidateProfileSuccessType } from '../../../../services/api';

interface PersonalInfoTabProps {
  candidateProfile: GetCandidateProfileSuccessType | null;
}

export const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ candidateProfile }) => {
  if (!candidateProfile) {
    return (
      <View className="bg-white rounded-xl p-6 mb-4">
        <Text className="text-gray-500 text-sm text-center">
          No profile data available
        </Text>
      </View>
    );
  }

  const { user } = candidateProfile;

  return (
    <View>
      {/* Basic Information */}
      <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
        <Text className="text-gray-900 font-bold text-lg mb-4">Basic Information</Text>

        <View className="mb-3">
          <Text className="text-gray-600 text-xs mb-1">Full Name</Text>
          <Text className="text-gray-900 text-base">
            {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Not provided'}
          </Text>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 text-xs mb-1">Email</Text>
          <Text className="text-gray-900 text-base">{user.email || 'Not provided'}</Text>
        </View>

        <View className="mb-3">
          <Text className="text-gray-600 text-xs mb-1">Phone Number</Text>
          <Text className="text-gray-900 text-base">{user.phoneNumber || 'Not provided'}</Text>
        </View>

        {user.bio && (
          <View className="mb-3">
            <Text className="text-gray-600 text-xs mb-1">Bio</Text>
            <Text className="text-gray-900 text-base">{user.bio}</Text>
          </View>
        )}
      </View>

      {/* Links & URLs */}
      {(candidateProfile.linkedinUrl || candidateProfile.githubUrl || candidateProfile.portfolioUrl) && (
        <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">Links</Text>

          {candidateProfile.linkedinUrl && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">LinkedIn Profile</Text>
              <Text className="text-primary-blue text-base">{candidateProfile.linkedinUrl}</Text>
            </View>
          )}

          {candidateProfile.githubUrl && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">GitHub Profile</Text>
              <Text className="text-primary-blue text-base">{candidateProfile.githubUrl}</Text>
            </View>
          )}

          {candidateProfile.portfolioUrl && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Portfolio URL</Text>
              <Text className="text-primary-blue text-base">{candidateProfile.portfolioUrl}</Text>
            </View>
          )}
        </View>
      )}

      {/* Preferences */}
      {candidateProfile.preferredLocations && candidateProfile.preferredLocations.length > 0 && (
        <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">Preferences</Text>

          <View className="mb-3">
            <Text className="text-gray-600 text-xs mb-2">Preferred Locations</Text>
            <View className="flex-row flex-wrap gap-2">
              {candidateProfile.preferredLocations.map((location, index) => (
                <View key={index} className="bg-blue-50 border border-primary-blue rounded-full px-3 py-1">
                  <Text className="text-primary-blue text-xs font-medium">{location}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

    </View>
  );
};
