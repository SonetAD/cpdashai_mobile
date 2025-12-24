import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { readFileAsBase64, isFileSizeValid } from '../../../../utils/fileHelpers';
import { useGetCandidateProfileQuery, useAddCertificationMutation } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
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

const CertificateIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

export default function CertificatesTab({
  onAddCertificate,
  onEditCertificate,
  onDeleteCertificate,
}: CertificatesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
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
  const { showAlert } = useAlert();

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
          <View className="mb-4">
            {console.log('=== RENDERING CERTIFICATES ===', certifications)}
            {console.log('Number of certificates to render:', certifications.length)}
            {certifications.map((cert, index) => {
              console.log(`Certificate ${index}:`, cert);
              console.log('- Has PDF URL:', !!cert.certificatePdfUrl);
              console.log('- PDF URL:', cert.certificatePdfUrl);
              return (
                <View
                key={cert.id || index}
                className="bg-white rounded-xl p-4 mb-3"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-base">
                      {cert.name}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {cert.issuingOrganization}
                    </Text>
                  </View>
                  {cert.certificatePdfUrl && (
                    <TouchableOpacity
                      onPress={() => openUrl(cert.certificatePdfUrl!)}
                      className="ml-2 bg-red-50 rounded-lg p-2 border border-red-200"
                    >
                      <View className="items-center">
                        <FileIcon />
                        <Text className="text-red-600 text-[10px] mt-1 font-medium">PDF</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {cert.description && (
                  <Text className="text-gray-500 text-sm mt-2">{cert.description}</Text>
                )}

                <View className="flex-row items-center flex-wrap mt-3">
                  <View className="flex-row items-center mr-4 mb-2">
                    <CalendarIcon />
                    <Text className="text-gray-500 text-xs ml-1">
                      Issued: {formatDate(cert.issueDate)}
                    </Text>
                  </View>

                  {cert.expiryDate && (
                    <View className="flex-row items-center mr-4 mb-2">
                      <CalendarIcon />
                      <Text className="text-gray-500 text-xs ml-1">
                        Expires: {formatDate(cert.expiryDate)}
                      </Text>
                    </View>
                  )}

                  {cert.credentialId && (
                    <View className="flex-row items-center mr-4 mb-2">
                      <Text className="text-gray-500 text-xs">
                        ID: {cert.credentialId}
                      </Text>
                    </View>
                  )}

                  {cert.credentialUrl && (
                    <TouchableOpacity
                      onPress={() => openUrl(cert.credentialUrl!)}
                      className="flex-row items-center mb-2"
                    >
                      <LinkIcon />
                      <Text className="text-blue-600 text-xs ml-1 underline">
                        View Credential
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* PDF Attachment Indicator */}
                {cert.certificatePdfUrl && (
                  <TouchableOpacity
                    onPress={() => openUrl(cert.certificatePdfUrl!)}
                    className="mt-3 bg-gray-50 rounded-lg p-3 border border-gray-200 flex-row items-center"
                  >
                    <View className="bg-red-100 rounded-lg p-2 mr-3">
                      <FileIcon />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 text-sm font-medium">Certificate PDF Attached</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">Tap to view document</Text>
                    </View>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        stroke="#6B7280"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>
              );
            })}
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-4 items-center flex-row justify-center mb-4"
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
        >
          <PlusIcon />
          <Text className="text-white text-base font-semibold ml-2">
            Add Certificate
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Certificate Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl" style={{ maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 20 : 0 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Add Certificate</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={isLoading}
              >
                <Text className="text-gray-500 text-base">Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Certificate Name */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">
                  Certificate Name *
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="e.g., AWS Certified Solutions Architect"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  editable={!isLoading}
                />
              </View>

              {/* Issuing Organization */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">
                  Issuing Organization *
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="e.g., Amazon Web Services"
                  placeholderTextColor="#9CA3AF"
                  value={formData.issuingOrganization}
                  onChangeText={(text) => setFormData({ ...formData, issuingOrganization: text })}
                  editable={!isLoading}
                />
              </View>

              {/* Issue Date */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Issue Date</Text>
                <TouchableOpacity
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => setShowIssueDatePicker(true)}
                  disabled={isLoading}
                >
                  <CalendarIcon />
                  <Text className="text-gray-900 ml-2">
                    {formData.issueDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expiry Date */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-700 text-sm font-medium">Expiry Date</Text>
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, hasExpiry: !formData.hasExpiry })}
                    disabled={isLoading}
                  >
                    <Text className="text-blue-600 text-sm">
                      {formData.hasExpiry ? 'Remove' : 'Add'} Expiry
                    </Text>
                  </TouchableOpacity>
                </View>
                {formData.hasExpiry && (
                  <TouchableOpacity
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex-row items-center"
                    onPress={() => setShowExpiryDatePicker(true)}
                    disabled={isLoading}
                  >
                    <CalendarIcon />
                    <Text className="text-gray-900 ml-2">
                      {formData.expiryDate?.toLocaleDateString() || 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Credential ID */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Credential ID</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="e.g., ABC123XYZ"
                  placeholderTextColor="#9CA3AF"
                  value={formData.credentialId}
                  onChangeText={(text) => setFormData({ ...formData, credentialId: text })}
                  editable={!isLoading}
                />
              </View>

              {/* Credential URL */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Credential URL</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="https://..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.credentialUrl}
                  onChangeText={(text) => setFormData({ ...formData, credentialUrl: text })}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Description</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder="Brief description of the certification"
                  placeholderTextColor="#9CA3AF"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </View>

              {/* Certificate PDF */}
              <View className="mb-6">
                <Text className="text-gray-700 text-sm font-medium mb-2">
                  Certificate PDF (Optional)
                </Text>
                <TouchableOpacity
                  className={`border rounded-xl px-4 py-3 flex-row items-center ${
                    selectedPdf ? 'bg-blue-50 border-primary-blue' : 'bg-gray-50 border-gray-200'
                  }`}
                  onPress={handleSelectPdf}
                  disabled={isLoading}
                >
                  <FileIcon />
                  <Text className={`ml-2 flex-1 ${selectedPdf ? 'text-primary-blue font-medium' : 'text-gray-600'}`} numberOfLines={1}>
                    {selectedPdf ? `✓ ${selectedPdf.name}` : 'Select PDF file (max 5MB)'}
                  </Text>
                </TouchableOpacity>
                {selectedPdf && (
                  <TouchableOpacity
                    onPress={() => setSelectedPdf(null)}
                    disabled={isLoading}
                  >
                    <Text className="text-red-600 text-sm mt-2">Remove file</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                className={`rounded-xl py-4 items-center mb-4 ${
                  isLoading ? 'bg-gray-300' : 'bg-primary-blue'
                }`}
                activeOpacity={0.8}
                onPress={handleAddCertification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">Add Certificate</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Date Pickers */}
        {showIssueDatePicker && (
          <DateTimePicker
            value={formData.issueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowIssueDatePicker(false);
              if (date) {
                setFormData({ ...formData, issueDate: date });
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {showExpiryDatePicker && (
          <DateTimePicker
            value={formData.expiryDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowExpiryDatePicker(false);
              if (date) {
                setFormData({ ...formData, expiryDate: date });
              }
            }}
            minimumDate={formData.issueDate}
          />
        )}
      </Modal>
    </View>
  );
}