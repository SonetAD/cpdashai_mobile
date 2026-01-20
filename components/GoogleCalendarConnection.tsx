import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, AppState, AppStateStatus } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  useGetGoogleCalendarAuthUrlMutation,
  useConnectGoogleCalendarMutation,
  useDisconnectGoogleCalendarMutation,
  useIsGoogleCalendarConnectedQuery,
  API_URL
} from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import * as WebBrowser from 'expo-web-browser';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Google Calendar Icon
const GoogleCalendarIcon = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d="M36 8H12C9.79086 8 8 9.79086 8 12V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V12C40 9.79086 38.2091 8 36 8Z" fill="#4285F4"/>
    <Path d="M34 6H14C10.6863 6 8 8.68629 8 12V14H40V12C40 8.68629 37.3137 6 34 6Z" fill="#1967D2"/>
    <Rect x="12" y="18" width="8" height="8" rx="1" fill="white"/>
    <Rect x="12" y="28" width="8" height="8" rx="1" fill="white"/>
    <Rect x="22" y="18" width="8" height="8" rx="1" fill="white"/>
    <Rect x="22" y="28" width="8" height="8" rx="1" fill="white"/>
    <Rect x="32" y="18" width="4" height="8" rx="1" fill="white"/>
    <Rect x="32" y="28" width="4" height="8" rx="1" fill="white"/>
  </Svg>
);

interface GoogleCalendarConnectionProps {
  onConnectionChange?: (isConnected: boolean) => void;
  compact?: boolean;
}

export const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  onConnectionChange,
  compact = false
}) => {
  const { showAlert } = useAlert();
  const [getAuthUrl, { isLoading: isGettingUrl }] = useGetGoogleCalendarAuthUrlMutation();
  const [connectCalendar, { isLoading: isConnecting }] = useConnectGoogleCalendarMutation();
  const [disconnectCalendar, { isLoading: isDisconnecting }] = useDisconnectGoogleCalendarMutation();
  const { data: isConnected, isLoading: isCheckingConnection, refetch } = useIsGoogleCalendarConnectedQuery();

  const isLoading = isGettingUrl || isConnecting || isDisconnecting;
  const appState = useRef(AppState.currentState);

  // Notify parent when connection status changes
  useEffect(() => {
    if (onConnectionChange && isConnected !== undefined) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  // Refresh status when app comes back to foreground (in case user completed OAuth externally)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('🔄 App returned to foreground, refreshing calendar status...');
        refetch();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [refetch]);

  const handleConnect = async () => {
    try {
      console.log('🔗 Starting Google Calendar connection flow...');

      const redirectUri = `${API_URL}/auth/google/callback`;
      console.log('📍 Redirect URI:', redirectUri);

      const response = await getAuthUrl().unwrap();
      const authData = response.getGoogleCalendarAuthUrl;

      if ('authorizationUrl' in authData && authData.authorizationUrl) {
        console.log('✅ Got auth URL:', authData.authorizationUrl);

        const result = await WebBrowser.openAuthSessionAsync(
          authData.authorizationUrl,
          redirectUri
        );

        console.log('🌐 Browser result:', result);

        if (result.type === 'success' && result.url) {
          console.log('📡 Fetching callback response from:', result.url);

          try {
            const callbackResponse = await fetch(result.url);
            const callbackData = await callbackResponse.json();

            console.log('📦 Callback data:', callbackData);

            if (callbackData.success && callbackData.code) {
              console.log('✅ Got authorization code, connecting calendar...');

              const connectResponse = await connectCalendar({ code: callbackData.code }).unwrap();
              const connectData = connectResponse.connectGoogleCalendar;

              if ('success' in connectData && connectData.success) {
                showAlert({
                  type: 'success',
                  title: 'Connected!',
                  message: 'Google Calendar connected successfully.',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                throw new Error(connectData.message || 'Failed to connect calendar');
              }
            } else {
              throw new Error(callbackData.errorDescription || callbackData.error || 'No authorization code received');
            }
          } catch (fetchError: any) {
            console.error('❌ Failed to fetch callback data:', fetchError);
            throw new Error('Failed to retrieve authorization code from callback');
          }
        }

        // Always refresh status after returning from OAuth popup (success, cancel, or dismiss)
        console.log('🔄 Refreshing calendar connection status...');
        refetch();
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('❌ Google Calendar connection error:', error);
      // Still refresh status on error in case connection happened but something else failed
      refetch();
      showAlert({
        type: 'error',
        title: 'Connection Failed',
        message: error.message || 'Failed to connect Google Calendar. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleDisconnect = async () => {
    showAlert({
      type: 'confirm',
      title: 'Disconnect Calendar?',
      message: 'Are you sure you want to disconnect your Google Calendar? Future interviews will not be synced.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await disconnectCalendar().unwrap();

              if (response.disconnectGoogleCalendar.success) {
                showAlert({
                  type: 'success',
                  title: 'Disconnected',
                  message: 'Google Calendar disconnected successfully.',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                refetch();
              } else {
                throw new Error(response.disconnectGoogleCalendar.message);
              }
            } catch (error: any) {
              console.error('❌ Disconnect error:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to disconnect calendar.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  if (isCheckingConnection) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#437EF4" />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Calendar Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.iconContainer}>
          <GoogleCalendarIcon size={36} />
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.title} numberOfLines={1}>Google Calendar</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isConnected ? 'Syncing interviews' : 'Sync your interviews'}
          </Text>
        </View>
        <View style={[styles.badge, isConnected ? styles.badgeConnected : styles.badgeDisconnected]}>
          <Text
            style={[styles.badgeText, isConnected ? styles.badgeTextConnected : styles.badgeTextDisconnected]}
            numberOfLines={1}
          >
            {isConnected ? '● Connected' : '○ Disconnected'}
          </Text>
        </View>
      </View>

      {/* Info Box - Only show when not connected */}
      {!isConnected && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📅 Connect your Google Calendar to automatically sync interview schedules.
          </Text>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.button,
          isConnected ? styles.buttonDisconnect : styles.buttonConnect,
          isLoading && styles.buttonDisabled
        ]}
        onPress={isConnected ? handleDisconnect : handleConnect}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            {isConnected ? 'Disconnect Calendar' : 'Connect Google Calendar'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Connected Info */}
      {isConnected && (
        <Text style={styles.connectedInfo}>
          Your interviews will be automatically synced to your calendar
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgeConnected: {
    backgroundColor: '#D1FAE5',
  },
  badgeDisconnected: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextConnected: {
    color: '#059669',
  },
  badgeTextDisconnected: {
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1D4ED8',
    lineHeight: 18,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonConnect: {
    backgroundColor: '#437EF4',
  },
  buttonDisconnect: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectedInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 10,
  },
});
