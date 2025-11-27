import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import BottomNavBar from '../../../components/BottomNavBar';

interface ApplicationTrackerScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

interface StatusButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ label, isActive, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-primary-blue' : 'bg-white border border-primary-blue'
      }`}
      activeOpacity={0.7}
    >
      <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-primary-blue'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ApplicationCardProps {
  jobTitle: string;
  company: string;
  appliedDate: string;
  currentStatus: string;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  jobTitle,
  company,
  appliedDate,
  currentStatus: initialStatus,
}) => {
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const statusOptions = [
    { label: 'Applied', value: 'Applied' },
    { label: 'Interviewing', value: 'Interviewing' },
    { label: 'Offer', value: 'Offer' },
  ];

  const selectedOption = statusOptions.find((opt) => opt.value === selectedStatus);

  return (
    <View
      className="bg-white rounded-2xl p-5"
      style={{
        zIndex: dropdownOpen ? 1000 : 1,
        elevation: dropdownOpen ? 5 : 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginBottom: dropdownOpen ? 140 : 16,
      }}
    >
      {/* Job Title */}
      <Text className="text-gray-900 text-lg font-bold mb-1">{jobTitle}</Text>

      {/* Company */}
      <Text className="text-gray-400 text-sm mb-1">{company}</Text>

      {/* Applied Date */}
      <Text className="text-gray-400 text-xs mb-4">{appliedDate}</Text>

      {/* Status Buttons */}
      <View className="flex-row mb-4">
        <StatusButton
          label="Applied"
          isActive={activeStatus === 'Applied'}
          onPress={() => setActiveStatus('Applied')}
        />
        <StatusButton
          label="Interviewing"
          isActive={activeStatus === 'Interviewing'}
          onPress={() => setActiveStatus('Interviewing')}
        />
        <StatusButton
          label="Offer"
          isActive={activeStatus === 'Offer'}
          onPress={() => setActiveStatus('Offer')}
        />
      </View>

      {/* Update Status Label */}
      <Text className="text-gray-900 text-sm font-medium mb-2">Update Status</Text>

      {/* Status Dropdown */}
      <View className="mb-4" style={{ zIndex: dropdownOpen ? 10000 : 1 }}>
        <TouchableOpacity
          className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5"
          onPress={() => setDropdownOpen(!dropdownOpen)}
        >
          <Text className={selectedOption ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
            {selectedOption?.label || 'Select status'}
          </Text>
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="#6B7280"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {dropdownOpen && (
          <View
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl"
            style={{
              zIndex: 10000,
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-3 border-b border-gray-100 ${
                  selectedStatus === option.value ? 'bg-primary-blue/10' : ''
                }`}
                onPress={() => {
                  setSelectedStatus(option.value);
                  setDropdownOpen(false);
                }}
              >
                <Text
                  className={`text-base ${
                    selectedStatus === option.value
                      ? 'text-primary-blue font-semibold'
                      : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Set Reminder Button */}
      <TouchableOpacity className="bg-primary-blue rounded-xl py-3 items-center">
        <Text className="text-white text-sm font-semibold">Set Reminder</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ApplicationTrackerScreen({
  activeTab = 'jobs',
  onTabChange,
  onBack,
}: ApplicationTrackerScreenProps) {
  const applications = [
    {
      jobTitle: 'Frontend Developer',
      company: 'TechNewPakistan',
      appliedDate: 'Applied on 12 Nov 2025',
      currentStatus: 'Applied',
    },
    {
      jobTitle: 'Frontend Developer',
      company: 'TechNewPakistan',
      appliedDate: 'Applied on 12 Nov 2025',
      currentStatus: 'Applied',
    },
  ];

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

      {/* Application Tracker Header */}
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
        <Text className="text-gray-900 text-lg font-bold">Application Tracker</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 100 }}
        style={{ overflow: 'visible' }}
      >
        {applications.map((application, index) => (
          <ApplicationCard key={index} {...application} />
        ))}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
