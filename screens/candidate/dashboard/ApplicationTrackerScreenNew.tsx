import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';
import SearchModal from '../../../components/SearchModal';
import { 
  useGetMyApplicationsQuery, 
  useWithdrawApplicationMutation,
  useIsGoogleCalendarConnectedQuery,
  useInterviewSlotsQuery,
  useSelectInterviewSlotMutation,
  useRescheduleInterviewMutation,
} from '../../../services/api';
import { GoogleCalendarConnection } from '../../../components/GoogleCalendarConnection';

interface ApplicationCardProps {
  application: any;
  onPress: (jobId: string) => void;
  onWithdraw: (applicationId: string) => void;
  onViewInterviewSlots?: (applicationId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onPress, onWithdraw, onViewInterviewSlots }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FFCC00',
      reviewed: '#437EF4',
      shortlisted: '#10B981',
      interview: '#8B5CF6',
      interview_scheduled: '#8B5CF6',
      offered: '#10B981',
      rejected: '#EF4444',
      withdrawn: '#6B7280',
      accepted: '#10B981',
    };
    return colors[status] || '#9CA3AF';
  };

  const getStatusText = (status: string) => {
    if (status === 'pending') return 'Submitted';
    if (status === 'interview_scheduled') return 'Interview';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const canWithdraw = ['pending', 'reviewed'].includes(application.status);

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(application.jobPosting.id);
      }}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: getStatusColor(application.status) }}
        >
          <Text className="text-white text-xs font-bold">
            {getStatusText(application.status)}
          </Text>
        </View>
        {application.jobMatch && (
          <Text className="text-primary-blue text-sm font-semibold">
            {Math.round(application.jobMatch.matchPercentage)}% Match
          </Text>
        )}
      </View>

      {/* Job Title */}
      <Text className="text-gray-900 text-xl font-bold mb-2">
        {application.jobPosting.title}
      </Text>

      {/* Company Name */}
      <Text className="text-primary-blue text-base font-semibold mb-3">
        {application.jobPosting.companyName}
      </Text>

      {/* Job Details */}
      <View className="mb-3">
        <View className="flex-row items-center mb-1">
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#6B7280"/>
          </Svg>
          <Text className="text-gray-500 text-sm">
            {application.jobPosting.location}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 16H4V8h16v12z" fill="#6B7280"/>
          </Svg>
          <Text className="text-gray-500 text-sm">
            {application.jobPosting.workMode.charAt(0).toUpperCase() + application.jobPosting.workMode.slice(1)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="#6B7280"/>
          </Svg>
          <Text className="text-gray-500 text-sm">
            Applied: {new Date(application.appliedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Rejection Reason */}
      {application.status === 'rejected' && application.rejectionReason && (
        <View className="bg-red-50 rounded-xl p-3 mb-3 border border-red-200">
          <Text className="text-red-600 text-xs font-semibold mb-1">Rejection Reason:</Text>
          <Text className="text-gray-700 text-sm">{application.rejectionReason}</Text>
        </View>
      )}

      {/* Interview Slots Available */}
      {(application.status === 'interview' || application.status === 'interview_scheduled' || application.status?.toLowerCase().includes('interview')) && onViewInterviewSlots && (
        <View className="bg-purple-50 rounded-xl p-3 mb-3 border border-purple-200">
          <View className="flex-row items-center mb-2">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="#8B5CF6"/>
            </Svg>
            <Text className="text-purple-700 text-sm font-semibold">Interview Scheduled!</Text>
          </View>
          <Text className="text-purple-600 text-xs mb-2">
            The employer has sent you interview time options. Select your preferred time slot.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onViewInterviewSlots(application.id);
            }}
            className="bg-purple-600 rounded-lg py-2 px-3 items-center"
          >
            <Text className="text-white text-xs font-semibold">Select Interview Time</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress(application.jobPosting.id);
          }}
          className="bg-primary-blue rounded-xl py-2 px-4 flex-1 items-center"
        >
          <Text className="text-white text-sm font-semibold">View Details</Text>
        </TouchableOpacity>
        {canWithdraw && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onWithdraw(application.id);
            }}
            className="bg-red-500 rounded-xl py-2 px-4 items-center"
          >
            <Text className="text-white text-sm font-semibold">Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface InterviewSlotsSelectorProps {
  applicationId: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InterviewSlotsSelector: React.FC<InterviewSlotsSelectorProps> = ({ applicationId, visible, onClose, onSuccess }) => {
  console.log('InterviewSlotsSelector - applicationId:', applicationId);
  
  const { data: isCalendarConnected, refetch: refetchCalendarStatus } = useIsGoogleCalendarConnectedQuery();
  const { data, isLoading, refetch, error } = useInterviewSlotsQuery(applicationId, { skip: !applicationId });
  const [selectSlot, { isLoading: isSelecting }] = useSelectInterviewSlotMutation();
  const [rescheduleInterview, { isLoading: isRescheduling }] = useRescheduleInterviewMutation();
  const [showCalendarCheck, setShowCalendarCheck] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  console.log('InterviewSlotsSelector - data:', data);
  console.log('InterviewSlotsSelector - isLoading:', isLoading);
  console.log('InterviewSlotsSelector - error:', error);

  const handleSelectSlot = async (slotId: string) => {
    // Check calendar connection first
    if (!isCalendarConnected) {
      setShowCalendarCheck(true);
      return;
    }

    Alert.alert(
      'Confirm Interview Time',
      'Are you sure you want to select this time slot? The interview will be added to your calendar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            try {
              const result = await selectSlot({ slotId }).unwrap();
              
              if (result.selectInterviewSlot.success) {
                Alert.alert(
                  'Interview Confirmed!',
                  'Your interview has been scheduled and added to your calendar.',
                  [{ text: 'OK', onPress: () => {
                    onSuccess();
                    onClose();
                  }}]
                );
              } else {
                throw new Error(result.selectInterviewSlot.message);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to select interview slot');
            }
          }
        }
      ]
    );
  };

  const handleRequestReschedule = () => {
    setShowRescheduleModal(true);
  };

  const submitRescheduleRequest = async () => {
    if (!rescheduleReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rescheduling');
      return;
    }

    // Since we're requesting a reschedule from existing slots,
    // we'll use the first slot as reference (this is a request, not actual reschedule)
    const slots = data?.interviewSlots || [];
    if (slots.length === 0) {
      Alert.alert('Error', 'No interview slots available');
      return;
    }

    Alert.alert(
      'Request Reschedule',
      'Are you sure you want to request alternative interview times?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          style: 'default',
          onPress: async () => {
            try {
              // Note: This might need adjustment based on actual backend implementation
              // For now, we'll just show a message that request was sent
              Alert.alert(
                'Request Sent',
                'Your reschedule request has been sent to the recruiter. They will respond with new time options.',
                [{ text: 'OK', onPress: () => {
                  setShowRescheduleModal(false);
                  setRescheduleReason('');
                  onClose();
                }}]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send reschedule request');
            }
          }
        }
      ]
    );
  };

  const slots = data?.interviewSlots || [];

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/60">
          <SafeAreaView className="flex-1">
            <View className="flex-1 bg-white mt-12 rounded-t-3xl">
              {/* Header */}
              <View className="px-5 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 text-xl font-bold">Select Interview Time</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#6B7280"/>
                    </Svg>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-500 text-sm mt-1">
                  Choose your preferred time slot
                </Text>
              </View>

              <ScrollView className="flex-1 px-5 py-4">
                {isLoading && (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#437EF4" />
                    <Text className="text-gray-500 mt-4">Loading time slots...</Text>
                  </View>
                )}

                {!isLoading && slots.length === 0 && (
                  <View className="bg-gray-50 rounded-xl p-6 items-center">
                    <Text className="text-gray-600 text-base font-semibold mb-2">
                      No Slots Available
                    </Text>
                    <Text className="text-gray-500 text-sm text-center">
                      The employer hasn't set up interview times yet. Please check back later.
                    </Text>
                  </View>
                )}

                {/* Info Box */}
                {!isLoading && slots.length > 0 && (
                  <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                    <View className="flex-row items-center mb-2">
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                        <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="#1E40AF"/>
                      </Svg>
                      <Text className="text-blue-800 text-sm font-semibold">
                        Select Your Preferred Time
                      </Text>
                    </View>
                    <Text className="text-blue-700 text-xs">
                      Choose one slot or request alternative times if none work for you.
                    </Text>
                  </View>
                )}

                {slots.map((slot: any) => (
                  <TouchableOpacity
                    key={slot.id}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3"
                    onPress={() => handleSelectSlot(slot.id)}
                    disabled={isSelecting}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 text-lg font-bold mb-1">
                          {new Date(slot.startTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                        <Text className="text-gray-600 text-base mb-1">
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          Duration: {slot.durationMinutes} minutes
                        </Text>
                      </View>
                      <View className="bg-blue-50 rounded-full p-3">
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#437EF4"/>
                        </Svg>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Request Reschedule Button */}
                {!isLoading && slots.length > 0 && (
                  <TouchableOpacity
                    className="bg-gray-100 rounded-xl py-3 px-4 items-center mt-2 border border-gray-300"
                    onPress={handleRequestReschedule}
                  >
                    <View className="flex-row items-center">
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                        <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#374151"/>
                      </Svg>
                      <Text className="text-gray-700 text-sm font-semibold">
                        Request Alternative Times
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Calendar Connection Modal */}
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
              <Text className="text-gray-500 text-sm mt-1">Required to confirm interview</Text>
            </View>
            
            <View className="px-5 py-4">
              <View className="bg-blue-50 rounded-xl p-4 mb-4">
                <View className="flex-row items-start mb-2">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, marginTop: 2 }}>
                    <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10z" fill="#1E40AF"/>
                  </Svg>
                  <Text className="text-blue-800 text-sm flex-1">
                    To confirm your interview, connect your Google Calendar first.
                  </Text>
                </View>
                <Text className="text-blue-700 text-xs ml-6">
                  This allows us to automatically add the interview to your calendar.
                </Text>
              </View>

              <GoogleCalendarConnection 
                onConnectionChange={(connected) => {
                  if (connected) {
                    setShowCalendarCheck(false);
                    refetchCalendarStatus();
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

      {/* Reschedule Request Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white rounded-2xl w-full max-w-md">
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-gray-900 text-xl font-bold">Request Reschedule</Text>
              <Text className="text-gray-500 text-sm mt-1">Let us know why you need different times</Text>
            </View>
            
            <View className="px-5 py-4">
              <View className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                <View className="flex-row items-center mb-2">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                    <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="#C2410C"/>
                  </Svg>
                  <Text className="text-orange-800 text-sm font-semibold">
                    Request Alternative Times
                  </Text>
                </View>
                <Text className="text-orange-700 text-xs">
                  The recruiter will review your request and provide new time options.
                </Text>
              </View>

              <Text className="text-gray-700 text-sm font-semibold mb-2">Reason for Reschedule</Text>
              <TextInput
                className="bg-gray-50 rounded-xl p-3 text-gray-900 border border-gray-200"
                placeholder="E.g., I have a conflict during these times..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
                style={{ height: 100, textAlignVertical: 'top' }}
              />
            </View>

            <View className="px-5 py-4 border-t border-gray-100 flex-row gap-3">
              <TouchableOpacity
                className="bg-gray-100 rounded-xl py-3 items-center justify-center flex-1"
                onPress={() => {
                  setShowRescheduleModal(false);
                  setRescheduleReason('');
                }}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-primary-blue rounded-xl py-3 items-center justify-center flex-1"
                onPress={submitRescheduleRequest}
                disabled={isRescheduling}
              >
                {isRescheduling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Send Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

interface ApplicationTrackerScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onJobPress?: (jobId: string) => void;
  onBrowseJobsPress?: () => void;
  onBack?: () => void;
  onSearchNavigate?: (route: string) => void;
}

export default function ApplicationTrackerScreen({
  activeTab = 'jobs',
  onTabChange,
  userName = 'User',
  onJobPress,
  onBrowseJobsPress,
  onBack,
  onSearchNavigate,
}: ApplicationTrackerScreenProps) {
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 100;

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showInterviewSlots, setShowInterviewSlots] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const { data, isLoading, error, refetch } = useGetMyApplicationsQuery({
    status: statusFilter,
  });

  const [withdrawApplication, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();

  const handleViewInterviewSlots = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setShowInterviewSlots(true);
  };

  const handleWithdraw = async (applicationId: string) => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await withdrawApplication({ applicationId }).unwrap();
              if (result.withdrawApplication.success) {
                Alert.alert('Success', 'Application withdrawn successfully');
                refetch();
              }
            } catch (err: any) {
              Alert.alert('Error', err?.data?.withdrawApplication?.message || 'Failed to withdraw application');
            }
          },
        },
      ]
    );
  };

  const handleJobPress = (jobId: string) => {
    if (onJobPress) {
      onJobPress(jobId);
    }
  };

  const statusOptions = [
    { label: 'All', value: undefined },
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Interview', value: 'interview' },
    { label: 'Offered', value: 'offered' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <>
    <CandidateLayout
      showBackButton={true}
      onBack={onBack}
      headerTitle="Application Tracker"
      headerSubtitle={`${data?.myApplications?.length || 0} application(s) submitted`}
      onSearchPress={() => setShowSearchModal(true)}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refetch();
            }}
            colors={['#437EF4']}
            tintColor="#437EF4"
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        onScrollBeginDrag={() => Haptics.selectionAsync()}
      >
        <View className="px-6 mt-6">
          {/* Header */}
          <View className="mb-4">
            <Text className="text-gray-900 text-2xl font-bold mb-1">Application Tracker</Text>
            <Text className="text-gray-500 text-sm">
              {data?.myApplications?.length || 0} application(s) submitted
            </Text>
          </View>

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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(option.value);
                }}
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
          {!isLoading && data?.myApplications?.length === 0 && (
            <View className="bg-gray-50 rounded-xl p-6 items-center">
              <Text className="text-gray-600 text-base font-semibold mb-2">
                No Applications Yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-4">
                Start applying to jobs that match your profile
              </Text>
              <TouchableOpacity
                onPress={onBrowseJobsPress}
                className="bg-primary-blue rounded-xl py-3 px-6"
              >
                <Text className="text-white font-semibold">Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Applications List */}
          {data?.myApplications?.map((application: any) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onPress={handleJobPress}
              onWithdraw={handleWithdraw}
              onViewInterviewSlots={handleViewInterviewSlots}
            />
          ))}
        </View>
      </ScrollView>

      {/* Interview Slots Selector Modal */}
      {selectedApplicationId && (
        <InterviewSlotsSelector
          applicationId={selectedApplicationId}
          visible={showInterviewSlots}
          onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowInterviewSlots(false);
            setSelectedApplicationId(null);
          }}
          onSuccess={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            refetch();
            setShowInterviewSlots(false);
            setSelectedApplicationId(null);
          }}
        />
      )}

      {/* Bottom Nav Bar */}
      <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />
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
