/**
 * NotificationItem
 *
 * Individual notification card with category-based styling.
 * Supports swipe-to-delete and press actions.
 */

import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  NOTIFICATION_CATEGORY_CONFIG,
  NOTIFICATION_TYPE_CONFIG,
} from '../../contexts/NotificationContext';
import type { Notification } from '../../services/notificationWebSocket';

interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onDelete?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
}

// Icon components based on category
const NotificationIcon = memo(({ category, type, size = 24 }: { category: string; type: string; size?: number }) => {
  const categoryConfig = NOTIFICATION_CATEGORY_CONFIG[category] || NOTIFICATION_CATEGORY_CONFIG.general;
  const typeConfig = NOTIFICATION_TYPE_CONFIG[type] || NOTIFICATION_TYPE_CONFIG.info;
  const color = categoryConfig.color || typeConfig.color;

  // Return appropriate icon based on category
  switch (category) {
    case 'application_shortlisted':
    case 'subscription_activated':
    case 'mission_completed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 11.08V12a10 10 0 11-5.93-9.14"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M22 4L12 14.01l-3-3"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'application_rejected':
    case 'subscription_canceled':
    case 'mission_expired':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Path
            d="M15 9l-6 6M9 9l6 6"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'interview_scheduled':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'crs_level_up':
    case 'crs_milestone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M23 6l-9.5 9.5-5-5L1 18"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17 6h6v6"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'job_match':
    case 'mission_assigned':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
          <Circle cx={12} cy={12} r={6} stroke={color} strokeWidth={2} />
          <Circle cx={12} cy={12} r={2} fill={color} />
        </Svg>
      );
    case 'subscription_expiring':
    case 'trial_ending':
    case 'mission_deadline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'job_offer':
    case 'mission_reward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      // Default bell icon
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
});

// Time ago formatter
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function NotificationItemComponent({
  notification,
  onPress,
  onDelete,
  onMarkAsRead,
}: NotificationItemProps) {
  const categoryConfig = NOTIFICATION_CATEGORY_CONFIG[notification.category] || NOTIFICATION_CATEGORY_CONFIG.general;
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.info;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read if not already
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    onPress?.(notification);
  }, [notification, onPress, onMarkAsRead]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(notification.id);
  }, [notification.id, onDelete]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={handleDelete}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        style={[
          styles.container,
          !notification.is_read && styles.unreadContainer,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Unread indicator */}
        {!notification.is_read && <View style={styles.unreadDot} />}

        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: categoryConfig.bgColor || typeConfig.bgColor },
          ]}
        >
          <NotificationIcon
            category={notification.category}
            type={notification.type}
            size={22}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              !notification.is_read && styles.unreadTitle,
            ]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.time}>{getTimeAgo(notification.created_at)}</Text>
        </View>

        {/* Arrow indicator if action URL exists */}
        {notification.action_url && (
          <View style={styles.arrowContainer}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 18l6-6-6-6"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

export default memo(NotificationItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  unreadContainer: {
    backgroundColor: '#F0F7FF',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
});
