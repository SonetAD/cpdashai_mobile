import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, Animated, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../../store/store';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { useGetCandidateProfileQuery, useGetRecruiterProfileQuery } from '../../../services/api';
import ProfilePictureUpload from '../../../components/profile/ProfilePictureUpload';
import SearchModal from '../../../components/SearchModal';

// Gradient Arc around avatar - matches ProfileScreen design
const GradientArc = ({ size = 110 }: { size?: number }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Create arc path (incomplete circle with gap at 9 o'clock position)
  const startAngle = 210; // Start at 10 o'clock
  const endAngle = 150; // End at 8 o'clock
  const largeArcFlag = 1; // Use large arc

  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const startX = center + radius * Math.cos(startRad);
  const startY = center + radius * Math.sin(startRad);
  const endX = center + radius * Math.cos(endRad);
  const endY = center + radius * Math.sin(endRad);

  const pathD = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

  return (
    <Svg width={size} height={size} style={avatarStyles.gradientArc}>
      <Defs>
        <SvgLinearGradient id="arcGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0E3FC8" />
          <Stop offset="100%" stopColor="#8C6BFF" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d={pathD}
        stroke="url(#arcGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
};

const avatarStyles = StyleSheet.create({
  avatarWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientArc: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
});

// Import tab components
import { PersonalInfoTab } from './tabs/PersonalInfoTab';
import { EducationTab } from './tabs/EducationTab';
import { ExperienceTab } from './tabs/ExperienceTab';
import { SkillsTab } from './tabs/SkillsTab';
import { ResumeTab } from './tabs/ResumeTab';
import { HobbyTab } from './tabs/HobbyTab';
import CertificatesTab from './tabs/CertificatesTab';
import ExtraCurricularTab from './tabs/ExtraCurricularTab';
import LeadershipSocialTab from './tabs/LeadershipSocialTab';
import LocationTab from './tabs/LocationTab';

interface FullProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  onSearchNavigate?: (route: string) => void;
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
  onSearchNavigate,
}: FullProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';
  const userRole = user?.role?.toLowerCase();
  const isRecruiter = userRole === 'recruiter';

  const [selectedTab, setSelectedTab] = useState('personal');
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const avatarFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;

  // RTK Query - use appropriate query based on user role
  const { data: candidateProfileData, isLoading: isLoadingCandidate, error: candidateError, refetch: refetchCandidate } = useGetCandidateProfileQuery(undefined, { skip: isRecruiter });
  const { data: recruiterProfileData, isLoading: isLoadingRecruiter, error: recruiterError, refetch: refetchRecruiter } = useGetRecruiterProfileQuery(undefined, { skip: !isRecruiter });

  const profileData = isRecruiter ? recruiterProfileData : candidateProfileData;
  const isLoadingProfile = isRecruiter ? isLoadingRecruiter : isLoadingCandidate;
  const profileError = isRecruiter ? recruiterError : candidateError;

  // Entrance animations
  useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Avatar animation with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(avatarScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(avatarFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);

    // Content animation with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, 250);
  }, []);

  // Refetch profile data when component mounts
  useEffect(() => {
    if (isRecruiter) {
      refetchRecruiter();
    } else {
      refetchCandidate();
    }
  }, [isRecruiter, refetchCandidate, refetchRecruiter]);

  // Track if profile is being updated
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isRecruiter) {
        await refetchRecruiter();
      } else {
        await refetchCandidate();
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Refresh error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle tab change with haptics
  const handleTabChange = (tabId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tabId);
  };

  // Handle back press
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(backButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onBack?.();
    });
  };

  // Debug profile loading
  useEffect(() => {
    if (profileError) {
      console.error('Profile loading error:', profileError);
    }
    if (profileData) {
      console.log('Profile data loaded:', profileData);
      // Check if there's an ongoing resume parsing that will update profile
      setIsProfileUpdating(false);
    }
  }, [profileData, profileError]);

  // Populate data from query response (only for candidates)
  useEffect(() => {
    if (!isRecruiter && candidateProfileData?.myProfile && candidateProfileData.myProfile.__typename === 'CandidateType') {
      const candidate = candidateProfileData.myProfile;

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
  }, [candidateProfileData, isRecruiter]);

  // Tabs - different for candidate and recruiter
  const tabs = isRecruiter
    ? [{ id: 'personal', label: 'Personal Info' }]
    : [
        { id: 'personal', label: 'Personal Info' },
        { id: 'location', label: 'Locations' },
        { id: 'education', label: 'Education' },
        { id: 'experience', label: 'Experience' },
        { id: 'skills', label: 'Skills' },
        { id: 'certificates', label: 'Certificates' },
        { id: 'extracurricular', label: 'Extra-curricular' },
        { id: 'leadership', label: 'Leadership' },
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

  const renderRecruiterProfile = () => {
    if (!recruiterProfileData || recruiterProfileData.recruiter.__typename === 'ErrorType') {
      return (
        <View className="bg-white rounded-xl p-6 mb-4">
          <Text className="text-gray-500 text-sm text-center">
            Failed to load profile information
          </Text>
        </View>
      );
    }

    const recruiter = recruiterProfileData.recruiter;

    return (
      <View>
        {/* Organization Information */}
        <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">Organization Information</Text>

          {recruiter.organizationName && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Organization Name</Text>
              <Text className="text-gray-900 text-base">{recruiter.organizationName}</Text>
            </View>
          )}

          {recruiter.organizationType && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Organization Type</Text>
              <Text className="text-gray-900 text-base capitalize">{recruiter.organizationType}</Text>
            </View>
          )}

          {recruiter.subRole && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Sub Role</Text>
              <Text className="text-gray-900 text-base">{recruiter.subRole}</Text>
            </View>
          )}

          {recruiter.position && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Position</Text>
              <Text className="text-gray-900 text-base">{recruiter.position}</Text>
            </View>
          )}

          {recruiter.companyName && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Company Name</Text>
              <Text className="text-gray-900 text-base">{recruiter.companyName}</Text>
            </View>
          )}

          {recruiter.companyWebsite && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">Company Website</Text>
              <Text className="text-primary-blue text-base">{recruiter.companyWebsite}</Text>
            </View>
          )}

          {recruiter.linkedinUrl && (
            <View className="mb-3">
              <Text className="text-gray-600 text-xs mb-1">LinkedIn Profile</Text>
              <Text className="text-primary-blue text-base">{recruiter.linkedinUrl}</Text>
            </View>
          )}
        </View>

        {/* Industries & Specializations */}
        {(recruiter.industries && recruiter.industries.length > 0) ||
         (recruiter.specializations && recruiter.specializations.length > 0) ? (
          <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
            <Text className="text-gray-900 font-bold text-lg mb-4">Areas of Focus</Text>

            {recruiter.industries && recruiter.industries.length > 0 && (
              <View className="mb-4">
                <Text className="text-gray-600 text-xs mb-2">Industries</Text>
                <View className="flex-row flex-wrap gap-2">
                  {recruiter.industries.map((industry, index) => (
                    <View key={index} className="bg-blue-50 border border-primary-blue rounded-full px-3 py-1">
                      <Text className="text-primary-blue text-xs font-medium">{industry}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {recruiter.specializations && recruiter.specializations.length > 0 && (
              <View>
                <Text className="text-gray-600 text-xs mb-2">Specializations</Text>
                <View className="flex-row flex-wrap gap-2">
                  {recruiter.specializations.map((spec, index) => (
                    <View key={index} className="bg-green-50 border border-green-500 rounded-full px-3 py-1">
                      <Text className="text-green-700 text-xs font-medium">{spec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Account Status */}
        <View className="bg-white rounded-xl p-5 mb-4 border border-gray-100">
          <Text className="text-gray-900 font-bold text-lg mb-4">Account Status</Text>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 text-sm">Verification Status</Text>
            <View className={`px-3 py-1 rounded-full ${recruiter.isVerified ? 'bg-green-50' : 'bg-orange-50'}`}>
              <Text className={`text-xs font-medium ${recruiter.isVerified ? 'text-green-700' : 'text-orange-700'}`}>
                {recruiter.isVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 text-sm">Account Status</Text>
            <View className={`px-3 py-1 rounded-full ${recruiter.isActive ? 'bg-green-50' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-medium ${recruiter.isActive ? 'text-green-700' : 'text-gray-700'}`}>
                {recruiter.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (isRecruiter && selectedTab === 'personal') {
      return renderRecruiterProfile();
    }

    // Get candidate profile data
    const candidateProfile = candidateProfileData?.myProfile?.__typename === 'CandidateType'
      ? candidateProfileData.myProfile
      : null;

    switch (selectedTab) {
      case 'personal':
        return <PersonalInfoTab candidateProfile={candidateProfile} />;
      case 'location':
        return <LocationTab />;
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
      case 'certificates':
        return <CertificatesTab />;
      case 'extracurricular':
        return <ExtraCurricularTab />;
      case 'leadership':
        return <LeadershipSocialTab />;
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
      <>
      <CandidateLayout
        userName={userName}
        onSearchPress={() => setShowSearchModal(true)}
        activeTab={activeTab}
        onTabChange={onTabChange}
      >
        <SkeletonLoader type="profile" />
      </CandidateLayout>
      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(route) => {
          setShowSearchModal(false);
          onSearchNavigate?.(route);
        }}
      />
      </>
    );
  }

  return (
    <>
    <CandidateLayout
      userName={userName}
      onSearchPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowSearchModal(true);
      }}
      activeTab={activeTab}
      onTabChange={onTabChange}
      hideHeader={true}
    >
      <ScrollView
        className="bg-white flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#437EF4']}
            tintColor="#437EF4"
          />
        }
      >
        {/* Header with Back Button and Profile Text */}
        <Animated.View
          className="px-6 pb-4 bg-white flex-row items-center"
          style={{
            paddingTop: insets.top + 16,
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          }}
        >
          <Pressable
            onPress={handleBackPress}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
            style={({ pressed }) => ({
              marginRight: 8,
              padding: 8,
              borderRadius: 12,
              backgroundColor: pressed ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
            })}
          >
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#1F2937"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </Pressable>
          <View className="flex-1">
            <Text className="text-gray-900 text-2xl font-bold">My Profile</Text>
            {isProfileUpdating && (
              <View className="flex-row items-center mt-1">
                <View className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                <Text className="text-blue-600 text-xs font-medium">Profile being updated from resume...</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View className="px-6 bg-white">
          {/* Avatar Section with Gradient Arc - matches ProfileScreen */}
          <Animated.View
            className="items-center mb-6 bg-white rounded-2xl py-6 mx-0"
            style={{
              opacity: avatarFade,
              transform: [{ scale: avatarScale }],
            }}
          >
            <View style={avatarStyles.avatarWrapper} className="mb-3">
              {/* Gradient Arc */}
              <GradientArc size={110} />
              {/* Avatar with white ring */}
              <View style={avatarStyles.avatarContainer}>
                <View style={avatarStyles.whiteRing}>
                  <ProfilePictureUpload
                    initials={getInitials()}
                    size={80}
                    editable={false}
                  />
                </View>
              </View>
            </View>
            <Text className="text-gray-900 text-lg font-bold mb-1">{getFullName()}</Text>
            <Text className="text-gray-500 text-xs">{user?.email || 'No email'}</Text>
          </Animated.View>

          {/* Tabs */}
          <Animated.View
            style={{
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-6"
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
                  ]}
                >
                  <View
                    className={`mr-2 px-4 py-2 rounded-full ${
                      selectedTab === tab.id
                        ? 'bg-primary-blue'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedTab === tab.id ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Tab Content */}
          <Animated.View
            className="mb-6"
            style={{
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            }}
          >
            {renderTabContent()}
          </Animated.View>
        </View>
      </ScrollView>
    </CandidateLayout>
    <SearchModal
      visible={showSearchModal}
      onClose={() => setShowSearchModal(false)}
      onNavigate={(route) => {
        setShowSearchModal(false);
        onSearchNavigate?.(route);
      }}
    />
    </>
  );
}
