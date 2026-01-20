/**
 * NotificationToastManager
 *
 * Manages displaying notification toasts when new notifications arrive.
 * Uses the NotificationContext's setOnNewNotification callback.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationToast from './NotificationToast';
import type { Notification } from '../../services/notificationWebSocket';

export function NotificationToastManager() {
  const router = useRouter();
  const segments = useSegments();
  const { setOnNewNotification, markAsRead } = useNotifications();
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  // Check if user is on an onboarding/setup screen
  const isOnOnboardingScreen = useMemo(() => {
    const currentPath = segments.join('/');
    return currentPath.includes('subscription-gate') ||
           currentPath.includes('profile-setup') ||
           currentPath.includes('cv-upload') ||
           currentPath.includes('login') ||
           currentPath.includes('register') ||
           currentPath.includes('create-account') ||
           currentPath.includes('onboarding') ||
           currentPath.includes('splash');
  }, [segments]);

  // Handle new notification received
  const handleNewNotification = useCallback((notification: Notification) => {
    setCurrentNotification(notification);
  }, []);

  // Register the callback when component mounts
  useEffect(() => {
    setOnNewNotification(handleNewNotification);

    return () => {
      setOnNewNotification(undefined);
    };
  }, [setOnNewNotification, handleNewNotification]);

  // Handle toast dismiss
  const handleDismiss = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Handle toast press - navigate to notifications page (only if not on onboarding)
  const handlePress = useCallback(() => {
    if (!currentNotification) return;

    // Don't navigate if on onboarding screens
    if (isOnOnboardingScreen) {
      // Just dismiss the toast without navigating
      setCurrentNotification(null);
      return;
    }

    // Mark as read
    markAsRead(currentNotification.id);

    // Navigate to notifications screen
    router.push('/(candidate)/notifications' as any);

    setCurrentNotification(null);
  }, [currentNotification, markAsRead, router, isOnOnboardingScreen]);

  if (!currentNotification) {
    return null;
  }

  return (
    <NotificationToast
      notification={currentNotification}
      visible={true}
      onDismiss={handleDismiss}
      onPress={isOnOnboardingScreen ? undefined : handlePress}
    />
  );
}

export default NotificationToastManager;
