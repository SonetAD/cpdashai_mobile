import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { readFileAsBase64, isFileSizeValid } from '../../../../utils/fileHelpers';
import { useGetCandidateProfileQuery, useAddCertificationMutation, useDeleteCertificationMutation, useUpdateCertificationMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { GlassDatePicker, DatePickerTrigger } from '../../../../components/ui/GlassDatePicker';
import { KeyboardAwareFormModal, FormInputGroup } from '../../../../components/ui/KeyboardAwareFormModal';
import { GlassButton } from '../../../../components/ui/GlassButton';
import Svg, { Path, Rect } from 'react-native-svg';
import type { Certification } from '../../../../services/api';

interface CertificatesTabProps {
  onAddCertificate?: () => void;
  onEditCertificate?: (certification: Certification) => void;
  onDeleteCertificate?: (certification: Certification) => void;
}

const PlusIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CertificateIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="14" rx="2" stroke="#437EF4" strokeWidth={2} />
    <Path d="M16 2L16 7" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
    <Path d="M8 2L8 7" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 11L12 17" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
    <Path d="M9 14H15" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const FileIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke="#6B7280"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2v6h6M10 9H8M16 13H8M16 17H8" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const LinkIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Edit/Delete Icons
const EditIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DeleteIcon = ({ size = 16 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="#EF4444"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function CertificatesTab({
  onAddCertificate,
  onEditCertificate,
  onDeleteCertificate,
}: CertificatesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certification | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; base64: string } | null>(null);
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    issuingOrganization: '',
    credentialId: '',
    credentialUrl: '',
    description: '',
    issueDate: new Date(),
    expiryDate: null as Date | null,
    hasExpiry: false,
  });

  const { data: profileData, isLoading: profileLoading, refetch } = useGetCandidateProfileQuery();
  const [addCertification] = useAddCertificationMutation();
  const [deleteCertification] = useDeleteCertificationMutation();
  const [updateCertification] = useUpdateCertificationMutation();
  const { showAlert } = useAlert();

  // Auth check
  const authToken = useSelector((state: any) => state.auth?.token);

  // Responsive dimensions
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 360;
  const isMediumScreen = screenWidth < 400;

  // Responsive card styles
  const responsiveCardStyles = useMemo(() => ({
    iconBadgeOuter: {
      width: isSmallScreen ? 40 : isMediumScreen ? 46 : 52,
      height: isSmallScreen ? 40 : isMediumScreen ? 46 : 52,
      borderRadius: isSmallScreen ? 12 : 16,
      marginRight: isSmallScreen ? 8 : 12,
    },
    iconBadge: {
      width: isSmallScreen ? 36 : isMediumScreen ? 42 : 48,
      height: isSmallScreen ? 36 : isMediumScreen ? 42 : 48,
      borderRadius: isSmallScreen ? 10 : 14,
    },
    certName: {
      fontSize: isSmallScreen ? 14 : isMediumScreen ? 15 : 17,
      lineHeight: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    },
    certOrg: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
    },
    actionButton: {
      width: isSmallScreen ? 30 : isMediumScreen ? 33 : 36,
      height: isSmallScreen ? 30 : isMediumScreen ? 33 : 36,
      borderRadius: isSmallScreen ? 8 : 10,
    },
    actionsContainer: {
      gap: isSmallScreen ? 4 : 8,
    },
    cardPadding: {
      padding: isSmallScreen ? 12 : isMediumScreen ? 14 : 16,
    },
    metaBadge: {
      paddingHorizontal: isSmallScreen ? 8 : 12,
      paddingVertical: isSmallScreen ? 6 : 8,
    },
    metaText: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    description: {
      fontSize: isSmallScreen ? 12 : isMediumScreen ? 13 : 14,
      lineHeight: isSmallScreen ? 17 : isMediumScreen ? 18 : 20,
      padding: isSmallScreen ? 8 : 10,
    },
    credentialText: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    expiryText: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    linkText: {
      fontSize: isSmallScreen ? 10 : isMediumScreen ? 11 : 12,
    },
    pdfBadge: {
      paddingHorizontal: isSmallScreen ? 6 : 10,
      paddingVertical: isSmallScreen ? 6 : 8,
    },
  }), [isSmallScreen, isMediumScreen]);

  // Responsive icon sizes
  const iconSizes = useMemo(() => ({
    certificate: isSmallScreen ? 18 : isMediumScreen ? 20 : 24,
    action: isSmallScreen ? 14 : 16,
  }), [isSmallScreen, isMediumScreen]);

  // Parse certifications from profile data
  const certifications: Certification[] = React.useMemo(() => {
    console.log('=== CERTIFICATES FETCH DEBUG ===');
    console.log('Profile Data:', profileData);
    console.log('Candidate Data:', profileData?.myProfile);
    console.log('Certifications Raw:', profileData?.myProfile?.certifications);

    if (!profileData?.myProfile?.certifications) {
      console.log('No certifications found in profile data');
      return [];
    }

    const certs = profileData.myProfile.certifications;
    console.log('Certifications Type:', typeof certs);
    console.log('Is Array:', Array.isArray(certs));
    console.log('Certifications Value:', certs);

    if (Array.isArray(certs)) {
      // Map snake_case fields from API to camelCase for TypeScript
      const mappedCerts = certs.map((cert: any) => {
        console.log('Mapping certificate:', cert);
        const mapped = {
          id: cert.id,
          name: cert.name,
          issuingOrganization: cert.issuing_organization || cert.issuingOrganization,
          credentialId: cert.credential_id || cert.credentialId,
          credentialUrl: cert.credential_url || cert.credentialUrl,
          description: cert.description,
          issueDate: cert.issue_date || cert.issueDate,
          expiryDate: cert.expiry_date || cert.expiryDate,
          certificatePdfUrl: cert.certificate_pdf_url || cert.certificatePdfUrl,
        };
        console.log('Mapped certificate:', mapped);
        return mapped;
      });
      console.log('Returning mapped certifications with length:', mappedCerts.length);
      return mappedCerts;
    }
    console.log('Certifications not an array, returning empty array');
    return [];
  }, [profileData]);

  const resetForm = () => {
    setFormData({
      name: '',
      issuingOrganization: '',
      credentialId: '',
      credentialUrl: '',
      description: '',
      issueDate: new Date(),
      expiryDate: null,
      hasExpiry: false,
    });
    setSelectedPdf(null);
  };

  const handleSelectPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];

        // Check file size (max 5MB)
        if (file.size && !isFileSizeValid(file.size, 5)) {
          showAlert({
            type: 'error',
            title: 'File Too Large',
            message: 'Certificate file must be less than 5MB',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          return;
        }

        try {
          // Read file as base64 using our helper function
          const base64Data = await readFileAsBase64(file.uri, 'application/pdf');

          setSelectedPdf({
            name: file.name,
            base64: base64Data,
          });

          showAlert({
            type: 'success',
            title: 'File Selected',
            message: `${file.name} has been selected successfully`,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } catch (readError) {
          console.error('Error reading file:', readError);

          showAlert({
            type: 'error',
            title: 'PDF Read Error',
            message: 'Failed to read the PDF file. Please try selecting the file again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });

          // Clear the selected PDF since we couldn't read it
          setSelectedPdf(null);
        }
      }
    } catch (error) {
      console.error('Error selecting PDF:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to select certificate file. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleAddCertification = async () => {
    // Auth check before API call
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Validate required fields
    if (!formData.name.trim() || !formData.issuingOrganization.trim()) {
      showAlert({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in the certificate name and issuing organization.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    setIsLoading(true);

    try {
      // Log to debug PDF upload
      console.log('Selected PDF:', selectedPdf ? { name: selectedPdf.name, hasBase64: !!selectedPdf.base64, base64Length: selectedPdf.base64?.length } : 'No PDF selected');

      const input = {
        certification: {
          name: formData.name.trim(),
          issuingOrganization: formData.issuingOrganization.trim(),
          certificatePdfBase64: selectedPdf?.base64 && selectedPdf.base64 !== '' ? selectedPdf.base64 : undefined,
          credentialId: formData.credentialId.trim() || undefined,
          credentialUrl: formData.credentialUrl.trim() || undefined,
          description: formData.description.trim() || undefined,
          issueDate: formData.issueDate.toISOString().split('T')[0],
          expiryDate: formData.hasExpiry && formData.expiryDate
            ? formData.expiryDate.toISOString().split('T')[0]
            : undefined,
        },
      };

      console.log('Sending input with PDF base64:', input.certification.certificatePdfBase64 ? 'Present' : 'Not present');

      const response = await addCertification(input).unwrap();
      console.log('Add Certification Response:', response);

      if (response.addCertification.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Certificate added successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        // Refresh profile data
        console.log('Refetching profile data after successful add...');
        await refetch();
        console.log('Profile data refetch complete');

        // Close modal and reset form
        setShowAddModal(false);
        resetForm();

        if (onAddCertificate) {
          onAddCertificate();
        }
      } else {
        throw new Error(response.addCertification.message || 'Failed to add certificate');
      }
    } catch (error: any) {
      console.error('Error adding certificate:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add certificate. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit Certificate
  const handleEditCertificate = (cert: Certification, index: number) => {
    setEditingCertificate(cert);
    setEditingIndex(index);
    setFormData({
      name: cert.name || '',
      issuingOrganization: cert.issuingOrganization || '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
      description: cert.description || '',
      issueDate: cert.issueDate ? new Date(cert.issueDate) : new Date(),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
      hasExpiry: !!cert.expiryDate,
    });
    setShowEditModal(true);
  };

  // Handle Update Certificate
  const handleUpdateCertification = async () => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (!formData.name.trim() || !formData.issuingOrganization.trim()) {
      showAlert({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in the certificate name and issuing organization.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (editingIndex === null) return;

    setIsLoading(true);

    try {
      const input = {
        index: editingIndex,
        certification: {
          name: formData.name.trim(),
          issuingOrganization: formData.issuingOrganization.trim(),
          certificatePdfBase64: selectedPdf?.base64 || undefined,
          credentialId: formData.credentialId.trim() || undefined,
          credentialUrl: formData.credentialUrl.trim() || undefined,
          description: formData.description.trim() || undefined,
          issueDate: formData.issueDate.toISOString().split('T')[0],
          expiryDate: formData.hasExpiry && formData.expiryDate
            ? formData.expiryDate.toISOString().split('T')[0]
            : undefined,
        },
      };

      const response = await updateCertification(input).unwrap();

      if (response.updateCertification.__typename === 'SuccessType') {
        showAlert({
          type: 'success',
          title: 'Success!',
          message: 'Certificate updated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        await refetch();
        setShowEditModal(false);
        resetForm();
        setEditingCertificate(null);
        setEditingIndex(null);

        if (onEditCertificate && editingCertificate) {
          onEditCertificate(editingCertificate);
        }
      } else {
        throw new Error(response.updateCertification.message || 'Failed to update certificate');
      }
    } catch (error: any) {
      console.error('Error updating certificate:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update certificate. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete Certificate
  const handleDeleteCertificate = (cert: Certification, index: number) => {
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Please log in again to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Delete Certificate',
      message: `Are you sure you want to delete "${cert.name}"? This action cannot be undone.`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteCertification({ index }).unwrap();

              if (response.deleteCertification.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: 'Certificate deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });

                await refetch();

                if (onDeleteCertificate) {
                  onDeleteCertificate(cert);
                }
              } else {
                throw new Error(response.deleteCertification.message || 'Failed to delete certificate');
              }
            } catch (error: any) {
              console.error('Error deleting certificate:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to delete certificate. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const openUrl = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      Linking.openURL(url);
    }
  };

  if (profileLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-500 mt-4">Loading certificates...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        {/* Add Button at Top */}
        <TouchableOpacity
          style={cardStyles.addButton}
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <View style={cardStyles.addButtonContent}>
            <PlusIcon />
            <Text style={cardStyles.addButtonText}>Add Certificate</Text>
          </View>
        </TouchableOpacity>

        {certifications.length === 0 ? (
          <View className="items-center py-12">
            <CertificateIcon />
            <Text className="text-gray-900 text-lg font-semibold mt-4">
              No Certificates Added
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-2 mb-6">
              Add your professional certifications to showcase your expertise
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            {certifications.map((cert, index) => (
              <View key={cert.id || index} style={cardStyles.cardWrapper}>
                {/* Shadow layer */}
                <View style={cardStyles.cardShadow} />

                {/* Glass card with gradient border */}
                <View style={cardStyles.cardOuter}>
                  <View style={[cardStyles.cardInner, responsiveCardStyles.cardPadding]}>
                    {/* Header Row */}
                    <View style={cardStyles.headerRow}>
                      {/* Certificate Icon Badge with glow */}
                      <View style={[cardStyles.iconBadgeOuter, responsiveCardStyles.iconBadgeOuter]}>
                        <View style={[cardStyles.iconBadge, responsiveCardStyles.iconBadge]}>
                          <CertificateIcon size={iconSizes.certificate} />
                        </View>
                      </View>

                      <View style={cardStyles.titleContainer}>
                        <Text style={[cardStyles.certName, responsiveCardStyles.certName]} numberOfLines={2}>{cert.name}</Text>
                        <Text style={[cardStyles.certOrg, responsiveCardStyles.certOrg]} numberOfLines={1}>{cert.issuingOrganization}</Text>
                      </View>

                      <View style={[cardStyles.actionsContainer, responsiveCardStyles.actionsContainer]}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleEditCertificate(cert, index);
                          }}
                          style={[cardStyles.editButton, responsiveCardStyles.actionButton]}
                        >
                          <EditIcon size={iconSizes.action} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            handleDeleteCertificate(cert, index);
                          }}
                          style={[cardStyles.deleteButton, responsiveCardStyles.actionButton]}
                        >
                          <DeleteIcon size={iconSizes.action} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Description */}
                    {cert.description && (
                      <Text style={[cardStyles.description, responsiveCardStyles.description]} numberOfLines={2}>{cert.description}</Text>
                    )}

                    {/* Divider */}
                    <View style={cardStyles.divider} />

                    {/* Metadata Row */}
                    <View style={cardStyles.metaRow}>
                      <View style={[cardStyles.metaBadge, responsiveCardStyles.metaBadge]}>
                        <CalendarIcon />
                        <Text style={[cardStyles.metaText, responsiveCardStyles.metaText]}>Issued: {formatDate(cert.issueDate)}</Text>
                      </View>

                      {cert.credentialId && (
                        <View style={[cardStyles.credentialBadge, responsiveCardStyles.metaBadge]}>
                          <Text style={[cardStyles.credentialText, responsiveCardStyles.credentialText]} numberOfLines={1}>ID: {cert.credentialId}</Text>
                        </View>
                      )}
                    </View>

                    {/* Expiry, Credential Link & PDF Row */}
                    {(cert.expiryDate || cert.credentialUrl || cert.certificatePdfUrl) && (
                      <View style={cardStyles.metaRow}>
                        {cert.expiryDate && (
                          <View style={[cardStyles.expiryBadge, responsiveCardStyles.metaBadge]}>
                            <Text style={[cardStyles.expiryText, responsiveCardStyles.expiryText]}>
                              Expires: {formatDate(cert.expiryDate)}
                            </Text>
                          </View>
                        )}

                        {cert.credentialUrl && (
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              openUrl(cert.credentialUrl!);
                            }}
                            style={[cardStyles.linkBadge, responsiveCardStyles.metaBadge]}
                          >
                            <LinkIcon />
                            <Text style={[cardStyles.linkText, responsiveCardStyles.linkText]} numberOfLines={1}>View Credential</Text>
                          </TouchableOpacity>
                        )}

                        {cert.certificatePdfUrl && (
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              openUrl(cert.certificatePdfUrl!);
                            }}
                            style={[cardStyles.pdfBadge, responsiveCardStyles.metaBadge]}
                          >
                            <FileIcon />
                            <Text style={[cardStyles.pdfText, responsiveCardStyles.linkText]}>View PDF</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Certificate Modal - Using KeyboardAwareFormModal */}
      <KeyboardAwareFormModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add Certificate"
        isLoading={isLoading}
        footerContent={
          <GlassButton
            text={isLoading ? '' : 'Add Certificate'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleAddCertification();
            }}
            disabled={isLoading}
            loading={isLoading}
            colors={['#3B82F6', '#2563EB']}
            shadowColor="rgba(37, 99, 235, 0.4)"
            height={52}
            borderRadius={14}
          />
        }
      >
        {/* Certificate Name */}
        <FormInputGroup label="Certificate Name" required>
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., AWS Certified Solutions Architect"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Issuing Organization */}
        <FormInputGroup label="Issuing Organization" required>
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., Amazon Web Services"
            placeholderTextColor="#9CA3AF"
            value={formData.issuingOrganization}
            onChangeText={(text) => setFormData({ ...formData, issuingOrganization: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Issue Date */}
        <FormInputGroup label="Issue Date">
          <DatePickerTrigger
            value={formData.issueDate.toLocaleDateString()}
            placeholder="Select issue date"
            onPress={() => setShowIssueDatePicker(true)}
          />
        </FormInputGroup>

        {/* Expiry Date */}
        <View style={glassStyles.inputGroup}>
          <View style={glassStyles.rowBetween}>
            <Text style={glassStyles.inputLabel}>Expiry Date</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData({ ...formData, hasExpiry: !formData.hasExpiry });
              }}
              disabled={isLoading}
            >
              <Text style={glassStyles.linkText}>
                {formData.hasExpiry ? 'Remove' : 'Add'} Expiry
              </Text>
            </TouchableOpacity>
          </View>
          {formData.hasExpiry && (
            <DatePickerTrigger
              value={formData.expiryDate?.toLocaleDateString() || ''}
              placeholder="Select expiry date"
              onPress={() => setShowExpiryDatePicker(true)}
            />
          )}
        </View>

        {/* Credential ID */}
        <FormInputGroup label="Credential ID">
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., ABC123XYZ"
            placeholderTextColor="#9CA3AF"
            value={formData.credentialId}
            onChangeText={(text) => setFormData({ ...formData, credentialId: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Credential URL */}
        <FormInputGroup label="Credential URL">
          <TextInput
            style={glassStyles.input}
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            value={formData.credentialUrl}
            onChangeText={(text) => setFormData({ ...formData, credentialUrl: text })}
            keyboardType="url"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Description */}
        <FormInputGroup label="Description">
          <TextInput
            style={[glassStyles.input, glassStyles.textArea]}
            placeholder="Brief description of the certification"
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Certificate PDF */}
        <FormInputGroup label="Certificate PDF (Optional)">
          <TouchableOpacity
            style={[
              glassStyles.pdfButton,
              selectedPdf && glassStyles.pdfButtonSelected
            ]}
            onPress={handleSelectPdf}
            disabled={isLoading}
          >
            <FileIcon />
            <Text
              style={[
                glassStyles.pdfButtonText,
                selectedPdf && glassStyles.pdfButtonTextSelected
              ]}
              numberOfLines={1}
            >
              {selectedPdf ? `${selectedPdf.name}` : 'Select PDF file (max 5MB)'}
            </Text>
          </TouchableOpacity>
          {selectedPdf && (
            <TouchableOpacity
              onPress={() => setSelectedPdf(null)}
              disabled={isLoading}
            >
              <Text style={glassStyles.removeFileText}>Remove file</Text>
            </TouchableOpacity>
          )}
        </FormInputGroup>
      </KeyboardAwareFormModal>

      {/* Edit Certificate Modal - Using KeyboardAwareFormModal */}
      <KeyboardAwareFormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setEditingCertificate(null);
          setEditingIndex(null);
        }}
        title="Edit Certificate"
        isLoading={isLoading}
        footerContent={
          <GlassButton
            text={isLoading ? '' : 'Update Certificate'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleUpdateCertification();
            }}
            disabled={isLoading}
            loading={isLoading}
            colors={['#3B82F6', '#2563EB']}
            shadowColor="rgba(37, 99, 235, 0.4)"
            height={52}
            borderRadius={14}
          />
        }
      >
        {/* Certificate Name */}
        <FormInputGroup label="Certificate Name" required>
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., AWS Certified Solutions Architect"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Issuing Organization */}
        <FormInputGroup label="Issuing Organization" required>
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., Amazon Web Services"
            placeholderTextColor="#9CA3AF"
            value={formData.issuingOrganization}
            onChangeText={(text) => setFormData({ ...formData, issuingOrganization: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Issue Date */}
        <FormInputGroup label="Issue Date">
          <DatePickerTrigger
            value={formData.issueDate.toLocaleDateString()}
            placeholder="Select issue date"
            onPress={() => setShowIssueDatePicker(true)}
          />
        </FormInputGroup>

        {/* Expiry Date */}
        <View style={glassStyles.inputGroup}>
          <View style={glassStyles.rowBetween}>
            <Text style={glassStyles.inputLabel}>Expiry Date</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData({ ...formData, hasExpiry: !formData.hasExpiry });
              }}
              disabled={isLoading}
            >
              <Text style={glassStyles.linkText}>
                {formData.hasExpiry ? 'Remove' : 'Add'} Expiry
              </Text>
            </TouchableOpacity>
          </View>
          {formData.hasExpiry && (
            <DatePickerTrigger
              value={formData.expiryDate?.toLocaleDateString() || ''}
              placeholder="Select expiry date"
              onPress={() => setShowExpiryDatePicker(true)}
            />
          )}
        </View>

        {/* Credential ID */}
        <FormInputGroup label="Credential ID">
          <TextInput
            style={glassStyles.input}
            placeholder="e.g., ABC123XYZ"
            placeholderTextColor="#9CA3AF"
            value={formData.credentialId}
            onChangeText={(text) => setFormData({ ...formData, credentialId: text })}
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Credential URL */}
        <FormInputGroup label="Credential URL">
          <TextInput
            style={glassStyles.input}
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            value={formData.credentialUrl}
            onChangeText={(text) => setFormData({ ...formData, credentialUrl: text })}
            keyboardType="url"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Description */}
        <FormInputGroup label="Description">
          <TextInput
            style={[glassStyles.input, glassStyles.textArea]}
            placeholder="Brief description of the certification"
            placeholderTextColor="#9CA3AF"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </FormInputGroup>

        {/* Certificate PDF */}
        <FormInputGroup label="Certificate PDF (Optional)">
          <TouchableOpacity
            style={[
              glassStyles.pdfButton,
              selectedPdf && glassStyles.pdfButtonSelected
            ]}
            onPress={handleSelectPdf}
            disabled={isLoading}
          >
            <FileIcon />
            <Text
              style={[
                glassStyles.pdfButtonText,
                selectedPdf && glassStyles.pdfButtonTextSelected
              ]}
              numberOfLines={1}
            >
              {selectedPdf ? `✓ ${selectedPdf.name}` : 'Select new PDF file (max 5MB)'}
            </Text>
          </TouchableOpacity>
          {selectedPdf && (
            <TouchableOpacity
              onPress={() => setSelectedPdf(null)}
              disabled={isLoading}
            >
              <Text style={glassStyles.removeFileText}>Remove file</Text>
            </TouchableOpacity>
          )}
        </FormInputGroup>
      </KeyboardAwareFormModal>

      {/* Glass Date Pickers */}
      <GlassDatePicker
        visible={showIssueDatePicker}
        onClose={() => setShowIssueDatePicker(false)}
        onSelect={(date) => {
          setFormData({ ...formData, issueDate: date });
          setShowIssueDatePicker(false);
        }}
        selectedDate={formData.issueDate}
        maxDate={new Date()}
        title="Select Issue Date"
      />

      <GlassDatePicker
        visible={showExpiryDatePicker}
        onClose={() => setShowExpiryDatePicker(false)}
        onSelect={(date) => {
          setFormData({ ...formData, expiryDate: date });
          setShowExpiryDatePicker(false);
        }}
        selectedDate={formData.expiryDate || undefined}
        minDate={formData.issueDate}
        title="Select Expiry Date"
      />
    </View>
  );
}

// Glassmorphism Styles
const glassStyles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  pdfButton: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfButtonSelected: {
    backgroundColor: 'rgba(219, 234, 254, 0.8)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  pdfButtonText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
    color: '#64748B',
  },
  pdfButtonTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  removeFileText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
  },
});

// Card Styles for Certificate Display
const cardStyles = StyleSheet.create({
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // New glass card styles
  cardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardOuter: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    backgroundColor: 'rgba(219, 234, 254, 0.4)',
    overflow: 'hidden',
  },
  cardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 16,
    borderRadius: 18,
    margin: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconBadgeOuter: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  titleContainer: {
    flex: 1,
    paddingTop: 4,
  },
  certName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
    lineHeight: 22,
  },
  certOrg: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    gap: 4,
  },
  pdfText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  credentialBadge: {
    backgroundColor: 'rgba(219, 234, 254, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  credentialText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  expiryBadge: {
    backgroundColor: 'rgba(254, 243, 199, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  expiryText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  linkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});