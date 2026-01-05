import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Glassmorphic Hero Card Component
interface HeroMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradientColors: string[];
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const HeroMetricCard: React.FC<HeroMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradientColors,
  trend
}) => {
  return (
    <View
      className="bg-white rounded-3xl p-5 mb-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3
      }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View
          style={{
            backgroundColor: `${gradientColors[0]}15`,
            borderRadius: 16,
            padding: 12
          }}
        >
          {icon}
        </View>
        {trend && (
          <View
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: trend.isPositive ? '#DCFCE7' : '#FEE2E2' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: trend.isPositive ? '#16A34A' : '#DC2626' }}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-gray-500 text-sm mb-2">{title}</Text>
      <Text className="text-gray-900 font-bold mb-2" style={{ fontSize: 36 }}>{value}</Text>
      <Text className="text-gray-400 text-xs">{subtitle}</Text>
    </View>
  );
};

// Pipeline Stage Card
interface PipelineStageProps {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

const PipelineStage: React.FC<PipelineStageProps> = ({ stage, count, percentage, color }) => {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-700 text-sm font-semibold">{stage}</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-900 text-lg font-bold mr-2">{count}</Text>
          <Text className="text-gray-500 text-xs">({percentage}%)</Text>
        </View>
      </View>
      <View className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <View
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: 20
          }}
        />
      </View>
    </View>
  );
};

// AI Insight Card Component
interface AIInsightCardProps {
  title: string;
  insight: string;
  action: string;
  onActionPress: () => void;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ title, insight, action, onActionPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress();
  };

  return (
    <View
      className="rounded-3xl p-5 mb-4 bg-white"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3
      }}
    >
      <View className="flex-row items-start mb-3">
        <View className="bg-purple-100 rounded-xl p-2.5 mr-3">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9.5 2C13.09 2 16 4.91 16 8.5C16 10.02 15.45 11.41 14.54 12.48L21.03 18.97C21.32 19.26 21.32 19.74 21.03 20.03C20.74 20.32 20.26 20.32 19.97 20.03L13.48 13.54C12.41 14.45 11.02 15 9.5 15C5.91 15 3 12.09 3 8.5C3 4.91 5.91 2 9.5 2Z"
              fill="#9333EA"
            />
            <Circle cx="9.5" cy="8.5" r="2" fill="white" />
          </Svg>
        </View>
        <View className="flex-1">
          <Text className="text-purple-900 text-base font-bold mb-1">{title}</Text>
          <Text className="text-gray-600 text-sm leading-5">{insight}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        className="bg-purple-500 rounded-xl py-3 items-center"
        activeOpacity={0.8}
      >
        <Text className="text-white text-sm font-semibold">{action}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Activity Feed Item
interface ActivityItemProps {
  avatar: string;
  name: string;
  action: string;
  time: string;
  statusColor: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ avatar, name, action, time, statusColor }) => {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: `${statusColor}20` }}
      >
        <Text className="text-base font-bold" style={{ color: statusColor }}>
          {avatar}
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row flex-wrap">
          <Text className="text-gray-900 text-sm font-bold">{name}</Text>
          <Text className="text-gray-600 text-sm"> {action}</Text>
        </View>
        <Text className="text-gray-400 text-xs mt-0.5">{time}</Text>
      </View>
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: statusColor }}
      />
    </View>
  );
};

// Quality Score Gauge
const QualityScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const radius = 50;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View className="items-center" style={{ height: 100 }}>
      <Svg width={140} height={80} viewBox="0 0 140 80">
        <Defs>
          <SvgGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF8D28" />
            <Stop offset="50%" stopColor="#FFCC00" />
            <Stop offset="100%" stopColor="#10B981" />
          </SvgGradient>
        </Defs>
        <Path
          d={`M 20 70 A ${radius} ${radius} 0 0 1 120 70`}
          stroke="#E5E7EB"
          strokeWidth={10}
          fill="none"
        />
        <Path
          d={`M 20 70 A ${radius} ${radius} 0 0 1 120 70`}
          stroke="url(#gaugeGradient)"
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute" style={{ bottom: 10 }}>
        <Text className="text-3xl font-bold text-gray-900 text-center">{score}</Text>
        <Text className="text-xs text-gray-500 text-center">Quality Score</Text>
      </View>
    </View>
  );
};

// Quick Action Button
interface QuickActionBtnProps {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  onPress: () => void;
}

const QuickActionBtn: React.FC<QuickActionBtnProps> = ({ icon, label, bgColor, onPress }) => {
  const buttonWidth = (SCREEN_WIDTH - 88) / 4;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="items-center"
      style={{ width: buttonWidth }}
      activeOpacity={0.7}
    >
      <View
        className="rounded-2xl items-center justify-center mb-2"
        style={{
          width: 52,
          height: 52,
          backgroundColor: `${bgColor}15`,
          shadowColor: bgColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4
        }}
      >
        {icon}
      </View>
      <Text
        className="text-gray-700 font-medium text-center"
        style={{ fontSize: 11 }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function RecruiterHomeScreen() {
  const router = useRouter();

  const handleViewJobs = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(recruiter)/(tabs)/home/jobs' as any);
  };

  const handleCreateJob = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(recruiter)/(tabs)/home/create-job' as any);
  };

  const handleViewTalent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(recruiter)/(tabs)/talent' as any);
  };

  const handleViewReports = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(recruiter)/(tabs)/reports' as any);
  };

  return (
    <TalentPartnerLayout
      title="Dashboard"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pt-2">
          {/* MY JOB POSTINGS - TOP PRIORITY SECTION */}
          <View className="mb-6">
            <Text className="text-gray-900 text-2xl font-bold mb-4">My Job Postings</Text>

            <TouchableOpacity
              onPress={handleViewJobs}
              activeOpacity={0.7}
              className="rounded-3xl p-6 mb-4"
              style={{
                backgroundColor: '#437EF4',
                shadowColor: '#437EF4',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8
              }}
            >
              <View className="flex-row items-center mb-4">
                <View className="bg-white/20 rounded-2xl p-3 mr-4">
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                      fill="white"
                    />
                    <Path
                      d="M11.9998 8V16M16 12H8"
                      stroke="#437EF4"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">View My Jobs</Text>
                  <Text className="text-white/90 text-sm">Manage postings & review applications</Text>
                </View>
                <View className="bg-white/20 rounded-full p-2">
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeMiterlimit="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="bg-white/20 rounded-xl px-4 py-2.5 mr-2 flex-1">
                  <Text className="text-white text-xs font-bold text-center">VIEW APPLICATIONS</Text>
                </View>
                <View className="bg-white/20 rounded-xl px-4 py-2.5 flex-1">
                  <Text className="text-white text-xs font-bold text-center">MANAGE JOBS</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateJob}
              activeOpacity={0.7}
              className="bg-white rounded-3xl p-5 border-2 border-primary-blue"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-primary-blue/10 rounded-2xl p-3 mr-4">
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 5v14M5 12h14" stroke="#437EF4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-lg font-bold mb-0.5">Create New Job</Text>
                    <Text className="text-gray-500 text-sm">Post a new job opening</Text>
                  </View>
                </View>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
          </View>

          {/* Hero Metrics - Glassmorphic Cards */}
          <View className="mb-6">
            <Text className="text-gray-700 text-base font-semibold mb-3">Overview</Text>
            <View className="flex-row mb-3" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <HeroMetricCard
                  title="Active Candidates"
                  value="0"
                  subtitle="0 reviewed today"
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C9.12 11.49 9.13 11.49 9.15 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
                        fill="#437EF4"
                      />
                      <Path
                        d="M14.08 14.15C11.29 12.29 6.74 12.29 3.93 14.15C2.66 15 1.96 16.15 1.96 17.38C1.96 18.61 2.66 19.75 3.92 20.59C5.32 21.53 7.16 22 9 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z"
                        fill="#437EF4"
                      />
                    </Svg>
                  }
                  gradientColors={['#437EF4']}
                />
              </View>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleViewJobs}
                activeOpacity={0.7}
              >
                <HeroMetricCard
                  title="Open Positions"
                  value="0"
                  subtitle="0 urgent hires"
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                        fill="#10B981"
                      />
                      <Path
                        d="M11.9998 8V16M16 12H8"
                        stroke="white"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  }
                  gradientColors={['#10B981']}
                />
              </TouchableOpacity>
            </View>

            <HeroMetricCard
              title="Time to Hire"
              value="0 days"
              subtitle="No data yet"
              icon={
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth={2} />
                  <Path
                    d="M12 7V12L15 15"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              gradientColors={['#F59E0B']}
            />
          </View>

          {/* AI-Powered Insights */}
          <View className="mb-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">AI Insights</Text>
            <AIInsightCard
              title="High-Quality Match Detected"
              insight="Sarah Johnson's profile shows 94% compatibility with Senior React Developer role. Her skills align perfectly with your requirements."
              action="Review Profile"
              onActionPress={handleViewTalent}
            />
          </View>

          {/* Recruitment Pipeline */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 text-xl font-bold">Recruitment Pipeline</Text>
              <TouchableOpacity>
                <Text className="text-primary-blue text-sm font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            <View
              className="bg-white rounded-3xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3
              }}
            >
              <PipelineStage stage="Applied" count={0} percentage={0} color="#3B82F6" />
              <PipelineStage stage="Screening" count={0} percentage={0} color="#8B5CF6" />
              <PipelineStage stage="Interview" count={0} percentage={0} color="#F59E0B" />
              <PipelineStage stage="Offer" count={0} percentage={0} color="#10B981" />
            </View>
          </View>

          {/* Candidate Quality Score */}
          <View className="mb-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">Candidate Quality</Text>
            <View
              className="bg-white rounded-3xl p-6 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3
              }}
            >
              <QualityScoreGauge score={0} />
              <Text className="text-gray-600 text-sm text-center mt-4 leading-5">
                No candidates yet.{'\n'}
                Start sourcing to see quality metrics!
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">Quick Actions</Text>
            <View
              className="bg-white rounded-3xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3
              }}
            >
              <View className="flex-row justify-between">
                <QuickActionBtn
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 22H16C20 22 22 20 22 16V8C22 4 20 2 16 2H8C4 2 2 4 2 8V16C2 20 4 22 8 22Z"
                        stroke="#437EF4"
                        strokeWidth={2}
                      />
                      <Path
                        d="M11.9998 8V16M16 12H8"
                        stroke="#437EF4"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  }
                  label="Post Job"
                  bgColor="#437EF4"
                  onPress={handleCreateJob}
                />
                <QuickActionBtn
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Circle cx="11" cy="11" r="8" stroke="#10B981" strokeWidth={2} />
                      <Path d="M21 21L16.65 16.65" stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
                    </Svg>
                  }
                  label="Find Talent"
                  bgColor="#10B981"
                  onPress={handleViewTalent}
                />
                <QuickActionBtn
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  }
                  label="Schedule"
                  bgColor="#F59E0B"
                  onPress={() => console.log('Schedule')}
                />
                <QuickActionBtn
                  icon={
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                      />
                      <Path
                        d="M15.5 9.75C16.19 10.45 16.19 11.55 15.5 12.25L12.56 15.19C11.86 15.88 10.76 15.88 10.06 15.19L9.5 14.63"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </Svg>
                  }
                  label="Analytics"
                  bgColor="#8B5CF6"
                  onPress={handleViewReports}
                />
              </View>
            </View>
          </View>

          {/* Recent Activity Feed */}
          <View className="mb-6">
            <Text className="text-gray-900 text-xl font-bold mb-4">Recent Activity</Text>
            <View
              className="bg-white rounded-3xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3
              }}
            >
              <ActivityItem
                avatar="SJ"
                name="Sarah Johnson"
                action="applied for Senior React Developer"
                time="2 min ago"
                statusColor="#10B981"
              />
              <ActivityItem
                avatar="MK"
                name="Michael Kim"
                action="completed technical interview"
                time="15 min ago"
                statusColor="#3B82F6"
              />
              <ActivityItem
                avatar="EP"
                name="Emily Parker"
                action="accepted your offer"
                time="1 hour ago"
                statusColor="#F59E0B"
              />
              <ActivityItem
                avatar="DM"
                name="David Martinez"
                action="scheduled for final interview"
                time="3 hours ago"
                statusColor="#8B5CF6"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
