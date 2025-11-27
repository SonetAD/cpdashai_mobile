import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';

interface CandidateDetailScreenProps {
  candidate: {
    name: string;
    program: string;
    careerStage: string;
    readiness: number;
    confidenceTrend: string;
    engagement: string;
    dropOffRisk: string;
    motivationStability: string;
    stressRisk: string;
    consistencyScore: number;
    skillGaps: string[];
    interviewPrep: string;
    applicationActivity: string;
    signals90Day: string;
    taskClarityIndex: string;
    communicationReadiness: string;
  };
  onBack: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

// Back Arrow Icon
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18L9 12L15 6"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
  isBold?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color, isBold = false }) => {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="text-gray-500 text-sm flex-1">{label}</Text>
      <Text
        className={`text-sm ${isBold ? 'font-bold' : 'font-semibold'}`}
        style={{ color: color || '#1F2937' }}
      >
        {value}
      </Text>
    </View>
  );
};

// Risk Alert Card Component
interface RiskAlertProps {
  title: string;
  severity: 'low' | 'medium' | 'high';
}

const RiskAlertCard: React.FC<RiskAlertProps> = ({ title, severity }) => {
  const getAlertColor = () => {
    switch (severity) {
      case 'high':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      case 'medium':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
      case 'low':
        return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    }
  };

  const colors = getAlertColor();

  return (
    <View
      className="rounded-xl p-3 mb-3"
      style={{
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border
      }}
    >
      <Text className="text-sm font-semibold" style={{ color: colors.text }}>
        {title}
      </Text>
    </View>
  );
};

// Action Button Component
interface ActionButtonProps {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-primary-blue rounded-2xl p-4 flex-row items-center justify-center mb-3"
      style={{
        shadowColor: '#437EF4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
      }}
      activeOpacity={0.8}
    >
      <View className="mr-3">{icon}</View>
      <Text className="text-white text-sm font-bold">{title}</Text>
    </TouchableOpacity>
  );
};

export default function CandidateDetailScreen({
  candidate,
  onBack,
  activeTab = 'talent',
  onTabChange,
}: CandidateDetailScreenProps) {
  return (
    <TalentPartnerLayout
      title="Candidate Details"
      subtitle={candidate.name}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="flex-1">
        {/* Back Button Row */}
        <View className="px-6 pt-4 pb-2">
          <TouchableOpacity
            onPress={onBack}
            className="flex-row items-center"
            activeOpacity={0.7}
          >
            <BackArrowIcon />
            <Text className="text-gray-700 text-sm font-semibold ml-2">Back to Candidates</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="px-6">
          {/* Candidate Info Card */}
          <View
            className="bg-white rounded-3xl p-6 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3
            }}
          >
            <Text className="text-gray-900 text-2xl font-bold mb-2">{candidate.name}</Text>
            <Text className="text-gray-500 text-sm mb-1">Program: {candidate.program}</Text>
            <Text className="text-gray-500 text-sm">Career Stage: {candidate.careerStage}</Text>
          </View>

          {/* Performance Signals */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3
            }}
          >
            <View className="flex-row items-center mb-4">
              <View className="bg-blue-100 rounded-xl p-2.5 mr-3">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 22H21M5 18V12C5 11.45 5.45 11 6 11H8C8.55 11 9 11.45 9 12V18M11 18V7C11 6.45 11.45 6 12 6H14C14.55 6 15 6.45 15 7V18M17 18V4C17 3.45 17.45 3 18 3H20C20.55 3 21 3.45 21 4V18"
                    stroke="#437EF4"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text className="text-gray-900 text-lg font-bold">Performance Signals</Text>
            </View>

            <MetricCard label="Engagement Level" value={candidate.engagement} />
            <MetricCard
              label="Motivation Stability"
              value={candidate.motivationStability}
              color={candidate.motivationStability === 'Improving' ? '#10B981' : '#6B7280'}
              isBold
            />
            <MetricCard
              label="Confidence Trend"
              value={candidate.confidenceTrend}
              color={candidate.confidenceTrend === 'Increasing' ? '#10B981' : '#6B7280'}
              isBold
            />
            <MetricCard label="Stress Risk" value={candidate.stressRisk} />
            <MetricCard
              label="Consistency Score"
              value={`${candidate.consistencyScore}%`}
              isBold
            />
          </View>

          {/* Risk Alerts */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3
            }}
          >
            <View className="flex-row items-center mb-4">
              <View className="bg-red-100 rounded-xl p-2.5 mr-3">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 9V13M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Circle cx="12" cy="17" r="1" fill="#EF4444" />
                </Svg>
              </View>
              <Text className="text-gray-900 text-lg font-bold">Risk Alerts</Text>
            </View>

            <RiskAlertCard title={`Drop-off Risk: ${candidate.dropOffRisk}`} severity="medium" />
            <RiskAlertCard title="Low-confidence before interview" severity="medium" />
            <RiskAlertCard title="Overwhelm Indicator: Slight" severity="low" />
          </View>

          {/* Career Coach Signals */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3
            }}
          >
            <View className="flex-row items-center mb-4">
              <View className="bg-green-100 rounded-xl p-2.5 mr-3">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#10B981"
                  />
                </Svg>
              </View>
              <Text className="text-gray-900 text-lg font-bold">Career Coach Signals</Text>
            </View>

            <MetricCard label="Job Readiness Score" value={`${candidate.readiness}%`} isBold />
            <MetricCard label="Skill Gaps" value={candidate.skillGaps.join(', ')} />
            <MetricCard label="Interview Preparedness" value={candidate.interviewPrep} />
            <MetricCard label="Application Activity" value={candidate.applicationActivity} />
            <MetricCard label="First 90-Day Signals" value={candidate.signals90Day} />
            <MetricCard label="Task Clarity Index" value={candidate.taskClarityIndex} />
            <MetricCard label="Communication Readiness" value={candidate.communicationReadiness} />
          </View>

          {/* Clara Recommendations */}
          <View
            className="bg-white rounded-3xl p-5 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3
            }}
          >
            <View className="flex-row items-center mb-4">
              <View className="bg-purple-100 rounded-xl p-2.5 mr-3">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9.5 2C13.09 2 16 4.91 16 8.5C16 10.02 15.45 11.41 14.54 12.48L21.03 18.97C21.32 19.26 21.32 19.74 21.03 20.03C20.74 20.32 20.26 20.32 19.97 20.03L13.48 13.54C12.41 14.45 11.02 15 9.5 15C5.91 15 3 12.09 3 8.5C3 4.91 5.91 2 9.5 2Z"
                    fill="#9333EA"
                  />
                  <Circle cx="9.5" cy="8.5" r="2" fill="white" />
                </Svg>
              </View>
              <Text className="text-gray-900 text-lg font-bold">Clara Recommendations</Text>
            </View>

            <ActionButton
              title="Schedule Check-in"
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
                    stroke="white"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              }
              onPress={() => console.log('Schedule check-in')}
            />

            <ActionButton
              title="Provide Interview Guidance"
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17C11.45 17 11 16.55 11 16V12C11 11.45 11.45 11 12 11C12.55 11 13 11.45 13 12V16C13 16.55 12.55 17 12 17ZM13 9H11V7H13V9Z"
                    fill="white"
                  />
                </Svg>
              }
              onPress={() => console.log('Provide guidance')}
            />

            <ActionButton
              title="Assign Mentor"
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C9.12 11.49 9.13 11.49 9.15 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
                    fill="white"
                  />
                  <Path
                    d="M14.08 14.15C11.29 12.29 6.74 12.29 3.93 14.15C2.66 15 1.96 16.15 1.96 17.38C1.96 18.61 2.66 19.75 3.92 20.59C5.32 21.53 7.16 22 9 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z"
                    fill="white"
                  />
                </Svg>
              }
              onPress={() => console.log('Assign mentor')}
            />

            <ActionButton
              title="Send Onboarding Resources"
              icon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M22 16.7399V4.66994C22 3.46994 21.02 2.57994 19.83 2.67994H19.77C17.67 2.85994 14.48 3.92994 12.7 5.04994L12.53 5.15994C12.24 5.33994 11.76 5.33994 11.47 5.15994L11.22 5.00994C9.44 3.89994 6.26 2.83994 4.16 2.66994C2.97 2.56994 2 3.46994 2 4.65994V16.7399C2 17.6999 2.78 18.5999 3.74 18.7199L4.03 18.7599C6.2 19.0499 9.55 20.1499 11.47 21.1999L11.51 21.2199C11.78 21.3699 12.21 21.3699 12.47 21.2199C14.39 20.1599 17.75 19.0499 19.93 18.7599L20.26 18.7199C21.22 18.5999 22 17.6999 22 16.7399Z"
                    stroke="white"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M12 5.48999V20.49M7.75 8.48999H5.5M8.5 11.49H5.5"
                    stroke="white"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              }
              onPress={() => console.log('Send resources')}
            />
          </View>
        </View>
      </ScrollView>
      </View>
    </TalentPartnerLayout>
  );
}
