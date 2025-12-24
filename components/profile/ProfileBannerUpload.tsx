import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  pickImageFromLibrary,
  takePhotoWithCamera,
} from '../../services/profilePictureService';
import {
  useGetMyProfileQuery,
  useUploadCandidateProfileBannerMutation,
  useUploadRecruiterProfileBannerMutation,
} from '../../services/api';
import { useAlert } from '../../contexts/AlertContext';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ProfileBannerUploadProps {
  currentBannerUrl?: string;
  height?: number;
  editable?: boolean;
  onUploadSuccess?: (imageUrl: string) => void;
}

const CameraIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 17a4 4 0 100-8 4 4 0 000 8z"
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EditIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ImageIcon = ({ size = 48 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
      stroke="#9CA3AF"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      fill="#9CA3AF"
    />
    <Path
      d="M21 15l-5-5L5 21"
      stroke="#9CA3AF"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ProfileBannerUpload({
  currentBannerUrl,
  height = 150,
  editable = true,
  onUploadSuccess,
}: ProfileBannerUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role?.toLowerCase();
  const { showAlert } = useAlert();

  // Get profile data
  const { data: profileData, refetch: refetchProfile } = useGetMyProfileQuery();

  // Upload mutations
  const [uploadCandidateBanner] = useUploadCandidateProfileBannerMutation();
  const [uploadRecruiterBanner] = useUploadRecruiterProfileBannerMutation();

  // Get the current banner URL
  const getBannerUrl = () => {
    if (previewImage) return previewImage;
    if (currentBannerUrl) return currentBannerUrl;

    if (profileData?.myProfile) {
      const profile = profileData.myProfile;
      if (profile.__typename === 'CandidateType' || profile.__typename === 'RecruiterType') {
        return profile.profileBanner || null;
      }
    }
    return null;
  };

  const handleImageSelection = async (source: 'camera' | 'gallery') => {
    setShowModal(false);

    try {
      let base64Image: string | null = null;

      if (source === 'camera') {
        base64Image = await takePhotoWithCamera();
        if (base64Image === null) {
          showAlert({
            type: 'error',
            title: 'Camera Permission Required',
            message: 'Please enable camera permissions in your device settings to take photos.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          return;
        }
      } else {
        base64Image = await pickImageFromLibrary();
        if (base64Image === null) {
          showAlert({
            type: 'error',
            title: 'Gallery Permission Required',
            message: 'Please enable photo library permissions in your device settings to select photos.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          return;
        }
      }

      if (base64Image) {
        setPreviewImage(base64Image);
        await uploadBanner(base64Image);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to select image. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const uploadBanner = async (base64Image: string) => {
    setUploading(true);

    try {
      let response: any;
      const timestamp = Date.now();
      const filename = `banner_${timestamp}.jpg`;

      if (userRole === 'candidate') {
        response = await uploadCandidateBanner({
          profileBannerBase64: base64Image,
          filename: filename,
        }).unwrap();
      } else if (userRole === 'recruiter' || userRole === 'talentpartner') {
        response = await uploadRecruiterBanner({
          profileBannerBase64: base64Image,
          filename: filename,
        }).unwrap();
      } else {
        throw new Error('Invalid user role');
      }

      if (response.uploadCandidateProfileBanner?.__typename === 'SuccessType' ||
          response.uploadRecruiterProfileBanner?.__typename === 'SuccessType') {
        const successData = response.uploadCandidateProfileBanner || response.uploadRecruiterProfileBanner;

        let bannerUrl = null;
        if (successData.data) {
          try {
            const parsedData = JSON.parse(successData.data);
            bannerUrl = parsedData.profile_banner_url || parsedData.banner_url;
          } catch (e) {
            console.log('Could not parse banner URL from response');
          }
        }

        showAlert({
          type: 'success',
          title: 'Success!',
          message: successData.message || 'Profile banner updated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        // Safely refetch profile data
        try {
          if (refetchProfile) {
            await refetchProfile();
          }
        } catch (refetchError) {
          console.log('Profile refetch skipped or failed:', refetchError);
        }

        if (bannerUrl && onUploadSuccess) {
          onUploadSuccess(bannerUrl);
        }
      } else {
        const errorData = response.uploadCandidateProfileBanner || response.uploadRecruiterProfileBanner;

        let errorMessage = 'Failed to upload banner';
        if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);

      let alertMessage = error.message || 'Failed to upload banner. Please try again.';

      if (error.message?.includes('5MB')) {
        alertMessage = 'Image is too large. Please choose an image smaller than 5MB.';
      } else if (error.message?.includes('Not authenticated')) {
        alertMessage = 'Your session has expired. Please login again.';
      } else if (error.message?.includes('Invalid file format')) {
        alertMessage = 'Invalid image format. Please use JPG, PNG, GIF or WebP images.';
      }

      showAlert({
        type: 'error',
        title: 'Upload Failed',
        message: alertMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });

      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const bannerUrl = getBannerUrl();

  return (
    <View style={[styles.container, { height }]}>
      <TouchableOpacity
        onPress={() => editable && setShowModal(true)}
        activeOpacity={editable ? 0.8 : 1}
        disabled={!editable}
        style={styles.bannerContainer}
      >
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <ImageIcon size={48} />
            {editable && (
              <Text style={styles.placeholderText}>Add Cover Photo</Text>
            )}
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadingContent}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          </View>
        )}

        {editable && !uploading && (
          <View style={styles.editButton}>
            <EditIcon size={16} />
            <Text style={styles.editButtonText}>
              {bannerUrl ? 'Change' : 'Add'} Cover
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Cover Photo</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImageSelection('camera')}
            >
              <CameraIcon size={24} />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => handleImageSelection('gallery')}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                />
                <Path
                  d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                  fill="#437EF4"
                />
                <Path
                  d="M21 15l-5-5L5 21"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {bannerUrl && (
              <TouchableOpacity
                style={[styles.modalOption, styles.removeOption]}
                onPress={() => {
                  setShowModal(false);
                  showAlert({
                    type: 'confirm',
                    title: 'Remove Banner',
                    message: 'Are you sure you want to remove your banner?',
                    buttons: [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                          setPreviewImage(null);
                        },
                      },
                    ],
                  });
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.modalOptionText, styles.removeText]}>
                  Remove Banner
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  bannerContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContent: {
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(67, 126, 244, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeOption: {
    backgroundColor: '#FEF2F2',
  },
  removeText: {
    color: '#EF4444',
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
