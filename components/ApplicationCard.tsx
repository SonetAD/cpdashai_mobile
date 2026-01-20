import React, { memo, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import GoogleCalendarIcon from '../assets/images/jobs/googleCalender.svg';
import GoogleCalendarDisconnectedIcon from '../assets/images/jobs/googleCalenderDisconnected.svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface InterviewSlotData {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'available' | 'selected' | 'expired';
}

export interface ConfirmedInterviewData {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  interviewType?: string;
  videoCallLink?: string;
  location?: string;
}

export interface ApplicationCardData {
  id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'interview_scheduled' | 'offered' | 'rejected' | 'withdrawn' | 'accepted';
  appliedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  jobPosting: {
    id: string;
    title: string;
    companyName: string;
    location: string;
    workMode?: string;
  };
  jobMatch?: {
    matchPercentage: number;
  };
  // Interview specific fields
  interviewSlots?: InterviewSlotData[];
  confirmedInterview?: ConfirmedInterviewData;
  interviewTimezone?: string;
}

interface ApplicationCardProps {
  application: ApplicationCardData;
  isGoogleCalendarConnected?: boolean;
  isSubmittingSlot?: boolean;
  onSelectSlot?: (slotId: string, slotData: InterviewSlotData) => void;
  onReschedule?: () => void;
  onConnectCalendar?: () => void;
  onPress?: () => void;
}

// Format date to readable format
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Get status display text and color
const getStatusInfo = (status: string): { text: string; color: string } => {
  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: 'Applied', color: '#437EF4' },
    reviewed: { text: 'Reviewed', color: '#8B5CF6' },
    shortlisted: { text: 'Shortlisted', color: '#10B981' },
    interview: { text: 'Interview', color: '#437EF4' },
    interview_scheduled: { text: 'Interview', color: '#437EF4' },
    offered: { text: 'Offered', color: '#10B981' },
    rejected: { text: 'Rejected', color: '#EF4444' },
    withdrawn: { text: 'Withdrawn', color: '#6B7280' },
    accepted: { text: 'Accepted', color: '#10B981' },
  };
  return statusMap[status] || { text: status, color: '#6B7280' };
};

// Format time from ISO string to display format (e.g., "12:00PM")
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr}${ampm}`;
};

// Format date for interview section
const formatInterviewDate = (isoString: string): string => {
  const date = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Get date key for grouping (YYYY-MM-DD)
const getDateKey = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Group slots by date
interface GroupedSlots {
  dateKey: string;
  dateLabel: string;
  slots: InterviewSlotData[];
}

const ApplicationCard = memo(({
  application,
  isGoogleCalendarConnected = false,
  isSubmittingSlot = false,
  onSelectSlot,
  onReschedule,
  onConnectCalendar,
  onPress,
}: ApplicationCardProps) => {
  const insets = useSafeAreaInsets();
  const { status, appliedAt, jobPosting, interviewSlots, confirmedInterview, interviewTimezone } = application;
  const { title, companyName, location } = jobPosting;
  const statusInfo = getStatusInfo(status);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  // Check if this is an interview status (either 'interview' or 'interview_scheduled')
  const isInterviewStatus = status === 'interview' || status === 'interview_scheduled';
  const availableSlots = interviewSlots?.filter(slot => slot.status === 'available') || [];

  // Show slot selection only if interview status, has available slots, and no confirmed interview
  const showSlotSelection = isInterviewStatus && availableSlots.length > 0 && !confirmedInterview;

  // Show confirmed interview section
  const showConfirmedInterviewSection = isInterviewStatus && confirmedInterview;

  // Debug logging
  console.log('🎫 ApplicationCard Debug:', {
    applicationId: application.id,
    status,
    isInterviewStatus,
    interviewSlots,
    availableSlotsCount: availableSlots.length,
    confirmedInterview,
    showSlotSelection,
    showConfirmedInterviewSection,
    isGoogleCalendarConnected,
  });

  // Get the pending slot details for confirmation sheet
  const pendingSlot = useMemo(() => {
    if (!pendingSlotId) return null;
    return availableSlots.find(slot => slot.id === pendingSlotId);
  }, [pendingSlotId, availableSlots]);

  // Group slots by date
  const groupedSlots = useMemo((): GroupedSlots[] => {
    const groups: Record<string, InterviewSlotData[]> = {};

    availableSlots.forEach(slot => {
      const dateKey = getDateKey(slot.startTime);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });

    // Sort by date and return array
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, slots]) => ({
        dateKey,
        dateLabel: formatInterviewDate(slots[0].startTime),
        slots: slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
      }));
  }, [availableSlots]);

  // Slots are disabled if Google Calendar is not connected
  const slotsDisabled = !isGoogleCalendarConnected;

  const handleSlotSelect = (slotId: string) => {
    if (slotsDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingSlotId(slotId);
    setShowConfirmSheet(true);
  };

  const handleConfirmSlot = () => {
    if (pendingSlotId && pendingSlot) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedSlotId(pendingSlotId);
      onSelectSlot?.(pendingSlotId, pendingSlot);
    }
    setShowConfirmSheet(false);
    setPendingSlotId(null);
  };

  const handleDiscardSlot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowConfirmSheet(false);
    setPendingSlotId(null);
  };

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReschedule?.();
  };

  // For interview status, don't trigger card press (no navigation to details)
  const handlePress = () => {
    if (isInterviewStatus) return; // Disable navigation for interview cards
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Card is clickable only if not interview status and has onPress
  const isCardClickable = !isInterviewStatus && !!onPress;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={isCardClickable ? 0.7 : 1}
      disabled={!isCardClickable}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {/* Job Title */}
          <Text style={styles.jobTitle} numberOfLines={2}>{title}</Text>

          {/* Company & Location */}
          <Text style={styles.companyLocation}>{companyName} • {location}</Text>

          {/* Applied Date */}
          <Text style={styles.appliedDate}>Applied on: {formatDate(appliedAt)}</Text>
        </View>

        {/* Google Calendar Icon - only show for interview status */}
        {isInterviewStatus && (
          <TouchableOpacity
            style={styles.calendarContainer}
            onPress={() => {
              if (!isGoogleCalendarConnected) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onConnectCalendar?.();
              }
            }}
            activeOpacity={isGoogleCalendarConnected ? 1 : 0.7}
            disabled={isGoogleCalendarConnected}
          >
            {isGoogleCalendarConnected ? (
              <GoogleCalendarIcon width={90} height={56} />
            ) : (
              <GoogleCalendarDisconnectedIcon width={90} height={56} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status : </Text>
        <Text style={[styles.statusValue, { color: statusInfo.color }]}>{statusInfo.text}</Text>
      </View>

      {/* Interview Slot Selection - only show for interview status with available slots */}
      {showSlotSelection && (
        <View style={styles.interviewSection}>
          <Text style={styles.selectTitle}>Select Your Time & Date</Text>

          {/* Show warning if not connected */}
          {!isGoogleCalendarConnected && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Connect Google Calendar to select a time slot
              </Text>
            </View>
          )}

          {/* Grouped Slots by Date */}
          {groupedSlots.map((group) => (
            <View key={group.dateKey} style={styles.dateGroup}>
              <Text style={styles.interviewDate}>
                {group.dateLabel}{interviewTimezone ? `, ${interviewTimezone}` : ''}
              </Text>

              {/* Time Slots for this date */}
              <View style={styles.slotsContainer}>
                {group.slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id || pendingSlotId === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotChip,
                        isSelected && styles.slotChipSelected,
                        slotsDisabled && styles.slotChipDisabled
                      ]}
                      onPress={() => handleSlotSelect(slot.id)}
                      activeOpacity={slotsDisabled ? 1 : 0.7}
                      disabled={slotsDisabled}
                    >
                      <Text style={[
                        styles.slotText,
                        isSelected && styles.slotTextSelected,
                        slotsDisabled && styles.slotTextDisabled
                      ]}>
                        {formatTime(slot.startTime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Reschedule Button */}
          <TouchableOpacity
            style={[
              styles.rescheduleButton,
              slotsDisabled && styles.rescheduleButtonDisabled
            ]}
            onPress={handleReschedule}
            activeOpacity={slotsDisabled ? 1 : 0.8}
            disabled={slotsDisabled}
          >
            <Text style={[
              styles.rescheduleText,
              slotsDisabled && styles.rescheduleTextDisabled
            ]}>Reschedule Interview</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Confirmed Interview Section */}
      {showConfirmedInterviewSection && confirmedInterview && (
        <View style={styles.confirmedSection}>
          {/* Confirmed Badge */}
          <View style={styles.confirmedBadge}>
            <View style={styles.checkmarkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.confirmedBadgeText}>Interview Confirmed</Text>
          </View>

          {/* Confirmed Time Card */}
          <View style={styles.confirmedTimeCard}>
            <View style={styles.confirmedTimeRow}>
              <View style={styles.confirmedDateContainer}>
                <Text style={styles.confirmedDateLabel}>Date</Text>
                <Text style={styles.confirmedDateValue}>
                  {formatInterviewDate(confirmedInterview.startTime)}
                </Text>
              </View>
              <View style={styles.confirmedTimeDivider} />
              <View style={styles.confirmedTimeContainer}>
                <Text style={styles.confirmedTimeLabel}>Time</Text>
                <Text style={styles.confirmedTimeValue}>
                  {formatTime(confirmedInterview.startTime)}
                </Text>
              </View>
            </View>
            <View style={styles.confirmedDurationRow}>
              <Text style={styles.confirmedDurationText}>
                Duration: {confirmedInterview.durationMinutes} minutes
                {interviewTimezone ? ` • ${interviewTimezone}` : ''}
              </Text>
            </View>
          </View>

          {/* Calendar Synced Info */}
          <View style={styles.calendarSyncedInfo}>
            <GoogleCalendarIcon width={20} height={12} />
            <Text style={styles.calendarSyncedText}>Added to your Google Calendar</Text>
          </View>

          {/* Reschedule Link */}
          {/* <TouchableOpacity
            style={styles.rescheduleLink}
            onPress={handleReschedule}
            activeOpacity={0.7}
          >
            <Text style={styles.rescheduleLinkText}>Need to reschedule?</Text>
          </TouchableOpacity> */}
        </View>
      )}

      {/* Bottom Sheet Confirmation Modal */}
      <Modal
        visible={showConfirmSheet}
        transparent
        animationType="slide"
        onRequestClose={handleDiscardSlot}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={handleDiscardSlot}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.bottomSheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            {/* Handle Bar */}
            <View style={styles.handleBarContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Content */}
            <View style={styles.bottomSheetContent}>
              <Text style={styles.bottomSheetTitle}>Confirm Interview Slot</Text>

              {pendingSlot && (
                <View style={styles.slotPreview}>
                  <Text style={styles.slotPreviewDate}>
                    {formatInterviewDate(pendingSlot.startTime)}
                  </Text>
                  <Text style={styles.slotPreviewTime}>
                    {formatTime(pendingSlot.startTime)} - {formatTime(pendingSlot.endTime)}
                  </Text>
                  <Text style={styles.slotPreviewDuration}>
                    {pendingSlot.durationMinutes} minutes
                  </Text>
                </View>
              )}

              <Text style={styles.bottomSheetMessage}>
                This will be added to your Google Calendar and notify the recruiter.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.bottomSheetActions}>
              <TouchableOpacity
                style={[styles.discardButton, isSubmittingSlot && styles.buttonDisabled]}
                onPress={handleDiscardSlot}
                activeOpacity={0.8}
                disabled={isSubmittingSlot}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, isSubmittingSlot && styles.buttonDisabled]}
                onPress={handleConfirmSlot}
                activeOpacity={0.8}
                disabled={isSubmittingSlot}
              >
                {isSubmittingSlot ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Slot</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // Shadow
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  companyLocation: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  appliedDate: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  calendarContainer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  interviewSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 8,
  },
  interviewDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slotChipSelected: {
    backgroundColor: '#437EF4',
    borderColor: '#437EF4',
  },
  slotChipDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  slotTextDisabled: {
    color: '#9CA3AF',
  },
  rescheduleButton: {
    backgroundColor: '#437EF4',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  rescheduleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rescheduleButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  rescheduleTextDisabled: {
    color: '#9CA3AF',
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  slotPreview: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  slotPreviewDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  slotPreviewTime: {
    fontSize: 24,
    fontWeight: '700',
    color: '#437EF4',
    marginBottom: 4,
  },
  slotPreviewDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  bottomSheetMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#437EF4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Confirmed Interview Section Styles
  confirmedSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  confirmedTimeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  confirmedTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmedDateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  confirmedDateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  confirmedDateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  confirmedTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 16,
  },
  confirmedTimeContainer: {
    flex: 1,
    alignItems: 'center',
  },
  confirmedTimeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  confirmedTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  confirmedDurationRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    alignItems: 'center',
  },
  confirmedDurationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarSyncedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  calendarSyncedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  rescheduleLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  rescheduleLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#437EF4',
    textDecorationLine: 'underline',
  },
});

export default ApplicationCard;
