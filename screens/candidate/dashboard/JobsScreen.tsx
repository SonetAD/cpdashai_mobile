import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import SearchIcon from '../../../assets/images/searchGray.svg';
import IdeaIcon from '../../../assets/images/homepage/idea.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';

interface JobsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onJobPress?: () => void;
  onApplicationTrackerPress?: () => void;
  onCVUploadPress?: () => void;
}

interface FilterButtonProps {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-primary-blue' : 'bg-white'
      }`}
      activeOpacity={0.7}
    >
      <Text className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface JobCardProps {
  matchPercentage: number;
  badgeColor: string;
  position: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  skills: string[];
  aiInsight: string;
  onPress?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({
  matchPercentage,
  badgeColor,
  position,
  description,
  company,
  location,
  jobType,
  salary,
  skills,
  aiInsight,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
      activeOpacity={0.7}
    >
      {/* Match Percentage Badge */}
      <View className="flex-row items-center mb-3">
        <View
          className="rounded-full px-3 py-1 flex-row items-center"
          style={{ backgroundColor: badgeColor }}
        >
          <View
            className="rounded-full mr-1.5"
            style={{ width: 6, height: 6, backgroundColor: 'white' }}
          />
          <Text className="text-white text-xs font-bold">{matchPercentage}% Fit</Text>
        </View>
      </View>

      {/* Position Title */}
      <Text className="text-gray-900 text-xl font-bold mb-2">{position}</Text>

      {/* Description */}
      <Text className="text-gray-400 text-sm leading-5 mb-4">{description}</Text>

      {/* Company Name */}
      <Text className="text-primary-blue text-base font-semibold mb-3">{company}</Text>

      {/* Job Details */}
      <View className="mb-4">
        <Text className="text-gray-500 text-sm mb-1">• {location}</Text>
        <Text className="text-gray-500 text-sm mb-1">• {jobType}</Text>
        <Text className="text-gray-500 text-sm">• {salary}</Text>
      </View>

      {/* Skills Tags */}
      <View className="flex-row flex-wrap mb-4">
        {skills.map((skill, index) => (
          <View key={index} className="bg-primary-cyan/20 rounded-lg px-3 py-2 mr-2 mb-2">
            <Text className="text-primary-cyan text-xs font-medium">{skill}</Text>
          </View>
        ))}
      </View>

      {/* AI Insight */}
      <View className="bg-yellow-50 rounded-xl p-3 flex-row items-start mb-4">
        <View className="mr-2 mt-0.5">
          <IdeaIcon width={17} height={18} />
        </View>
        <Text className="text-gray-700 text-xs flex-1 leading-4">{aiInsight}</Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity className="bg-primary-blue rounded-xl py-3 flex-1 items-center">
          <Text className="text-white text-sm font-semibold">Apply Now</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-primary-cyan rounded-xl py-3 flex-1 items-center">
          <Text className="text-white text-sm font-semibold">Save</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function JobsScreen({
  activeTab = 'jobs',
  onTabChange,
  userName = 'User',
  onJobPress,
  onApplicationTrackerPress,
  onCVUploadPress,
}: JobsScreenProps) {
  const [activeFilter, setActiveFilter] = useState('Remote');
  const [searchQuery, setSearchQuery] = useState('');

  const jobListings = [
    {
      matchPercentage: 92,
      badgeColor: '#437EF4',
      position: 'Product Designer',
      description:
        'Design intuitive user experiences for our flagship products. Work with cross-functional teams to create beautiful, accessible interfaces that delight users.',
      company: 'Chawla Solution',
      location: 'Remote - Pakistan',
      jobType: 'Full Time',
      salary: '$45K - $60K / year',
      skills: ['Figma', 'UX Research', 'Prototyping'],
      aiInsight: 'AI Insight: Your design portfolio shows strong UX depth 87% fit for this role.',
    },
    {
      matchPercentage: 81,
      badgeColor: '#FFCC00',
      position: 'Frontend Engineer',
      description:
        'Build responsive web applications using modern JavaScript frameworks. Collaborate with designers and backend engineers to deliver high-quality features.',
      company: 'Chawla Solution',
      location: 'Remote - Pakistan',
      jobType: 'Full Time',
      salary: '$45K - $60K / year',
      skills: ['React', 'TypeScript', 'Next.js'],
      aiInsight: 'AI Insight: Your frontend skills and React experience make you a strong match for this position.',
    },
  ];

  return (
    <CandidateLayout
      userName={userName}
      onSearchPress={() => console.log('Search pressed')}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="px-6 mt-6">
        {/* Job Matches Header */}
        <View className="mb-4">
          <Text className="text-gray-900 text-2xl font-bold mb-1">Job Matches</Text>
          <Text className="text-gray-500 text-sm">Sorted by your best career fit</Text>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-4 shadow-sm">
          <SearchIcon width={20} height={20} />
          <TextInput
            placeholder="Search something..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900 text-sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingRight: 24 }}
        >
          <FilterButton
            label="Remote"
            isActive={activeFilter === 'Remote'}
            onPress={() => setActiveFilter('Remote')}
          />
          <FilterButton
            label="Onsite"
            isActive={activeFilter === 'Onsite'}
            onPress={() => setActiveFilter('Onsite')}
          />
          <FilterButton
            label="Location"
            isActive={activeFilter === 'Location'}
            onPress={() => setActiveFilter('Location')}
          />
          <FilterButton
            label="Categories"
            isActive={activeFilter === 'Categories'}
            onPress={() => setActiveFilter('Categories')}
          />
        </ScrollView>

        {/* Application Tracker Link */}
        <TouchableOpacity
          onPress={onApplicationTrackerPress}
          className="bg-white rounded-xl px-4 py-3 mb-3 shadow-sm flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 text-base font-semibold">Application Tracker</Text>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="#437EF4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* CV Upload Link */}
        <TouchableOpacity
          onPress={onCVUploadPress}
          className="bg-white rounded-xl px-4 py-3 mb-6 shadow-sm flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <Text className="text-gray-900 text-base font-semibold">CV Upload</Text>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="#437EF4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Job Listings */}
        {jobListings.map((job, index) => (
          <JobCard key={index} {...job} onPress={onJobPress} />
        ))}

        {/* View All Link */}
        <TouchableOpacity className="items-end mb-6">
          <View className="flex-row items-center">
            <Text className="text-primary-blue text-sm font-medium mr-1">View All</Text>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M6 12L10 8L6 4"
                stroke="#437EF4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </TouchableOpacity>
      </View>
    </CandidateLayout>
  );
}
