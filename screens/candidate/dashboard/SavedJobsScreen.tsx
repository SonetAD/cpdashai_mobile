import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { useGetMySavedJobsQuery, useUnsaveJobMutation } from '../../../services/api';

interface SavedJobCardProps {
  savedJob: any;
  onPress: (jobId: string) => void;
  onUnsave: (savedJobId: string) => void;
}

const SavedJobCard: React.FC<SavedJobCardProps> = ({ savedJob, onPress, onUnsave }) => {
  const { jobPosting, notes, savedAt } = savedJob;

  const formatSalary = () => {
    if (jobPosting.salaryMin && jobPosting.salaryMax) {
      const currency = jobPosting.salaryCurrency || 'USD';
      return `${currency} ${jobPosting.salaryMin.toLocaleString()} - ${jobPosting.salaryMax.toLocaleString()}`;
    }
    return 'Salary not disclosed';
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(jobPosting.id)}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Saved Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="bg-green-500 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-bold">✓ Saved</Text>
        </View>
        <Text className="text-gray-400 text-xs">
          {new Date(savedAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Job Title */}
      <Text className="text-gray-900 text-xl font-bold mb-2">{jobPosting.title}</Text>

      {/* Company Name */}
      <Text className="text-primary-blue text-base font-semibold mb-3">
        {jobPosting.companyName}
      </Text>

      {/* Job Details */}
      <View className="mb-3">
        <Text className="text-gray-500 text-sm mb-1">📍 {jobPosting.location}</Text>
        <Text className="text-gray-500 text-sm mb-1">
          💼 {jobPosting.workMode.charAt(0).toUpperCase() + jobPosting.workMode.slice(1)} •{' '}
          {jobPosting.jobType.replace('_', ' ')}
        </Text>
        <Text className="text-gray-500 text-sm">💰 {formatSalary()}</Text>
      </View>

      {/* Notes */}
      {notes && (
        <View className="bg-yellow-50 rounded-xl p-3 mb-3">
          <Text className="text-gray-700 text-xs italic">Note: {notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          onPress={() => onPress(jobPosting.id)}
          className="bg-primary-blue rounded-xl py-2 px-4 flex-1 items-center"
        >
          <Text className="text-white text-sm font-semibold">View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onUnsave(savedJob.id)}
          className="bg-gray-200 rounded-xl py-2 px-4 items-center"
        >
          <Text className="text-gray-700 text-sm font-semibold">Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

interface SavedJobsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onJobPress?: (jobId: string) => void;
  onBrowseJobsPress?: () => void;
}

export default function SavedJobsScreen({
  activeTab = 'jobs',
  onTabChange,
  userName = 'User',
  onJobPress,
  onBrowseJobsPress,
}: SavedJobsScreenProps) {
  const { data, isLoading, error, refetch } = useGetMySavedJobsQuery();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();

  const handleUnsave = async (savedJobId: string) => {
    try {
      await unsaveJob({ savedJobId }).unwrap();
      refetch();
    } catch (err) {
      console.error('Error unsaving job:', err);
    }
  };

  const handleJobPress = (jobId: string) => {
    if (onJobPress) {
      onJobPress(jobId);
    }
  };

  return (
    <CandidateLayout
      userName={userName}
      onSearchPress={() => console.log('Search pressed')}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="px-6 mt-6">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-gray-900 text-2xl font-bold mb-1">Saved Jobs</Text>
            <Text className="text-gray-500 text-sm">
              {data?.mySavedJobs?.length || 0} job(s) saved for later
            </Text>
          </View>

          {/* Loading State */}
          {isLoading && !data && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#437EF4" />
              <Text className="text-gray-500 mt-4">Loading saved jobs...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-600 text-sm">
                Error loading saved jobs. Please try again.
              </Text>
            </View>
          )}

          {/* No Saved Jobs State */}
          {!isLoading && data?.mySavedJobs?.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">No Saved Jobs</Text>
              <Text className="text-gray-500 text-sm text-center mb-4">
                Save jobs to easily access them later and keep track of opportunities
              </Text>
              <TouchableOpacity
                onPress={onBrowseJobsPress}
                className="bg-primary-blue rounded-xl py-3 px-6"
              >
                <Text className="text-white font-semibold">Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Jobs List */}
          {data?.mySavedJobs?.map((savedJob: any) => (
            <SavedJobCard
              key={savedJob.id}
              savedJob={savedJob}
              onPress={handleJobPress}
              onUnsave={handleUnsave}
            />
          ))}
        </View>
      </ScrollView>
    </CandidateLayout>
  );
}
