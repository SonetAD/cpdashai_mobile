/**
 * NotificationsScreen
 *
 * Displays all notifications with filtering and actions.
 * Optimized with FlashList for performance.
 */

import React, { useCallback, useState, useMemo, memo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { NotificationItem } from '../../../components/notifications';
import { useNotifications, NOTIFICATION_CATEGORY_CONFIG, NOTIFICATION_TYPE_CONFIG } from '../../../contexts/NotificationContext';
import type { Notification } from '../../../services/notificationWebSocket';
import { GlassButton } from '../../../components/ui/GlassButton';

type FilterType = 'all' | 'unread' | 'application' | 'crs' | 'mission' | 'subscription';

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Get category display name
const getCategoryDisplayName = (category: string): string => {
  const names: Record<string, string> = {
    application_received: 'Application Received',
    application_shortlisted: 'Shortlisted',
    application_rejected: 'Application Update',
    application_withdrawn: 'Application Withdrawn',
    interview_scheduled: 'Interview Scheduled',
    job_offer: 'Job Offer',
    job_match: 'Job Match',
    new_job_posted: 'New Job',
    saved_job_update: 'Saved Job Update',
    crs_level_up: 'Level Up',
    crs_score_change: 'CRS Update',
    crs_milestone: 'Milestone Reached',
    mission_assigned: 'New Mission',
    mission_completed: 'Mission Complete',
    mission_deadline: 'Mission Deadline',
    mission_expired: 'Mission Expired',
    mission_reward: 'Reward Earned',
    subscription_activated: 'Subscription Active',
    subscription_canceled: 'Subscription Canceled',
    subscription_renewed: 'Subscription Renewed',
    subscription_expiring: 'Subscription Expiring',
    subscription_payment_failed: 'Payment Failed',
    trial_started: 'Trial Started',
    trial_ending: 'Trial Ending',
    trial_ended: 'Trial Ended',
    general: 'Notification',
    system: 'System',
  };
  return names[category] || 'Notification';
};

// Category Icon Component
const CategoryIcon = memo(({ category, size = 18, color }: { category: string; size?: number; color: string }) => {
  switch (category) {
    case 'crs_level_up':
    case 'crs_score_change':
    case 'crs_milestone':
      // Trending up icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M17 6h6v6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'trial_started':
    case 'subscription_activated':
    case 'subscription_renewed':
      // Star/sparkle icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'trial_ending':
    case 'trial_ended':
    case 'subscription_expiring':
    case 'subscription_canceled':
      // Clock/warning icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'mission_assigned':
    case 'mission_completed':
    case 'job_match':
      // Target icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Circle cx={12} cy={12} r={6} stroke={color} strokeWidth={2} />
          <Circle cx={12} cy={12} r={2} fill={color} />
        </Svg>
      );
    case 'application_shortlisted':
    case 'job_offer':
      // Check circle icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'interview_scheduled':
      // Calendar icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      // Bell icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
});

// Notification Detail Modal
const NotificationDetailModal = memo(({
  notification,
  visible,
  onClose,
  onMarkAsRead,
}: {
  notification: Notification | null;
  visible: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}) => {
  if (!notification) return null;

  const categoryConfig = NOTIFICATION_CATEGORY_CONFIG[notification.category] || NOTIFICATION_CATEGORY_CONFIG.general;
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.info;
  const color = categoryConfig.color || typeConfig.color;
  const bgColor = categoryConfig.bgColor || typeConfig.bgColor;

  // Button colors - always blue
  const buttonColors = ['#3B82F6', '#2563EB'];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    onClose();
  };

  // Remove emojis from title for cleaner display
  const cleanTitle = notification.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Glass Category Badge */}
          <View style={styles.modalGlassBadge}>
            <View style={[styles.modalBadgeDot, { backgroundColor: color }]} />
            <CategoryIcon category={notification.category} size={16} color={color} />
            <Text style={[styles.modalBadgeText, { color }]}>
              {getCategoryDisplayName(notification.category)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>{cleanTitle}</Text>

          {/* Message */}
          <Text style={styles.modalMessage}>{notification.message}</Text>

          {/* Timestamp Row */}
          <View style={styles.modalInfoRow}>
            <View style={styles.modalTimestamp}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke="#9CA3AF" strokeWidth={2} />
                <Path d="M12 6v6l4 2" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.modalTimestampText}>
                {formatDate(notification.created_at)}
              </Text>
            </View>
          </View>

          {/* Glass Button */}
          <View style={styles.modalButtonContainer}>
            <GlassButton
              text="Got it"
              width={280}
              height={50}
              borderRadius={25}
              colors={buttonColors}
              shadowColor="rgba(37, 99, 235, 0.4)"
              onPress={handleClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'application', label: 'Applications' },
  { key: 'crs', label: 'CRS' },
  { key: 'mission', label: 'Missions' },
  { key: 'subscription', label: 'Subscription' },
];

// Memoized filter chip component
const FilterChip = memo(({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
));

// Empty state component
const EmptyState = memo(({ filter }: { filter: FilterType }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconContainer}>
      <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="#D1D5DB"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M13.73 21a2 2 0 01-3.46 0"
          stroke="#D1D5DB"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
    <Text style={styles.emptyTitle}>
      {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
    </Text>
    <Text style={styles.emptyMessage}>
      {filter === 'all'
        ? "You're all caught up! New notifications will appear here."
        : `You don't have any ${filter} notifications at the moment.`}
    </Text>
  </View>
));


export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  // Mark all notifications as read when user visits this page
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, []);

  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      switch (activeFilter) {
        case 'unread':
          return !notification.is_read;
        case 'application':
          return notification.category.startsWith('application_') ||
                 notification.category === 'interview_scheduled' ||
                 notification.category === 'job_offer';
        case 'crs':
          return notification.category.startsWith('crs_');
        case 'mission':
          return notification.category.startsWith('mission_');
        case 'subscription':
          return notification.category.startsWith('subscription_') ||
                 notification.category.startsWith('trial_');
        default:
          return true;
      }
    });
  }, [notifications, activeFilter]);

  const handleFilterChange = useCallback((filter: FilterType) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNotification(notification);
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedNotification(null);
  }, []);

  const handleDelete = useCallback((notificationId: string) => {
    deleteNotification(notificationId);
  }, [deleteNotification]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        onDelete={handleDelete}
        onMarkAsRead={markAsRead}
      />
    ),
    [handleNotificationPress, handleDelete, markAsRead]
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Filter chips */}
        <View style={styles.filterContainer}>
          <FlashList
            data={FILTERS}
            horizontal
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={80}
            renderItem={({ item }) => (
              <FilterChip
                label={item.label}
                isActive={activeFilter === item.key}
                onPress={() => handleFilterChange(item.key)}
              />
            )}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.filterList}
          />
        </View>

        {/* Result count */}
        <View style={styles.headerActions}>
          <Text style={styles.resultCount}>
            {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    ),
    [activeFilter, filteredNotifications.length, handleFilterChange]
  );

  const ListEmptyComponent = useMemo(
    () => (isLoading ? null : <EmptyState filter={activeFilter} />),
    [isLoading, activeFilter]
  );

  return (
    <>
      <CandidateLayout
        showBackButton
        onBack={() => router.back()}
        headerTitle="Notifications"
        showGlassPill={false}
      >
        <View style={[styles.container, { paddingTop: insets.top + 80 }]}>
          {isLoading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <FlashList
              data={filteredNotifications}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              estimatedItemSize={100}
              ListHeaderComponent={ListHeaderComponent}
              ListEmptyComponent={ListEmptyComponent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={['#3B82F6']}
                  tintColor="#3B82F6"
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </CandidateLayout>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        visible={isModalVisible}
        onClose={handleCloseModal}
        onMarkAsRead={markAsRead}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  filterContainer: {
    height: 52,
  },
  filterList: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignSelf: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
    gap: 8,
    // Glass effect border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Shadow
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 26,
  },
  modalMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalInfoRow: {
    marginBottom: 24,
  },
  modalTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTimestampText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  modalButtonContainer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
});
