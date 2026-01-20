import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, RefreshControl, ActivityIndicator, StyleSheet, Dimensions, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import SearchIcon from '../../../assets/images/searchGray.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import JobMatchCard, { JobMatchCardData } from '../../../components/JobMatchCard';
import ApplicationCard, { ApplicationCardData, InterviewSlotData, ConfirmedInterviewData } from '../../../components/ApplicationCard';
import FeatureGate from '../../../components/FeatureGate';
import { GoogleCalendarConnection } from '../../../components/GoogleCalendarConnection';
import {
  useGetMyJobMatchesQuery,
  useGetJobPostingsQuery,
  useGetMyApplicationsQuery,
  useGetMyProfileQuery,
  useInterviewSlotsQuery,
  useApplicationInterviewQuery,
  useIsGoogleCalendarConnectedQuery,
  useSelectInterviewSlotMutation,
  JobApplication,
  InterviewSlot
} from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

// Wrapper component that fetches interview slots and confirmed interview for applications
const ApplicationCardWithSlots = ({
  application,
  isGoogleCalendarConnected,
  isSubmittingSlot,
  onSelectSlot,
  onReschedule,
  onConnectCalendar,
  onPress,
}: {
  application: JobApplication;
  isGoogleCalendarConnected: boolean;
  isSubmittingSlot?: boolean;
  onSelectSlot?: (slotId: string, slotData: InterviewSlotData) => void;
  onReschedule?: () => void;
  onConnectCalendar?: () => void;
  onPress?: () => void;
}) => {
  const isInterviewScheduled = application.status === 'interview_scheduled' || application.status === 'interview';

  // Fetch available slots
  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useInterviewSlotsQuery(application.id, {
    skip: !isInterviewScheduled,
  });

  // Fetch confirmed interview (if any)
  const { data: interviewData, isLoading: interviewLoading } = useApplicationInterviewQuery(application.id, {
    skip: !isInterviewScheduled,
  });

  // Debug logging
  console.log('📅 ApplicationCardWithSlots Debug:', {
    applicationId: application.id,
    applicationStatus: application.status,
    isInterviewScheduled,
    slotsLoading,
    slotsError: slotsError ? JSON.stringify(slotsError) : null,
    slotsData: slotsData ? JSON.stringify(slotsData) : null,
    interviewLoading,
    interviewData: interviewData ? JSON.stringify(interviewData) : null,
  });

  // Transform available slots
  const availableSlots: InterviewSlotData[] = slotsData?.interviewSlots?.map((slot: InterviewSlot): InterviewSlotData => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    durationMinutes: slot.durationMinutes,
    status: slot.status,
  })) || [];

  // Transform confirmed interview data
  const confirmedInterview: ConfirmedInterviewData | undefined = interviewData?.applicationInterview ? {
    id: interviewData.applicationInterview.id,
    startTime: interviewData.applicationInterview.startTime!,
    endTime: interviewData.applicationInterview.endTime!,
    durationMinutes: interviewData.applicationInterview.durationMinutes!,
    status: interviewData.applicationInterview.status,
    interviewType: interviewData.applicationInterview.interviewType,
    videoCallLink: interviewData.applicationInterview.videoCallLink,
    location: interviewData.applicationInterview.location,
  } : undefined;

  // Transform to card data
  const cardData: ApplicationCardData = {
    id: application.id,
    status: application.status,
    appliedAt: application.appliedAt,
    reviewedAt: application.reviewedAt,
    rejectionReason: application.rejectionReason,
    jobPosting: {
      id: application.jobPosting.id,
      title: application.jobPosting.title,
      companyName: application.jobPosting.companyName,
      location: application.jobPosting.location,
      workMode: application.jobPosting.workMode,
    },
    jobMatch: application.jobMatch ? {
      matchPercentage: application.jobMatch.matchPercentage,
    } : undefined,
    interviewSlots: availableSlots,
    confirmedInterview,
    interviewTimezone: 'GMT+5', // TODO: Get from backend or user preferences
  };

  return (
    <ApplicationCard
      application={cardData}
      isGoogleCalendarConnected={isGoogleCalendarConnected}
      isSubmittingSlot={isSubmittingSlot}
      onSelectSlot={onSelectSlot}
      onReschedule={onReschedule}
      onConnectCalendar={onConnectCalendar}
      onPress={onPress}
    />
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface JobsScreenProps {
  onJobPress?: (jobId: string) => void;
  onApplicationTrackerPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

type TabType = 'find_jobs' | 'track_applications';
type FilterType = 'all' | 'remote' | 'onsite' | 'location' | 'categories';

export default function JobsScreen({
  onJobPress,
  onApplicationTrackerPress,
  onNotificationPress,
  onProfilePress,
}: JobsScreenProps) {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 100;

  const [activeTab, setActiveTab] = useState<TabType>('find_jobs');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Alert context
  const { showAlert } = useAlert();

  // Interview slot selection mutation
  const [selectInterviewSlot, { isLoading: isSelectingSlot }] = useSelectInterviewSlotMutation();

  // Profile data for avatar
  const { data: profileData } = useGetMyProfileQuery();
  const profilePictureUrl = profileData?.myProfile?.profilePicture || null;

  // Check Google Calendar connection status
  const { data: isGoogleCalendarConnected, refetch: refetchCalendarStatus } = useIsGoogleCalendarConnectedQuery();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get work mode based on active filter
  const getWorkMode = () => {
    if (activeFilter === 'remote') return 'remote';
    if (activeFilter === 'onsite') return 'onsite';
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
    skip: (matchesData?.myJobMatches?.matches?.length ?? 0) > 0,
  });

  // Fetch applications data
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications
  } = useGetMyApplicationsQuery({});

  // Determine which data to use
  const hasMatches = (matchesData?.myJobMatches?.matches?.length ?? 0) > 0;
  const useMatchData = hasMatches || !jobsData;
  const isLoading = matchesLoading || jobsLoading;
  const error = matchesError || jobsError;

  // Filter function for jobs
  const filterJobs = (jobs: any[], query: string) => {
    if (!query) return jobs;

    return jobs.filter((item: any) => {
      const job = item.jobPosting || item;
      const searchLower = query.toLowerCase();

      if (job.title?.toLowerCase().includes(searchLower)) return true;
      if (job.companyName?.toLowerCase().includes(searchLower)) return true;
      if (job.location?.toLowerCase().includes(searchLower)) return true;
      if (job.description?.toLowerCase().includes(searchLower)) return true;
      if (job.requiredSkills?.some((skill: string) =>
        skill.toLowerCase().includes(searchLower)
      )) return true;
      if (job.workMode?.toLowerCase().includes(searchLower)) return true;

      return false;
    });
  };

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

  const refetch = useCallback(() => {
    refetchMatches();
    refetchApplications();
    if ((matchesData?.myJobMatches?.matches?.length ?? 0) === 0) {
      refetchJobs();
    }
  }, [refetchMatches, refetchApplications, refetchJobs, matchesData]);

  const handleJobPress = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onJobPress?.(jobId);
  }, [onJobPress]);

  const handleApply = useCallback((jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJobPress?.(jobId);
  }, [onJobPress]);

  const handleSearchPress = useCallback(() => {
    // Focus on search input or open search modal
  }, []);

  const handleNotificationPress = useCallback(() => {
    onNotificationPress?.();
  }, [onNotificationPress]);

  const handleProfilePress = useCallback(() => {
    onProfilePress?.();
  }, [onProfilePress]);

  // Transform job match data to JobMatchCardData format
  const transformToCardData = (jobMatch: any): JobMatchCardData => ({
    id: jobMatch.id || jobMatch.jobPosting?.id,
    matchPercentage: parseFloat(jobMatch.matchPercentage) || 0,
    matchedSkills: jobMatch.matchedSkills || [],
    missingSkills: jobMatch.missingSkills || [],
    recommendation: jobMatch.recommendation,
    isSaved: jobMatch.isSaved,
    isApplied: jobMatch.isApplied,
    jobPosting: {
      id: jobMatch.jobPosting?.id,
      title: jobMatch.jobPosting?.title || 'Job Title',
      companyName: jobMatch.jobPosting?.companyName || 'Company',
      description: jobMatch.jobPosting?.description || '',
      location: jobMatch.jobPosting?.location || 'Location',
      workMode: jobMatch.jobPosting?.workMode || 'remote',
      jobType: jobMatch.jobPosting?.jobType || 'full_time',
      requiredSkills: jobMatch.jobPosting?.requiredSkills || [],
      salaryMin: jobMatch.jobPosting?.salaryMin,
      salaryMax: jobMatch.jobPosting?.salaryMax,
      salaryCurrency: jobMatch.jobPosting?.salaryCurrency,
    },
  });

  // Filter applications based on search
  const filteredApplications = useMemo(() => {
    const applications = applicationsData?.myApplications || [];
    if (!debouncedSearch) return applications;

    return applications.filter((app: JobApplication) => {
      const searchLower = debouncedSearch.toLowerCase();
      if (app.jobPosting.title?.toLowerCase().includes(searchLower)) return true;
      if (app.jobPosting.companyName?.toLowerCase().includes(searchLower)) return true;
      if (app.jobPosting.location?.toLowerCase().includes(searchLower)) return true;
      if (app.status?.toLowerCase().includes(searchLower)) return true;
      return false;
    });
  }, [applicationsData?.myApplications, debouncedSearch]);

  // Header info based on active tab
  const headerTitle = activeTab === 'find_jobs' ? 'Job Matches' : 'Track Applications';
  const headerSubtitle = activeTab === 'find_jobs'
    ? 'Sorted by your best career fit'
    : 'Sorted by your best career fit';

  // Combined loading state
  const isLoadingContent = activeTab === 'find_jobs' ? isLoading : applicationsLoading;

  return (
    <CandidateLayout
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      showGlassPill={true}
      profilePictureUrl={profilePictureUrl}
      onSearchPress={handleSearchPress}
      onNotificationPress={handleNotificationPress}
      onProfilePress={handleProfilePress}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={isLoadingContent}
            onRefresh={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (activeTab === 'find_jobs') {
                refetch();
              } else {
                refetchApplications();
              }
            }}
            colors={['#437EF4']}
            tintColor="#437EF4"
            progressViewOffset={HEADER_HEIGHT}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search something...."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 6L6 18M6 6L18 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'find_jobs' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('find_jobs');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'find_jobs' && styles.tabTextActive]}>
              Find Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'track_applications' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('track_applications');
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'track_applications' && styles.tabTextActive]}>
              Track Applications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips - Only show for Find Jobs tab */}
        {activeTab === 'find_jobs' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('all');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'remote' && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('remote');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === 'remote' && styles.filterChipTextActive]}>
                Remote
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'onsite' && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('onsite');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === 'onsite' && styles.filterChipTextActive]}>
                Onsite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'location' && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('location');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === 'location' && styles.filterChipTextActive]}>
                Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'categories' && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter('categories');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, activeFilter === 'categories' && styles.filterChipTextActive]}>
                Categories
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Loading State */}
        {isLoadingContent && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#437EF4" />
            <Text style={styles.loadingText}>
              {activeTab === 'find_jobs' ? 'Loading jobs...' : 'Loading applications...'}
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoadingContent && activeTab === 'find_jobs' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error loading jobs</Text>
            <Text style={styles.errorText}>Please try again</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Search Results State - Find Jobs */}
        {!isLoadingContent && !error && debouncedSearch && activeTab === 'find_jobs' &&
         filteredMatches.length === 0 && filteredJobs.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No results for "{searchQuery}"</Text>
            <Text style={styles.emptyText}>Try different keywords or clear your search</Text>
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* No Jobs State */}
        {!isLoadingContent && !error && !debouncedSearch && activeTab === 'find_jobs' &&
         filteredMatches.length === 0 && filteredJobs.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6H16L14 4H10L8 6H4C2.9 6 2 6.9 2 8V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM20 18H4V8H20V18ZM12 9C9.24 9 7 11.24 7 14C7 16.76 9.24 19 12 19C14.76 19 17 16.76 17 14C17 11.24 14.76 9 12 9ZM12 17C10.35 17 9 15.65 9 14C9 12.35 10.35 11 12 11C13.65 11 15 12.35 15 14C15 15.65 13.65 17 12 17Z"
                  fill="#9CA3AF"
                />
              </Svg>
            </View>
            <Text style={styles.emptyTitle}>No Jobs Available</Text>
            <Text style={styles.emptyText}>
              Complete your profile to get personalized job recommendations
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Job Listings */}
        {!isLoadingContent && !error && activeTab === 'find_jobs' && (filteredMatches.length > 0 || filteredJobs.length > 0) && (
          <View style={styles.jobsList}>
            {/* Show matched jobs */}
            {useMatchData && filteredMatches.map((jobMatch: any) => (
              <View key={jobMatch.id || jobMatch.jobPosting?.id} style={styles.cardWrapper}>
                <JobMatchCard
                  data={transformToCardData(jobMatch)}
                  width={SCREEN_WIDTH - 40}
                  onViewDetails={() => handleJobPress(jobMatch.jobPosting?.id)}
                  onApply={() => handleApply(jobMatch.jobPosting?.id)}
                />
              </View>
            ))}

            {/* Fallback: Show general job postings */}
            {!useMatchData && filteredJobs.map((item: any) => {
              const job = item.jobPosting;
              const jobMatch = {
                id: job.id,
                matchPercentage: 0,
                matchedSkills: [],
                missingSkills: [],
                jobPosting: job,
                isSaved: false,
                isApplied: false,
              };
              return (
                <View key={job.id} style={styles.cardWrapper}>
                  <JobMatchCard
                    data={transformToCardData(jobMatch)}
                    width={SCREEN_WIDTH - 40}
                    onViewDetails={() => handleJobPress(job.id)}
                    onApply={() => handleApply(job.id)}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Track Applications Tab - Entire section gated by application_tracker feature */}
        {!isLoadingContent && activeTab === 'track_applications' && (
          <FeatureGate
            featureId="application_tracker"
            featureName="Application Tracker"
            showLockedState={true}
          >
            {/* No Search Results State */}
            {debouncedSearch && filteredApplications.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No results for "{searchQuery}"</Text>
                <Text style={styles.emptyText}>Try different keywords or clear your search</Text>
                <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* No Applications State */}
            {!debouncedSearch && filteredApplications.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM17 12H7V14H17V12ZM17 8H7V10H17V8ZM13 16H7V18H13V16Z"
                      fill="#9CA3AF"
                    />
                  </Svg>
                </View>
                <Text style={styles.emptyTitle}>No Applications Yet</Text>
                <Text style={styles.emptyText}>
                  Start applying to jobs to track your application status here
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab('find_jobs');
                  }}
                >
                  <Text style={styles.refreshText}>Find Jobs</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Applications List */}
            {filteredApplications.length > 0 && (
              <View style={styles.applicationsList}>
                {filteredApplications.map((application: JobApplication) => (
                  <ApplicationCardWithSlots
                    key={application.id}
                    application={application}
                    isGoogleCalendarConnected={isGoogleCalendarConnected || false}
                    isSubmittingSlot={isSelectingSlot}
                    onSelectSlot={async (slotId, slotData) => {
                      console.log('Selected slot:', slotId, 'for application:', application.id);
                      try {
                        const result = await selectInterviewSlot({ slotId }).unwrap();
                        console.log('Select interview slot result:', result);

                        if (result.selectInterviewSlot.__typename === 'InterviewSuccessType') {
                          showAlert({
                            type: 'success',
                            title: 'Interview Scheduled!',
                            message: 'Your interview has been confirmed and added to your Google Calendar.',
                            buttons: [{ text: 'OK', style: 'default' }],
                          });
                          // Refetch applications to get updated interview data
                          refetchApplications();
                        } else {
                          throw new Error(result.selectInterviewSlot.message || 'Failed to schedule interview');
                        }
                      } catch (error: any) {
                        console.error('Failed to select interview slot:', error);
                        showAlert({
                          type: 'error',
                          title: 'Scheduling Failed',
                          message: error.message || 'Failed to schedule the interview. Please try again.',
                          buttons: [{ text: 'OK', style: 'default' }],
                        });
                      }
                    }}
                    onReschedule={() => {
                      console.log('Reschedule requested for application:', application.id);
                      showAlert({
                        type: 'info',
                        title: 'Reschedule Interview',
                        message: 'Please contact the recruiter to reschedule your interview.',
                        buttons: [{ text: 'OK', style: 'default' }],
                      });
                    }}
                    onConnectCalendar={() => {
                      setShowCalendarModal(true);
                    }}
                    onPress={() => handleJobPress(application.jobPosting.id)}
                  />
                ))}
              </View>
            )}
          </FeatureGate>
        )}

        {/* Pagination */}
        {useMatchData && matchesData?.myJobMatches?.hasNext && !isLoadingContent && activeTab === 'find_jobs' && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => setPage(page + 1)}
            activeOpacity={0.7}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Google Calendar Connection Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.calendarModalContent}
          >
            {/* Header */}
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Connect Calendar</Text>
              <Text style={styles.calendarModalSubtitle}>Required to select interview time slots</Text>
            </View>

            {/* Calendar Connection Component */}
            <View style={styles.calendarConnectionWrapper}>
              <GoogleCalendarConnection
                onConnectionChange={(connected) => {
                  if (connected) {
                    setShowCalendarModal(false);
                    refetchCalendarStatus();
                  }
                }}
              />
            </View>

            {/* Footer */}
            <View style={styles.calendarModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCalendarModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CandidateLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 12,
    // Shadow
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#437EF4',
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContent: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#437EF4',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  clearSearchButton: {
    backgroundColor: '#437EF4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    backgroundColor: '#437EF4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobsList: {
    gap: 16,
  },
  applicationsList: {
    gap: 0,
  },
  cardWrapper: {
    marginBottom: 0,
  },
  loadMoreButton: {
    backgroundColor: '#437EF4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModalContent: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  calendarModalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  calendarModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  calendarModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  calendarConnectionWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  calendarModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
