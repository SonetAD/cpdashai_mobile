import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import ProfileScreen from '../profile/ProfileScreen';
import FullProfileScreen from '../profile/FullProfileScreen';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'bg-white',
}) => {
  return (
    <View className={`${color} rounded-2xl p-5 mb-4 shadow-sm`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-gray-600 text-sm">{title}</Text>
        {icon && <View>{icon}</View>}
      </View>
      <Text className="text-gray-900 text-3xl font-bold mb-1">{value}</Text>
      {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
    </View>
  );
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-5 mb-4 flex-row items-center shadow-sm"
      activeOpacity={0.7}
    >
      <View className="bg-primary-blue/10 rounded-xl p-3 mr-4">{icon}</View>
      <View className="flex-1">
        <Text className="text-gray-900 text-base font-semibold mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface CandidateDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export default function CandidateDashboard({
  userName = 'User',
  onLogout,
}: CandidateDashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showFullProfile, setShowFullProfile] = useState(false);

  const handleTabChange = (tabId: string) => {
    console.log('Tab changed to:', tabId);
    setActiveTab(tabId);
    // Reset full profile view when changing tabs
    if (tabId !== 'profile') {
      setShowFullProfile(false);
    }
  };

  const handleViewFullProfile = () => {
    setShowFullProfile(true);
  };

  const handleBackToProfile = () => {
    setShowFullProfile(false);
  };

  // Render different screens based on active tab
  if (activeTab === 'profile') {
    if (showFullProfile) {
      return (
        <FullProfileScreen
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onBack={handleBackToProfile}
        />
      );
    }
    return (
      <ProfileScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onViewFullProfile={handleViewFullProfile}
      />
    );
  }

  return (
    <CandidateLayout
      userName={userName}
      onSearchPress={() => console.log('Search pressed')}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {/* Stats Cards */}
      <View className="px-6 mt-6">
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-2">
              <DashboardCard title="CV Score" value="85%" subtitle="Good" />
            </View>
            <View className="flex-1 ml-2">
              <DashboardCard
                title="Job Matches"
                value="24"
                subtitle="New this week"
              />
            </View>
          </View>

          <DashboardCard
            title="Profile Views"
            value="156"
            subtitle="12 recruiters viewed your profile this month"
          />
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-4">
          <Text className="text-gray-900 text-xl font-bold mb-4">
            Quick Actions
          </Text>

          <ActionCard
            title="Update Your CV"
            description="Keep your CV fresh and get more matches"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M15.5 8.5H8.5M12 12H8.5M15.5 15.5H8.5"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeMiterlimit={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Update CV')}
          />

          <ActionCard
            title="Browse Jobs"
            description="Explore new opportunities tailored for you"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M7.75 12L10.58 14.83L16.25 9.17004"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Browse Jobs')}
          />

          <ActionCard
            title="AI Career Coach"
            description="Get personalized advice to boost your career"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M8.5 12.5L10.5 14.5L15.5 9.5"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('AI Career Coach')}
          />

          <ActionCard
            title="Messages"
            description="3 new messages from recruiters"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
                  stroke="#437EF4"
                  strokeWidth={1.5}
                  strokeMiterlimit={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Messages')}
          />
        </View>

      {/* Logout Button */}
      {onLogout && (
        <View className="px-6 mt-4 mb-6">
          <TouchableOpacity
            onPress={onLogout}
            className="bg-white border border-gray-300 rounded-xl py-4 items-center"
          >
            <Text className="text-gray-700 font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </CandidateLayout>
  );
}
