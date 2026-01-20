import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  useCreateJobPostingMutation,
  useUpdateJobPostingMutation,
  useGetJobPostingQuery,
} from '../../../services/api';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';
import { useAlert } from '../../../contexts/AlertContext';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassSectionCard } from '../../../components/ui/GlassSectionCard';

interface CreateEditJobPostingScreenProps {
  jobId?: string;
  onBack?: () => void;
  onSuccess?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function CreateEditJobPostingScreen({
  jobId,
  onBack,
  onSuccess,
  activeTab = 'dashboard',
  onTabChange,
}: CreateEditJobPostingScreenProps) {
  const isEditMode = !!jobId;

  // Fetch job data if editing
  const { data: jobData, isLoading: loadingJob } = useGetJobPostingQuery(
    { jobId: jobId! },
    { skip: !jobId }
  );

  const [createJob, { isLoading: isCreating }] = useCreateJobPostingMutation();
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobPostingMutation();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    department: '',
    description: '',
    responsibilities: '',
    jobType: 'full_time',
    experienceLevel: 'mid',
    yearsOfExperienceMin: '',
    yearsOfExperienceMax: '',
    location: '',
    workMode: 'remote',
    requiredSkills: '',
    preferredSkills: '',
    requiredQualifications: '',
    certifications: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    salaryPeriod: 'yearly',
    benefits: '',
    industry: '',
    applicationDeadline: '',
    status: 'active',
  });

  // Populate form data when editing
  useEffect(() => {
    if (jobData?.jobPosting) {
      const job = jobData.jobPosting;
      setFormData({
        title: job.title || '',
        companyName: job.companyName || '',
        department: job.department || '',
        description: job.description || '',
        responsibilities: job.responsibilities?.join('\n') || '',
        jobType: job.jobType || 'full_time',
        experienceLevel: job.experienceLevel || 'mid',
        yearsOfExperienceMin: job.yearsOfExperienceMin?.toString() || '',
        yearsOfExperienceMax: job.yearsOfExperienceMax?.toString() || '',
        location: job.location || '',
        workMode: job.workMode || 'remote',
        requiredSkills: job.requiredSkills?.join(', ') || '',
        preferredSkills: job.preferredSkills?.join(', ') || '',
        requiredQualifications: job.requiredQualifications?.join('\n') || '',
        certifications: job.certifications?.join(', ') || '',
        salaryMin: job.salaryMin?.toString() || '',
        salaryMax: job.salaryMax?.toString() || '',
        salaryCurrency: job.salaryCurrency || 'USD',
        salaryPeriod: job.salaryPeriod || 'yearly',
        benefits: job.benefits?.join('\n') || '',
        industry: job.industry || '',
        applicationDeadline: job.applicationDeadline || '',
        status: job.status || 'active',
      });
    }
  }, [jobData]);

  const { showAlert } = useAlert();

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter a job title',
        buttons: [{ text: 'OK', style: 'default' }]
      });
      return;
    }
    if (!formData.companyName.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter a company name',
        buttons: [{ text: 'OK', style: 'default' }]
      });
      return;
    }
    if (!formData.description.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter a job description',
        buttons: [{ text: 'OK', style: 'default' }]
      });
      return;
    }
    if (!formData.location.trim()) {
      showAlert({
        type: 'error',
        title: 'Required Field',
        message: 'Please enter a location',
        buttons: [{ text: 'OK', style: 'default' }]
      });
      return;
    }

    // Prepare input data
    const inputData: any = {
      title: formData.title.trim(),
      companyName: formData.companyName.trim(),
      description: formData.description.trim(),
      responsibilities: formData.responsibilities
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r),
      jobType: formData.jobType,
      experienceLevel: formData.experienceLevel,
      yearsOfExperienceMin: parseInt(formData.yearsOfExperienceMin) || 0,
      location: formData.location.trim(),
      workMode: formData.workMode,
      requiredSkills: formData.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s),
      requiredQualifications: formData.requiredQualifications
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q),
      status: formData.status,
    };

    // Optional fields
    if (formData.department) inputData.department = formData.department.trim();
    if (formData.yearsOfExperienceMax)
      inputData.yearsOfExperienceMax = parseInt(formData.yearsOfExperienceMax);
    if (formData.preferredSkills)
      inputData.preferredSkills = formData.preferredSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
    if (formData.certifications)
      inputData.certifications = formData.certifications
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c);
    if (formData.salaryMin) inputData.salaryMin = parseInt(formData.salaryMin);
    if (formData.salaryMax) inputData.salaryMax = parseInt(formData.salaryMax);
    if (formData.salaryCurrency) inputData.salaryCurrency = formData.salaryCurrency;
    if (formData.salaryPeriod) inputData.salaryPeriod = formData.salaryPeriod;
    if (formData.benefits)
      inputData.benefits = formData.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter((b) => b);
    if (formData.industry) inputData.industry = formData.industry.trim();
    if (formData.applicationDeadline) inputData.applicationDeadline = formData.applicationDeadline;

    try {
      if (isEditMode) {
        const result = await updateJob({ jobId: jobId!, ...inputData }).unwrap();
        if (result.updateJobPosting.success) {
          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Job posting updated successfully',
            buttons: [{ text: 'OK', style: 'default', onPress: () => {
              if (onSuccess) onSuccess();
              if (onBack) onBack();
            }}]
          });
        }
      } else {
        const result = await createJob(inputData).unwrap();
        if (result.createJobPosting.success) {
          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Job posting created successfully',
            buttons: [{ text: 'OK', style: 'default', onPress: () => {
              if (onSuccess) onSuccess();
              if (onBack) onBack();
            }}]
          });
        }
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.createJobPosting?.message ||
          error?.data?.updateJobPosting?.message ||
          'Failed to save job posting',
        buttons: [{ text: 'OK', style: 'default' }]
      });
    }
  };

  if (loadingJob && isEditMode) {
    return (
      <View style={formStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#437EF4" />
        <Text style={formStyles.loadingText}>Loading job data...</Text>
      </View>
    );
  }

  return (
    <TalentPartnerLayout
      title={isEditMode ? 'Edit Job Posting' : 'Create Job Posting'}
      subtitle={isEditMode ? 'Update your job details' : 'Post a new opportunity'}
    >
      {/* Back Button */}
      {onBack && (
        <View style={formStyles.backButtonContainer}>
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }} style={formStyles.backButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path
                d="M15 18L9 12L15 6"
                stroke="#437EF4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={formStyles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={formStyles.formContainer}>
            {/* Basic Information */}
            <GlassSectionCard>
              <Text style={formStyles.sectionTitle}>Basic Information</Text>

              <Text style={formStyles.fieldLabel}>Job Title *</Text>
              <TextInput
                style={formStyles.textInput}
                placeholder="e.g. Senior Full Stack Developer"
                placeholderTextColor="#9CA3AF"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={formStyles.fieldLabel}>Company Name *</Text>
              <TextInput
                style={formStyles.textInput}
                placeholder="e.g. Tech Innovations Inc"
                placeholderTextColor="#9CA3AF"
                value={formData.companyName}
                onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              />

              <Text style={formStyles.fieldLabel}>Department</Text>
              <TextInput
                style={formStyles.textInput}
                placeholder="e.g. Engineering"
                placeholderTextColor="#9CA3AF"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
              />

              <Text style={formStyles.fieldLabel}>Location *</Text>
              <TextInput
                style={[formStyles.textInput, { marginBottom: 0 }]}
                placeholder="e.g. San Francisco, CA"
                placeholderTextColor="#9CA3AF"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
            </GlassSectionCard>

            {/* Job Details */}
            <GlassSectionCard>
              <Text style={formStyles.sectionTitle}>Job Details</Text>

              <Text style={formStyles.fieldLabel}>Description *</Text>
              <TextInput
                style={[formStyles.textInput, formStyles.multilineInput]}
                placeholder="Describe the role..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />

              <Text style={formStyles.fieldLabel}>Responsibilities (one per line)</Text>
              <TextInput
                style={[formStyles.textInput, formStyles.multilineInput, { marginBottom: 0 }]}
                placeholder="Design and develop..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={formData.responsibilities}
                onChangeText={(text) => setFormData({ ...formData, responsibilities: text })}
              />
            </GlassSectionCard>

            {/* Employment Type */}
            <GlassSectionCard>
              <Text style={formStyles.sectionTitle}>Employment Type</Text>

              <Text style={formStyles.fieldLabel}>Job Type</Text>
              <View style={formStyles.toggleContainer}>
                {[
                  { label: 'Full Time', value: 'full_time' },
                  { label: 'Part Time', value: 'part_time' },
                  { label: 'Contract', value: 'contract' },
                  { label: 'Internship', value: 'internship' },
                  { label: 'Freelance', value: 'freelance' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFormData({ ...formData, jobType: option.value });
                    }}
                    style={[
                      formStyles.togglePill,
                      formData.jobType === option.value
                        ? formStyles.togglePillActive
                        : formStyles.togglePillInactive
                    ]}
                  >
                    <Text
                      style={[
                        formStyles.togglePillText,
                        formData.jobType === option.value
                          ? formStyles.togglePillTextActive
                          : formStyles.togglePillTextInactive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={formStyles.fieldLabel}>Work Mode</Text>
              <View style={formStyles.toggleContainer}>
                {[
                  { label: 'Remote', value: 'remote' },
                  { label: 'Onsite', value: 'onsite' },
                  { label: 'Hybrid', value: 'hybrid' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFormData({ ...formData, workMode: option.value });
                    }}
                    style={[
                      formStyles.togglePill,
                      formData.workMode === option.value
                        ? formStyles.togglePillActive
                        : formStyles.togglePillInactive
                    ]}
                  >
                    <Text
                      style={[
                        formStyles.togglePillText,
                        formData.workMode === option.value
                          ? formStyles.togglePillTextActive
                          : formStyles.togglePillTextInactive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={formStyles.fieldLabel}>Experience Level</Text>
              <View style={formStyles.toggleContainer}>
                {[
                  { label: 'Entry', value: 'entry' },
                  { label: 'Junior', value: 'junior' },
                  { label: 'Mid', value: 'mid' },
                  { label: 'Senior', value: 'senior' },
                  { label: 'Lead', value: 'lead' },
                  { label: 'Principal', value: 'principal' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFormData({ ...formData, experienceLevel: option.value });
                    }}
                    style={[
                      formStyles.togglePill,
                      formData.experienceLevel === option.value
                        ? formStyles.togglePillActive
                        : formStyles.togglePillInactive
                    ]}
                  >
                    <Text
                      style={[
                        formStyles.togglePillText,
                        formData.experienceLevel === option.value
                          ? formStyles.togglePillTextActive
                          : formStyles.togglePillTextInactive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={formStyles.rowContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={formStyles.fieldLabel}>Min Years</Text>
                  <TextInput
                    style={[formStyles.textInput, { marginBottom: 0 }]}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.yearsOfExperienceMin}
                    onChangeText={(text) =>
                      setFormData({ ...formData, yearsOfExperienceMin: text })
                    }
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={formStyles.fieldLabel}>Max Years</Text>
                  <TextInput
                    style={[formStyles.textInput, { marginBottom: 0 }]}
                    placeholder="10"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.yearsOfExperienceMax}
                    onChangeText={(text) =>
                      setFormData({ ...formData, yearsOfExperienceMax: text })
                    }
                  />
                </View>
              </View>
            </GlassSectionCard>

            {/* Skills & Requirements */}
            <GlassSectionCard>
              <Text style={formStyles.sectionTitle}>Skills & Requirements</Text>

              <Text style={formStyles.fieldLabel}>Required Skills * (comma-separated)</Text>
              <TextInput
                style={formStyles.textInput}
                placeholder="JavaScript, React, Node.js, Python"
                placeholderTextColor="#9CA3AF"
                value={formData.requiredSkills}
                onChangeText={(text) => setFormData({ ...formData, requiredSkills: text })}
              />

              <Text style={formStyles.fieldLabel}>Preferred Skills (comma-separated)</Text>
              <TextInput
                style={formStyles.textInput}
                placeholder="TypeScript, GraphQL, Docker"
                placeholderTextColor="#9CA3AF"
                value={formData.preferredSkills}
                onChangeText={(text) => setFormData({ ...formData, preferredSkills: text })}
              />

              <Text style={formStyles.fieldLabel}>Required Qualifications * (one per line)</Text>
              <TextInput
                style={[formStyles.textInput, formStyles.multilineInput]}
                placeholder="Bachelor's degree in Computer Science"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.requiredQualifications}
                onChangeText={(text) => setFormData({ ...formData, requiredQualifications: text })}
              />

              <Text style={formStyles.fieldLabel}>Certifications (comma-separated)</Text>
              <TextInput
                style={[formStyles.textInput, { marginBottom: 0 }]}
                placeholder="AWS Certified, PMP"
                placeholderTextColor="#9CA3AF"
                value={formData.certifications}
                onChangeText={(text) => setFormData({ ...formData, certifications: text })}
              />
            </GlassSectionCard>

            {/* Compensation */}
            <GlassSectionCard>
              <Text style={formStyles.sectionTitle}>Compensation</Text>

              <View style={[formStyles.rowContainer, { marginBottom: 16 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={formStyles.fieldLabel}>Min Salary</Text>
                  <TextInput
                    style={[formStyles.textInput, { marginBottom: 0 }]}
                    placeholder="120000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.salaryMin}
                    onChangeText={(text) => setFormData({ ...formData, salaryMin: text })}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={formStyles.fieldLabel}>Max Salary</Text>
                  <TextInput
                    style={[formStyles.textInput, { marginBottom: 0 }]}
                    placeholder="180000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.salaryMax}
                    onChangeText={(text) => setFormData({ ...formData, salaryMax: text })}
                  />
                </View>
              </View>

              <Text style={formStyles.fieldLabel}>Benefits (one per line)</Text>
              <TextInput
                style={[formStyles.textInput, formStyles.multilineInput, { marginBottom: 0 }]}
                placeholder="Health insurance&#10;401k matching&#10;Remote work"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.benefits}
                onChangeText={(text) => setFormData({ ...formData, benefits: text })}
              />
            </GlassSectionCard>

            {/* Status */}
            <GlassSectionCard style={{ marginBottom: 24 }}>
              <Text style={formStyles.sectionTitle}>Status</Text>

              <View style={formStyles.toggleContainer}>
                {[
                  { label: 'Active', value: 'active' },
                  { label: 'Draft', value: 'draft' },
                  ...(isEditMode
                    ? [
                        { label: 'Paused', value: 'paused' },
                        { label: 'Closed', value: 'closed' },
                        { label: 'Filled', value: 'filled' },
                      ]
                    : []),
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFormData({ ...formData, status: option.value });
                    }}
                    style={[
                      formStyles.togglePill,
                      formData.status === option.value
                        ? formStyles.togglePillActive
                        : formStyles.togglePillInactive
                    ]}
                  >
                    <Text
                      style={[
                        formStyles.togglePillText,
                        formData.status === option.value
                          ? formStyles.togglePillTextActive
                          : formStyles.togglePillTextInactive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassSectionCard>

            {/* Submit Button */}
            <GlassButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSubmit();
              }}
              disabled={isCreating || isUpdating}
              loading={isCreating || isUpdating}
              text={isCreating || isUpdating
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Job Posting'
                : 'Create Job Posting'}
              colors={['#437EF4', '#5B8AF5']}
              height={52}
              borderRadius={12}
              fullWidth
              style={{ marginBottom: 24 }}
            />

            {/* Bottom padding for navbar */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TalentPartnerLayout>
  );
}

// Glass design styles
const formStyles = StyleSheet.create({
  // Loading state
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 14,
  },

  // Back button
  backButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#437EF4',
    fontWeight: '600',
    fontSize: 14,
  },

  // Form container
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Section title
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Field label
  fieldLabel: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },

  // Text input
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#111827',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },

  // Multiline input
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Toggle container
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },

  // Toggle pill
  togglePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  togglePillActive: {
    backgroundColor: 'rgba(67, 126, 244, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  togglePillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  togglePillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
  },
  togglePillTextInactive: {
    color: '#4B5563',
  },

  // Row container
  rowContainer: {
    flexDirection: 'row',
  },
});
