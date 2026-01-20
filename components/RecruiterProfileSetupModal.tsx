import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useCompleteRecruiterProfileMutation } from '../services/api';
import { useAlert } from '../contexts/AlertContext';

interface RecruiterProfileSetupModalProps {
  visible: boolean;
  onComplete: () => void;
  onCancel?: () => void;
  userEmail?: string;
  userName?: string;
  userPhotoUrl?: string;
}

// Sub-role options based on organization type
const subRoleOptions: Record<string, { label: string; value: string }[]> = {
  employer: [
    { label: 'Company', value: 'company' },
    { label: 'Recruiter', value: 'recruiter' },
    { label: 'HR Team', value: 'hr_team' },
  ],
  university: [
    { label: 'College', value: 'college' },
    { label: 'University', value: 'university' },
    { label: 'Skill Bootcamp', value: 'bootcamp' },
    { label: 'Training Center', value: 'training_center' },
  ],
  agency: [
    { label: 'Staffing Agency', value: 'staffing_agency' },
    { label: 'Career Service', value: 'career_service' },
    { label: 'Placement Department', value: 'placement_dept' },
  ],
};

const organizationTypes = [
  { label: 'Employer', value: 'employer' },
  { label: 'University', value: 'university' },
  { label: 'Agency', value: 'agency' },
];

export default function RecruiterProfileSetupModal({
  visible,
  onComplete,
  onCancel,
  userEmail,
  userName,
  userPhotoUrl,
}: RecruiterProfileSetupModalProps) {
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<'employer' | 'university' | 'agency' | ''>('');
  const [subRole, setSubRole] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [position, setPosition] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [completeProfile, { isLoading }] = useCompleteRecruiterProfileMutation();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }

    if (!organizationType) {
      newErrors.organizationType = 'Please select organization type';
    }

    if (!subRole) {
      newErrors.subRole = 'Please select your role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Build error message for missing required fields
      const missingFields: string[] = [];
      if (!organizationName.trim()) {
        missingFields.push('Organization Name');
      }
      if (!organizationType) {
        missingFields.push('Organization Type');
      }
      if (!subRole) {
        missingFields.push('Your Role');
      }

      // Show error popup
      showAlert({
        type: 'error',
        title: 'Required Fields Missing',
        message: `Please fill in the following required fields:\n\n${missingFields.map(field => `• ${field}`).join('\n')}`,
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const input: any = {
        organizationName: organizationName.trim(),
        organizationType: organizationType as 'employer' | 'university' | 'agency',
        subRole,
      };

      // Only add optional fields if they have values
      if (linkedinUrl.trim()) {
        input.linkedinUrl = linkedinUrl.trim();
      }
      if (position.trim()) {
        input.position = position.trim();
      }

      console.log('Sending completeRecruiterProfile with input:', input);

      const result = await completeProfile(input).unwrap();

      console.log('Profile completion result:', result);

      // Check for success response (CompleteRecruiterProfileSuccessType)
      if (result?.completeRecruiterProfile?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete();
      } else if (result?.completeRecruiterProfile?.__typename === 'ErrorType') {
        const errorMessage = result.completeRecruiterProfile?.message || 'Failed to complete profile';
        setErrors({ submit: errorMessage });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        // Fallback error
        const errorMsg = result?.completeRecruiterProfile?.message || 'Failed to complete profile. Please try again.';
        setErrors({ submit: errorMsg });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      // Extract meaningful error message
      let errorMessage = 'An error occurred. Please try again.';
      if (error?.data?.completeRecruiterProfile?.message) {
        errorMessage = error.data.completeRecruiterProfile.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setErrors({ submit: errorMessage });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleOrganizationTypeSelect = (type: 'employer' | 'university' | 'agency') => {
    Haptics.selectionAsync();
    setOrganizationType(type);
    setSubRole(''); // Reset sub role when org type changes
    setErrors((prev) => ({ ...prev, organizationType: '', subRole: '' }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        {/* Header */}
        <LinearGradient
          colors={['#437EF4', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="pt-12 pb-6 px-6"
        >
          <View className="flex-row items-center justify-between">
            {onCancel && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCancel();
                }}
                className="p-2"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            )}
            <View className="flex-1" />
          </View>

          <View className="items-center mt-4">
            {userPhotoUrl ? (
              <Image
                source={{ uri: userPhotoUrl }}
                className="w-20 h-20 rounded-full mb-4"
                style={{ borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }}
              />
            ) : (
              <View className="bg-white/20 rounded-full p-4 mb-4">
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle cx={12} cy={7} r={4} stroke="white" strokeWidth={2} />
                </Svg>
              </View>
            )}
            <Text className="text-white text-2xl font-bold text-center">
              Complete Your Profile
            </Text>
            <Text className="text-white/90 text-sm text-center mt-2">
              {userName ? `Welcome, ${userName}!` : 'Welcome!'} Just a few more details to get started.
            </Text>
            {userEmail && (
              <Text className="text-white/70 text-xs text-center mt-1">
                {userEmail}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Form */}
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Organization Name */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Organization Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={organizationName}
              onChangeText={(text) => {
                setOrganizationName(text);
                setErrors((prev) => ({ ...prev, organizationName: '' }));
              }}
              placeholder="Enter your organization name"
              placeholderTextColor="#9CA3AF"
              className={`bg-white border ${errors.organizationName ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3.5 text-gray-900`}
              onFocus={() => Haptics.selectionAsync()}
            />
            {errors.organizationName && (
              <Text className="text-red-500 text-xs mt-1">{errors.organizationName}</Text>
            )}
          </View>

          {/* Organization Type */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Organization Type <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row gap-2">
              {organizationTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => handleOrganizationTypeSelect(type.value as 'employer' | 'university' | 'agency')}
                  className={`flex-1 py-3 rounded-xl border ${
                    organizationType === type.value
                      ? 'bg-primary-blue border-primary-blue'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      organizationType === type.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.organizationType && (
              <Text className="text-red-500 text-xs mt-1">{errors.organizationType}</Text>
            )}
          </View>

          {/* Sub Role */}
          {organizationType && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">
                Your Role <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {subRoleOptions[organizationType]?.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSubRole(role.value);
                      setErrors((prev) => ({ ...prev, subRole: '' }));
                    }}
                    className={`px-4 py-2.5 rounded-full border ${
                      subRole === role.value
                        ? 'bg-primary-blue border-primary-blue'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        subRole === role.value ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.subRole && (
                <Text className="text-red-500 text-xs mt-1">{errors.subRole}</Text>
              )}
            </View>
          )}

          {/* LinkedIn URL (Optional) */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              LinkedIn Profile <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <TextInput
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="https://linkedin.com/in/yourprofile"
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
              autoCapitalize="none"
              keyboardType="url"
              onFocus={() => Haptics.selectionAsync()}
            />
          </View>

          {/* Position/Job Title (Optional) */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">
              Job Title <Text className="text-gray-400">(Optional)</Text>
            </Text>
            <TextInput
              value={position}
              onChangeText={setPosition}
              placeholder="e.g., Senior Recruiter, HR Manager"
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900"
              autoCapitalize="words"
              onFocus={() => Haptics.selectionAsync()}
            />
          </View>

          {/* Error Message */}
          {errors.submit && (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <Text className="text-red-700 text-sm text-center">{errors.submit}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`rounded-xl py-4 ${isLoading ? 'opacity-50' : ''}`}
            activeOpacity={0.8}
            style={{ marginBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            <LinearGradient
              colors={['#437EF4', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl py-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-bold text-base">
                  Complete Setup
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
