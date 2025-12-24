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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
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
    pending: '#FFCC00',
    reviewed: '#437EF4',
    shortlisted: '#10B981',
    interview: '#8B5CF6',
    offered: '#10B981',
    rejected: '#EF4444',
    withdrawn: '#6B7280',
    accepted: '#10B981',
  };
  return colors[status] || '#9CA3AF';
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

  return (
    <TouchableOpacity
      onPress={() => onPress(application.id)}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: getStatusColor(application.status) }}
        >
          <Text className="text-white text-xs font-bold">
            {getStatusText(application.status)}
          </Text>
        </View>
        <View className="flex-row items-center">
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
        <View className="bg-green-50 rounded-xl p-3 mb-3">
          <Text className="text-green-700 text-xs font-semibold mb-1">Top Strengths:</Text>
          <Text className="text-green-700 text-xs">
            {application.jobMatch.strengths.slice(0, 2).join(' • ')}
          </Text>
        </View>
      )}

      {/* Applied Date */}
      <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-100">
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
  const [videoCallLink, setVideoCallLink] = useState('');
  const [location, setLocation] = useState('');
  const [duration, setDuration] = useState(60);
  const [interviewSlots, setInterviewSlots] = useState<Array<{ startTime: Date; endTime: Date }>>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  
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

  const handleShortlist = async () => {
    if (!selectedApplication) return;

    try {
      const result = await shortlistApplication({
        applicationId: selectedApplication.id,
        recruiterNotes: recruiterNotes || undefined,
      }).unwrap();

      console.log('Shortlist application result:', result);

      if (result.shortlistApplication.__typename === 'JobApplicationSuccessType' && result.shortlistApplication.success) {
        // Update selectedApplication immediately with new status
        const updatedApp = {
          ...selectedApplication,
          status: 'shortlisted',
          recruiterNotes: recruiterNotes || selectedApplication.recruiterNotes,
        };
        console.log('Updating selectedApplication to:', updatedApp);
        setSelectedApplication(updatedApp);
        
        // Clear input fields
        setRecruiterNotes('');
        
        // Refetch data in background
        refetch().then((refetchResult) => {
          console.log('Refetch completed after shortlist');
          if (refetchResult.data?.jobApplications) {
            const freshApplication = refetchResult.data.jobApplications.find(
              (app: any) => app.id === selectedApplication.id
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
        
        // Update selectedApplication immediately with new status
        const updatedApp = {
          ...selectedApplication,
          status: 'rejected',
          rejectionReason: rejectionReason || '',
          recruiterNotes: recruiterNotes || selectedApplication.recruiterNotes,
        };
        console.log('Updating selectedApplication to:', updatedApp);
        setSelectedApplication(updatedApp);
        
        // Clear input fields
        setRejectionReason('');
        setRecruiterNotes('');
        
        // Refetch data in background
        refetch().then((refetchResult) => {
          console.log('Refetch completed after reject');
          if (refetchResult.data?.jobApplications) {
            const freshApplication = refetchResult.data.jobApplications.find(
              (app: any) => app.id === selectedApplication.id
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
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {/* Back Button */}
      {onBack && (
        <View className="px-5 pt-4">
          <TouchableOpacity onPress={onBack} className="flex-row items-center mb-3">
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
          {/* Status Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => setStatusFilter(option.value)}
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
              <Text className="text-gray-500 mt-4">Loading applications...</Text>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View className="bg-red-50 rounded-xl p-4 mb-4">
              <Text className="text-red-600 text-sm">
                Error loading applications. Please try again.
              </Text>
            </View>
          )}

          {/* No Applications State */}
          {!isLoading && applications.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">
                No Applications Yet
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                {statusFilter
                  ? `No ${statusFilter} applications for this job`
                  : 'This job posting hasn\'t received any applications yet'}
              </Text>
            </View>
          )}

          {/* Applications List */}
          {applications.map((application: any) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onPress={handleApplicationPress}
            />
          ))}
        </View>
      </ScrollView>

      {/* Application Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View className="flex-1 bg-black/60">
          <View className="flex-1 mt-12 bg-white rounded-t-3xl shadow-2xl" style={{ maxHeight: Dimensions.get('window').height * 0.9 }}>
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
                    onPress={() => setShowDetailsModal(false)}
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
                    <View className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 mb-4 border border-blue-100 shadow-sm">
                      {/* Status Badge */}
                      <View className="mb-3">
                        <View
                          className="rounded-full px-3 py-1 self-start"
                          style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                        >
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
                      
                      <View className="flex-row items-center bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#437EF4" />
                        </Svg>
                        <Text className="text-primary-blue text-sm font-medium flex-1" numberOfLines={1}>
                          {selectedApplication.candidate?.user?.email || ''}
                        </Text>
                      </View>
                    </View>

                    {/* Match Score with Enhanced UI */}
                    {selectedApplication.jobMatch && (
                      <View className="bg-green-50 rounded-2xl p-5 mb-4 border border-green-100">
                        <Text className="text-gray-900 text-lg font-bold mb-3">
                          Match Analysis
                        </Text>
                        
                        {/* Match Percentage Circle */}
                        <View className="bg-white rounded-2xl p-4 mb-4 items-center border border-green-100">
                          <LinearGradient
                            colors={['#437EF4', '#3B70E2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="rounded-full w-24 h-24 items-center justify-center"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
                          >
                            <Text className="text-white text-3xl font-bold">
                              {`${Math.round(parseFloat(selectedApplication.jobMatch.matchPercentage) || 0)}%`}
                            </Text>
                          </LinearGradient>
                          <Text className="text-gray-600 text-sm font-medium mt-3">Overall Match Score</Text>
                        </View>

                        {/* Score Breakdown */}
                        <View className="bg-white rounded-xl p-4 mb-4 border border-green-100">
                          <Text className="text-gray-900 text-sm font-bold mb-3">Score Breakdown</Text>
                          <View className="space-y-2">
                            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                              <Text className="text-gray-700 text-sm">Skills Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.skillsMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                              <Text className="text-gray-700 text-sm">Experience Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.experienceMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                              <Text className="text-gray-700 text-sm">Qualifications Match</Text>
                              <Text className="text-primary-blue text-sm font-semibold">
                                {Math.round(parseFloat(selectedApplication.jobMatch.qualificationsMatchScore) || 0)}%
                              </Text>
                            </View>
                            <View className="flex-row justify-between items-center py-2">
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
                            <View className="bg-white rounded-xl p-4 mb-4 border border-green-100">
                              <Text className="text-gray-900 text-sm font-bold mb-3">Matched Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.matchedSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} className="bg-green-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
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
                            <View className="bg-white rounded-xl p-4 mb-4 border border-red-100">
                              <Text className="text-gray-900 text-sm font-bold mb-3">Missing Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.missingSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} className="bg-red-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
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
                            <View className="bg-white rounded-xl p-4 mb-4 border border-blue-100">
                              <Text className="text-gray-900 text-sm font-bold mb-3">Additional Skills</Text>
                              <View className="flex-row flex-wrap">
                                {selectedApplication.jobMatch.extraSkills.map(
                                  (skill: string, index: number) => (
                                    <View key={index} className="bg-blue-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
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
                            <View className="bg-white rounded-xl p-4 mb-4 border border-green-100">
                              <Text className="text-gray-900 text-sm font-bold mb-3">
                                Key Strengths
                              </Text>
                              {selectedApplication.jobMatch.strengths.map(
                                (strength: string, index: number) => (
                                  <View key={index} className="flex-row items-start mb-2 bg-green-50 rounded-lg p-2">
                                    <View className="bg-green-500 rounded-full w-5 h-5 items-center justify-center mr-2 mt-0.5">
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
                            <View className="bg-white rounded-xl p-4 mb-4 border border-orange-100">
                              <Text className="text-gray-900 text-sm font-bold mb-3">
                                Areas for Improvement
                              </Text>
                              {selectedApplication.jobMatch.weaknesses.map(
                                (weakness: string, index: number) => (
                                  <View key={index} className="flex-row items-start mb-2 bg-orange-50 rounded-lg p-2">
                                    <View className="bg-orange-500 rounded-full w-5 h-5 items-center justify-center mr-2 mt-0.5">
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
                          <View className="bg-white rounded-xl p-4 border border-blue-100">
                            <Text className="text-gray-900 text-sm font-bold mb-2">AI Recommendation</Text>
                            <Text className="text-gray-700 text-sm leading-5">
                              {selectedApplication.jobMatch.recommendation}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Cover Letter with Better Styling */}
                    {selectedApplication.coverLetter && selectedApplication.coverLetter.trim() !== '' && (
                      <View className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-4 border border-purple-100 shadow-sm">
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#8B5CF6" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Cover Letter
                          </Text>
                        </View>
                        <View className="bg-white rounded-xl p-4 border border-purple-100">
                          <Text className="text-gray-700 text-sm leading-6">
                            {selectedApplication.coverLetter}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Application Timeline with Status */}
                    <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-4 border border-amber-100 shadow-sm">
                      <View className="flex-row items-center mb-4">
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="#F59E0B" />
                        </Svg>
                        <Text className="text-gray-900 text-lg font-bold">
                          Timeline & Status
                        </Text>
                      </View>
                      
                      <View className="bg-white rounded-xl p-4 border border-amber-100">
                        <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
                          <View className="bg-green-500 rounded-full w-8 h-8 items-center justify-center mr-3">
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
                          <View className="flex-row items-center">
                            <View className="bg-blue-500 rounded-full w-8 h-8 items-center justify-center mr-3">
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
                    </View>

                    {/* Rejection Reason */}
                    {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                      <View className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 mb-4 border border-red-200 shadow-sm">
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Rejection Reason
                          </Text>
                        </View>
                        <View className="bg-white rounded-xl p-4 border border-red-200">
                          <Text className="text-gray-700 text-sm leading-5">
                            {selectedApplication.rejectionReason}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Recruiter Notes */}
                    {selectedApplication.recruiterNotes && selectedApplication.recruiterNotes.trim() !== '' && (
                      <View className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 mb-4 border border-yellow-200 shadow-sm">
                        <View className="flex-row items-center mb-3">
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                            <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#F59E0B" />
                          </Svg>
                          <Text className="text-gray-900 text-lg font-bold">
                            Recruiter Notes
                          </Text>
                        </View>
                        <View className="bg-white rounded-xl p-4 border border-yellow-200">
                          <Text className="text-gray-700 text-sm leading-5">
                            {selectedApplication.recruiterNotes}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>

              {/* Professional Action Buttons */}
              <View className="px-5 py-5 bg-white border-t border-gray-100">
                {/* Primary Actions */}
                <View className="mb-3">
                  <TouchableOpacity
                    className={`rounded-2xl py-4 px-5 items-center justify-center shadow-sm ${
                      selectedApplication?.status === 'shortlisted' ? 'bg-gray-300' : 'bg-green-500'
                    }`}
                    activeOpacity={0.7}
                    disabled={isShortlisting || selectedApplication?.status === 'shortlisted'}
                    onPress={() => {
                      showAlert({
                        type: 'success',
                        title: 'Shortlist Candidate',
                        message: 'Move this candidate to your shortlist?',
                        buttons: [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Shortlist', style: 'default', onPress: () => {
                            // Call handleShortlist without waiting
                            handleShortlist();
                          }}
                        ]
                      });
                    }}
                  >
                    <View className="flex-row items-center">
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="white" />
                      </Svg>
                      <Text className="text-white font-bold text-base">
                        {selectedApplication?.status === 'shortlisted' ? 'Already Shortlisted' : 'Shortlist Candidate'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View className="mb-3">
                  <TouchableOpacity
                    className="bg-primary-blue rounded-2xl py-4 px-5 items-center justify-center shadow-sm"
                    activeOpacity={0.7}
                    onPress={() => {
                      // Check if calendar is connected
                      if (!isCalendarConnected) {
                        setShowCalendarCheck(true);
                      } else {
                        // Reset interview form
                        setInterviewType('video_call');
                        setVideoCallLink('');
                        setLocation('');
                        setDuration(60);
                        setInterviewSlots([]);
                        setShowInterviewModal(true);
                      }
                    }}
                  >
                    <View className="flex-row items-center">
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                        <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="white" />
                      </Svg>
                      <Text className="text-white font-bold text-base">Schedule Interview</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Secondary Actions */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 rounded-2xl py-3.5 px-4 items-center justify-center border border-gray-200"
                    activeOpacity={0.7}
                    onPress={() => setShowDetailsModal(false)}
                  >
                    <Text className="text-gray-700 font-semibold text-sm">Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 rounded-2xl py-3.5 px-4 items-center justify-center border ${
                      selectedApplication?.status === 'rejected' 
                        ? 'bg-gray-100 border-gray-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                    activeOpacity={0.7}
                    disabled={isRejecting || selectedApplication?.status === 'rejected'}
                    onPress={() => setShowRejectModal(true)}
                  >
                    <View className="flex-row items-center">
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                        <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={selectedApplication?.status === 'rejected' ? '#9CA3AF' : '#EF4444'} />
                      </Svg>
                      <Text className={`font-semibold text-sm ${
                        selectedApplication?.status === 'rejected' ? 'text-gray-500' : 'text-red-600'
                      }`}>
                        {selectedApplication?.status === 'rejected' ? 'Already Rejected' : 'Reject'}
                      </Text>
                    </View>
                  </TouchableOpacity>
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
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white rounded-2xl w-full max-w-md">
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 text-xl font-bold">Reject Application</Text>
              <Text className="text-gray-500 text-sm mt-1">Provide a reason for rejection (optional)</Text>
            </View>
            
            <View className="px-5 py-4">
              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Rejection Reason</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                  placeholder="e.g., Not enough experience"
                  placeholderTextColor="#9CA3AF"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 text-sm font-medium mb-2">Internal Notes (Optional)</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
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

            <View className="px-5 py-4 border-t border-gray-100 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-xl py-3 items-center justify-center"
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setRecruiterNotes('');
                }}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-500 rounded-xl py-3 items-center justify-center"
                onPress={handleReject}
                disabled={isRejecting}
              >
                <Text className="text-white font-semibold">
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Connection Check Modal */}
      <Modal
        visible={showCalendarCheck}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarCheck(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white rounded-2xl w-full max-w-md">
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 text-xl font-bold">Connect Google Calendar</Text>
              <Text className="text-gray-500 text-sm mt-1">Required for interview scheduling</Text>
            </View>
            
            <View className="px-5 py-4">
              <View className="bg-blue-50 rounded-xl p-4 mb-4">
                <Text className="text-blue-800 text-sm mb-2">
                  📅 To schedule interviews, you need to connect your Google Calendar first.
                </Text>
                <Text className="text-blue-700 text-xs">
                  This allows us to automatically add interviews to both yours and the candidate's calendar.
                </Text>
              </View>

              <GoogleCalendarConnection 
                onConnectionChange={(connected) => {
                  if (connected) {
                    setShowCalendarCheck(false);
                    refetchCalendarStatus();
                    // Open interview modal after connection
                    setTimeout(() => {
                      setInterviewType('video_call');
                      setVideoCallLink('');
                      setLocation('');
                      setDuration(60);
                      setInterviewSlots([]);
                      setShowInterviewModal(true);
                    }, 500);
                  }
                }}
              />
            </View>

            <View className="px-5 py-4 border-t border-gray-100">
              <TouchableOpacity
                className="bg-gray-100 rounded-xl py-3 items-center justify-center"
                onPress={() => setShowCalendarCheck(false)}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interview Scheduling Modal */}
      <Modal
        visible={showInterviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInterviewModal(false)}
      >
        <View className="flex-1 bg-black/60">
          <SafeAreaView className="flex-1">
            <View className="flex-1 bg-white mt-12 rounded-t-3xl">
              {/* Header */}
              <View className="px-5 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-xl font-bold">Schedule Interview</Text>
                  <TouchableOpacity onPress={() => setShowInterviewModal(false)}>
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
                <View className="mb-4">
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Interview Type</Text>
                  <View className="flex-row gap-2">
                    {[
                      { value: 'video_call', label: 'Video Call', icon: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z' },
                      { value: 'phone', label: 'Phone', icon: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' },
                      { value: 'in_person', label: 'In Person', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        className={`flex-1 p-3 rounded-xl border-2 ${
                          interviewType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setInterviewType(type.value as any)}
                      >
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 4 }}>
                          <Path d={type.icon} fill={interviewType === type.value ? '#437EF4' : '#9CA3AF'}/>
                        </Svg>
                        <Text className={`text-xs font-semibold ${
                          interviewType === type.value ? 'text-blue-600' : 'text-gray-600'
                        }`}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Video Call Link */}
                {interviewType === 'video_call' && (
                  <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-semibold mb-2">Video Call Link</Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                      placeholder="https://meet.google.com/..."
                      placeholderTextColor="#9CA3AF"
                      value={videoCallLink}
                      onChangeText={setVideoCallLink}
                      keyboardType="url"
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {/* Location */}
                {(interviewType === 'in_person' || interviewType === 'phone') && (
                  <View className="mb-4">
                    <Text className="text-gray-700 text-sm font-semibold mb-2">
                      {interviewType === 'in_person' ? 'Location' : 'Phone Number'}
                    </Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                      placeholder={interviewType === 'in_person' ? 'Office address' : '+1 (555) 123-4567'}
                      placeholderTextColor="#9CA3AF"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>
                )}

                {/* Duration */}
                <View className="mb-4">
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Duration (minutes)</Text>
                  <View className="flex-row gap-2">
                    {[30, 45, 60, 90].map((min) => (
                      <TouchableOpacity
                        key={min}
                        className={`flex-1 py-3 rounded-xl border-2 ${
                          duration === min ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                        onPress={() => setDuration(min)}
                      >
                        <Text className={`text-center font-semibold ${
                          duration === min ? 'text-blue-600' : 'text-gray-600'
                        }`}>{min}m</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time Slots */}
                <View className="mb-4">
                  <Text className="text-gray-700 text-sm font-semibold mb-2">Available Time Slots</Text>
                  <Text className="text-gray-500 text-xs mb-3">Add 2-4 time options for the candidate</Text>
                  
                  {interviewSlots.map((slot, index) => (
                    <View key={index} className="flex-row items-center mb-2 gap-2">
                      <View className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                        <Text className="text-gray-900 text-sm font-medium">
                          {slot.startTime.toLocaleDateString()} at {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="bg-red-50 p-2 rounded-lg"
                        onPress={() => {
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
                    className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl py-3 items-center justify-center mt-2"
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(10, 0, 0, 0);
                      setInterviewSlots([...interviewSlots, {
                        startTime: tomorrow,
                        endTime: new Date(tomorrow.getTime() + duration * 60000)
                      }]);
                    }}
                  >
                    <Text className="text-blue-600 font-semibold">+ Add Time Slot</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Footer Actions */}
              <View className="px-5 py-4 border-t border-gray-100">
                <TouchableOpacity
                  className={`rounded-xl py-4 items-center justify-center ${
                    interviewSlots.length < 2 || isCreatingSlots
                      ? 'bg-gray-300'
                      : 'bg-blue-500'
                  }`}
                  disabled={interviewSlots.length < 2 || isCreatingSlots}
                  onPress={async () => {
                    try {
                      const input = {
                        applicationId: selectedApplication.id,
                        interviewType,
                        durationMinutes: duration,
                        ...(interviewType === 'video_call' && { videoCallLink }),
                        ...(interviewType !== 'video_call' && { location }),
                        slots: interviewSlots.map(slot => ({
                          startTime: slot.startTime.toISOString(),
                          endTime: slot.endTime.toISOString(),
                        })),
                      };

                      const result = await createInterviewSlots(input).unwrap();
                      
                      if (result.createInterviewSlots.success) {
                        setShowInterviewModal(false);
                        setShowDetailsModal(false);
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
                >
                  {isCreatingSlots ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-base">
                      Send {interviewSlots.length} Time Options to Candidate
                    </Text>
                  )}
                </TouchableOpacity>
                {interviewSlots.length < 2 && (
                  <Text className="text-gray-400 text-xs text-center mt-2">
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
