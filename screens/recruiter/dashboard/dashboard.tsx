import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

const BellIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6.43994V9.76994M12.02 2C8.34002 2 5.36002 4.98 5.36002 8.66V10.76C5.36002 11.44 5.08002 12.46 4.73002 13.04L3.46002 15.16C2.68002 16.47 3.22002 17.93 4.66002 18.41C9.44002 20 14.61 20 19.39 18.41C20.74 17.96 21.32 16.38 20.59 15.16L19.32 13.04C18.97 12.46 18.69 11.43 18.69 10.76V8.66C18.68 5 15.68 2 12.02 2Z"
      stroke="#9CA3AF"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
    />
    <Path
      d="M15.33 18.8201C15.33 20.6501 13.83 22.1501 12 22.1501C11.09 22.1501 10.25 21.7701 9.65004 21.1701C9.05004 20.5701 8.67004 19.7301 8.67004 18.8201"
      stroke="#9CA3AF"
      strokeWidth={1.5}
      strokeMiterlimit={10}
    />
  </Svg>
);

const UserCircleIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Circle cx={20} cy={20} r={20} fill="#2AD1CC" />
    <Path
      d="M20 10C17.24 10 15 12.24 15 15C15 17.76 17.24 20 20 20C22.76 20 25 17.76 25 15C25 12.24 22.76 10 20 10Z"
      fill="white"
    />
    <Path
      d="M20 22C15.58 22 12 25.58 12 30H28C28 25.58 24.42 22 20 22Z"
      fill="white"
    />
  </Svg>
);

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
      <View className="bg-primary-cyan/10 rounded-xl p-3 mr-4">{icon}</View>
      <View className="flex-1">
        <Text className="text-gray-900 text-base font-semibold mb-1">
          {title}
        </Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface RecruiterDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

export default function RecruiterDashboard({
  userName = 'Recruiter',
  onLogout,
}: RecruiterDashboardProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary-cyan px-6 pt-4 pb-8">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <UserCircleIcon />
              <View className="ml-3">
                <Text className="text-white text-lg font-bold">
                  Welcome back!
                </Text>
                <Text className="text-white/80 text-sm">{userName}</Text>
              </View>
            </View>
            <TouchableOpacity className="p-2">
              <BellIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 -mt-4">
          <View className="flex-row justify-between mb-4">
            <View className="flex-1 mr-2">
              <DashboardCard
                title="Active Jobs"
                value="8"
                subtitle="3 expiring soon"
              />
            </View>
            <View className="flex-1 ml-2">
              <DashboardCard
                title="Applications"
                value="142"
                subtitle="34 new this week"
              />
            </View>
          </View>

          <DashboardCard
            title="Top Candidates"
            value="87"
            subtitle="AI-matched candidates for your open positions"
          />
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-4">
          <Text className="text-gray-900 text-xl font-bold mb-4">
            Quick Actions
          </Text>

          <ActionCard
            title="Post a Job"
            description="Create a new job posting to find talent"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M11.9998 8V16M16 12H8"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Post Job')}
          />

          <ActionCard
            title="Review Applications"
            description="34 new applications waiting for review"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M15.5 8.5H8.5M12 12H8.5M15.5 15.5H8.5"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeMiterlimit={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Review Applications')}
          />

          <ActionCard
            title="AI Candidate Match"
            description="Find the best candidates with AI assistance"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M8.5 12.5L10.5 14.5L15.5 9.5"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('AI Match')}
          />

          <ActionCard
            title="Messages"
            description="7 new messages from candidates"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeMiterlimit={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Messages')}
          />

          <ActionCard
            title="Manage Jobs"
            description="View and edit your current job postings"
            icon={
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 2.26953V6.40007C14 7.06007 14.54 8.00953 15.15 8.28953L18.77 10.1395C19.54 10.5095 20.58 10.1095 20.87 9.26953L22.03 5.66007C22.62 3.86007 21.62 2.86953 19.83 2.44953L16.03 1.46953C15.07 1.21953 14 1.55953 14 2.26953Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M2 11.16V15.84C2 16.54 2.29 17.39 2.77 17.82L8.23 22.61C9.13 23.38 10.67 23.38 11.57 22.61L17.03 17.82C17.51 17.39 17.8 16.54 17.8 15.84V11.16C17.8 10.46 17.51 9.61001 17.03 9.18001L11.57 4.39001C10.67 3.62001 9.13 3.62001 8.23 4.39001L2.77 9.18001C2.29 9.61001 2 10.46 2 11.16Z"
                  stroke="#2AD1CC"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            onPress={() => console.log('Manage Jobs')}
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
      </ScrollView>
    </SafeAreaView>
  );
}
