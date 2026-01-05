import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  useGetMyJobPostingsQuery,
  useDeleteJobPostingMutation,
} from '../../../services/api';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';
import { useAlert } from '../../../contexts/AlertContext';

interface JobPostingCardProps {
  jobPosting: any;
  onPress: (jobId: string) => void;
  onEdit: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onViewApplications: (jobId: string) => void;
}

const JobPostingCard: React.FC<JobPostingCardProps> = ({
  jobPosting,
  onPress,
  onEdit,
  onDelete,
  onViewApplications,
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#9CA3AF',
      active: '#10B981',
      paused: '#FFCC00',
      closed: '#EF4444',
      filled: '#437EF4',
    };
    return colors[status] || '#9CA3AF';
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(jobPosting.id);
  };

  const handleViewApplications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewApplications(jobPosting.id);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(jobPosting.id);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(jobPosting.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: getStatusColor(jobPosting.status) }}
        >
          <Text className="text-white text-xs font-bold">
            {getStatusText(jobPosting.status)}
          </Text>
        </View>
        <Text className="text-gray-400 text-xs">
          Posted: {new Date(jobPosting.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Job Title */}
      <Text className="text-gray-900 text-xl font-bold mb-2">{jobPosting.title}</Text>

      {/* Company Name */}
      <Text className="text-primary-blue text-base font-semibold mb-3">
        {jobPosting.companyName}
      </Text>

      {/* Stats */}
      <View className="flex-row items-center mb-4">
        <View className="flex-row items-center">
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
            <Path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#6B7280" />
          </Svg>
          <Text className="text-gray-600 text-sm">{jobPosting.applicationsCount} applications</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={handleViewApplications}
          className="bg-primary-blue rounded-xl py-2 px-3 flex-1 items-center"
        >
          <Text className="text-white text-xs font-semibold">Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleEdit}
          className="bg-primary-cyan rounded-xl py-2 px-3 flex-1 items-center"
        >
          <Text className="text-white text-xs font-semibold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="bg-red-500 rounded-xl py-2 px-3 items-center"
        >
          <Text className="text-white text-xs font-semibold">Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface RecruiterJobsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onBack?: () => void;
  onCreateJob?: () => void;
  onEditJob?: (jobId: string) => void;
  onViewJob?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
}

export default function RecruiterJobsScreen({
  activeTab = 'dashboard',
  onTabChange,
  userName = 'User',
  onBack,
  onCreateJob,
  onEditJob,
  onViewJob,
  onViewApplications,
}: RecruiterJobsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { showAlert } = useAlert();

  const { data, isLoading, error, refetch } = useGetMyJobPostingsQuery({
    status: statusFilter,
  });

  const [deleteJobPosting, { isLoading: isDeleting }] = useDeleteJobPostingMutation();

  const handleDelete = async (jobId: string) => {
    showAlert({
      type: 'error',
      title: 'Delete Job Posting',
      message: 'Are you sure you want to delete this job posting? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteJobPosting({ jobId }).unwrap();
              if (result.deleteJobPosting.success) {
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Job posting deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }]
                });
                refetch();
              }
            } catch (err: any) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: err?.data?.deleteJobPosting?.message || 'Failed to delete job posting',
                buttons: [{ text: 'OK', style: 'default' }]
              });
            }
          },
        },
      ]
    });
  };

  const handleEdit = (jobId: string) => {
    if (onEditJob) {
      onEditJob(jobId);
    }
  };

  const handleViewApplicationsAction = (jobId: string) => {
    if (onViewApplications) {
      onViewApplications(jobId);
    }
  };

  const handleJobPress = (jobId: string) => {
    if (onViewJob) {
      onViewJob(jobId);
    }
  };

  const handleCreateJob = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onCreateJob) {
      onCreateJob();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    }
  };

  const handleFilterChange = (value: string | undefined) => {
    Haptics.selectionAsync();
    setStatusFilter(value);
  };

  const statusOptions = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Paused', value: 'paused' },
    { label: 'Closed', value: 'closed' },
    { label: 'Filled', value: 'filled' },
  ];

  return (
    <TalentPartnerLayout
      title="Job Postings"
      subtitle={`${data?.myJobPostings?.length || 0} active posting(s)`}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {/* Create Job Button */}
      <View className="px-6 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          {onBack && (
            <TouchableOpacity onPress={handleBack} className="flex-row items-center">
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
          )}
          <View className="flex-1" />
          <TouchableOpacity
            onPress={handleCreateJob}
            className="bg-primary-blue rounded-xl py-3 px-5 flex-row items-center shadow-md"
          >
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text className="text-white font-bold">New Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="px-6 pt-6">
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleFilterChange(option.value)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  statusFilter === option.value ? 'bg-primary-blue' : 'bg-white'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    statusFilter === option.value ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Loading State */}
          {isLoading && !data && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#437EF4" />
              <Text className="text-gray-500 mt-4">Loading job postings...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-600 text-sm">
                Error loading job postings. Please try again.
              </Text>
            </View>
          )}

          {/* No Jobs State */}
          {!isLoading && data?.myJobPostings?.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">
                No Job Postings Yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-4">
                Create your first job posting to start receiving applications
              </Text>
              <TouchableOpacity
                onPress={handleCreateJob}
                className="bg-primary-blue rounded-xl py-3 px-6"
              >
                <Text className="text-white font-semibold">Create Job Posting</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Job Postings List */}
          {data?.myJobPostings?.map((jobPosting: any) => (
            <JobPostingCard
              key={jobPosting.id}
              jobPosting={jobPosting}
              onPress={handleJobPress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewApplications={handleViewApplicationsAction}
            />
          ))}

          {/* Bottom padding for navbar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
