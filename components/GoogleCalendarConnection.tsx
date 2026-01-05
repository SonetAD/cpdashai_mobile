import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import Svg, { Path } from 'react-native-svg';
import { 
  useGetGoogleCalendarAuthUrlMutation,
  useConnectGoogleCalendarMutation,
  useDisconnectGoogleCalendarMutation,
  useIsGoogleCalendarConnectedQuery,
  API_URL
} from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import * as WebBrowser from 'expo-web-browser';

interface GoogleCalendarConnectionProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export const GoogleCalendarConnection: React.FC<GoogleCalendarConnectionProps> = ({
  onConnectionChange
}) => {
  const { showAlert } = useAlert();
  const [getAuthUrl, { isLoading: isGettingUrl }] = useGetGoogleCalendarAuthUrlMutation();
  const [connectCalendar, { isLoading: isConnecting }] = useConnectGoogleCalendarMutation();
  const [disconnectCalendar, { isLoading: isDisconnecting }] = useDisconnectGoogleCalendarMutation();
  const { data: isConnected, isLoading: isCheckingConnection, refetch } = useIsGoogleCalendarConnectedQuery();

  useEffect(() => {
    if (onConnectionChange && isConnected !== undefined) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  const handleConnect = async () => {
    try {
      console.log('🔗 Starting Google Calendar connection flow...');
      
      // Get the redirect URI (same as backend callback)
      const redirectUri = `${API_URL}/auth/google/callback`;
      console.log('📍 Redirect URI:', redirectUri);

      // Get authorization URL
      const response = await getAuthUrl().unwrap();
      const authData = response.getGoogleCalendarAuthUrl;
      
      if ('authorizationUrl' in authData && authData.authorizationUrl) {
        console.log('✅ Got auth URL:', authData.authorizationUrl);

        // Open browser for OAuth
        const result = await WebBrowser.openAuthSessionAsync(
          authData.authorizationUrl,
          redirectUri
        );

        console.log('🌐 Browser result:', result);

        if (result.type === 'success' && result.url) {
          // The callback returns JSON with the code, so we need to fetch it
          console.log('📡 Fetching callback response from:', result.url);
          
          try {
            const callbackResponse = await fetch(result.url);
            const callbackData = await callbackResponse.json();
            
            console.log('📦 Callback data:', callbackData);

            if (callbackData.success && callbackData.code) {
              console.log('✅ Got authorization code, connecting calendar...');
              
              // Connect calendar with the code
              const connectResponse = await connectCalendar({ code: callbackData.code }).unwrap();
              const connectData = connectResponse.connectGoogleCalendar;

              if ('success' in connectData && connectData.success) {
                showAlert({
                  type: 'success',
                  title: 'Connected!',
                  message: 'Google Calendar connected successfully.',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                refetch();
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
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error: any) {
      console.error('❌ Google Calendar connection error:', error);
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
      <View className="bg-white rounded-xl p-4 border border-gray-100">
        <ActivityIndicator size="small" color="#437EF4" />
        <Text className="text-gray-500 text-xs text-center mt-2">Checking connection...</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 border border-gray-100">
      <View className="flex-row items-center mb-3">
        <View className="bg-blue-50 rounded-full p-2 mr-3">
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM7 11h5v5H7z" fill="#437EF4"/>
          </Svg>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-base font-semibold">Google Calendar</Text>
          <Text className="text-gray-500 text-xs mt-0.5">
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Text className={`text-xs font-medium ${isConnected ? 'text-green-700' : 'text-gray-500'}`}>
            {isConnected ? '● Connected' : '○ Not connected'}
          </Text>
        </View>
      </View>

      {!isConnected && (
        <View className="bg-blue-50 rounded-lg p-3 mb-3">
          <Text className="text-blue-800 text-xs">
            📅 Connect your Google Calendar to automatically sync interview schedules.
          </Text>
        </View>
      )}

      <TouchableOpacity
        className={`rounded-lg py-3 items-center ${
          isConnected ? 'bg-red-500' : 'bg-blue-500'
        } ${(isGettingUrl || isConnecting || isDisconnecting) ? 'opacity-50' : ''}`}
        onPress={isConnected ? handleDisconnect : handleConnect}
        disabled={isGettingUrl || isConnecting || isDisconnecting}
      >
        {(isGettingUrl || isConnecting || isDisconnecting) ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text className="text-white text-sm font-semibold">
            {isConnected ? 'Disconnect Calendar' : 'Connect Google Calendar'}
          </Text>
        )}
      </TouchableOpacity>

      {isConnected && (
        <Text className="text-gray-400 text-xs text-center mt-2">
          Your interviews will be automatically synced to your calendar
        </Text>
      )}
    </View>
  );
};
