import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';

interface TalentPartnerDashboardProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

// Icons
const UsersIcon = ({ color = '#437EF4' }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C8.96 11.48 9.04 11.48 9.1 11.49C9.12 11.49 9.13 11.49 9.15 11.49C9.16 11.49 9.16 11.49 9.17 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
      fill={color}
    />
    <Path
      d="M14.08 14.15C11.29 12.29 6.74002 12.29 3.93002 14.15C2.66002 15 1.96002 16.15 1.96002 17.38C1.96002 18.61 2.66002 19.75 3.92002 20.59C5.32002 21.53 7.16002 22 9.00002 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z"
      fill={color}
    />
    <Path
      d="M19.9904 7.34C20.1504 9.28 18.7704 10.98 16.8604 11.21C16.8504 11.21 16.8504 11.21 16.8404 11.21H16.8104C16.7504 11.21 16.6904 11.21 16.6404 11.23C15.6704 11.28 14.7804 10.97 14.1104 10.4C15.1404 9.48 15.7304 8.1 15.6104 6.6C15.5404 5.79 15.2604 5.05 14.8404 4.42C15.2204 4.23 15.6604 4.11 16.1104 4.07C18.0704 3.90 19.8204 5.36 19.9904 7.34Z"
      fill={color}
    />
    <Path
      d="M21.9902 16.59C21.9102 17.56 21.2902 18.4 20.2502 18.97C19.2502 19.52 17.9902 19.78 16.7402 19.75C17.4602 19.1 17.8802 18.29 17.9602 17.43C18.0602 16.19 17.4702 15 16.2902 14.05C15.6202 13.52 14.8402 13.1 13.9902 12.79C16.2002 12.15 18.9802 12.58 20.6902 13.96C21.6102 14.7 22.0802 15.63 21.9902 16.59Z"
      fill={color}
    />
  </Svg>
);

const BriefcaseIcon = ({ color = '#437EF4' }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 22H16C20.02 22 20.74 20.39 20.95 18.43L21.7 10.43C21.97 7.99 21.27 6 17 6H7C2.73 6 2.03 7.99 2.3 10.43L3.05 18.43C3.26 20.39 3.98 22 8 22Z"
      fill={color}
    />
    <Path
      d="M8 6V5.2C8 3.43 8 2 11.2 2H12.8C16 2 16 3.43 16 5.2V6"
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 13V14C14 14.01 14 14.01 14 14.02C14 15.11 13.99 16 12 16C10.02 16 10 15.12 10 14.03V13C10 12 10 12 11 12H13C14 12 14 12 14 13Z"
      stroke="white"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChartIcon = ({ color = '#437EF4' }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 10.75H5C2.58 10.75 1.25 9.42 1.25 7V5C1.25 2.58 2.58 1.25 5 1.25H7C9.42 1.25 10.75 2.58 10.75 5V7C10.75 9.42 9.42 10.75 7 10.75Z"
      fill={color}
    />
    <Path
      d="M19 10.75H17C14.58 10.75 13.25 9.42 13.25 7V5C13.25 2.58 14.58 1.25 17 1.25H19C21.42 1.25 22.75 2.58 22.75 5V7C22.75 9.42 21.42 10.75 19 10.75Z"
      fill={color}
    />
    <Path
      d="M19 22.75H17C14.58 22.75 13.25 21.42 13.25 19V17C13.25 14.58 14.58 13.25 17 13.25H19C21.42 13.25 22.75 14.58 22.75 17V19C22.75 21.42 21.42 22.75 19 22.75Z"
      fill={color}
    />
    <Path
      d="M7 22.75H5C2.58 22.75 1.25 21.42 1.25 19V17C1.25 14.58 2.58 13.25 5 13.25H7C9.42 13.25 10.75 14.58 10.75 17V19C10.75 21.42 9.42 22.75 7 22.75Z"
      fill={color}
    />
  </Svg>
);

const DocumentIcon = ({ color = '#437EF4' }) => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
      fill={color}
    />
    <Path
      d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5"
      stroke="white"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13H12M8 17H16"
      stroke="white"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon, color }) => {
  return (
    <View className="bg-white rounded-3xl p-5 shadow-md mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}>
      <View className="flex-row items-center justify-between mb-3">
        <View className={`rounded-2xl p-3`} style={{ backgroundColor: `${color}15` }}>
          {icon}
        </View>
        {change && (
          <View className={`px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text className={`text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-gray-500 text-sm mb-1">{title}</Text>
      <Text className="text-gray-900 text-3xl font-bold">{value}</Text>
    </View>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  gradient: string[];
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, onPress, gradient }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-3xl overflow-hidden mb-4 shadow-md"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}
      activeOpacity={0.8}
    >
      <View className="bg-white p-5 flex-row items-center">
        <View className="bg-primary-blue/10 rounded-2xl p-4 mr-4">
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-lg font-bold mb-1">{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08"
            stroke="#437EF4"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

// Quick Insight Card
interface QuickInsightProps {
  title: string;
  value: string;
  color: string;
}

const QuickInsight: React.FC<QuickInsightProps> = ({ title, value, color }) => {
  return (
    <View className="bg-white rounded-2xl p-4 mr-3 shadow-sm" style={{ minWidth: 140, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      <View className={`w-12 h-12 rounded-xl mb-3`} style={{ backgroundColor: `${color}15` }}>
        <View className="items-center justify-center flex-1">
          <Text className="text-2xl font-bold" style={{ color }}>
            {value}
          </Text>
        </View>
      </View>
      <Text className="text-gray-600 text-sm font-medium">{title}</Text>
    </View>
  );
};

export default function TalentPartnerDashboard({
  activeTab = 'home',
  onTabChange,
}: TalentPartnerDashboardProps) {
  return (
    <TalentPartnerLayout
      title="Welcome"
      subtitle="Your recruitment command center"
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-6">
          {/* Stats Grid */}
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <StatCard
                title="Active Candidates"
                value="1,247"
                change="+12%"
                trend="up"
                icon={<UsersIcon color="#437EF4" />}
                color="#437EF4"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatCard
                title="Open Positions"
                value="34"
                change="+5"
                trend="up"
                icon={<BriefcaseIcon color="#83E4E1" />}
                color="#83E4E1"
              />
            </View>
          </View>

          <View className="flex-row mb-6">
            <View className="flex-1 mr-2">
              <StatCard
                title="Interviews Today"
                value="12"
                icon={<ChartIcon color="#FF8D28" />}
                color="#FF8D28"
              />
            </View>
            <View className="flex-1 ml-2">
              <StatCard
                title="Placements"
                value="89"
                change="+18%"
                trend="up"
                icon={<DocumentIcon color="#FFCC00" />}
                color="#FFCC00"
              />
            </View>
          </View>

          {/* Quick Insights */}
          <View className="mb-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">Quick Insights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <QuickInsight title="Response Rate" value="94%" color="#437EF4" />
              <QuickInsight title="Avg Time to Hire" value="18d" color="#83E4E1" />
              <QuickInsight title="Quality Score" value="4.8" color="#FF8D28" />
              <QuickInsight title="Match Rate" value="87%" color="#FFCC00" />
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View className="mb-4">
            <Text className="text-gray-900 text-xl font-bold mb-4">Quick Actions</Text>

            <ActionCard
              title="Find Candidates"
              description="Browse AI-matched candidates for your roles"
              icon={<UsersIcon color="#437EF4" />}
              onPress={() => console.log('Find Candidates')}
              gradient={['#437EF4', '#3B71E0']}
            />

            <ActionCard
              title="Post New Job"
              description="Create and publish a new job listing"
              icon={<BriefcaseIcon color="#83E4E1" />}
              onPress={() => console.log('Post Job')}
              gradient={['#83E4E1', '#6FD5D2']}
            />

            <ActionCard
              title="Interview Schedule"
              description="View and manage upcoming interviews"
              icon={<ChartIcon color="#FF8D28" />}
              onPress={() => console.log('Schedule')}
              gradient={['#FF8D28', '#FF7A1C']}
            />

            <ActionCard
              title="Analytics Dashboard"
              description="View detailed recruitment metrics"
              icon={<DocumentIcon color="#FFCC00" />}
              onPress={() => console.log('Analytics')}
              gradient={['#FFCC00', '#E6B800']}
            />
          </View>
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
