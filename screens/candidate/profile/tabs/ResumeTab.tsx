import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useUploadAndParseResumeMutation } from '../../../../services/api';
import Svg, { Path } from 'react-native-svg';

export const ResumeTab: React.FC = () => {
  const [uploadResume, { isLoading }] = useUploadAndParseResumeMutation();

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      const file = result.assets[0];

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size && file.size > maxSize) {
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB.');
        return;
      }

      Alert.alert(
        'Resume Selected',
        `${file.name}\nSize: ${((file.size || 0) / 1024).toFixed(2)} KB\n\nDo you want to upload and parse this resume?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upload', onPress: () => handleUploadResume(file) },
        ]
      );
    } catch (error) {
      console.error('DocumentPicker error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleUploadResume = async (file: DocumentPicker.DocumentPickerAsset) => {
    try {
      console.log('Reading file from path:', file.uri);

      // Read file as base64 using Expo FileSystem
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      console.log('File converted to base64, length:', base64Data.length);

      // Call the mutation
      const result = await uploadResume({
        fileName: file.name,
        fileData: base64Data,
        fileType: file.mimeType || 'application/pdf',
      }).unwrap();

      console.log('Upload result:', result);

      if (result?.uploadAndParseResume?.__typename === 'SuccessType') {
        Alert.alert(
          'Success',
          result.uploadAndParseResume.message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Profile data will be auto-refetched due to invalidatesTags
              },
            },
          ]
        );
      } else if (result?.uploadAndParseResume) {
        Alert.alert('Error', result.uploadAndParseResume.message);
      } else {
        Alert.alert('Error', 'No response received from server. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to upload resume:', error);
      Alert.alert(
        'Upload Failed',
        error?.data?.uploadAndParseResume?.message ||
        error?.message ||
        'Failed to upload and parse resume. Please try again.'
      );
    }
  };

  return (
    <View>
      {/* Instructions Card */}
      <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
        <View className="flex-row items-start mb-2">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="mt-0.5 mr-2">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="#3B82F6"
            />
          </Svg>
          <View className="flex-1">
            <Text className="text-blue-900 font-semibold text-sm mb-1">
              Auto-Fill Your Profile
            </Text>
            <Text className="text-blue-700 text-xs leading-5">
              Upload your resume (PDF only) and we'll automatically extract your skills, experience, and education.
            </Text>
          </View>
        </View>
      </View>

      {/* Current Resume Status */}
      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
        <Text className="text-gray-600 text-sm mb-2">Resume Status</Text>
        <Text className="text-gray-500 text-sm">
          No resume uploaded yet
        </Text>
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        className="bg-primary-blue rounded-xl py-3 items-center flex-row justify-center"
        activeOpacity={0.8}
        onPress={handlePickDocument}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <View className="mr-2">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"
                  fill="#FFFFFF"
                />
              </Svg>
            </View>
            <Text className="text-white text-sm font-semibold">
              {isLoading ? 'Uploading & Parsing...' : 'Upload Resume (PDF)'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Guidelines */}
      <View className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        <Text className="text-gray-700 text-sm font-semibold mb-2">
          For Best Results:
        </Text>
        <View className="space-y-1">
          <View className="flex-row items-start mb-1">
            <Text className="text-gray-600 text-xs mr-2">✓</Text>
            <Text className="text-gray-600 text-xs flex-1">
              Use a standard resume format with clear sections
            </Text>
          </View>
          <View className="flex-row items-start mb-1">
            <Text className="text-gray-600 text-xs mr-2">✓</Text>
            <Text className="text-gray-600 text-xs flex-1">
              Include section headers: Experience, Education, Skills
            </Text>
          </View>
          <View className="flex-row items-start mb-1">
            <Text className="text-gray-600 text-xs mr-2">✓</Text>
            <Text className="text-gray-600 text-xs flex-1">
              File must be PDF format and under 5MB
            </Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-gray-600 text-xs mr-2">✓</Text>
            <Text className="text-gray-600 text-xs flex-1">
              Review and edit the extracted data after upload
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
