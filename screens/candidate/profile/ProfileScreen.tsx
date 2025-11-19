import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import UserIcon from '../../../assets/images/userIcon.svg';
import MailIcon from '../../../assets/images/mailIcon.svg';
import CallIcon from '../../../assets/images/callIcon.svg';
import UserQuestionIcon from '../../../assets/images/userQuestionWhite.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';

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

interface ProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onViewFullProfile?: () => void;
}

export default function ProfileScreen({
  activeTab = 'profile',
  onTabChange,
  onViewFullProfile,
}: ProfileScreenProps) {
  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';
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

  return (
    <CandidateLayout
      userName={userName}
      onSearchPress={() => console.log('Search pressed')}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="px-6 mt-6">
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
            icon={<UserQuestionIcon width={20} height={20} />}
            value="No role"
          />
          <ProfileField
            icon={<CallIcon width={20} height={20} />}
            value={user?.phoneNumber || 'No phone number'}
          />
        </View>

        {/* View Full Profile Button */}
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-4 mt-6 items-center"
          activeOpacity={0.8}
          onPress={onViewFullProfile}
        >
          <Text className="text-white text-base font-semibold">
            View Full Profile
          </Text>
        </TouchableOpacity>
      </View>
    </CandidateLayout>
  );
}
