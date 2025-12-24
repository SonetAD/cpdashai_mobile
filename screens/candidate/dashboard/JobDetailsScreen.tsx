import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import TickIcon from '../../../assets/images/jobs/tick.svg';
import CrossIcon from '../../../assets/images/jobs/cross.svg';
import BottomNavBar from '../../../components/BottomNavBar';

interface JobDetailsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

interface FitItemProps {
  skill: string;
  matched: boolean;
}

const FitItem: React.FC<FitItemProps> = ({ skill, matched }) => {
  return (
    <View
      className={`rounded-xl px-4 py-3 mb-3 flex-row items-center ${
        matched ? 'bg-blue-50' : 'bg-red-50'
      }`}
    >
      {matched ? <TickIcon width={18} height={18} /> : <CrossIcon width={18} height={18} />}
      <Text className={`ml-3 flex-1 text-sm ${matched ? 'text-gray-700' : 'text-gray-700'}`}>
        {skill}
      </Text>
    </View>
  );
};

interface ApplicationStepProps {
  step: number;
  text: string;
}

const ApplicationStep: React.FC<ApplicationStepProps> = ({ step, text }) => {
  return (
    <View className="bg-blue-50 rounded-xl px-4 py-3 mb-3 flex-row items-center">
      <View className="w-6 h-6 rounded-full bg-primary-blue items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">{step}</Text>
      </View>
      <Text className="flex-1 text-gray-700 text-sm">{text}</Text>
    </View>
  );
};

export default function JobDetailsScreen({
  activeTab = 'jobs',
  onTabChange,
  onBack,
}: JobDetailsScreenProps) {
  const fitBreakdown = [
    { skill: 'React.js (Matched)', matched: true },
    { skill: 'JavaScript (Matched)', matched: true },
    { skill: 'UI Development (Matched)', matched: true },
    { skill: 'TypeScript (Missing)', matched: false },
    { skill: 'API Integration (Missing)', matched: false },
  ];

  const responsibilities = [
    'Build responsive UI using React.js',
    'Collaborate with design & backend teams',
    'Optimise app performance & loading time',
    'Maintain clean, reusable code',
  ];

  const requiredSkills = ['React', 'JavaScript', 'REST APIs', 'CSS/SCSS', 'Git'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          {/* Logo */}
          <LogoWhite width={39} height={33} />

          {/* Job Matches Title */}
          <View className="flex-1 mx-4">
            <Text className="text-white text-lg font-bold">Job Matches</Text>
            <Text className="text-white/90 text-xs mt-0.5">Sorted by your best career fit</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Job Details Header */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={onBack} className="mr-4">
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-bold">Job Details</Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Match Badge */}
          <View className="flex-row items-center mb-4">
            <View className="rounded-full px-3 py-1 flex-row items-center bg-primary-blue">
              <View className="rounded-full mr-1.5" style={{ width: 6, height: 6, backgroundColor: 'white' }} />
              <Text className="text-white text-xs font-bold">92% fit</Text>
            </View>
          </View>

          {/* Job Title */}
          <Text className="text-gray-900 text-2xl font-bold mb-3">Frontend Developer</Text>

          {/* Description */}
          <Text className="text-gray-400 text-sm leading-5 mb-5">
            Chawla is looking for a skilled Frontend Developer with hands-on experience in React, UI development, performance optimisation, and modern ES6+ JavaScript practices. You'll work closely with designers and backend engineers to create seamless user experiences
          </Text>

          {/* Company Name */}
          <Text className="text-primary-blue text-base font-semibold mb-3">Chawla Solution</Text>

          {/* Job Details */}
          <View className="mb-6">
            <Text className="text-gray-500 text-sm mb-1">• Remote - Pakistan</Text>
            <Text className="text-gray-500 text-sm mb-1">• Full Time</Text>
            <Text className="text-gray-500 text-sm">• $45K - $60K / year</Text>
          </View>

          {/* Fit Breakdown */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Fit Breakdown</Text>
            {fitBreakdown.map((item, index) => (
              <FitItem key={index} skill={item.skill} matched={item.matched} />
            ))}
            <TouchableOpacity className="bg-primary-blue rounded-xl py-3 items-center mt-2">
              <Text className="text-white text-sm font-semibold">Improve my Fit</Text>
            </TouchableOpacity>
          </View>

          {/* Key Responsibilities */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Key Responsibilities</Text>
            {responsibilities.map((responsibility, index) => (
              <View key={index} className="flex-row mb-2">
                <Text className="text-gray-400 text-sm mr-2">•</Text>
                <Text className="text-gray-400 text-sm flex-1">{responsibility}</Text>
              </View>
            ))}
          </View>

          {/* Required Skills */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Required Skills</Text>
            <View className="flex-row flex-wrap">
              {requiredSkills.map((skill, index) => (
                <View key={index} className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2">
                  <Text className="text-primary-blue text-xs font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Auto Generate Cover Letter Button */}
          <TouchableOpacity className="bg-primary-blue rounded-xl py-3 items-center mb-6">
            <Text className="text-white text-sm font-semibold">Auto Generate Cover Letter</Text>
          </TouchableOpacity>

          {/* Prepare Application */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Prepare Application</Text>
            <ApplicationStep step={1} text="Select CV (best match detected)" />
            <ApplicationStep step={2} text="Attach cover letter" />
            <ApplicationStep step={3} text="Final Review" />
          </View>

          {/* Apply Now Button */}
          <TouchableOpacity className="bg-primary-blue rounded-xl py-4 items-center mb-6">
            <Text className="text-white text-base font-semibold">Apply Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
