import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassSectionCard } from '../../../components/ui/GlassSectionCard';

// Glass design color constants
const GLASS_COLORS = {
  cardBg: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',
  filterActive: 'rgba(67, 126, 244, 0.95)',
  filterInactive: 'rgba(255, 255, 255, 0.8)',
  inputBg: 'rgba(255, 255, 255, 0.6)',
  statusPending: 'rgba(255, 204, 0, 0.9)',
  statusReviewed: 'rgba(67, 126, 244, 0.9)',
  statusShortlisted: 'rgba(16, 185, 129, 0.9)',
  statusInterview: 'rgba(139, 92, 246, 0.9)',
  statusOffered: 'rgba(16, 185, 129, 0.9)',
  statusRejected: 'rgba(239, 68, 68, 0.9)',
  statusWithdrawn: 'rgba(107, 114, 128, 0.9)',
  statusAccepted: 'rgba(16, 185, 129, 0.9)',
};
import {
  useGetJobApplicationsQuery,
  useGetJobPostingQuery,
  useShortlistApplicationMutation,
  useRejectApplicationMutation,
  useIsGoogleCalendarConnectedQuery,
  useCreateInterviewSlotsMutation,
} from '../../../services/api';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';
import { useAlert } from '../../../contexts/AlertContext';
import { GoogleCalendarConnection } from '../../../components/GoogleCalendarConnection';
import DateTimePicker from '@react-native-community/datetimepicker';

// Helper functions for status colors and text
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: GLASS_COLORS.statusPending,
    reviewed: GLASS_COLORS.statusReviewed,
    shortlisted: GLASS_COLORS.statusShortlisted,
    interview: GLASS_COLORS.statusInterview,
    offered: GLASS_COLORS.statusOffered,
    rejected: GLASS_COLORS.statusRejected,
    withdrawn: GLASS_COLORS.statusWithdrawn,
    accepted: GLASS_COLORS.statusAccepted,
  };
  return colors[status] || 'rgba(156, 163, 175, 0.9)';
};

const getStatusText = (status: string) => {
  if (status === 'pending') return 'Submitted';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

interface ApplicationCardProps {
  application: any;
  onPress: (applicationId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onPress }) => {

  const matchPercentage = application.jobMatch?.matchPercentage
    ? Math.round(parseFloat(application.jobMatch.matchPercentage))
    : 0;

  const candidateName = [
    application.candidate?.user?.firstName?.trim(),
    application.candidate?.user?.lastName?.trim()
  ].filter(Boolean).join(' ') || 'Candidate';

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(application.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={glassStyles.applicationCard}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          style={[glassStyles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}
        >
          <Text className="text-white text-xs font-bold">
            {getStatusText(application.status)}
          </Text>
        </View>
        <View style={glassStyles.matchBadge}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#10B981" />
          </Svg>
          <Text className="text-green-600 text-xs font-semibold">{matchPercentage}% Match</Text>
        </View>
      </View>

      {/* Candidate Info */}
      <Text className="text-gray-900 text-lg font-bold mb-1">
        {candidateName}
      </Text>
      <Text className="text-gray-500 text-xs mb-3">
        {application.candidate?.user?.email}
      </Text>

      {/* Strengths */}
      {application.jobMatch?.strengths && application.jobMatch.strengths.length > 0 && (
        <View style={glassStyles.strengthsBox}>
          <Text className="text-green-700 text-xs font-semibold mb-1">Top Strengths:</Text>
          <Text className="text-green-700 text-xs">
            {application.jobMatch.strengths.slice(0, 2).join(' • ')}
          </Text>
        </View>
      )}

      {/* Applied Date */}
      <View style={glassStyles.dateRow}>
        <Text className="text-gray-400 text-xs">
          Applied: {new Date(application.appliedAt).toLocaleDateString()}
        </Text>
        {application.reviewedAt && (
          <Text className="text-gray-400 text-xs">
            Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface JobApplicationsScreenProps {
  jobId: string;
  onBack?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function JobApplicationsScreen({ jobId, onBack, activeTab = 'dashboard', onTabChange }: JobApplicationsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  
  // Interview scheduling states
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showCalendarCheck, setShowCalendarCheck] = useState(false);
  const [interviewType, setInterviewType] = useState<'in_person' | 'phone' | 'video_call'>('video_call');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(60);
  const [interviewSlots, setInterviewSlots] = useState<Array<{ startTime: Date; endTime: Date }>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [tempDateTime, setTempDateTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  
  const { showAlert } = useAlert();

  const [shortlistApplication, { isLoading: isShortlisting }] = useShortlistApplicationMutation();
  const [rejectApplication, { isLoading: isRejecting }] = useRejectApplicationMutation();
  const { data: isCalendarConnected, refetch: refetchCalendarStatus } = useIsGoogleCalendarConnectedQuery();
  const [createInterviewSlots, { isLoading: isCreatingSlots }] = useCreateInterviewSlotsMutation();

  console.log('JobApplicationsScreen - jobId:', jobId);
  console.log('JobApplicationsScreen - statusFilter:', statusFilter);

  const { data: jobData } = useGetJobPostingQuery({ jobId });
  const { data, isLoading, error, refetch } = useGetJobApplicationsQuery({
    jobId,
    status: statusFilter,
  });

  const job = jobData?.jobPosting;
  // Filter out withdrawn applications
  const applications = (data?.jobApplications || []).filter((app: any) => app.status !== 'withdrawn');

  console.log('JobApplicationsScreen - applications data:', data);
  console.log('JobApplicationsScreen - applications count:', applications.length);
  console.log('JobApplicationsScreen - isLoading:', isLoading);
  console.log('JobApplicationsScreen - error:', error);

  const handleApplicationPress = (applicationId: string) => {
    const application = applications.find((app: any) => app.id === applicationId);
    if (application) {
      setSelectedApplication(application);
      setShowDetailsModal(true);
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

  const handleShortlist = async () => {
    if (!selectedApplication) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await shortlistApplication({
        applicationId: selectedApplication.id,
        recruiterNotes: recruiterNotes || undefined,
      }).unwrap();

      console.log('Shortlist application result:', result);

      if (result.shortlistApplication.__typename === 'JobApplicationSuccessType' && result.shortlistApplication.success) {
        // Update selectedApplication immediately with new status using functional update
        const currentAppId = selectedApplication.id;
        const currentNotes = recruiterNotes;

        setSelectedApplication((prev: any) => prev ? {
          ...prev,
          status: 'shortlisted',
          recruiterNotes: currentNotes || prev.recruiterNotes,
        } : prev);

        // Clear input fields
        setRecruiterNotes('');

        // Refetch data in background
        refetch().then((refetchResult) => {
          console.log('Refetch completed after shortlist');
          if (refetchResult.data?.jobApplications) {
            const freshApplication = refetchResult.data.jobApplications.find(
              (app: any) => app.id === currentAppId
            );
            if (freshApplication) {
              console.log('Setting fresh application data:', freshApplication.status);
              setSelectedApplication(freshApplication);
            }
          }
        });

        showAlert({
          type: 'success',
          title: 'Success',
          message: result.shortlistApplication.message || 'Application shortlisted successfully!',
        });
      } else if (result.shortlistApplication.__typename === 'ErrorType') {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.shortlistApplication.message || 'Failed to shortlist application',
        });
      }
    } catch (error: any) {
      console.error('Shortlist application error:', error);
      
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to shortlist application',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const result = await rejectApplication({
        applicationId: selectedApplication.id,
        rejectionReason: rejectionReason || undefined,
        recruiterNotes: recruiterNotes || undefined,
      }).unwrap();

      console.log('Reject application result:', result);

      if (result.rejectApplication.__typename === 'JobApplicationSuccessType' && result.rejectApplication.success) {
        // Close rejection modal
        setShowRejectModal(false);

        // Capture current values before async operations
        const currentAppId = selectedApplication.id;
        const currentRejectionReason = rejectionReason;
        const currentNotes = recruiterNotes;

        // Update selectedApplication immediately with new status using functional update
        setSelectedApplication((prev: any) => prev ? {
          ...prev,
          status: 'rejected',
          rejectionReason: currentRejectionReason || '',
          recruiterNotes: currentNotes || prev.recruiterNotes,
        } : prev);

        // Clear input fields
        setRejectionReason('');
        setRecruiterNotes('');

        // Refetch data in background
        refetch().then((refetchResult) => {
          console.log('Refetch completed after reject');
          if (refetchResult.data?.jobApplications) {
            const freshApplication = refetchResult.data.jobApplications.find(
              (app: any) => app.id === currentAppId
            );
            if (freshApplication) {
              console.log('Setting fresh application data:', freshApplication.status);
              setSelectedApplication(freshApplication);
            }
          }
        });

        showAlert({
          type: 'success',
          title: 'Success',
          message: result.rejectApplication.message || 'Application rejected successfully',
        });
      } else if (result.rejectApplication.__typename === 'ErrorType') {
        // Close rejection modal on error
        setShowRejectModal(false);
        
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.rejectApplication.message || 'Failed to reject application',
        });
      }
    } catch (error: any) {
      console.error('Reject application error:', error);
      
      // Close rejection modal on error
      setShowRejectModal(false);
      
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to reject application',
      });
    }
  };

  const statusOptions = [
    { label: 'All', value: undefined },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Interview', value: 'interview' },
    { label: 'Offered', value: 'offered' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <TalentPartnerLayout
      title="Applications"
      subtitle={job ? job.title : 'Job Applications'}
    >
      {/* Back Button */}
      {onBack && (
        <View className="px-5 pt-4">
          <TouchableOpacity onPress={handleBack} className="flex-row items-center mb-3">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path
                d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                fill="#437EF4"
              />
            </Svg>
            <Text className="text-primary-blue font-semibold">Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="flex-1">
        {/* Stats Bar */}
        <View className="px-5 pb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-700 text-sm font-medium">
              {`${applications.length} ${applications.length === 1 ? 'Application' : 'Applications'}`}
            </Text>
          </View>
        </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="p-5">
          {/* Status Filters - Glass Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleFilterChange(option.value)}
                style={[
                  glassStyles.filterPill,
                  statusFilter === option.value
                    ? glassStyles.filterPillActive
                    : glassStyles.filterPillInactive,
                ]}
              >
                <Text
                  style={[
                    glassStyles.filterPillText,
                    statusFilter === option.value && glassStyles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Loading State */}
          {isLoading && !data && (
            <GlassSectionCard style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#437EF4" />
              <Text className="text-gray-500 mt-4">Loading applications...</Text>
            </GlassSectionCard>
          )}

          {/* Error State */}
          {error && (
            <GlassSectionCard style={glassStyles.errorBox}>
              <Text className="text-red-600 text-sm">
                Error loading applications. Please try again.
              </Text>
            </GlassSectionCard>
          )}

          {/* No Applications State */}
          {!isLoading && applications.length === 0 && (
            <GlassSectionCard style={{ alignItems: 'center', padding: 24 }}>
              <Text className="text-gray-600 text-base font-semibold mb-2">
                No Applications Yet
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                {statusFilter
                  ? `No ${statusFilter} applications for this job`
                  : 'This job posting hasn\'t received any applications yet'}
              </Text>
            </GlassSectionCard>
          )}

          {/* Applications List */}
          {applications.map((application: any) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onPress={handleApplicationPress}
            />
          ))}

          {/* Bottom padding for navbar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Application Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={glassStyles.modalOverlay}>
          <View style={[glassStyles.modalContainer, { maxHeight: Dimensions.get('window').height * 0.9 }]}>
            <SafeAreaView className="flex-1" key={`${selectedApplication?.id}-${selectedApplication?.status}`}>
              {/* Modal Header with Gradient */}
              <LinearGradient
                colors={['#437EF4', '#3B70E2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-5 py-4 rounded-t-3xl"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bold">Application Details</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowDetailsModal(false);
                    }}
                    className="bg-white/20 rounded-full p-2"
                  >
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        fill="white"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <ScrollView className="flex-1 px-5 py-4" key={selectedApplication?.status}>
                {selectedApplication && (
                  <>
                    {/* Candidate Info Card */}
                    <GlassSectionCard style={glassStyles.candidateInfoCard}>
                      {/* Status Badge */}
                      <View style={{ marginBottom: 12 }}>
                        <View style={[glassStyles.statusBadge, { backgroundColor: getStatusColor(selectedApplication.status), alignSelf: 'flex-start' }]}>
                          <Text className="text-white text-xs font-bold">
                            {getStatusText(selectedApplication.status)}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-gray-900 text-2xl font-bold mb-3">
                            {selectedApplication.candidate?.user?.firstName || ''}{' '}
                            {selectedApplication.candidate?.user?.lastName || ''}
                          </Text>
                        </View>
                      </View>

                      <View style={glassStyles.emailRow}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#437EF4" />
                        </Svg>
                        <Text className="text-primary-blue text-sm font-medium flex-1" numberOfLines={1}>
                          {selectedApplication.candidate?.user?.email || ''}
                        </Text>
                      </View>
                    </GlassSectionCard>

                    {/* Match Score with Enhanced UI */}
                    {selectedApplication.jobMatch && (
                      <GlassSectionCard style={glassStyles.matchAnalysisCard}>
                        <Text className="text-gray-900 text-lg font-bold mb-3">
                          Match Analysis
                        </Text>

                        {/* Match Percentage Circle */}
                        <View style={glassStyles.matchCircleContainer}>
                          <LinearGradient
                            colors={['#437EF4', '#3B70E2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={glassStyles.matchCircle}
                          >
                            <Text className="text-white text-3xl font-bold">
                              {`${Math.round(parseFloat(selectedApplication.jobMatch.matchPercentage) || 0)}%`}
                            </Text>
                          </LinearGradient>
                          <Text className="text-gray-600 text-sm font-medium mt-3">Overall Match Score</Text>
                        </View>

                        {/* Score Breakdown */}
                        <View style={glassStyles.scoreBreakdownBox}>
                          <Text className="text-gray-900 text-sm font-bold mb-3">Score Breakdown</Text>
                          <View className="space-y-2">
                            <View style={glassStyles.scoreRow}>
                              <Text className="text-gray-700 text-sm">Skills Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.skillsMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View style={glassStyles.scoreRow}>
                              <Text className="text-gray-700 text-sm">Experience Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.experienceMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View style={glassStyles.scoreRow}>
                              <Text className="text-gray-700 text-sm">Qualifications Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.qualificationsMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View style={[glassStyles.scoreRow, { borderBottomWidth: 0 }]}>
                              <Text className="text-gray-700 text-sm">Location Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.locationMatchScore) || 0)}%
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Matched Skills */}
                        {selectedApplication.jobMatch.matchedSkills &&
                          selectedApplication.jobMatch.matchedSkills.length > 0 && (
                            <View style={glassStyles.skillsBox}>
                              <Text className="text-gray-900 text-sm font-bold mb-3">Matched Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.matchedSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} style={glassStyles.skillBadgeGreen}>
                                      <Text className="text-green-700 text-xs font-medium">{skill}</Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          )}

                        {/* Missing Skills */}
                        {selectedApplication.jobMatch.missingSkills &&
                          selectedApplication.jobMatch.missingSkills.length > 0 && (
                            <View style={glassStyles.skillsBox}>
                              <Text className="text-gray-900 text-sm font-bold mb-3">Missing Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.missingSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} style={glassStyles.skillBadgeRed}>
                                      <Text className="text-red-700 text-xs font-medium">{skill}</Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          )}

                        {/* Extra Skills */}
                        {selectedApplication.jobMatch.extraSkills &&
                          selectedApplication.jobMatch.extraSkills.length > 0 && (
                            <View style={glassStyles.skillsBox}>
                              <Text className="text-gray-900 text-sm font-bold mb-3">Additional Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.extraSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} style={glassStyles.skillBadgeBlue}>
                                      <Text className="text-blue-700 text-xs font-medium">{skill}</Text>
                                    </View>
                                  )
                                )}
                              </View>
                            </View>
                          )}

                        {/* Strengths */}
                        {selectedApplication.jobMatch.strengths &&
                          selectedApplication.jobMatch.strengths.length > 0 && (
                            <View style={glassStyles.skillsBox}>
                              <Text className="text-gray-900 text-sm font-bold mb-3">
                                Key Strengths
                              </Text>
                              {selectedApplication.jobMatch.strengths.map(
                                (strength: string, index: number) => (
                                  <View key={index} style={glassStyles.strengthItem}>
                                    <View style={glassStyles.strengthIcon}>
                                      <Text className="text-white text-xs font-bold">✓</Text>
                                    </View>
                                    <Text className="text-gray-700 text-sm flex-1 leading-5">{strength}</Text>
                                  </View>
                                )
                              )}
                            </View>
                          )}

                        {/* Weaknesses */}
                        {selectedApplication.jobMatch.weaknesses &&
                          selectedApplication.jobMatch.weaknesses.length > 0 && (
                            <View style={glassStyles.skillsBox}>
                              <Text className="text-gray-900 text-sm font-bold mb-3">
                                Areas for Improvement
                              </Text>
                              {selectedApplication.jobMatch.weaknesses.map(
                                (weakness: string, index: number) => (
                                  <View key={index} style={glassStyles.weaknessItem}>
                                    <View style={glassStyles.weaknessIcon}>
                                      <Text className="text-white text-xs font-bold">!</Text>
                                    </View>
                                    <Text className="text-gray-700 text-sm flex-1 leading-5">{weakness}</Text>
                                  </View>
                                )
                              )}
                            </View>
                          )}

                        {/* Recommendation */}
                        {selectedApplication.jobMatch.recommendation && (
                          <View style={glassStyles.recommendationBox}>
                            <Text className="text-gray-900 text-sm font-bold mb-2">AI Recommendation</Text>
                            <Text className="text-gray-700 text-sm leading-5">
                              {selectedApplication.jobMatch.recommendation}
                            </Text>
                          </View>
                        )}
                      </GlassSectionCard>
                    )}

                    {/* Cover Letter with Better Styling */}
                    {selectedApplication.coverLetter && selectedApplication.coverLetter.trim() !== '' && (
                      <GlassSectionCard style={glassStyles.coverLetterCard}>
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#8B5CF6" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Cover Letter
                          </Text>
                        </View>
                        <View style={glassStyles.coverLetterContent}>
                          <Text className="text-gray-700 text-sm leading-6">
                            {selectedApplication.coverLetter}
                          </Text>
                        </View>
                      </GlassSectionCard>
                    )}

                    {/* Application Timeline with Status */}
                    <GlassSectionCard style={glassStyles.timelineCard}>
                      <View className="flex-row items-center mb-4">
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#F59E0B" />
                        </Svg>
                        <Text className="text-gray-900 text-lg font-bold">
                          Timeline & Status
                        </Text>
                      </View>

                      <View style={glassStyles.timelineContent}>
                        <View style={glassStyles.timelineItem}>
                          <View style={[glassStyles.timelineIcon, { backgroundColor: '#10B981' }]}>
                            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white" />
                            </Svg>
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 text-sm font-semibold">Application Submitted</Text>
                            <Text className="text-gray-500 text-xs mt-0.5">
                              {new Date(selectedApplication.appliedAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                        </View>

                        {selectedApplication.reviewedAt && (
                          <View style={[glassStyles.timelineItem, { borderBottomWidth: 0 }]}>
                            <View style={[glassStyles.timelineIcon, { backgroundColor: '#437EF4' }]}>
                              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <Path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="white" />
                              </Svg>
                            </View>
                            <View className="flex-1">
                              <Text className="text-gray-900 text-sm font-semibold">Application Reviewed</Text>
                              <Text className="text-gray-500 text-xs mt-0.5">
                                {new Date(selectedApplication.reviewedAt).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </GlassSectionCard>

                    {/* Rejection Reason */}
                    {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                      <GlassSectionCard style={glassStyles.rejectionCard}>
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Rejection Reason
                          </Text>
                        </View>
                        <View style={glassStyles.rejectionContent}>
                          <Text className="text-gray-700 text-sm leading-5">
                            {selectedApplication.rejectionReason}
                          </Text>
                        </View>
                      </GlassSectionCard>
                    )}

                    {/* Recruiter Notes */}
                    {selectedApplication.recruiterNotes && selectedApplication.recruiterNotes.trim() !== '' && (
                      <GlassSectionCard style={glassStyles.notesCard}>
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#F59E0B" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Recruiter Notes
                          </Text>
                        </View>
                        <View style={glassStyles.notesContent}>
                          <Text className="text-gray-700 text-sm leading-5">
                            {selectedApplication.recruiterNotes}
                          </Text>
                        </View>
                      </GlassSectionCard>
                    )}
                  </>
                )}
              </ScrollView>

              {/* Action Buttons - Compact Layout */}
              <View style={glassStyles.actionButtonsContainer}>
                {/* Primary Actions Row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <View style={{ flex: 1 }}>
                    <GlassButton
                      text={selectedApplication?.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
                      colors={selectedApplication?.status === 'shortlisted' ? ['#9CA3AF', '#9CA3AF'] : ['#10B981', '#34D399']}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        showAlert({
                          type: 'success',
                          title: 'Shortlist Candidate',
                          message: 'Move this candidate to your shortlist?',
                          buttons: [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Shortlist', style: 'default', onPress: () => {
                              handleShortlist();
                            }}
                          ]
                        });
                      }}
                      disabled={isShortlisting || selectedApplication?.status === 'shortlisted'}
                      fullWidth
                      height={44}
                      textStyle={{ fontSize: 14 }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <GlassButton
                      text="Interview"
                      colors={['#437EF4', '#5B8AF5']}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        if (!isCalendarConnected) {
                          setShowCalendarCheck(true);
                        } else {
                          setInterviewType('video_call');
                          setLocation('');
                          setDuration(60);
                          setInterviewSlots([]);
                          setShowInterviewModal(true);
                        }
                      }}
                      fullWidth
                      height={44}
                      textStyle={{ fontSize: 14 }}
                    />
                  </View>
                </View>

                {/* Secondary Actions Row */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <GlassButton
                      text="Close"
                      colors={['#F3F4F6', '#E5E7EB']}
                      textStyle={{ color: '#374151', fontSize: 14 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowDetailsModal(false);
                      }}
                      fullWidth
                      height={40}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <GlassButton
                      text={selectedApplication?.status === 'rejected' ? 'Rejected' : 'Reject'}
                      colors={selectedApplication?.status === 'rejected' ? ['#F3F4F6', '#E5E7EB'] : ['#EF4444', '#F87171']}
                      textStyle={{ color: selectedApplication?.status === 'rejected' ? '#9CA3AF' : '#FFFFFF', fontSize: 14 }}
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        setShowRejectModal(true);
                      }}
                      disabled={isRejecting || selectedApplication?.status === 'rejected'}
                      fullWidth
                      height={40}
                    />
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={glassStyles.centeredModalOverlay}>
          <GlassSectionCard style={glassStyles.rejectModalContent}>
            <View style={glassStyles.rejectModalHeader}>
              <Text className="text-gray-900 text-xl font-bold">Reject Application</Text>
              <Text className="text-gray-500 text-sm mt-1">Provide a reason for rejection (optional)</Text>
            </View>

            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text className="text-gray-700 text-sm font-medium mb-2">Rejection Reason</Text>
                <TextInput
                  style={glassStyles.glassTextInput}
                  placeholder="e.g., Not enough experience"
                  placeholderTextColor="#9CA3AF"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text className="text-gray-700 text-sm font-medium mb-2">Internal Notes (Optional)</Text>
                <TextInput
                  style={glassStyles.glassTextInput}
                  placeholder="Notes for your team..."
                  placeholderTextColor="#9CA3AF"
                  value={recruiterNotes}
                  onChangeText={setRecruiterNotes}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={glassStyles.rejectModalFooter}>
              <View style={{ flex: 1 }}>
                <GlassButton
                  text="Cancel"
                  colors={['#F3F4F6', '#E5E7EB']}
                  textStyle={{ color: '#374151' }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRecruiterNotes('');
                  }}
                  fullWidth
                  height={44}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton
                  text={isRejecting ? 'Rejecting...' : 'Reject'}
                  colors={['#EF4444', '#F87171']}
                  onPress={handleReject}
                  disabled={isRejecting}
                  loading={isRejecting}
                  fullWidth
                  height={44}
                />
              </View>
            </View>
          </GlassSectionCard>
        </View>
      </Modal>

      {/* Calendar Connection Check Modal */}
      <Modal
        visible={showCalendarCheck}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarCheck(false)}
      >
        <TouchableOpacity
          style={glassStyles.centeredModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarCheck(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={glassStyles.calendarModalContent}
          >
            {/* Header */}
            <View style={glassStyles.calendarModalHeader}>
              <Text style={glassStyles.calendarModalTitle}>Connect Calendar</Text>
              <Text style={glassStyles.calendarModalSubtitle}>Required for interview scheduling</Text>
            </View>

            {/* Calendar Connection Component */}
            <View style={glassStyles.calendarConnectionWrapper}>
              <GoogleCalendarConnection
                onConnectionChange={(connected) => {
                  if (connected) {
                    setShowCalendarCheck(false);
                    refetchCalendarStatus();
                    setTimeout(() => {
                      setInterviewType('video_call');
                      setLocation('');
                      setDuration(60);
                      setInterviewSlots([]);
                      setShowInterviewModal(true);
                    }, 500);
                  }
                }}
              />
            </View>

            {/* Footer */}
            <View style={glassStyles.calendarModalFooter}>
              <TouchableOpacity
                style={glassStyles.cancelButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCalendarCheck(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={glassStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Interview Scheduling Modal */}
      <Modal
        visible={showInterviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterviewModal(false)}
      >
        <View style={glassStyles.modalOverlay}>
          <SafeAreaView className="flex-1">
            <View style={glassStyles.interviewModalContainer}>
              {/* Header */}
              <View style={glassStyles.interviewModalHeader}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-xl font-bold">Schedule Interview</Text>
                  <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowInterviewModal(false);
                  }} style={glassStyles.closeButton}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#6B7280"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-sm mt-1">
                  Create time slots for {selectedApplication?.candidate?.user?.firstName} to choose from
                </Text>
              </View>

              <ScrollView className="flex-1 px-5 py-4">
                {/* Interview Type */}
                <View style={{ marginBottom: 16 }}>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Interview Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[
                      { value: 'video_call', label: 'Video Call', icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z' },
                      { value: 'phone', label: 'Phone', icon: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
                      { value: 'in_person', label: 'In Person', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          glassStyles.interviewTypeButton,
                          interviewType === type.value && glassStyles.interviewTypeButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setInterviewType(type.value as any);
                        }}
                      >
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 4 }}>
                          <Path d={type.icon} fill={interviewType === type.value ? '#437EF4' : '#9CA3AF'}/>
                        </Svg>
                        <Text style={[
                          glassStyles.interviewTypeText,
                          interviewType === type.value && glassStyles.interviewTypeTextActive,
                        ]}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Location */}
                {(interviewType === 'in_person' || interviewType === 'phone') && (
                  <View style={{ marginBottom: 16 }}>
                    <Text className="text-gray-700 text-sm font-semibold mb-2">
                      {interviewType === 'in_person' ? 'Location' : 'Phone Number'}
                    </Text>
                    <TextInput
                      style={glassStyles.glassTextInput}
                      placeholder={interviewType === 'in_person' ? 'Office address' : '+1 (555) 123-4567'}
                      placeholderTextColor="#9CA3AF"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                )}

                {/* Duration */}
                <View style={{ marginBottom: 16 }}>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Duration (minutes)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[30, 45, 60, 90].map((min) => (
                      <TouchableOpacity
                        key={min}
                        style={[
                          glassStyles.durationButton,
                          duration === min && glassStyles.durationButtonActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setDuration(min);
                        }}
                      >
                        <Text style={[
                          glassStyles.durationText,
                          duration === min && glassStyles.durationTextActive,
                        ]}>{min}m</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time Slots */}
                <View style={{ marginBottom: 16 }}>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Available Time Slots</Text>
                  <Text className="text-gray-500 text-xs mb-3">Add 2-4 time options for the candidate</Text>

                  {interviewSlots.map((slot, index) => (
                    <View key={index} style={glassStyles.timeSlotRow}>
                      <View style={glassStyles.timeSlotBox}>
                        <Text className="text-gray-900 text-sm font-medium">
                          {slot.startTime.toLocaleDateString()} at {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={glassStyles.removeSlotButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setInterviewSlots(interviewSlots.filter((_, i) => i !== index));
                        }}
                      >
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#EF4444"/>
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={glassStyles.addSlotButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow);
                      setSelectedHour(10);
                      setSelectedMinute(0);
                      setIsAM(true);
                      setCurrentSlotIndex(interviewSlots.length);
                      setShowDatePicker(true);
                    }}
                  >
                    <Text style={glassStyles.addSlotButtonText}>+ Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Custom Date Time Picker Modal */}
              {showDatePicker && (
                <Modal
                  transparent
                  animationType="slide"
                  visible={showDatePicker}
                  onRequestClose={() => {
                    setShowDatePicker(false);
                    setCurrentSlotIndex(null);
                  }}
                >
                  <View className="flex-1 bg-black/70 justify-end">
                    <SafeAreaView className="bg-white rounded-t-3xl" edges={['bottom']}>
                      {/* Drag Indicator */}
                      <View className="items-center pt-3 pb-2">
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
                      </View>

                      {/* Header */}
                      <LinearGradient
                        colors={['#437EF4', '#3B70E2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="mx-5 mb-4 rounded-2xl p-5"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="bg-white/20 rounded-full p-2.5 mr-3">
                              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="white" />
                              </Svg>
                            </View>
                            <View className="flex-1">
                              <Text className="text-white text-xl font-bold">Pick Date & Time</Text>
                              <Text className="text-white/80 text-sm mt-0.5">Interview slot</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setShowDatePicker(false);
                              setCurrentSlotIndex(null);
                            }}
                            className="bg-white/20 rounded-full p-2"
                          >
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="white"/>
                            </Svg>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>

                      <ScrollView className="max-h-[500px]">
                        {/* Date Selection */}
                        <View className="px-5 mb-4">
                          <Text className="text-gray-900 text-base font-bold mb-3">📅 Select Date</Text>
                          <View className="bg-gray-50 rounded-2xl p-2">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {Array.from({ length: 6 }, (_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                const isSelected = selectedDate.toDateString() === date.toDateString();
                                return (
                                  <TouchableOpacity
                                    key={i}
                                    onPress={() => {
                                      Haptics.selectionAsync();
                                      setSelectedDate(date);
                                    }}
                                    className={`min-w-[70px] mx-1 rounded-xl p-3 items-center ${
                                      isSelected ? 'bg-blue-500' : 'bg-white'
                                    }`}
                                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: isSelected ? 0.2 : 0.05, shadowRadius: 3, elevation: isSelected ? 3 : 1 }}
                                  >
                                    <Text className={`text-xs font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </Text>
                                    <Text className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                      {date.getDate()}
                                    </Text>
                                    <Text className={`text-xs font-medium mt-0.5 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                      {date.toLocaleDateString('en-US', { month: 'short' })}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        </View>

                        {/* Time Selection */}
                        <View className="px-5 mb-4">
                          <Text className="text-gray-900 text-base font-bold mb-3">🕐 Select Time</Text>
                          
                          <View className="flex-row items-center justify-center gap-3 mb-4">
                            {/* Hour Picker */}
                            <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                              <Text className="text-gray-500 text-xs font-semibold mb-2 text-center">Hour</Text>
                              <ScrollView 
                                style={{ height: 150 }} 
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                              >
                                {Array.from({ length: 12 }, (_, i) => {
                                  const hour = i === 0 ? 12 : i;
                                  const isSelected = selectedHour === hour;
                                  return (
                                    <TouchableOpacity
                                      key={i}
                                      onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedHour(hour);
                                      }}
                                      className={`py-3 rounded-xl mb-2 ${isSelected ? 'bg-blue-500' : 'bg-white'}`}
                                    >
                                      <Text className={`text-center text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        {hour.toString().padStart(2, '0')}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>

                            <Text className="text-gray-400 text-3xl font-bold">:</Text>

                            {/* Minute Picker */}
                            <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                              <Text className="text-gray-500 text-xs font-semibold mb-2 text-center">Minute</Text>
                              <ScrollView 
                                style={{ height: 150 }} 
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true}
                              >
                                {Array.from({ length: 12 }, (_, i) => {
                                  const minute = i * 5;
                                  const isSelected = selectedMinute === minute;
                                  return (
                                    <TouchableOpacity
                                      key={i}
                                      onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedMinute(minute);
                                      }}
                                      className={`py-3 rounded-xl mb-2 ${isSelected ? 'bg-blue-500' : 'bg-white'}`}
                                    >
                                      <Text className={`text-center text-xl font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                        {minute.toString().padStart(2, '0')}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>

                            {/* AM/PM Toggle */}
                            <View className="bg-gray-50 rounded-2xl p-4">
                              <Text className="text-gray-500 text-xs font-semibold mb-2 text-center">Period</Text>
                              <View style={{ height: 150, justifyContent: 'center', gap: 8 }}>
                                <TouchableOpacity
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setIsAM(true);
                                  }}
                                  className={`py-3 px-5 rounded-xl ${isAM ? 'bg-blue-500' : 'bg-white'}`}
                                >
                                  <Text className={`text-center text-xl font-bold ${isAM ? 'text-white' : 'text-gray-900'}`}>
                                    AM
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setIsAM(false);
                                  }}
                                  className={`py-3 px-5 rounded-xl ${!isAM ? 'bg-blue-500' : 'bg-white'}`}
                                >
                                  <Text className={`text-center text-xl font-bold ${!isAM ? 'text-white' : 'text-gray-900'}`}>
                                    PM
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Preview */}
                        <View className="mx-5 mb-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                          <Text className="text-blue-900 text-xs font-semibold mb-2 uppercase tracking-wide">Selected Time</Text>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-gray-900 text-lg font-bold">
                                {selectedDate.toLocaleDateString('en-US', { 
                                  weekday: 'long',
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </Text>
                              <Text className="text-blue-700 text-xl font-bold mt-1">
                                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')} {isAM ? 'AM' : 'PM'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </ScrollView>

                      {/* Action Buttons */}
                      <View className="px-5 pb-5 pt-3 border-t border-gray-100">
                        <View className="flex-row gap-3">
                          <TouchableOpacity
                            className="flex-1 bg-gray-100 rounded-2xl py-4 items-center justify-center"
                            activeOpacity={0.7}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setShowDatePicker(false);
                              setCurrentSlotIndex(null);
                            }}
                          >
                            <Text className="text-gray-700 font-bold text-base">Cancel</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            className="flex-[2] bg-green-500 rounded-2xl py-4 items-center justify-center shadow-sm"
                            activeOpacity={0.7}
                            onPress={() => {
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              // Create datetime from selected values
                              const finalDateTime = new Date(selectedDate);
                              let hour = selectedHour;
                              if (!isAM && hour !== 12) hour += 12;
                              if (isAM && hour === 12) hour = 0;
                              finalDateTime.setHours(hour, selectedMinute, 0, 0);

                              // Validate time is not in the past
                              const now = new Date();
                              if (finalDateTime <= now) {
                                showAlert({
                                  type: 'error',
                                  title: 'Invalid Time',
                                  message: 'Please select a time in the future.',
                                  buttons: [{ text: 'OK', style: 'default' }],
                                });
                                return;
                              }

                              // Add the slot
                              const endTime = new Date(finalDateTime.getTime() + duration * 60000);
                              
                              if (currentSlotIndex !== null) {
                                if (currentSlotIndex === interviewSlots.length) {
                                  setInterviewSlots([...interviewSlots, {
                                    startTime: finalDateTime,
                                    endTime: endTime
                                  }]);
                                } else {
                                  const updatedSlots = [...interviewSlots];
                                  updatedSlots[currentSlotIndex] = {
                                    startTime: finalDateTime,
                                    endTime: endTime
                                  };
                                  setInterviewSlots(updatedSlots);
                                }
                              }
                              
                              setShowDatePicker(false);
                              setCurrentSlotIndex(null);
                            }}
                          >
                            <View className="flex-row items-center">
                              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                                <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white"/>
                              </Svg>
                              <Text className="text-white font-bold text-base">Confirm & Add</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </SafeAreaView>
                  </View>
                </Modal>
              )}

              {/* Footer Actions */}
              <View style={glassStyles.interviewFooter}>
                <GlassButton
                  text={isCreatingSlots ? 'Sending...' : `Send ${interviewSlots.length} Time Options to Candidate`}
                  colors={interviewSlots.length < 2 || isCreatingSlots ? ['#9CA3AF', '#9CA3AF'] : ['#437EF4', '#5B8AF5']}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    try {
                      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                      const formatLocalDateTime = (date: Date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const seconds = String(date.getSeconds()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                      };

                      const input = {
                        applicationId: selectedApplication.id,
                        interviewType,
                        durationMinutes: duration,
                        timezone: userTimezone,
                        ...(location && { location }),
                        slots: interviewSlots.map(slot => ({
                          startTime: formatLocalDateTime(slot.startTime),
                          endTime: formatLocalDateTime(slot.endTime),
                        })),
                      };

                      const result = await createInterviewSlots(input).unwrap();

                      if (result.createInterviewSlots.success) {
                        // Update selectedApplication status to interview
                        setSelectedApplication((prev: any) => prev ? {
                          ...prev,
                          status: 'interview',
                        } : prev);

                        setShowInterviewModal(false);

                        // Refetch to get latest data
                        refetch();

                        showAlert({
                          type: 'success',
                          title: 'Interview Scheduled!',
                          message: 'Interview slots sent to candidate. They will receive an email to select their preferred time.',
                          buttons: [{ text: 'OK', style: 'default' }],
                        });
                      } else {
                        throw new Error(result.createInterviewSlots.message);
                      }
                    } catch (error: any) {
                      showAlert({
                        type: 'error',
                        title: 'Error',
                        message: error.message || 'Failed to create interview slots',
                        buttons: [{ text: 'OK', style: 'default' }],
                      });
                    }
                  }}
                  disabled={interviewSlots.length < 2 || isCreatingSlots}
                  loading={isCreatingSlots}
                  fullWidth
                  height={52}
                />
                {interviewSlots.length < 2 && (
                  <Text style={glassStyles.slotHintText}>
                    Add at least 2 time slots to continue
                  </Text>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      </View>
    </TalentPartnerLayout>
  );
}

// Glass design styles
const glassStyles = StyleSheet.create({
  // Application Card
  applicationCard: {
    backgroundColor: GLASS_COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GLASS_COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  strengthsBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
  },

  // Filter Pills
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: GLASS_COLORS.filterActive,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterPillInactive: {
    backgroundColor: GLASS_COLORS.filterInactive,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // Error State
  errorBox: {
    backgroundColor: 'rgba(254, 226, 226, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modalContainer: {
    flex: 1,
    marginTop: 48,
    backgroundColor: 'rgba(248, 250, 252, 0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Candidate Info Card
  candidateInfoCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },

  // Match Analysis Card
  matchAnalysisCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  matchCircleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  matchCircle: {
    borderRadius: 48,
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreBreakdownBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  skillsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  skillBadgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  skillBadgeRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  skillBadgeBlue: {
    backgroundColor: 'rgba(67, 126, 244, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(67, 126, 244, 0.3)',
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    padding: 8,
  },
  strengthIcon: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 8,
    padding: 8,
  },
  weaknessIcon: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationBox: {
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(67, 126, 244, 0.2)',
  },

  // Cover Letter Card
  coverLetterCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  coverLetterContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },

  // Timeline Card
  timelineCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  timelineContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  timelineIcon: {
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Rejection Card
  rejectionCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },

  // Notes Card
  notesCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  notesContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },

  // Action Buttons Container
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Reject Modal
  rejectModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  rejectModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  rejectModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    flexDirection: 'row',
    gap: 12,
  },

  // Calendar Modal
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

  // Glass Text Input
  glassTextInput: {
    backgroundColor: GLASS_COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },

  // Interview Modal
  interviewModalContainer: {
    flex: 1,
    backgroundColor: GLASS_COLORS.cardBg,
    marginTop: 48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  interviewModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  closeButton: {
    backgroundColor: 'rgba(229, 231, 235, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  interviewTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  interviewTypeButtonActive: {
    borderColor: '#437EF4',
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
  },
  interviewTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  interviewTypeTextActive: {
    color: '#437EF4',
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  durationButtonActive: {
    borderColor: '#437EF4',
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
  },
  durationText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#4B5563',
  },
  durationTextActive: {
    color: '#437EF4',
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timeSlotBox: {
    flex: 1,
    backgroundColor: GLASS_COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
  },
  removeSlotButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  addSlotButton: {
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(67, 126, 244, 0.4)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addSlotButtonText: {
    color: '#437EF4',
    fontWeight: '600',
  },
  interviewFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  slotHintText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
