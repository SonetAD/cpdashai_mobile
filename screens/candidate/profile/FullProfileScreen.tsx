import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import Svg, { Path, Circle } from 'react-native-svg';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { useGetCandidateProfileQuery } from '../../../services/api';

// Import tab components
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { EducationTab } from './tabs/EducationTab';
import { ExperienceTab } from './tabs/ExperienceTab';
import { SkillsTab } from './tabs/SkillsTab';
import { ResumeTab } from './tabs/ResumeTab';
import { HobbyTab } from './tabs/HobbyTab';

interface FullProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

interface ExperienceEntry {
  id: string;
  index: number;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  employmentType: string;
  description: string;
  current: boolean;
}

export default function FullProfileScreen({
  activeTab = 'profile',
  onTabChange,
  onBack,
}: FullProfileScreenProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';
  const [selectedTab, setSelectedTab] = useState('personal');
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);

  // RTK Query
  const { data: profileData, isLoading: isLoadingProfile, error: profileError } = useGetCandidateProfileQuery();

  // Debug profile loading
  useEffect(() => {
    if (profileError) {
      console.error('Profile loading error:', profileError);
    }
    if (profileData) {
      console.log('Profile data loaded:', profileData);
    }
  }, [profileData, profileError]);

  // Populate data from query response
  useEffect(() => {
    if (profileData?.candidate && profileData.candidate.__typename === 'CandidateType') {
      const candidate = profileData.candidate;

      // Populate education list
      if (candidate.education && candidate.education.length > 0) {
        console.log('Raw education data from API:', candidate.education);
        const educationData: EducationEntry[] = candidate.education.map((edu, index) => {
          console.log(`Education ${index}:`, edu);
          return {
            id: edu.education_id || `edu-${index}`,
            degree: edu.degree || '',
            institution: edu.institution || '',
            fieldOfStudy: edu.field_of_study || '',
            startDate: edu.start_date || '',
            endDate: edu.end_date || '',
            grade: edu.grade || '',
          };
        });
        console.log('Mapped education data:', educationData);
        setEducationList(educationData);
      }

      // Populate experience list
      if (candidate.experience && candidate.experience.length > 0) {
        console.log('Raw experience data from API:', candidate.experience);
        const experienceData: ExperienceEntry[] = candidate.experience.map((exp, index) => {
          console.log(`Experience ${index}:`, exp);
          return {
            id: `exp-${index}`,
            index: index,
            position: exp.position || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: exp.start_date || '',
            endDate: exp.end_date || '',
            employmentType: exp.employment_type || '',
            description: exp.description || '',
            current: exp.current || false,
          };
        });
        console.log('Mapped experience data:', experienceData);
        setExperienceList(experienceData);
      }

      // Populate skills
      if (candidate.skills && Array.isArray(candidate.skills)) {
        setSkills(candidate.skills);
      }

      // Populate hobbies
      if (candidate.hobbies && Array.isArray(candidate.hobbies)) {
        setHobbies(candidate.hobbies);
      }
    }
  }, [profileData]);

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'education', label: 'Education' },
    { id: 'experience', label: 'Experience' },
    { id: 'skills', label: 'Skills' },
    { id: 'resume', label: 'Resume' },
    { id: 'hobby', label: 'Hobby' },
  ];

  const getFullName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return userName;
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'personal':
        return <PersonalInfoTab user={user} getFullName={getFullName} />;
      case 'education':
        return (
          <EducationTab
            educationList={educationList}
            setEducationList={setEducationList}
          />
        );
      case 'experience':
        return (
          <ExperienceTab
            experienceList={experienceList}
            setExperienceList={setExperienceList}
          />
        );
      case 'skills':
        return (
          <SkillsTab
            skills={skills}
            onUpdateSkills={(updatedSkills) => {
              setSkills(updatedSkills);
            }}
          />
        );
      case 'resume':
        return <ResumeTab />;
      case 'hobby':
        return (
          <HobbyTab
            hobbies={hobbies}
            onUpdateHobbies={(updatedHobbies) => {
              setHobbies(updatedHobbies);
            }}
          />
        );
      default:
        return null;
    }
  };

  // Show skeleton loader while fetching profile data
  if (isLoadingProfile) {
    return (
      <CandidateLayout
        userName={userName}
        onSearchPress={() => console.log('Search pressed')}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        <SkeletonLoader type="profile" />
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout
      userName={userName}
      onSearchPress={() => console.log('Search pressed')}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="bg-white -mt-5 flex-1">
        {/* Header with Back Button and Profile Text */}
        <View className="px-6 pt-6 pb-4 bg-white flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            className="mr-3"
            activeOpacity={0.7}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18L9 12L15 6"
                stroke="#1F2937"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text className="text-gray-900 text-base font-medium">Profile</Text>
        </View>

        <View className="px-6 bg-white">
          {/* Avatar Section with Progress Ring */}
          <View className="items-center mb-6 bg-white rounded-2xl py-6 mx-0">
            <View className="relative mb-3">
              {/* Progress Ring */}
              <Svg width={78} height={78} className="absolute -top-1 -left-1">
                <Circle
                  cx={39}
                  cy={39}
                  r={36}
                  stroke="#E5E7EB"
                  strokeWidth={4}
                  fill="none"
                />
                <Circle
                  cx={39}
                  cy={39}
                  r={36}
                  stroke="#2AD1CC"
                  strokeWidth={4}
                  fill="none"
                  strokeDasharray={226}
                  strokeDashoffset={113}
                  strokeLinecap="round"
                />
              </Svg>
              {/* Avatar */}
              <View
                className="items-center justify-center overflow-hidden"
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: '#437EF4'
                }}
              >
                <Text className="text-white text-2xl font-semibold">{getInitials()}</Text>
              </View>
            </View>
            <Text className="text-gray-900 text-lg font-bold mb-1">{getFullName()}</Text>
            <Text className="text-gray-500 text-xs">{user?.email || 'No email'}</Text>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
                className={`mr-2 px-4 py-2 rounded-full ${
                  selectedTab === tab.id
                    ? 'bg-primary-blue'
                    : 'bg-white border border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedTab === tab.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tab Content */}
          <View className="mb-6">{renderTabContent()}</View>
        </View>
      </View>
    </CandidateLayout>
  );
}
