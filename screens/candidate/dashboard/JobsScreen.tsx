import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import SearchIcon from '../../../assets/images/searchGray.svg';
import IdeaIcon from '../../../assets/images/homepage/idea.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import SearchModal from '../../../components/SearchModal';
import { 
  useGetMyJobMatchesQuery, 
  useGetJobPostingsQuery,
  useSaveJobMutation, 
  useUnsaveJobMutation,
  useApplyToJobMutation,
  useGetMyApplicationsQuery
} from '../../../services/api';

interface JobsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
  userName?: string;
  onJobPress?: (jobId: string) => void;
  onApplicationTrackerPress?: () => void;
  onCVUploadPress?: () => void;
  onSearchNavigate?: (route: string) => void;
}

interface FilterButtonProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-primary-blue' : 'bg-white'
      }`}
      activeOpacity={0.7}
    >
      <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface JobCardProps {
  jobMatch: any;
  onPress: (jobId: string) => void;
  onSave: (jobId: string, isSaved: boolean) => void;
  onApply: (jobId: string) => void;
  applicationsData?: any;
}

const JobCard: React.FC<JobCardProps> = ({ jobMatch, onPress, onSave, onApply, applicationsData }) => {
  const { matchPercentage, jobPosting, isSaved, recommendation, missingSkills } = jobMatch;
  
  // Find the application for this job from myApplications
  const application = applicationsData?.myApplications?.find(
    (app: any) => app.jobPosting.id === jobPosting.id
  );
  const applicationStatus = application?.status;
  
  // User can apply if no application exists or if application is withdrawn (but not rejected, shortlisted, etc)
  const canApply = !application || applicationStatus === 'withdrawn';
  const canWithdraw = application && ['pending', 'reviewed'].includes(applicationStatus || '');
  
  // Get badge color based on match percentage
  const getBadgeColor = (percentage: number) => {
    if (percentage >= 85) return '#437EF4'; // Blue
    if (percentage >= 70) return '#10B981'; // Green
    if (percentage >= 50) return '#FFCC00'; // Yellow
    return '#EF4444'; // Red
  };

  // Format salary
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
      {/* Position Title */}
      <Text className="text-gray-900 text-xl font-bold mb-2">{jobPosting.title}</Text>

      {/* Description */}
      <Text className="text-gray-400 text-sm leading-5 mb-4" numberOfLines={3}>
        {jobPosting.description}
      </Text>

      {/* Company Name */}
      <Text className="text-primary-blue text-base font-semibold mb-3">{jobPosting.companyName}</Text>

      {/* Application Status Badge */}
      {application && applicationStatus && applicationStatus !== 'pending' && applicationStatus !== 'withdrawn' && (
        <View className="mb-3">
          <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-200">
            <Text className="text-gray-600 text-xs font-medium">Status:</Text>
            <View
              className="rounded-full px-3 py-1"
              style={{ 
                backgroundColor: 
                  applicationStatus === 'pending' ? '#FFCC00' :
                  applicationStatus === 'reviewed' ? '#437EF4' :
                  applicationStatus === 'shortlisted' ? '#10B981' :
                  applicationStatus === 'interview' ? '#8B5CF6' :
                  applicationStatus === 'offered' ? '#10B981' :
                  applicationStatus === 'rejected' ? '#EF4444' :
                  applicationStatus === 'withdrawn' ? '#6B7280' :
                  applicationStatus === 'accepted' ? '#10B981' : '#9CA3AF'
              }}
            >
              <Text className="text-white text-xs font-bold">
                {applicationStatus === 'pending' ? 'Submitted' : applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
              </Text>
            </View>
          </View>
          {applicationStatus === 'rejected' && application.rejectionReason && (
            <View className="mt-2 bg-red-50 rounded-xl p-2.5 border border-red-200">
              <Text className="text-red-600 text-xs font-semibold mb-0.5">Rejection Reason:</Text>
              <Text className="text-gray-700 text-xs" numberOfLines={2}>{application.rejectionReason}</Text>
            </View>
          )}
        </View>
      )}

      {/* Job Details */}
      <View className="mb-4">
        <Text className="text-gray-500 text-sm mb-1">• {jobPosting.location}</Text>
        <Text className="text-gray-500 text-sm mb-1">• {jobPosting.workMode.charAt(0).toUpperCase() + jobPosting.workMode.slice(1)} - {jobPosting.jobType.replace('_', ' ')}</Text>
        <Text className="text-gray-500 text-sm">• {formatSalary()}</Text>
      </View>

      {/* Skills Tags */}
      <View className="flex-row flex-wrap mb-4">
        {jobPosting.requiredSkills?.slice(0, 5).map((skill: string, index: number) => (
          <View key={index} className="bg-primary-cyan/20 rounded-lg px-3 py-2 mr-2 mb-2">
            <Text className="text-primary-cyan text-xs font-medium">{skill}</Text>
          </View>
        ))}
      </View>

      {/* AI Insight */}
      {recommendation && (
        <View className="bg-yellow-50 rounded-xl p-3 flex-row items-start mb-4">
          <View className="mr-2 mt-0.5">
            <IdeaIcon width={17} height={18} />
          </View>
          <Text className="text-gray-700 text-xs flex-1 leading-4" numberOfLines={3}>
            AI Insight: {recommendation}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        {canApply ? (
          <TouchableOpacity 
            onPress={() => onApply(jobPosting.id)}
            className="bg-primary-blue rounded-xl py-3 flex-1 items-center"
          >
            <Text className="text-white text-sm font-semibold">
              {applicationStatus === 'withdrawn' ? 'Reapply' : 'Apply Now'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-300 rounded-xl py-3 flex-1 items-center">
            <Text className="text-gray-600 text-sm font-semibold">
              {applicationStatus === 'pending' ? 'Applied' : 
               applicationStatus === 'reviewed' ? 'Under Review' :
               applicationStatus === 'shortlisted' ? 'Shortlisted' :
               applicationStatus === 'interview' ? 'Interview' :
               applicationStatus === 'offered' ? 'Offer Received' :
               applicationStatus === 'rejected' ? 'Closed' :
               applicationStatus === 'accepted' ? 'Accepted' : 'Applied'}
            </Text>
          </View>
        )}
        <TouchableOpacity 
          onPress={() => onSave(jobPosting.id, isSaved)}
          className={`rounded-xl py-3 flex-1 items-center ${isSaved ? 'bg-green-500' : 'bg-primary-cyan'}`}
        >
          <Text className="text-white text-sm font-semibold">{isSaved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function JobsScreen({
  activeTab = 'jobs',
  onTabChange,
  onAIAssistantPress,
  userName = 'User',
  onJobPress,
  onApplicationTrackerPress,
  onCVUploadPress,
  onSearchNavigate,
}: JobsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter function for jobs
  const filterJobs = (jobs: any[], query: string) => {
    if (!query) return jobs;

    return jobs.filter((item: any) => {
      const job = item.jobPosting || item;
      const searchLower = query.toLowerCase();

      // Search in title
      if (job.title?.toLowerCase().includes(searchLower)) return true;
      // Search in company name
      if (job.companyName?.toLowerCase().includes(searchLower)) return true;
      // Search in location
      if (job.location?.toLowerCase().includes(searchLower)) return true;
      // Search in description
      if (job.description?.toLowerCase().includes(searchLower)) return true;
      // Search in skills
      if (job.requiredSkills?.some((skill: string) =>
        skill.toLowerCase().includes(searchLower)
      )) return true;
      // Search in work mode
      if (job.workMode?.toLowerCase().includes(searchLower)) return true;
      // Search in job type
      if (job.jobType?.toLowerCase().replace('_', ' ').includes(searchLower)) return true;

      return false;
    });
  };

  // Get work mode based on active filter
  const getWorkMode = () => {
    if (activeFilter === 'Remote') return 'remote';
    if (activeFilter === 'Onsite') return 'onsite';
    return undefined;
  };

  // Fetch job matches (personalized)
  const { 
    data: matchesData, 
    isLoading: matchesLoading, 
    error: matchesError, 
    refetch: refetchMatches 
  } = useGetMyJobMatchesQuery({
    workMode: getWorkMode(),
    page,
    pageSize: 20,
  });

  // Fallback: Fetch all job postings if matches fail or return empty
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs
  } = useGetJobPostingsQuery({
    workMode: getWorkMode(),
    status: 'active',
    limit: 20,
    offset: (page - 1) * 20,
  }, {
    skip: (matchesData?.myJobMatches?.matches?.length ?? 0) > 0, // Skip if we have matches
  });

  // Fetch applications data
  const { data: applicationsData, refetch: refetchApplications } = useGetMyApplicationsQuery({});

  // Save/unsave job mutations
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();
  const [applyToJob] = useApplyToJobMutation();

  // Determine which data to use
  const hasMatches = (matchesData?.myJobMatches?.matches?.length ?? 0) > 0;
  const useMatchData = hasMatches || !jobsData;
  const isLoading = matchesLoading || jobsLoading;
  const error = matchesError || jobsError;

  // Filter matched jobs based on search
  const filteredMatches = useMemo(() => {
    const matches = matchesData?.myJobMatches?.matches || [];
    return filterJobs(matches, debouncedSearch);
  }, [matchesData?.myJobMatches?.matches, debouncedSearch]);

  // Filter regular job postings based on search
  const filteredJobs = useMemo(() => {
    const jobs = jobsData?.jobPostings || [];
    return filterJobs(jobs.map((job: any) => ({ jobPosting: job })), debouncedSearch);
  }, [jobsData?.jobPostings, debouncedSearch]);
  
  const refetch = () => {
    refetchMatches();
    refetchApplications();
    // Only refetch jobs if it's not skipped
    if ((matchesData?.myJobMatches?.matches?.length ?? 0) === 0) {
      refetchJobs();
    }
  };

  // Refetch when jobs tab becomes active
  useEffect(() => {
    if (activeTab === 'jobs') {
      console.log('Jobs tab active - refetching data');
      refetchMatches();
      refetchApplications();
      // Only refetch jobs if it's not skipped
      if ((matchesData?.myJobMatches?.matches?.length ?? 0) === 0) {
        refetchJobs();
      }
    }
  }, [activeTab, matchesData]);

  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        // Find the saved job to get its ID
        const savedJob = matchesData?.myJobMatches?.matches?.find((match: any) => match.jobPosting.id === jobId);
        if (savedJob) {
          await unsaveJob({ savedJobId: savedJob.id }).unwrap();
        }
      } else {
        await saveJob({ jobId }).unwrap();
      }
      refetch();
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
    }
  };

  const handleApply = (jobId: string) => {
    // Call onJobPress to navigate to job details
    if (onJobPress) {
      onJobPress(jobId);
    }
  };

  const handleJobPress = (jobId: string) => {
    if (onJobPress) {
      onJobPress(jobId);
    }
  };

  return (
    <>
    <CandidateLayout
      onSearchPress={() => setShowSearchModal(true)}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View className="px-6 mt-6">
          {/* Job Matches Header */}
          <View className="mb-4">
            <Text className="text-gray-900 text-2xl font-bold mb-1">
              {useMatchData ? 'Job Matches' : 'Available Jobs'}
            </Text>
            <Text className="text-gray-500 text-sm">
              {debouncedSearch
                ? `${filteredMatches.length + filteredJobs.length} results found`
                : useMatchData
                  ? `${matchesData?.myJobMatches?.totalCount || 0} jobs sorted by your best career fit`
                  : `${jobsData?.jobPostings?.length || 0} active job postings`
              }
            </Text>
          </View>

          {/* Search Bar */}
          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-4 shadow-sm">
            <SearchIcon width={20} height={20} />
            <TextInput
              placeholder="Search jobs, companies, skills..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-gray-900 text-sm"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="ml-2">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            <FilterButton
              label="All"
              isActive={activeFilter === undefined}
              onPress={() => setActiveFilter(undefined)}
            />
            <FilterButton
              label="Remote"
              isActive={activeFilter === 'Remote'}
              onPress={() => setActiveFilter('Remote')}
            />
            <FilterButton
              label="Onsite"
              isActive={activeFilter === 'Onsite'}
              onPress={() => setActiveFilter('Onsite')}
            />
          </ScrollView>

          {/* Application Tracker Link */}
          <TouchableOpacity
            onPress={onApplicationTrackerPress}
            className="bg-white rounded-xl px-4 py-3 mb-3 shadow-sm flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-gray-900 text-base font-semibold">Application Tracker</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="#437EF4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* CV Upload Link */}
          <TouchableOpacity
            onPress={onCVUploadPress}
            className="bg-white rounded-xl px-4 py-3 mb-6 shadow-sm flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text className="text-gray-900 text-base font-semibold">CV Upload</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="#437EF4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Loading State */}
          {isLoading && (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#437EF4" />
              <Text className="text-gray-500 mt-4">Loading jobs...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-600 text-sm font-semibold mb-1">Error loading jobs</Text>
              <Text className="text-red-600 text-xs">
                {JSON.stringify(error)}
              </Text>
              <TouchableOpacity 
                onPress={refetch} 
                className="bg-red-600 rounded-lg py-2 px-4 mt-3"
              >
                <Text className="text-white text-sm font-semibold text-center">Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No Search Results State */}
          {!isLoading && !error && debouncedSearch &&
           filteredMatches.length === 0 && filteredJobs.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">
                No results for "{searchQuery}"
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-3">
                Try different keywords or clear your search
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="bg-primary-blue rounded-lg py-2 px-4"
              >
                <Text className="text-white text-sm font-semibold">Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* No Jobs State */}
          {!isLoading && !error && !debouncedSearch &&
           (matchesData?.myJobMatches?.matches?.length === 0) &&
           (jobsData?.jobPostings?.length === 0 || !jobsData) && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">No Jobs Available</Text>
              <Text className="text-gray-500 text-sm text-center mb-3">
                {useMatchData
                  ? 'Complete your profile to get personalized job recommendations'
                  : 'Check back later for new opportunities'
                }
              </Text>
              <TouchableOpacity
                onPress={refetch}
                className="bg-primary-blue rounded-lg py-2 px-4"
              >
                <Text className="text-white text-sm font-semibold">Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Job Listings - Show filtered matches if available */}
          {!isLoading && useMatchData && filteredMatches.map((jobMatch: any) => (
            <JobCard
              key={jobMatch.id}
              jobMatch={jobMatch}
              onPress={handleJobPress}
              onSave={handleSaveJob}
              onApply={handleApply}
              applicationsData={applicationsData}
            />
          ))}

          {/* Fallback: Show filtered general job postings without match data */}
          {!isLoading && !useMatchData && filteredJobs.map((item: any) => {
            const job = item.jobPosting;
            // Transform job posting to match expected format
            const jobMatch = {
              id: job.id,
              matchPercentage: 0,
              jobPosting: job,
              isSaved: false,
              isApplied: false,
              recommendation: '',
              missingSkills: [],
            };
            return (
              <JobCard
                key={job.id}
                jobMatch={jobMatch}
                onPress={handleJobPress}
                onSave={handleSaveJob}
                onApply={handleApply}
                applicationsData={applicationsData}
              />
            );
          })}

          {/* Pagination */}
          {useMatchData && matchesData?.myJobMatches && 
           (matchesData.myJobMatches.hasNext || matchesData.myJobMatches.hasPrevious) && (
            <View className="flex-row justify-between items-center mb-6">
              {matchesData.myJobMatches.hasPrevious && (
                <TouchableOpacity
                  onPress={() => setPage(page - 1)}
                  className="bg-primary-blue rounded-xl py-3 px-6"
                >
                  <Text className="text-white text-sm font-semibold">Previous</Text>
                </TouchableOpacity>
              )}
              <View className="flex-1" />
              {matchesData.myJobMatches.hasNext && (
                <TouchableOpacity
                  onPress={() => setPage(page + 1)}
                  className="bg-primary-blue rounded-xl py-3 px-6"
                >
                  <Text className="text-white text-sm font-semibold">Next</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </CandidateLayout>
    <SearchModal
      visible={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      onNavigate={(route) => {
        setShowSearchModal(false);
        onSearchNavigate?.(route);
      }}
    />
    </>
  );
}
