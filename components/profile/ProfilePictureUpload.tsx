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
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  pickImageFromLibrary,
  takePhotoWithCamera,
  extractBase64FromDataURI,
} from '../../services/profilePictureService';
import {
  useGetMyProfileQuery,
  useUploadCandidateProfilePictureMutation,
  useUploadRecruiterProfilePictureMutation,
  useDeleteCandidateProfilePictureMutation,
  useDeleteRecruiterProfilePictureMutation,
} from '../../services/api';
import { useAlert } from '../../contexts/AlertContext';
import Svg, { Path, Circle } from 'react-native-svg';
import DefaultAvatar from '../../assets/images/default.svg';

interface ProfilePictureUploadProps {
  currentPictureUrl?: string;
  initials?: string;
  size?: number;
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
    <Circle cx="12" cy="13" r="4" stroke="#FFFFFF" strokeWidth={1.5} />
  </Svg>
);

const EditIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function ProfilePictureUpload({
  currentPictureUrl,
  initials = 'U',
  size = 80,
  editable = true,
  onUploadSuccess,
}: ProfilePictureUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user);
  const userRole = user?.role?.toLowerCase();
  const { showAlert } = useAlert();

  // Get profile data
  const { data: profileData, refetch: refetchProfile } = useGetMyProfileQuery();

  // Upload mutations
  const [uploadCandidateProfilePicture] = useUploadCandidateProfilePictureMutation();
  const [uploadRecruiterProfilePicture] = useUploadRecruiterProfilePictureMutation();

  // Delete mutations
  const [deleteCandidateProfilePicture] = useDeleteCandidateProfilePictureMutation();
  const [deleteRecruiterProfilePicture] = useDeleteRecruiterProfilePictureMutation();

  // Get the current profile picture URL
  const getProfilePictureUrl = () => {
    if (previewImage) return previewImage;
    if (currentPictureUrl) return currentPictureUrl;

    if (profileData?.myProfile) {
      const profile = profileData.myProfile;
      if (profile.__typename === 'CandidateType' || profile.__typename === 'RecruiterType') {
        return profile.profilePicture || null;
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
        await uploadProfilePicture(base64Image);
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

  const uploadProfilePicture = async (base64Image: string) => {
    setUploading(true);

    try {
      // Send the full data URI (with prefix) as the backend accepts both formats
      // The backend handles data:image/jpeg;base64,... format
      let response: any;

      if (userRole === 'candidate') {
        response = await uploadCandidateProfilePicture({
          profilePictureBase64: base64Image, // Send full data URI
        }).unwrap();
      } else if (userRole === 'recruiter' || userRole === 'talentpartner') {
        response = await uploadRecruiterProfilePicture({
          profilePictureBase64: base64Image, // Send full data URI
        }).unwrap();
      } else {
        throw new Error('Invalid user role');
      }

      if (response.uploadCandidateProfilePicture?.__typename === 'SuccessType' ||
          response.uploadRecruiterProfilePicture?.__typename === 'SuccessType') {
        const successData = response.uploadCandidateProfilePicture || response.uploadRecruiterProfilePicture;

        // Parse the data field which contains the profile picture URL as JSON
        let profilePictureUrl = null;
        if (successData.data) {
          try {
            const parsedData = JSON.parse(successData.data);
            profilePictureUrl = parsedData.profile_picture_url;
          } catch (e) {
            console.log('Could not parse profile picture URL from response');
          }
        }

        showAlert({
          type: 'success',
          title: 'Success!',
          message: successData.message || 'Profile picture updated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        // Safely refetch profile to get updated picture URL
        try {
          if (refetchProfile) {
            await refetchProfile();
          }
        } catch (refetchError) {
          console.log('Profile refetch skipped or failed:', refetchError);
        }

        // Call success callback with the new image URL if available
        if (profilePictureUrl && onUploadSuccess) {
          onUploadSuccess(profilePictureUrl);
        }
      } else {
        const errorData = response.uploadCandidateProfilePicture || response.uploadRecruiterProfilePicture;

        // Handle error response with proper error messages
        let errorMessage = 'Failed to upload profile picture';
        if (errorData?.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors[0].message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);

      // Provide user-friendly error messages
      let alertMessage = error.message || 'Failed to upload profile picture. Please try again.';

      // Handle specific error cases
      if (error.message?.includes('5MB')) {
        alertMessage = 'Image is too large. Please choose an image smaller than 5MB.';
      } else if (error.message?.includes('Not authenticated')) {
        alertMessage = 'Your session has expired. Please login again.';
      } else if (error.message?.includes('Invalid file format')) {
        alertMessage = 'Invalid image format. Please use JPG, PNG, GIF or WebP images.';
      } else if (error.originalStatus === 413 || error.message?.includes('413') || error.message?.includes('Entity Too Large')) {
        alertMessage = 'Image is too large. Please choose a smaller image (under 3MB recommended).';
      } else if (error.status === 'PARSING_ERROR' && error.originalStatus === 413) {
        alertMessage = 'Image is too large. Please choose a smaller image (under 3MB recommended).';
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

  const profilePictureUrl = getProfilePictureUrl();

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => editable && setShowModal(true)}
          disabled={!editable || uploading}
          activeOpacity={0.8}
        >
          <View style={[styles.avatarContainer, { width: size, height: size }]}>
            {profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={[styles.avatar, { width: size, height: size }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.initialsContainer, { width: size, height: size }]}>
                <DefaultAvatar width={size} height={size} />
              </View>
            )}

            {uploading && (
              <View style={[styles.uploadingOverlay, { width: size, height: size }]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {editable && !uploading && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <CameraIcon size={14} />
          </TouchableOpacity>
        )}
      </View>

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
            <Text style={styles.modalTitle}>Choose Profile Picture</Text>

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
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 12l2.03 2.71L14 11l4 5H6l3-4z"
                  fill="#437EF4"
                />
              </Svg>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {profilePictureUrl && (
              <TouchableOpacity
                style={[styles.modalOption, styles.removeOption]}
                onPress={() => {
                  setShowModal(false);
                  showAlert({
                    type: 'confirm',
                    title: 'Remove Picture',
                    message: 'Are you sure you want to remove your profile picture?',
                    buttons: [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            setUploading(true);
                            let response: any;

                            if (userRole === 'candidate') {
                              response = await deleteCandidateProfilePicture().unwrap();
                            } else if (userRole === 'recruiter' || userRole === 'talentpartner') {
                              response = await deleteRecruiterProfilePicture().unwrap();
                            }

                            const result = response?.deleteCandidateProfilePicture || response?.deleteRecruiterProfilePicture;

                            if (result?.__typename === 'SuccessType') {
                              setPreviewImage(null);
                              showAlert({
                                type: 'success',
                                title: 'Success',
                                message: result.message || 'Profile picture removed successfully',
                                buttons: [{ text: 'OK', style: 'default' }],
                              });
                              // Refetch profile to update UI
                              if (refetchProfile) {
                                await refetchProfile();
                              }
                            } else {
                              throw new Error(result?.message || 'Failed to remove profile picture');
                            }
                          } catch (error: any) {
                            console.error('Error deleting profile picture:', error);
                            showAlert({
                              type: 'error',
                              title: 'Error',
                              message: error.message || 'Failed to remove profile picture. Please try again.',
                              buttons: [{ text: 'OK', style: 'default' }],
                            });
                          } finally {
                            setUploading(false);
                          }
                        },
                      },
                    ],
                  });
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                    stroke="#DC2626"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.modalOptionText, styles.removeText]}>
                  Remove Picture
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatarContainer: {
    position: 'relative',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  avatar: {
    borderRadius: 9999,
  },
  initialsContainer: {
    backgroundColor: '#437EF4',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#437EF4',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 15,
    fontWeight: '500',
  },
  removeOption: {
    backgroundColor: '#FEE2E2',
  },
  removeText: {
    color: '#DC2626',
  },
  modalCancel: {
    paddingVertical: 15,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});