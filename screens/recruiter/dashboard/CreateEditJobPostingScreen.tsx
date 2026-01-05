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
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-500 mt-4">Loading job data...</Text>
      </View>
    );
  }

  return (
    <TalentPartnerLayout
      title={isEditMode ? 'Edit Job Posting' : 'Create Job Posting'}
      subtitle={isEditMode ? 'Update your job details' : 'Post a new opportunity'}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {/* Back Button */}
      {onBack && (
        <View className="px-6 pt-4">
          <TouchableOpacity onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }} className="flex-row items-center mb-4">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path
                d="M15 18L9 12L15 6"
                stroke="#437EF4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text className="text-primary-blue font-semibold">Back</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-6">
            {/* Basic Information */}
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-gray-900 text-lg font-bold mb-4">Basic Information</Text>

            <Text className="text-gray-700 text-sm mb-2">Job Title *</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="e.g. Senior Full Stack Developer"
              placeholderTextColor="#9CA3AF"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Company Name *</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="e.g. Tech Innovations Inc"
              placeholderTextColor="#9CA3AF"
              value={formData.companyName}
              onChangeText={(text) => setFormData({ ...formData, companyName: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Department</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="e.g. Engineering"
              placeholderTextColor="#9CA3AF"
              value={formData.department}
              onChangeText={(text) => setFormData({ ...formData, department: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Location *</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor="#9CA3AF"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>

          {/* Job Details */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">Job Details</Text>

            <Text className="text-gray-700 text-sm mb-2">Description *</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="Describe the role..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Responsibilities (one per line)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="Design and develop..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={formData.responsibilities}
              onChangeText={(text) => setFormData({ ...formData, responsibilities: text })}
            />
          </View>

          {/* Employment Type */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">Employment Type</Text>

            <Text className="text-gray-700 text-sm mb-2">Job Type</Text>
            <View className="flex-row flex-wrap mb-4">
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
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    formData.jobType === option.value ? 'bg-primary-blue' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.jobType === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-700 text-sm mb-2">Work Mode</Text>
            <View className="flex-row flex-wrap mb-4">
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
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    formData.workMode === option.value ? 'bg-primary-blue' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.workMode === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-700 text-sm mb-2">Experience Level</Text>
            <View className="flex-row flex-wrap mb-4">
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
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    formData.experienceLevel === option.value ? 'bg-primary-blue' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.experienceLevel === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">Min Years</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.yearsOfExperienceMin}
                  onChangeText={(text) =>
                    setFormData({ ...formData, yearsOfExperienceMin: text })
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">Max Years</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
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
          </View>

          {/* Skills & Requirements */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">Skills & Requirements</Text>

            <Text className="text-gray-700 text-sm mb-2">Required Skills * (comma-separated)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="JavaScript, React, Node.js, Python"
              placeholderTextColor="#9CA3AF"
              value={formData.requiredSkills}
              onChangeText={(text) => setFormData({ ...formData, requiredSkills: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Preferred Skills (comma-separated)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="TypeScript, GraphQL, Docker"
              placeholderTextColor="#9CA3AF"
              value={formData.preferredSkills}
              onChangeText={(text) => setFormData({ ...formData, preferredSkills: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">
              Required Qualifications * (one per line)
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="Bachelor's degree in Computer Science"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.requiredQualifications}
              onChangeText={(text) => setFormData({ ...formData, requiredQualifications: text })}
            />

            <Text className="text-gray-700 text-sm mb-2">Certifications (comma-separated)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="AWS Certified, PMP"
              placeholderTextColor="#9CA3AF"
              value={formData.certifications}
              onChangeText={(text) => setFormData({ ...formData, certifications: text })}
            />
          </View>

          {/* Compensation */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">Compensation</Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">Min Salary</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
                  placeholder="120000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.salaryMin}
                  onChangeText={(text) => setFormData({ ...formData, salaryMin: text })}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 text-sm mb-2">Max Salary</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
                  placeholder="180000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.salaryMax}
                  onChangeText={(text) => setFormData({ ...formData, salaryMax: text })}
                />
              </View>
            </View>

            <Text className="text-gray-700 text-sm mb-2">Benefits (one per line)</Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
              placeholder="Health insurance&#10;401k matching&#10;Remote work"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formData.benefits}
              onChangeText={(text) => setFormData({ ...formData, benefits: text })}
            />
          </View>

          {/* Status */}
          <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
            <Text className="text-gray-900 text-lg font-bold mb-4">Status</Text>

            <View className="flex-row flex-wrap">
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
                  className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                    formData.status === option.value ? 'bg-primary-blue' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      formData.status === option.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSubmit();
            }}
            disabled={isCreating || isUpdating}
            className="bg-primary-blue rounded-xl py-4 items-center mb-6"
          >
            <Text className="text-white text-base font-semibold">
              {isCreating || isUpdating
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update Job Posting'
                : 'Create Job Posting'}
            </Text>
          </TouchableOpacity>

          {/* Bottom padding for navbar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </TalentPartnerLayout>
  );
}
