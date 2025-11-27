import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import Svg, { Path } from 'react-native-svg';
import UserIcon from '../../../assets/images/userIcon.svg';
import MailIcon from '../../../assets/images/mailIcon.svg';
import CallIcon from '../../../assets/images/callIcon.svg';
import UserQuestionIcon from '../../../assets/images/userQuestionWhite.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import SearchModal from '../../../components/SearchModal';
import SettingsScreen from './SettingsScreen';
import { useCheckSubscriptionStatusQuery } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

interface ProfileFieldProps {
  icon: React.ReactNode;
  value: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ icon, value }) => {
  return (
    <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 mb-3 flex-row items-center">
      <View className="mr-3">{icon}</View>
      <Text className="text-gray-400 text-sm flex-1">{value}</Text>
    </View>
  );
};

const SettingsIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface ProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onViewFullProfile?: () => void;
  onLogout?: () => void;
  onViewPricing?: () => void;
}

export default function ProfileScreen({
  activeTab = 'profile',
  onTabChange,
  onViewFullProfile,
  onLogout,
  onViewPricing,
}: ProfileScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';

  // Get subscription status
  const { data: subscriptionData, refetch: refetchSubscription } = useCheckSubscriptionStatusQuery();
  const { showAlert } = useAlert();
  // Generate initials from user name
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  // Get full name
  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return userName;
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchSubscription();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle logout with confirmation
  const handleLogoutPress = () => {
    showAlert({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout from your account?',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onLogout?.();
          },
        },
      ],
    });
  };

  // If settings screen is shown, render it instead
  if (showSettings) {
    return (
      <SettingsScreen
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          // If a different tab is selected, close settings and navigate
          if (tabId !== activeTab) {
            setShowSettings(false);
          }
          onTabChange?.(tabId);
        }}
        onBack={() => setShowSettings(false)}
        onViewPricing={onViewPricing}
      />
    );
  }

  return (
    <>
      <CandidateLayout
        userName={userName}
        onSearchPress={() => setShowSearchModal(true)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#437EF4']}
            tintColor="#437EF4"
          />
        }
      >
        <View className="px-6 mt-6 pb-6">
        {/* Avatar Section */}
        <View className="items-center mb-6">
          <View
            className="rounded-full bg-blue-400 items-center justify-center mb-3"
            style={{ width: 70, height: 70 }}
          >
            <Text className="text-white text-2xl font-semibold">{getInitials()}</Text>
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-1">{getFullName()}</Text>
          <Text className="text-gray-500 text-sm mb-1">
            {user?.email || 'No email'}
          </Text>
          {user?.phoneNumber && (
            <Text className="text-gray-500 text-sm">{user.phoneNumber}</Text>
          )}
        </View>

        {/* Subscription Status Card */}
        {subscriptionData?.subscriptionStatus && (
          <TouchableOpacity
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 mb-6"
            activeOpacity={0.8}
            onPress={onViewPricing}
            style={{
              backgroundColor: subscriptionData.subscriptionStatus.plan === 'free' ? '#F3F4F6' : '#DBEAFE',
              borderWidth: 1,
              borderColor: subscriptionData.subscriptionStatus.plan === 'free' ? '#E5E7EB' : '#93C5FD'
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className={`text-sm font-semibold ${
                    subscriptionData.subscriptionStatus.plan === 'free' ? 'text-gray-600' : 'text-blue-700'
                  }`}>
                    Subscription Plan
                  </Text>
                  {subscriptionData.subscriptionStatus.plan !== 'free' && (
                    <View className="bg-green-500 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-white text-xs font-bold">ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text className={`text-xl font-bold capitalize mb-2 ${
                  subscriptionData.subscriptionStatus.plan === 'free' ? 'text-gray-900' : 'text-blue-900'
                }`}>
                  {subscriptionData.subscriptionStatus.plan || 'Free'} Plan
                </Text>

                {subscriptionData.subscriptionStatus.canUseAiFeatures ? (
                  <View>
                    <Text className="text-gray-600 text-xs mb-1">
                      AI Resume Parses: {subscriptionData.subscriptionStatus.aiResumeParsesRemaining || 0} remaining
                    </Text>
                    <Text className="text-gray-600 text-xs">
                      AI Improvements: {subscriptionData.subscriptionStatus.aiContentImprovementsRemaining || 0} remaining
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-600 text-xs">
                    Upgrade to unlock AI features
                  </Text>
                )}
              </View>

              <View className="items-center">
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 18l6-6-6-6"
                    stroke={subscriptionData.subscriptionStatus.plan === 'free' ? '#6B7280' : '#1D4ED8'}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            {subscriptionData.subscriptionStatus.currentPeriodEnd && subscriptionData.subscriptionStatus.plan !== 'free' && (
              <View className="mt-3 pt-3 border-t border-gray-200">
                <Text className="text-gray-500 text-xs">
                  Next billing: {new Date(subscriptionData.subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Profile Fields */}
        <View className="mt-4">
          <ProfileField
            icon={<UserIcon width={20} height={20} />}
            value={getFullName()}
          />
          <ProfileField
            icon={<MailIcon width={20} height={20} />}
            value={user?.email || 'No email'}
          />
          <ProfileField
            icon={<CallIcon width={20} height={20} />}
            value={user?.phoneNumber || 'No phone number'}
          />
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6">
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-4 flex-1 items-center"
            activeOpacity={0.8}
            onPress={onViewFullProfile}
          >
            <Text className="text-white text-base font-semibold">
              View Full Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border-2 border-primary-blue rounded-xl py-4 px-4 items-center justify-center"
            activeOpacity={0.8}
            onPress={() => setShowSettings(true)}
          >
            <SettingsIcon />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {onLogout && (
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-xl py-4 mt-4 items-center"
            activeOpacity={0.8}
            onPress={handleLogoutPress}
          >
            <Text className="text-gray-700 text-base font-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        )}
        </View>
      </ScrollView>
      </CandidateLayout>

      {/* Search Modal */}
      <SearchModal visible={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
}
