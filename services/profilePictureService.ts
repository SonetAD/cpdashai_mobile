import { Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Check if device is a tablet (screen width > 600dp is typically tablet)
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.min(width, height);
  return screenSize >= 600;
};

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

  // On tablets, skip built-in editing as it may not show buttons properly
  // We'll crop the image programmatically instead
  const useBuiltInEditing = !isTablet();

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: useBuiltInEditing,
    aspect: [1, 1],
    quality: 0.8,
    base64: false, // We'll handle base64 in processImage
  });

  if (!result.canceled && result.assets[0]) {
    // If we skipped built-in editing (tablet), crop to square programmatically
    if (!useBuiltInEditing) {
      return await processImageWithCrop(result.assets[0].uri, result.assets[0].type);
    }
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

  // On tablets, skip built-in editing as it may not show buttons properly
  // We'll crop the image programmatically instead
  const useBuiltInEditing = !isTablet();

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: useBuiltInEditing,
    aspect: [1, 1],
    quality: 0.8,
    base64: false, // We'll handle base64 in processImage
  });

  if (!result.canceled && result.assets[0]) {
    // If we skipped built-in editing (tablet), crop to square programmatically
    if (!useBuiltInEditing) {
      return await processImageWithCrop(result.assets[0].uri, 'image');
    }
    return await processImage(result.assets[0].uri, 'image');
  }

  return null;
};

// Process image with automatic center crop to square (for tablets)
const processImageWithCrop = async (uri: string, type?: string | null): Promise<string> => {
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

    // First get original image dimensions
    const originalImage = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1, format }
    );

    const { width, height } = originalImage;

    // Calculate center crop to make it square
    const size = Math.min(width, height);
    const originX = (width - size) / 2;
    const originY = (height - size) / 2;

    // Crop to square from center and resize to standard size
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { crop: { originX, originY, width: size, height: size } },
        { resize: { width: 800, height: 800 } }
      ],
      {
        compress: 0.8,
        format,
        base64: true
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('Failed to convert image to base64');
    }

    // Check size and compress more if needed
    let base64Size = manipulatedImage.base64.length;
    const maxBase64Size = 5242880 * 1.37; // 5MB limit with base64 overhead

    if (base64Size > maxBase64Size) {
      const attempts = [
        { width: 600, height: 600, compress: 0.7 },
        { width: 400, height: 400, compress: 0.6 },
        { width: 300, height: 300, compress: 0.5 }
      ];

      for (const attempt of attempts) {
        manipulatedImage = await ImageManipulator.manipulateAsync(
          uri,
          [
            { crop: { originX, originY, width: size, height: size } },
            { resize: { width: attempt.width, height: attempt.height } }
          ],
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

      if (base64Size > maxBase64Size) {
        throw new Error('Unable to compress image below 5MB limit. Please choose a smaller image.');
      }
    }

    return `data:${mimeType};base64,${manipulatedImage.base64}`;
  } catch (error) {
    console.error('Error processing image with crop:', error);
    throw error;
  }
};

// Process and compress image with size limit
// Note: nginx may have a lower limit than backend (5MB), so we target ~2.5MB max
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

    // Target max size ~2MB to stay well under nginx limits (base64 adds ~33% overhead)
    // 2MB binary = ~2.7MB base64, which is safe for most server configs
    const targetMaxSize = 2 * 1024 * 1024 * 1.37; // ~2.7MB in base64

    // Always resize and compress for profile pictures to ensure fast uploads
    // Start with a reasonable size for profile pictures
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800, height: 800 } }],
      {
        compress: 0.8,
        format,
        base64: true
      }
    );

    if (!manipulatedImage.base64) {
      throw new Error('Failed to convert image to base64');
    }

    // Check size and compress more if needed
    let base64Size = manipulatedImage.base64.length;

    if (base64Size > targetMaxSize) {
      // Try progressively smaller sizes and compression
      const attempts = [
        { width: 600, height: 600, compress: 0.7 },
        { width: 500, height: 500, compress: 0.6 },
        { width: 400, height: 400, compress: 0.5 },
        { width: 300, height: 300, compress: 0.4 }
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
          if (base64Size <= targetMaxSize) {
            break;
          }
        }
      }

      // Final check
      if (base64Size > targetMaxSize) {
        throw new Error('Unable to compress image to a suitable size. Please choose a smaller image.');
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