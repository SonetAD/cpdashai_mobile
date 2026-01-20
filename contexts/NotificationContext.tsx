/**
 * NotificationContext
 *
 * Provides real-time notification functionality across the app.
 * Manages WebSocket connection, notification state, and unread count.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import notificationWebSocket, {
  Notification,
  NotificationWebSocketHandlers,
} from '../services/notificationWebSocket';
import {
  useGetMyNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useGetUnreadNotificationCountQuery,
} from '../services/api';

// Notification category colors and icons
export const NOTIFICATION_CATEGORY_CONFIG: Record<
  string,
  { color: string; bgColor: string; icon: string }
> = {
  // Application-related
  application_received: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'briefcase' },
  application_shortlisted: { color: '#10B981', bgColor: '#ECFDF5', icon: 'check-circle' },
  application_rejected: { color: '#EF4444', bgColor: '#FEF2F2', icon: 'x-circle' },
  application_withdrawn: { color: '#6B7280', bgColor: '#F3F4F6', icon: 'arrow-left' },
  interview_scheduled: { color: '#8B5CF6', bgColor: '#F5F3FF', icon: 'calendar' },
  job_offer: { color: '#10B981', bgColor: '#ECFDF5', icon: 'gift' },

  // Job-related
  job_match: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'target' },
  new_job_posted: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'plus-circle' },
  saved_job_update: { color: '#F59E0B', bgColor: '#FFFBEB', icon: 'bookmark' },

  // CRS-related
  crs_level_up: { color: '#10B981', bgColor: '#ECFDF5', icon: 'trending-up' },
  crs_score_change: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'activity' },
  crs_milestone: { color: '#F59E0B', bgColor: '#FFFBEB', icon: 'award' },

  // Mission-related
  mission_assigned: { color: '#8B5CF6', bgColor: '#F5F3FF', icon: 'target' },
  mission_completed: { color: '#10B981', bgColor: '#ECFDF5', icon: 'check' },
  mission_deadline: { color: '#F59E0B', bgColor: '#FFFBEB', icon: 'clock' },
  mission_expired: { color: '#EF4444', bgColor: '#FEF2F2', icon: 'x' },
  mission_reward: { color: '#10B981', bgColor: '#ECFDF5', icon: 'gift' },

  // Subscription-related
  subscription_activated: { color: '#10B981', bgColor: '#ECFDF5', icon: 'check-circle' },
  subscription_canceled: { color: '#EF4444', bgColor: '#FEF2F2', icon: 'x-circle' },
  subscription_renewed: { color: '#10B981', bgColor: '#ECFDF5', icon: 'refresh-cw' },
  subscription_expiring: { color: '#F59E0B', bgColor: '#FFFBEB', icon: 'alert-triangle' },
  subscription_payment_failed: { color: '#EF4444', bgColor: '#FEF2F2', icon: 'alert-circle' },
  trial_started: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'play' },
  trial_ending: { color: '#F59E0B', bgColor: '#FFFBEB', icon: 'clock' },
  trial_ended: { color: '#6B7280', bgColor: '#F3F4F6', icon: 'stop-circle' },

  // General
  general: { color: '#3B82F6', bgColor: '#EFF6FF', icon: 'bell' },
  system: { color: '#6B7280', bgColor: '#F3F4F6', icon: 'info' },
};

// Type mapping for notification type to color
export const NOTIFICATION_TYPE_CONFIG: Record<
  string,
  { color: string; bgColor: string }
> = {
  success: { color: '#10B981', bgColor: '#ECFDF5' },
  warning: { color: '#F59E0B', bgColor: '#FFFBEB' },
  error: { color: '#EF4444', bgColor: '#FEF2F2' },
  info: { color: '#3B82F6', bgColor: '#EFF6FF' },
};

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => void;

  // New notification callback (for showing toasts)
  onNewNotification?: (notification: Notification) => void;
  setOnNewNotification: (callback: ((notification: Notification) => void) | undefined) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const onNewNotificationRef = useRef<((notification: Notification) => void) | undefined>();

  // Get auth state
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // GraphQL queries and mutations
  const {
    data: notificationsData,
    isLoading,
    refetch: refetchNotifications,
  } = useGetMyNotificationsQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  const { data: unreadCountData, refetch: refetchUnreadCount } = useGetUnreadNotificationCountQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  const [markAsReadMutation] = useMarkNotificationAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  // Update notifications from API response
  useEffect(() => {
    if (notificationsData?.myNotifications?.notifications) {
      const apiNotifications = notificationsData.myNotifications.notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        category: n.category,
        title: n.title,
        message: n.message,
        is_read: n.isRead,
        read_at: n.readAt,
        action_url: n.actionUrl,
        related_job_id: n.relatedJobId,
        related_application_id: n.relatedApplicationId,
        related_mission_id: n.relatedMissionId,
        related_subscription_id: n.relatedSubscriptionId,
        related_crs_id: n.relatedCrsId,
        created_at: n.createdAt,
      }));
      setNotifications(apiNotifications);
    }
  }, [notificationsData]);

  // Update unread count from API response
  useEffect(() => {
    if (typeof unreadCountData?.unreadNotificationCount === 'number') {
      setUnreadCount(unreadCountData.unreadNotificationCount);
    }
  }, [unreadCountData]);

  // WebSocket handlers
  const wsHandlers: NotificationWebSocketHandlers = {
    onConnected: (count) => {
      console.log('Notification WS connected, unread:', count);
      setUnreadCount(count);
    },

    onNewNotification: (notification) => {
      console.log('New notification received:', notification.title);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Call the toast callback if set
      onNewNotificationRef.current?.(notification);
    },

    onNotificationRead: (notificationId) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },

    onAllNotificationsRead: () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    },

    onNotificationDeleted: (notificationId) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    },

    onUnreadCountUpdate: (count) => {
      setUnreadCount(count);
    },

    onConnectionChange: (connected) => {
      setIsConnected(connected);
    },

    onError: (error) => {
      // Silently handle WebSocket errors - will fallback to GraphQL
      console.log('NotificationWS: WebSocket unavailable, using GraphQL fallback');
    },
  };

  // Connect/disconnect WebSocket based on auth state
  useEffect(() => {
    if (isAuthenticated && token) {
      notificationWebSocket.connect(wsHandlers);
    } else {
      notificationWebSocket.disconnect();
      setNotifications([]);
      setUnreadCount(0);
    }

    return () => {
      notificationWebSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  // Handle app state changes (reconnect when app comes to foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Reconnect and refresh when app comes to foreground
        notificationWebSocket.updateToken();
        refetchNotifications();
        refetchUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Try WebSocket first
      const wsSuccess = notificationWebSocket.markAsRead(notificationId);

      // Fall back to GraphQL if WebSocket fails
      if (!wsSuccess) {
        try {
          await markAsReadMutation({ notificationId }).unwrap();
        } catch (error) {
          console.error('Error marking notification as read:', error);
          // Revert optimistic update on error
          refetchNotifications();
          refetchUnreadCount();
        }
      }
    },
    [markAsReadMutation, refetchNotifications, refetchUnreadCount]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    // Try WebSocket first
    const wsSuccess = notificationWebSocket.markAllAsRead();

    // Fall back to GraphQL if WebSocket fails
    if (!wsSuccess) {
      try {
        await markAllAsReadMutation().unwrap();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        // Revert optimistic update on error
        refetchNotifications();
        refetchUnreadCount();
      }
    }
  }, [markAllAsReadMutation, refetchNotifications, refetchUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await deleteNotificationMutation({ notificationId }).unwrap();
      } catch (error) {
        console.error('Error deleting notification:', error);
        // Revert optimistic update on error
        refetchNotifications();
        refetchUnreadCount();
      }
    },
    [notifications, deleteNotificationMutation, refetchNotifications, refetchUnreadCount]
  );

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    refetchNotifications();
    refetchUnreadCount();
  }, [refetchNotifications, refetchUnreadCount]);

  // Set new notification callback
  const setOnNewNotification = useCallback(
    (callback: ((notification: Notification) => void) | undefined) => {
      onNewNotificationRef.current = callback;
    },
    []
  );

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    setOnNewNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
