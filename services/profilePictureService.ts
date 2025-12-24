import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Type definitions for profile picture operations
export interface ProfilePictureUploadInput {
  profilePictureBase64: string;
}

// Type definitions for profile banner operations
export interface ProfileBannerUploadInput {
  profileBannerBase64: string;
  filename: string;
}

export interface ProfileSuccessType {
  __typename: 'SuccessType';
  data?: string;
  message: string;
}

export interface ProfileErrorType {
  __typename: 'ErrorType';
  message: string;
}

export interface MyProfileQuery {
  myProfile: CandidateProfileType | RecruiterProfileType;
}

export interface CandidateProfileType {
  __typename: 'CandidateType';
  id: string;
  profilePicture?: string;
  profileBanner?: string;
}

export interface RecruiterProfileType {
  __typename: 'RecruiterType';
  id: string;
  profilePicture?: string;
  profileBanner?: string;
}

// GraphQL Queries and Mutations
export const MY_PROFILE_QUERY = `
  query MyProfile {
    myProfile {
      ... on CandidateType {
        id
        profilePicture
        profileBanner
      }
      ... on RecruiterType {
        id
        profilePicture
        profileBanner
      }
    }
  }
`;

export const UPLOAD_CANDIDATE_PROFILE_PICTURE = `
  mutation UploadCandidateProfilePicture($input: UploadProfilePictureInput!) {
    uploadCandidateProfilePicture(input: $input) {
      ... on SuccessType {
        data
        message
      }
      ... on ErrorType {
        __typename
        message
      }
    }
  }
`;

export const UPLOAD_RECRUITER_PROFILE_PICTURE = `
  mutation UploadRecruiterProfilePicture($input: UploadProfilePictureInput!) {
    uploadRecruiterProfilePicture(input: $input) {
      ... on SuccessType {
        data
        message
      }
      ... on ErrorType {
        __typename
        message
      }
    }
  }
`;

export const UPLOAD_CANDIDATE_PROFILE_BANNER = `
  mutation UploadCandidateProfileBanner($input: UploadProfileBannerInput!) {
    uploadCandidateProfileBanner(input: $input) {
      ... on SuccessType {
        data
        message
      }
      ... on ErrorType {
        __typename
        message
      }
    }
  }
`;

export const UPLOAD_RECRUITER_PROFILE_BANNER = `
  mutation UploadRecruiterProfileBanner($input: UploadProfileBannerInput!) {
    uploadRecruiterProfileBanner(input: $input) {
      ... on SuccessType {
        data
        message
      }
      ... on ErrorType {
        __typename
        message
      }
    }
  }
`;

// Image picker configuration
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return true;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

export const pickImageFromLibrary = async (): Promise<string | null> => {
  const hasPermission = await requestMediaLibraryPermissions();

  if (!hasPermission) {
    // Return null without alert - let the component handle the error
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: false, // We'll handle base64 in processImage
  });

  if (!result.canceled && result.assets[0]) {
    return await processImage(result.assets[0].uri, result.assets[0].type);
  }

  return null;
};

export const takePhotoWithCamera = async (): Promise<string | null> => {
  const hasPermission = await requestCameraPermissions();

  if (!hasPermission) {
    // Return null without alert - let the component handle the error
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: false, // We'll handle base64 in processImage
  });

  if (!result.canceled && result.assets[0]) {
    return await processImage(result.assets[0].uri, 'image');
  }

  return null;
};

// Process and compress image with 5MB size limit
const processImage = async (uri: string, type?: string | null): Promise<string> => {
  try {
    // Determine the format based on the URI or type
    let format = ImageManipulator.SaveFormat.JPEG;
    let mimeType = 'image/jpeg';

    if (type === 'png' || uri.toLowerCase().includes('.png')) {
      format = ImageManipulator.SaveFormat.PNG;
      mimeType = 'image/png';
    } else if (uri.toLowerCase().includes('.webp')) {
      format = ImageManipulator.SaveFormat.WEBP;
      mimeType = 'image/webp';
    }

    // First, get the original image to check its size
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: 1,
        format,
        base64: true
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('Failed to convert image to base64');
    }

    // Calculate base64 size (approximately 4/3 * original binary size)
    let base64Size = manipulatedImage.base64.length;
    const maxBase64Size = 5242880 * 1.37; // 5MB limit with base64 overhead

    // If image is too large, resize and compress
    if (base64Size > maxBase64Size) {
      // Try progressively smaller sizes and compression
      const attempts = [
        { width: 1024, height: 1024, compress: 0.8 },
        { width: 800, height: 800, compress: 0.7 },
        { width: 600, height: 600, compress: 0.6 },
        { width: 400, height: 400, compress: 0.5 }
      ];

      for (const attempt of attempts) {
        manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: attempt.width, height: attempt.height } }],
          {
            compress: attempt.compress,
            format,
            base64: true
          }
        );

        if (manipulatedImage.base64) {
          base64Size = manipulatedImage.base64.length;
          if (base64Size <= maxBase64Size) {
            break;
          }
        }
      }

      // Final check
      if (base64Size > maxBase64Size) {
        throw new Error('Unable to compress image below 5MB limit. Please choose a smaller image.');
      }
    }

    // Return base64 string with proper MIME type prefix
    return `data:${mimeType};base64,${manipulatedImage.base64}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Helper function to extract base64 from data URI
export const extractBase64FromDataURI = (dataURI: string): string => {
  const base64Match = dataURI.match(/^data:image\/[a-z]+;base64,(.+)$/i);
  return base64Match ? base64Match[1] : dataURI;
};

// Profile picture action sheet options
export interface ProfilePictureOption {
  label: string;
  icon: string;
  action: () => Promise<string | null>;
}

export const getProfilePictureOptions = (): ProfilePictureOption[] => [
  {
    label: 'Take Photo',
    icon: '📷',
    action: takePhotoWithCamera,
  },
  {
    label: 'Choose from Gallery',
    icon: '🖼️',
    action: pickImageFromLibrary,
  },
];