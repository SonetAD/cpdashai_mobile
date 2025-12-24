import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';
import CandidateDetailScreen from './CandidateDetailScreen';

interface TalentScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

// Filter Button Component
interface FilterButtonProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="px-4 py-2 rounded-full mr-3"
      style={{
        backgroundColor: isActive ? '#437EF4' : 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isActive ? 0.15 : 0.05,
        shadowRadius: 8,
        elevation: isActive ? 3 : 1,
        minHeight: 36,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Text
        className="font-semibold"
        style={{
          fontSize: 13,
          color: isActive ? 'white' : '#6B7280'
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Candidate Card Component
interface CandidateCardProps {
  name: string;
  status: 'Open' | 'In Progress' | 'Completed';
  readiness: number;
  confidenceTrend: 'Improving' | 'Stable' | 'Declining';
  engagement: 'Low' | 'Medium' | 'High' | 'Very High';
  dropOffRisk: 'Low' | 'Medium' | 'High';
  lastActive: string;
  onPress?: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  status,
  readiness,
  confidenceTrend,
  engagement,
  dropOffRisk,
  lastActive,
  onPress,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Open':
        return '#437EF4';
      case 'In Progress':
        return '#F59E0B';
      case 'Completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTrendColor = () => {
    switch (confidenceTrend) {
      case 'Improving':
        return '#10B981';
      case 'Stable':
        return '#6B7280';
      case 'Declining':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getRiskColor = () => {
    switch (dropOffRisk) {
      case 'Low':
        return '#10B981';
      case 'Medium':
        return '#F59E0B';
      case 'High':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-3xl p-5 mb-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E5E7EB'
      }}
    >
      {/* Header - Name and Status */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-gray-900 text-lg font-bold flex-1">{name}</Text>
        <View
          className="px-4 py-2 rounded-xl"
          style={{ backgroundColor: getStatusColor() }}
        >
          <Text className="text-white text-xs font-bold">{status}</Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-500 text-sm flex-1">Readiness:</Text>
          <Text className="text-gray-900 text-sm font-bold">{readiness}%</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Text className="text-gray-500 text-sm flex-1">Confidence Trend:</Text>
          <Text
            className="text-sm font-bold"
            style={{ color: getTrendColor() }}
          >
            {confidenceTrend}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Text className="text-gray-500 text-sm flex-1">Engagement:</Text>
          <Text className="text-gray-900 text-sm font-bold">{engagement}</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Text className="text-gray-500 text-sm flex-1">Drop-off Risk:</Text>
          <Text
            className="text-sm font-bold"
            style={{ color: getRiskColor() }}
          >
            {dropOffRisk}
          </Text>
        </View>
      </View>

      {/* Last Active */}
      <View className="pt-3 border-t border-gray-100">
        <Text className="text-gray-400 text-xs">Last Active: {lastActive}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function TalentScreen({
  activeTab = 'talent',
  onTabChange,
}: TalentScreenProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const candidates = [
    {
      name: 'Sonet Adhikary',
      status: 'Open' as const,
      readiness: 78,
      confidenceTrend: 'Improving' as const,
      engagement: 'High' as const,
      dropOffRisk: 'Medium' as const,
      lastActive: '2h ago',
      program: 'Data Analytics',
      careerStage: 'Entry-Level',
      motivationStability: 'Improving',
      stressRisk: 'Moderate',
      consistencyScore: 82,
      skillGaps: ['Python', 'SQL', 'Presentation'],
      interviewPrep: 'In Progress',
      applicationActivity: 'Moderate',
      signals90Day: 'Developing',
      taskClarityIndex: 'High',
      communicationReadiness: 'Strong',
    },
    {
      name: 'Maya Verma',
      status: 'In Progress' as const,
      readiness: 65,
      confidenceTrend: 'Stable' as const,
      engagement: 'Medium' as const,
      dropOffRisk: 'High' as const,
      lastActive: '5h ago',
      program: 'Full-Stack Development',
      careerStage: 'Mid-Level',
      motivationStability: 'Stable',
      stressRisk: 'High',
      consistencyScore: 68,
      skillGaps: ['React', 'Node.js'],
      interviewPrep: 'Needs Support',
      applicationActivity: 'Low',
      signals90Day: 'At Risk',
      taskClarityIndex: 'Medium',
      communicationReadiness: 'Improving',
    },
    {
      name: 'Rajesh Kumar',
      status: 'Completed' as const,
      readiness: 90,
      confidenceTrend: 'Declining' as const,
      engagement: 'Very High' as const,
      dropOffRisk: 'Low' as const,
      lastActive: '1d ago',
      program: 'DevOps Engineering',
      careerStage: 'Senior-Level',
      motivationStability: 'Declining',
      stressRisk: 'Low',
      consistencyScore: 95,
      skillGaps: ['Kubernetes'],
      interviewPrep: 'Ready',
      applicationActivity: 'Very Active',
      signals90Day: 'Excellent',
      taskClarityIndex: 'High',
      communicationReadiness: 'Excellent',
    },
    {
      name: 'Priya Sharma',
      status: 'Open' as const,
      readiness: 82,
      confidenceTrend: 'Improving' as const,
      engagement: 'High' as const,
      dropOffRisk: 'Low' as const,
      lastActive: '3h ago',
      program: 'UX/UI Design',
      careerStage: 'Entry-Level',
      motivationStability: 'Improving',
      stressRisk: 'Low',
      consistencyScore: 88,
      skillGaps: ['Figma Advanced', 'User Research'],
      interviewPrep: 'In Progress',
      applicationActivity: 'Active',
      signals90Day: 'Strong',
      taskClarityIndex: 'High',
      communicationReadiness: 'Strong',
    },
    {
      name: 'Arjun Patel',
      status: 'In Progress' as const,
      readiness: 71,
      confidenceTrend: 'Stable' as const,
      engagement: 'Medium' as const,
      dropOffRisk: 'Medium' as const,
      lastActive: '6h ago',
      program: 'Cybersecurity',
      careerStage: 'Mid-Level',
      motivationStability: 'Stable',
      stressRisk: 'Moderate',
      consistencyScore: 75,
      skillGaps: ['Penetration Testing', 'SIEM Tools'],
      interviewPrep: 'In Progress',
      applicationActivity: 'Moderate',
      signals90Day: 'Developing',
      taskClarityIndex: 'Medium',
      communicationReadiness: 'Adequate',
    },
  ];

  // Show detail screen if a candidate is selected
  if (selectedCandidate) {
    return (
      <CandidateDetailScreen
        candidate={selectedCandidate}
        onBack={() => setSelectedCandidate(null)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <TalentPartnerLayout
      title="Candidates"
      subtitle="Manage your candidate pipeline"
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-6 pt-4">
          {/* Search Bar */}
          <View
            className="bg-white rounded-2xl flex-row items-center px-4 py-3 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2
            }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth={2} />
              <Path d="M21 21L16.65 16.65" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              placeholder="Search Candidate ..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-gray-900"
              style={{ fontSize: 14 }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Buttons */}
          <View className="mb-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24, flexGrow: 0 }}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              <FilterButton
                label="All"
                isActive={activeFilter === 'all'}
                onPress={() => setActiveFilter('all')}
              />
              <FilterButton
                label="High Risk"
                isActive={activeFilter === 'highRisk'}
                onPress={() => setActiveFilter('highRisk')}
              />
              <FilterButton
                label="Interview-Ready"
                isActive={activeFilter === 'interviewReady'}
                onPress={() => setActiveFilter('interviewReady')}
              />
              <FilterButton
                label="Program"
                isActive={activeFilter === 'program'}
                onPress={() => setActiveFilter('program')}
              />
            </ScrollView>
          </View>

          {/* Candidate List */}
          {candidates.map((candidate, index) => (
            <CandidateCard
              key={index}
              {...candidate}
              onPress={() => setSelectedCandidate(candidate)}
            />
          ))}
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}
