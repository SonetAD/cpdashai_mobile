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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { 
  useGetMyApplicationsQuery, 
  useWithdrawApplicationMutation,
  useIsGoogleCalendarConnectedQuery,
  useInterviewSlotsQuery,
  useSelectInterviewSlotMutation,
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

  const canWithdraw = ['pending', 'reviewed'].includes(application.status);

  return (
    <TouchableOpacity
      onPress={() => onPress(application.jobPosting.id)}
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
        <Text className="text-gray-500 text-sm mb-1">
          📍 {application.jobPosting.location}
        </Text>
        <Text className="text-gray-500 text-sm mb-1">
          💼 {application.jobPosting.workMode.charAt(0).toUpperCase() + application.jobPosting.workMode.slice(1)}
        </Text>
        <Text className="text-gray-500 text-sm">
          📅 Applied: {new Date(application.appliedAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Rejection Reason */}
      {application.status === 'rejected' && application.rejectionReason && (
        <View className="bg-red-50 rounded-xl p-3 mb-3 border border-red-200">
          <Text className="text-red-600 text-xs font-semibold mb-1">Rejection Reason:</Text>
          <Text className="text-gray-700 text-sm">{application.rejectionReason}</Text>
        </View>
      )}

      {/* Interview Slots Available */}
      {application.status === 'interview' && onViewInterviewSlots && (
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
            onPress={() => onViewInterviewSlots(application.id)}
            className="bg-purple-600 rounded-lg py-2 px-3 items-center"
          >
            <Text className="text-white text-xs font-semibold">Select Interview Time</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-3 mt-3">
        <TouchableOpacity
          onPress={() => onPress(application.jobPosting.id)}
          className="bg-primary-blue rounded-xl py-2 px-4 flex-1 items-center"
        >
          <Text className="text-white text-sm font-semibold">View Details</Text>
        </TouchableOpacity>
        {canWithdraw && (
          <TouchableOpacity
            onPress={() => onWithdraw(application.id)}
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
  const { data: isCalendarConnected, refetch: refetchCalendarStatus } = useIsGoogleCalendarConnectedQuery();
  const { data, isLoading, refetch } = useInterviewSlotsQuery(applicationId, { skip: !applicationId });
  const [selectSlot, { isLoading: isSelecting }] = useSelectInterviewSlotMutation();
  const [showCalendarCheck, setShowCalendarCheck] = useState(false);

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
                <Text className="text-blue-800 text-sm mb-2">
                  📅 To confirm your interview, connect your Google Calendar first.
                </Text>
                <Text className="text-blue-700 text-xs">
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
    </>
  );
};

interface ApplicationTrackerScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onJobPress?: (jobId: string) => void;
  onBrowseJobsPress?: () => void;
}

export default function ApplicationTrackerScreen({
  activeTab = 'jobs',
  onTabChange,
  userName = 'User',
  onJobPress,
  onBrowseJobsPress,
}: ApplicationTrackerScreenProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showInterviewSlots, setShowInterviewSlots] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

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
            setShowInterviewSlots(false);
            setSelectedApplicationId(null);
          }}
          onSuccess={() => {
            refetch();
            setShowInterviewSlots(false);
            setSelectedApplicationId(null);
          }}
        />
      )}
    </CandidateLayout>
  );
}
