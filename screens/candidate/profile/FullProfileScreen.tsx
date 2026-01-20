import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Animated, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RootState } from '../../../store/store';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { SkeletonLoader } from '../../../components/SkeletonLoader';
import { useGetCandidateProfileQuery, useGetRecruiterProfileQuery, useGetMyCRSQuery } from '../../../services/api';
import ProfilePictureUpload from '../../../components/profile/ProfilePictureUpload';
import ProfileBannerUpload from '../../../components/profile/ProfileBannerUpload';
import SearchModal from '../../../components/SearchModal';

// Gradient Arc around avatar with progress fill
const GradientArc = ({ size = 110, progress = 0 }: { size?: number; progress?: number }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc parameters - gap at bottom left (9 o'clock position)
  const gapAngle = 60; // degrees of gap
  const totalArcAngle = 360 - gapAngle; // 300 degrees of arc
  const startAngle = 210; // Start at 10 o'clock (right side of gap)
  const endAngle = 150; // End at 8 o'clock (left side of gap)

  // Convert angles to cartesian coordinates
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const arcStart = polarToCartesian(startAngle);
  const arcEnd = polarToCartesian(endAngle);
  const largeArcFlag = totalArcAngle > 180 ? 1 : 0;

  // Background arc path (full arc from start to end)
  const backgroundArc = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcEnd.x} ${arcEnd.y}`;

  // Progress arc - fills based on percentage (minimum 5% if > 0)
  const displayProgress = progress === 0 ? 0 : Math.max(progress, 5);
  const progressAngle = (displayProgress / 100) * totalArcAngle;

  // Progress fills from start angle clockwise
  const progressEndAngle = startAngle + progressAngle;
  const progressEnd = polarToCartesian(progressEndAngle > 360 ? progressEndAngle - 360 : progressEndAngle);
  const progressLargeArc = progressAngle > 180 ? 1 : 0;
  const progressArc = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`;

  return (
    <Svg width={size} height={size} style={avatarStyles.gradientArc}>
      <Defs>
        <SvgLinearGradient id="arcGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0E3FC8" />
          <Stop offset="100%" stopColor="#8C6BFF" />
        </SvgLinearGradient>
      </Defs>
      {/* Background arc - gray */}
      <Path
        d={backgroundArc}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Progress arc - gradient fill */}
      {displayProgress > 0 && (
        <Path
          d={progressArc}
          stroke="url(#arcGradientFull)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </Svg>
  );
};

const avatarStyles = StyleSheet.create({
  overlappingAvatarContainer: {
    position: 'absolute',
    bottom: -55, // Half of avatar height to overlap
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
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
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  showBackButton?: boolean;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
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
  showBackButton = true,
  onNotificationPress,
  onProfilePress,
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
  const { data: crsData } = useGetMyCRSQuery(undefined, { skip: isRecruiter });

  // Get CRS level display and score
  const levelDisplay = crsData?.myCrs?.levelDisplay;
  const crsScore = crsData?.myCrs?.totalScore;

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
            position: exp.title || exp.position || '',  // Backend sends 'title', map to 'position'
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
    // First check candidate profile data (has fullName from API)
    if (!isRecruiter && candidateProfileData?.myProfile?.__typename === 'CandidateType') {
      const profileUser = candidateProfileData.myProfile.user;
      if (profileUser?.fullName) {
        return profileUser.fullName;
      }
      if (profileUser?.firstName && profileUser?.lastName) {
        return `${profileUser.firstName} ${profileUser.lastName}`;
      }
      if (profileUser?.firstName) {
        return profileUser.firstName;
      }
    }
    // Fallback to Redux auth user
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return userName;
  };

  const getInitials = () => {
    // First check candidate profile data (has fullName from API)
    if (!isRecruiter && candidateProfileData?.myProfile?.__typename === 'CandidateType') {
      const profileUser = candidateProfileData.myProfile.user;
      if (profileUser?.fullName) {
        const parts = profileUser.fullName.trim().split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return profileUser.fullName.substring(0, 2).toUpperCase();
      }
      if (profileUser?.firstName && profileUser?.lastName) {
        return `${profileUser.firstName[0]}${profileUser.lastName[0]}`.toUpperCase();
      }
      if (profileUser?.firstName) {
        return profileUser.firstName.substring(0, 2).toUpperCase();
      }
    }
    // Fallback to Redux auth user
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

  // Memoize profile picture URL to prevent unnecessary re-renders
  // IMPORTANT: This must be before any early returns to follow Rules of Hooks
  const profilePictureUrl = useMemo(
    () => {
      if (isRecruiter) {
        const recruiter = recruiterProfileData?.recruiter;
        if (recruiter && '__typename' in recruiter && recruiter.__typename === 'RecruiterType') {
          return recruiter.user?.profilePictureUrl || null;
        }
        return null;
      }
      const candidate = candidateProfileData?.myProfile;
      if (candidate && '__typename' in candidate && candidate.__typename === 'CandidateType') {
        return (candidate as any).profilePicture || null;
      }
      return null;
    },
    [isRecruiter, candidateProfileData?.myProfile, recruiterProfileData?.recruiter]
  );

  // Memoize search press handler to prevent CandidateLayout re-renders
  // IMPORTANT: This must be before any early returns to follow Rules of Hooks
  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearchModal(true);
  }, []);

  // Show skeleton loader while fetching profile data
  if (isLoadingProfile) {
    return (
      <>
      <CandidateLayout
        onSearchPress={handleSearchPress}
        showGlassPill={true}
        profilePictureUrl={profilePictureUrl}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
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
      onSearchPress={handleSearchPress}
      showGlassPill={true}
      profilePictureUrl={profilePictureUrl}
      onNotificationPress={onNotificationPress}
      onProfilePress={onProfilePress}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: 'white' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 }}
        bounces={true}
        alwaysBounceVertical={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#437EF4']}
            tintColor="#437EF4"
            progressViewOffset={insets.top + 70}
          />
        }
      >
        {/* Profile Banner with Overlapping Avatar */}
        <View style={{ marginBottom: 70 }}>
          {/* Profile Banner */}
          <ProfileBannerUpload
            height={150}
            editable={true}
            onUploadSuccess={() => {
              // Refetch profile after banner upload
              if (refetchCandidate) refetchCandidate();
            }}
          />

          {/* Avatar Section - Overlapping Banner */}
          <Animated.View
            style={[
              avatarStyles.overlappingAvatarContainer,
              {
                opacity: avatarFade,
                transform: [{ scale: avatarScale }],
              },
            ]}
          >
            <View style={avatarStyles.avatarWrapper}>
              {/* Gradient Arc */}
              <GradientArc size={110} progress={crsScore} />
              {/* Avatar with white ring */}
              <View style={avatarStyles.avatarContainer}>
                <View style={avatarStyles.whiteRing}>
                  <ProfilePictureUpload
                    initials={getInitials()}
                    size={80}
                    editable={true}
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Profile updating indicator */}
          {isProfileUpdating && (
            <View className="flex-row items-center justify-center mt-16">
              <View className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
              <Text className="text-blue-600 text-xs font-medium">Profile being updated from resume...</Text>
            </View>
          )}
        </View>

        {/* User Info Section */}
        <View className="items-center mb-6 px-6">
          <Text className="text-gray-900 text-lg font-bold mb-1">{getFullName()}</Text>
          <Text className="text-gray-500 text-xs">{user?.email || 'No email'}</Text>

          {/* CRS Level Badge */}
          {!isRecruiter && (levelDisplay || crsScore !== undefined) && (
            <View style={profileStyles.levelBadge}>
              <Text style={profileStyles.levelBadgeText}>
                {levelDisplay}{levelDisplay && crsScore !== undefined ? ' • ' : ''}{crsScore !== undefined ? `${Math.round(crsScore)} CRS` : ''}
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 bg-white">

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
              style={profileStyles.tabsScroll}
              contentContainerStyle={profileStyles.tabsContainer}
            >
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => handleTabChange(tab.id)}
                  style={({ pressed }) => [
                    profileStyles.tab,
                    selectedTab === tab.id && profileStyles.tabActive,
                    { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
                  ]}
                >
                  <Text
                    style={[
                      profileStyles.tabText,
                      selectedTab === tab.id && profileStyles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
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

const profileStyles = StyleSheet.create({
  levelBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  // Tab styles matching ProfileSetupScreen
  tabsScroll: {
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 0,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
