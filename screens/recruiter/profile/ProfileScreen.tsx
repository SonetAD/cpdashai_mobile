import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../../store/store';
import { useGetRecruiterProfileQuery, useGetMyProfileQuery } from '../../../services/api';
import ProfilePictureUpload from '../../../components/profile/ProfilePictureUpload';
import ProfileBannerUpload from '../../../components/profile/ProfileBannerUpload';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';

interface ProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onLogout?: () => void;
}


// Settings Item Component
interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightElement,
}) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!onPress}
      className="flex-row items-center py-4 border-b border-gray-100"
      activeOpacity={0.7}
    >
      <View
        className="rounded-xl p-2.5 mr-4"
        style={{ backgroundColor: '#437EF415' }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 text-base font-semibold mb-0.5">{title}</Text>
        {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 18L15 12L9 6"
            stroke="#9CA3AF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ))}
    </TouchableOpacity>
  );
};

// Settings Toggle Item
interface SettingsToggleItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SettingsToggleItem: React.FC<SettingsToggleItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) => {
  const handleValueChange = (newValue: boolean) => {
    Haptics.selectionAsync();
    onValueChange(newValue);
  };

  return (
    <View className="flex-row items-center py-4 border-b border-gray-100">
      <View
        className="rounded-xl p-2.5 mr-4"
        style={{ backgroundColor: '#437EF415' }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 text-base font-semibold mb-0.5">{title}</Text>
        {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={value ? '#437EF4' : '#F3F4F6'}
      />
    </View>
  );
};

export default function ProfileScreen({
  activeTab = 'profile',
  onTabChange,
  onLogout,
}: ProfileScreenProps) {
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [candidateUpdates, setCandidateUpdates] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Get user from Redux store
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch recruiter profile data
  const { data: recruiterProfileData, isLoading, refetch: refetchRecruiterProfile } = useGetRecruiterProfileQuery();
  const { data: profileData, refetch: refetchProfile } = useGetMyProfileQuery();

  // Extract recruiter profile
  const recruiterProfile = recruiterProfileData?.recruiter?.__typename === 'RecruiterType'
    ? recruiterProfileData.recruiter
    : null;

  // Handle profile picture upload success
  const handleProfilePictureUploadSuccess = async (imageUrl: string) => {
    // Refetch both profile queries to get the updated picture
    try {
      const refetchPromises = [];
      if (refetchRecruiterProfile) refetchPromises.push(refetchRecruiterProfile().catch(e => console.log('Recruiter profile refetch skipped')));
      if (refetchProfile) refetchPromises.push(refetchProfile().catch(e => console.log('Profile refetch skipped')));
      await Promise.all(refetchPromises);
    } catch (error) {
      console.log('Error refetching after profile picture update:', error);
    }
  };

  // Handle banner upload success
  const handleBannerUploadSuccess = async (imageUrl: string) => {
    // Refetch profile to get the updated banner
    try {
      if (refetchProfile) {
        await refetchProfile();
      }
    } catch (error) {
      console.log('Error refetching after banner update:', error);
    }
  };

  // Prepare display data
  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    if (recruiterProfile?.user?.fullName) {
      return recruiterProfile.user.fullName;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getEmail = () => {
    return user?.email || recruiterProfile?.user?.email || 'No email';
  };

  const getRole = () => {
    if (recruiterProfile?.position) {
      return recruiterProfile.position;
    }
    if (recruiterProfile?.subRole) {
      return recruiterProfile.subRole;
    }
    return user?.role || 'Recruiter';
  };

  const getCompany = () => {
    return recruiterProfile?.organizationName || recruiterProfile?.companyName || 'No company';
  };

  const getJoinedDate = () => {
    if (recruiterProfile?.createdAt) {
      const date = new Date(recruiterProfile.createdAt);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    return 'Recently joined';
  };

  // Get initials for profile picture
  const getInitials = () => {
    const fullName = getFullName();
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Show loading state
  if (isLoading) {
    return (
      <TalentPartnerLayout
        title="Profile & Settings"
        subtitle="Manage your account"
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#437EF4" />
          <Text className="text-gray-500 mt-4">Loading profile...</Text>
        </View>
      </TalentPartnerLayout>
    );
  }

  return (
    <TalentPartnerLayout
      title="Profile & Settings"
      subtitle="Manage your account"
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Profile Banner */}
        <ProfileBannerUpload
          height={150}
          editable={true}
          onUploadSuccess={handleBannerUploadSuccess}
        />

        <View className="px-6 pt-4">
          {/* Profile Header Card */}
          <View
            className="bg-white rounded-3xl p-6 mb-6 items-center"
            style={{
              marginTop: -40,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <ProfilePictureUpload
              initials={getInitials()}
              size={80}
              editable={true}
              onUploadSuccess={handleProfilePictureUploadSuccess}
            />
            <Text className="text-gray-900 text-2xl font-bold mt-4 mb-1">
              {getFullName()}
            </Text>
            <Text className="text-gray-500 text-sm mb-2">{getEmail()}</Text>
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-100 rounded-full px-4 py-1.5">
                <Text className="text-blue-600 text-xs font-bold">{getRole()}</Text>
              </View>
              {recruiterProfile?.isVerified && (
                <View className="bg-green-100 rounded-full px-4 py-1.5 ml-2">
                  <Text className="text-green-600 text-xs font-bold">✓ Verified</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-400 text-xs">
              {getCompany()} • Member since {getJoinedDate()}
            </Text>

            {/* Edit Profile Button */}
            <TouchableOpacity
              className="bg-primary-blue rounded-2xl py-3 px-8 mt-4"
              style={{
                backgroundColor: '#437EF4',
                shadowColor: '#437EF4',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 3,
              }}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text className="text-white font-bold text-sm">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings Section */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Text className="text-gray-900 text-lg font-bold mb-4">Account Settings</Text>

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49H9.15C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
                    fill="#437EF4"
                  />
                  <Path
                    d="M14.08 14.15C11.29 12.29 6.74 12.29 3.93 14.15C2.66 15 1.96 16.15 1.96 17.38C1.96 18.61 2.66 19.75 3.92 20.59C5.32 21.53 7.16 22 9 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z"
                    fill="#437EF4"
                  />
                </Svg>
              }
              title="Personal Information"
              subtitle="Update your name, email, and contact details"
              onPress={() => console.log('Personal Info')}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
                    stroke="#437EF4"
                    strokeWidth={2}
                  />
                  <Path d="M12 6V12L16 14" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Change Password"
              subtitle="Update your password regularly"
              onPress={() => console.log('Change Password')}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="11" width="18" height="10" rx="2" stroke="#437EF4" strokeWidth={2} />
                  <Path
                    d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11"
                    stroke="#437EF4"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Privacy Settings"
              subtitle="Control your data and privacy preferences"
              onPress={() => console.log('Privacy')}
            />
          </View>

          {/* Notifications Section */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Text className="text-gray-900 text-lg font-bold mb-4">Notifications</Text>

            <SettingsToggleItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 6.43994V9.76994M12.02 2C8.34002 2 5.36002 4.98 5.36002 8.66V10.76C5.36002 11.44 5.08002 12.46 4.73002 13.04L3.46002 15.16C2.68002 16.47 3.22002 17.93 4.66002 18.41C9.44002 20 14.61 20 19.39 18.41C20.74 17.96 21.32 16.38 20.59 15.16L19.32 13.04C18.97 12.46 18.69 11.43 18.69 10.76V8.66C18.68 5 15.68 2 12.02 2Z"
                    stroke="#437EF4"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Push Notifications"
              subtitle="Receive notifications on your device"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />

            <SettingsToggleItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
                    stroke="#437EF4"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  <Path
                    d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9"
                    stroke="#437EF4"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              title="Email Notifications"
              subtitle="Get updates via email"
              value={emailNotifications}
              onValueChange={setEmailNotifications}
            />

            <SettingsToggleItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke="#437EF4" strokeWidth={2} />
                  <Path d="M12 8V12L15 15" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Candidate Updates"
              subtitle="Get notified about candidate activity"
              value={candidateUpdates}
              onValueChange={setCandidateUpdates}
            />

            <SettingsToggleItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 22H21M5 18V12C5 11.45 5.45 11 6 11H8C8.55 11 9 11.45 9 12V18M11 18V7C11 6.45 11.45 6 12 6H14C14.55 6 15 6.45 15 7V18M17 18V4C17 3.45 17.45 3 18 3H20C20.55 3 21 3.45 21 4V18"
                    stroke="#437EF4"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Weekly Reports"
              subtitle="Receive weekly analytics summaries"
              value={weeklyReports}
              onValueChange={setWeeklyReports}
            />
          </View>

          {/* Security Section */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Text className="text-gray-900 text-lg font-bold mb-4">Security</Text>

            <SettingsToggleItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2Z"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path d="M9 12L11 14L15 10" stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
                </Svg>
              }
              title="Two-Factor Authentication"
              subtitle="Add an extra layer of security"
              value={twoFactorAuth}
              onValueChange={setTwoFactorAuth}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                  <Path
                    d="M7.33 14.49L9.71 11.4C10.05 10.96 10.68 10.88 11.12 11.22L12.95 12.66C13.39 13 14.02 12.92 14.36 12.49L16.67 9.51001"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Activity Log"
              subtitle="View your recent account activity"
              onPress={() => console.log('Activity Log')}
            />
          </View>

          {/* Support & About Section */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <Text className="text-gray-900 text-lg font-bold mb-4">Support & About</Text>

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth={2} />
                  <Path
                    d="M12 17V11M12 7.5H12.01"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Help Center"
              subtitle="FAQs and support articles"
              onPress={() => console.log('Help')}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                  />
                  <Path
                    d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={() => console.log('Contact')}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 16.7399V4.66994C22 3.46994 21.02 2.57994 19.83 2.67994H19.77C17.67 2.85994 14.48 3.92994 12.7 5.04994L12.53 5.15994C12.24 5.33994 11.76 5.33994 11.47 5.15994L11.22 5.00994C9.44 3.89994 6.26 2.83994 4.16 2.66994C2.97 2.56994 2 3.46994 2 4.65994V16.7399C2 17.6999 2.78 18.5999 3.74 18.7199L4.03 18.7599C6.2 19.0499 9.55 20.1499 11.47 21.1999L11.51 21.2199C11.78 21.3699 12.21 21.3699 12.47 21.2199C14.39 20.1599 17.75 19.0499 19.93 18.7599L20.26 18.7199C21.22 18.5999 22 17.6999 22 16.7399Z"
                    stroke="#8B5CF6"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="Terms & Privacy"
              subtitle="Read our policies"
              onPress={() => console.log('Terms')}
            />

            <SettingsItem
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke="#8B5CF6" strokeWidth={2} />
                  <Path
                    d="M12 8V12M12 16H12.01"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              title="About"
              subtitle="Version 1.0.0"
              onPress={() => console.log('About')}
            />
          </View>

          {/* Logout Button */}
          {onLogout && (
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                onLogout();
              }}
              className="bg-white border border-red-200 rounded-2xl py-4 mb-4 flex-row items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
              activeOpacity={0.7}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path
                  d="M17.44 14.62L20 12.06L17.44 9.5M9.76 12.06H19.93M11.76 20C7.34 20 3.76 17 3.76 12C3.76 7 7.34 4 11.76 4"
                  stroke="#DC2626"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text className="text-red-600 font-bold text-base">Logout</Text>
            </TouchableOpacity>
          )}

          {/* Bottom padding for navbar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
