import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Svg, { Circle, Path, Rect, Defs, LinearGradient, Stop, G, ClipPath } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import ProfileScreen from '../profile/ProfileScreen';
import FullProfileScreen from '../profile/FullProfileScreen';
import JobsScreen from './JobsScreen';
import JobDetailsScreen from './JobDetailsScreen';
import ApplicationTrackerScreen from './ApplicationTrackerScreen';
import CVUploadScreen from './CVUploadScreen';
import CVBuilderScreen from './CVBuilderScreen';
import InterviewCoachScreen from '../aiCoach/InterviewCoachScreen';
import AIClaraAssistantScreen from '../aiCoach/AIClaraAssistantScreen';
import SearchModal from '../../../components/SearchModal';
import PricingScreen from '../subscription/PricingScreen';
import SubscriptionSuccessScreen from '../subscription/SubscriptionSuccessScreen';
import PremiumUpgradeBanner from '../../../components/PremiumUpgradeBanner';
import LockedFeatureCard from '../../../components/LockedFeatureCard';
import { useParseAndCreateResumeMutation, useExportResumePdfMutation, useCheckSubscriptionStatusQuery } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

// Import SVG assets
import UploadCVIcon from '../../../assets/images/homepage/uploadCV.svg';
import FindJobsIcon from '../../../assets/images/homepage/findJobs.svg';
import PracticeInterviewIcon from '../../../assets/images/homepage/practiceInterview.svg';
import IdeaIcon from '../../../assets/images/homepage/idea.svg';
import TrophyIcon from '../../../assets/images/homepage/trophy.svg';
import CircleCheckIcon from '../../../assets/images/homepage/circleCheck.svg';
import SkillGraphIcon from '../../../assets/images/homepage/skillGraph.svg';
import MessageIcon from '../../../assets/images/homepage/message.svg';

interface CandidateDashboardProps {
  userName?: string;
  onLogout?: () => void;
}

// Circular Progress Component
const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 35;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - percentage) / 100) * circumference;

  return (
    <View className="items-center justify-center">
      <Svg width={80} height={80} viewBox="0 0 80 80">
        {/* Background Circle */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#83E4E1"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        {/* Outer Cyan Ring */}
        <Circle
          cx="40"
          cy="40"
          r={radius + strokeWidth + 2}
          stroke="#83E4E1"
          strokeWidth={2}
          fill="none"
          opacity={0.3}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className="text-2xl font-bold text-gray-900">{percentage}%</Text>
      </View>
    </View>
  );
};

// Quick Action Card Component
interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, title, description, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 items-center flex-1 shadow-sm"
      style={{ minHeight: 160 }}
      activeOpacity={0.7}
    >
      <View className="mb-3">{icon}</View>
      <Text className="text-gray-900 text-base font-bold mb-2 text-center">{title}</Text>
      <Text className="text-gray-400 text-xs text-center leading-4">{description}</Text>
    </TouchableOpacity>
  );
};

// Job Card Component
interface JobCardProps {
  position: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  skills: string[];
  aiInsight: string;
  badgeColor?: string;
}

const JobCard: React.FC<JobCardProps> = ({
  position,
  description,
  company,
  location,
  jobType,
  salary,
  skills,
  aiInsight,
  badgeColor = '#437EF4',
}) => {
  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
      {/* Position Badge */}
      <View className="flex-row items-center mb-3">
        <View
          className="rounded-full mr-2"
          style={{ width: 8, height: 8, backgroundColor: badgeColor }}
        />
        <Text className="text-gray-500 text-xs">Position</Text>
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
    </View>
  );
};

// Activity Item Component
interface ActivityItemProps {
  title: string;
  subtitle: string;
  dotColor: string;
  actionText: string;
  onActionPress: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  dotColor,
  actionText,
  onActionPress,
}) => {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-start flex-1">
        <View
          className="rounded-full mt-1 mr-3"
          style={{ width: 8, height: 8, backgroundColor: dotColor }}
        />
        <View className="flex-1">
          <Text className="text-gray-900 text-sm font-semibold mb-0.5">{title}</Text>
          <Text className="text-gray-400 text-xs">{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onActionPress}>
        <Text className="text-primary-blue text-sm font-medium">{actionText}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Gamification Badge Component
interface GamificationBadgeProps {
  icon: React.ReactNode;
  title: string;
}

const GamificationBadge: React.FC<GamificationBadgeProps> = ({ icon, title }) => {
  return (
    <View className="items-center flex-1">
      <View className="mb-2">{icon}</View>
      <Text className="text-gray-900 text-xs font-bold text-center">{title}</Text>
    </View>
  );
};

export default function CandidateDashboard({
  userName = 'User',
  onLogout,
}: CandidateDashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplicationTracker, setShowApplicationTracker] = useState(false);
  const [showCVUpload, setShowCVUpload] = useState(false);
  const [showCVBuilder, setShowCVBuilder] = useState(false);
  const [editResumeId, setEditResumeId] = useState<string | undefined>(undefined);
  const [showClaraAssistant, setShowClaraAssistant] = useState(false);
  const [cvRefreshTrigger, setCvRefreshTrigger] = useState(0);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);

  // API hooks for resume upload
  const [parseAndCreateResume] = useParseAndCreateResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();
  const { showAlert } = useAlert();

  // Subscription status
  const { data: subscriptionData, refetch: refetchSubscription } = useCheckSubscriptionStatusQuery();
  const canUseAiFeatures = subscriptionData?.subscriptionStatus?.canUseAiFeatures || false;

  // Refetch subscription status when component mounts or user changes
  useEffect(() => {
    console.log('Dashboard mounted - refetching subscription status');
    refetchSubscription();
  }, [userName]); // Refetch when userName changes (indicates new user login)

  // Create separate animations for each tab
  const homeOpacity = useRef(new Animated.Value(1)).current;
  const jobsOpacity = useRef(new Animated.Value(0)).current;
  const aiCoachOpacity = useRef(new Animated.Value(0)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;

    console.log('Tab changed to:', tabId);

    const getOpacityRef = (tab: string) => {
      switch (tab) {
        case 'home': return homeOpacity;
        case 'jobs': return jobsOpacity;
        case 'aiCoach': return aiCoachOpacity;
        case 'profile': return profileOpacity;
        default: return homeOpacity;
      }
    };

    const currentOpacity = getOpacityRef(activeTab);
    const nextOpacity = getOpacityRef(tabId);

    // Fade out current, fade in next
    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(nextOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(tabId);

    if (tabId !== 'profile') {
      setShowFullProfile(false);
    }
    if (tabId !== 'jobs') {
      setShowJobDetails(false);
      setShowApplicationTracker(false);
      setShowCVUpload(false);
      setShowCVBuilder(false);
    }
    if (tabId !== 'aiCoach') {
      setShowClaraAssistant(false);
    }
  };

  const handleViewFullProfile = () => {
    setShowFullProfile(true);
  };

  const handleBackToProfile = () => {
    setShowFullProfile(false);
  };

  const handleJobPress = () => {
    setShowJobDetails(true);
  };

  const handleBackFromJobDetails = () => {
    setShowJobDetails(false);
  };

  const handleApplicationTrackerPress = () => {
    setShowApplicationTracker(true);
  };

  const handleBackFromApplicationTracker = () => {
    setShowApplicationTracker(false);
  };

  const handleCVUploadPress = () => {
    setShowCVUpload(true);
  };

  const handleBackFromCVUpload = () => {
    setShowCVUpload(false);
  };

  const handleCreateCV = () => {
    setEditResumeId(undefined); // Clear edit mode
    setShowCVBuilder(true);
  };

  const handleEditCV = (resumeId: string) => {
    setEditResumeId(resumeId); // Set edit mode
    setShowCVBuilder(true);
  };

  const handleBackFromCVBuilder = () => {
    console.log('🔙 Returning from CV Builder - triggering refresh');
    setShowCVBuilder(false);
    setEditResumeId(undefined); // Clear edit mode
    setCvRefreshTrigger(Date.now()); // Trigger refresh in CVUploadScreen
  };

  const handleClaraPress = () => {
    setShowClaraAssistant(true);
  };

  const handleBackFromClara = () => {
    setShowClaraAssistant(false);
  };

  // Handle resume upload from home screen
  const handleQuickUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size && file.size > maxSize) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select a file smaller than 10MB.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Only PDF and DOCX files are supported.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      // Add data URI prefix
      const fileData = `data:${file.mimeType};base64,${base64}`;

      // Parse and create resume
      const data = await parseAndCreateResume({
        fileName: file.name,
        fileData: fileData,
      }).unwrap();

      if (data.parseAndCreateResume.__typename === 'ResumeBuilderSuccessType') {
        const resume = data.parseAndCreateResume.resume;

        // Automatically trigger PDF generation
        try {
          const pdfData = await exportPdf(resume.id).unwrap();

          if (pdfData.exportResumePdf.__typename === 'SuccessType') {
            showAlert({
              type: 'success',
              title: 'Success!',
              message: `Resume parsed successfully!\n\nName: ${resume.fullName}\nATS Score: ${resume.atsScore}%\n\nYour PDF is being generated.`,
              buttons: [{
                text: 'View Resumes',
                style: 'default',
                onPress: () => handleCVUploadPress()
              }],
            });
          } else {
            showAlert({
              type: 'warning',
              title: 'Partial Success',
              message: `Resume parsed with ATS Score: ${resume.atsScore}%\n\nPDF generation will be available shortly.`,
              buttons: [{
                text: 'View Resumes',
                style: 'default',
                onPress: () => handleCVUploadPress()
              }],
            });
          }
        } catch (pdfError) {
          showAlert({
            type: 'warning',
            title: 'Partial Success',
            message: `Resume parsed successfully!\n\nPDF generation will be available shortly.`,
            buttons: [{
              text: 'View Resumes',
              style: 'default',
              onPress: () => handleCVUploadPress()
            }],
          });
        }
      } else if (data.parseAndCreateResume.__typename === 'ErrorType') {
        showAlert({
          type: 'error',
          title: 'Upload Failed',
          message: data.parseAndCreateResume.message || 'Failed to parse resume.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      showAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error?.data?.parseAndCreateResume?.message || error?.message || 'Failed to upload resume. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Render nested screens (overlays)
  if (showCVBuilder) {
    return (
      <CVBuilderScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackFromCVBuilder}
        resumeId={editResumeId}
      />
    );
  }
  if (showCVUpload) {
    return (
      <CVUploadScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackFromCVUpload}
        onCreateCV={handleCreateCV}
        onEditCV={handleEditCV}
        onViewPricing={() => {
          setShowCVUpload(false);
          setShowPricing(true);
        }}
        forceRefresh={cvRefreshTrigger}
      />
    );
  }
  if (showApplicationTracker) {
    return (
      <ApplicationTrackerScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackFromApplicationTracker}
      />
    );
  }
  if (showJobDetails) {
    return (
      <JobDetailsScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackFromJobDetails}
      />
    );
  }
  if (showClaraAssistant) {
    return (
      <AIClaraAssistantScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackFromClara}
      />
    );
  }
  if (showFullProfile) {
    return (
      <FullProfileScreen
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onBack={handleBackToProfile}
      />
    );
  }

  // Home content
  const HomeContent = (
    <>
      <CandidateLayout
        userName={userName}
        onSearchPress={() => setShowSearchModal(true)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="pb-6">
          <View className="px-6 mt-6">
            {/* AI Companion Section */}
            <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Your AI Companion</Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
              <View className="bg-primary-cyan rounded-xl items-center justify-center mr-4" style={{ width: 48, height: 48 }}>
                <Text className="text-white text-xl font-bold">AI</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 text-base font-bold mb-1">AI Companion</Text>
                <Text className="text-gray-400 text-xs leading-4">
                  Your AI support system for career progress, confidence, and overall well-being.
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Quick Actions</Text>

            {/* First Row */}
            <View className="flex-row mb-3" style={{ gap: 12 }}>
              <QuickActionCard
                icon={<UploadCVIcon width={40} height={40} />}
                title="Upload CV"
                description="Drag & drop a file or browse an active resume from device for AI's swift analysis and feedback!"
                onPress={handleQuickUploadCV}
              />
              <QuickActionCard
                icon={<FindJobsIcon width={40} height={40} />}
                title="Find Jobs"
                description="Discover your dream job effortlessly in the sea of opportunities! Dive in and explore"
                onPress={() => console.log('Find Jobs')}
              />
            </View>

            {/* Second Row */}
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickActionCard
                icon={<PracticeInterviewIcon width={40} height={40} />}
                title="Practice Interview"
                description="Prepare with confidence for real moments, by simulating AI-driven mock sessions"
                onPress={() => console.log('Practice Interview')}
              />
              <QuickActionCard
                icon={<SkillGraphIcon width={32} height={32} />}
                title="Skill Gap"
                description="Identify all the skills they need to improve to reach their desired career path"
                onPress={() => console.log('Skill Gap')}
              />
            </View>
          </View>

          {/* Premium Upgrade Banner - Only for Free Users */}
          {!canUseAiFeatures && (
            <PremiumUpgradeBanner onUpgrade={() => setShowPricing(true)} />
          )}

          {/* Top Job Matches Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Top Job Matches for You</Text>

            <JobCard
              position="Product Designer"
              description="Design intuitive user experiences for our flagship products. Work with cross-functional teams to create beautiful, accessible interfaces that delight users."
              company="Chawla Solution"
              location="Remote - Pakistan"
              jobType="Full Time"
              salary="$45K - $60K / year"
              skills={['Figma', 'UX Research', 'Prototyping']}
              aiInsight="AI Insight: Your design portfolio shows strong UX depth 87% fit for this role."
              badgeColor="#437EF4"
            />

            <JobCard
              position="Frontend Engineer"
              description="Build responsive web applications using modern JavaScript frameworks. Collaborate with designers and backend engineers to deliver high-quality features."
              company="Chawla Solution"
              location="Remote - Pakistan"
              jobType="Full Time"
              salary="$45K - $60K / year"
              skills={['React', 'TypeScript', 'Next.js']}
              aiInsight="AI Insight: Your frontend skills and React experience make you a strong match for this position."
              badgeColor="#FFCC00"
            />
          </View>

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

          {/* Recent Activity Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Recent Activity</Text>

            <ActivityItem
              title="Uploaded CV"
              subtitle="Today - Created and scored"
              dotColor="#437EF4"
              actionText="View"
              onActionPress={() => console.log('View CV')}
            />

            <ActivityItem
              title="Practice session"
              subtitle="Yesterday - 1 mock interview"
              dotColor="#FF8D28"
              actionText="View"
              onActionPress={() => console.log('View Practice')}
            />

            <ActivityItem
              title="Jobs Match"
              subtitle="Yesterday - 1 mock interview"
              dotColor="#FFCC00"
              actionText="Review"
              onActionPress={() => console.log('Review Jobs')}
            />
          </View>

          {/* Gamification Section */}
          <View className="mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">Gamification</Text>
            <View className="flex-row gap-4">
              <GamificationBadge
                icon={<TrophyIcon width={27} height={27} />}
                title="CV Master"
              />
              <GamificationBadge
                icon={<CircleCheckIcon width={27} height={27} />}
                title="Interview Pro"
              />
              <GamificationBadge
                icon={<SkillGraphIcon width={27} height={27} />}
                title="Skill Builder"
              />
            </View>
          </View>

          {/* Ask to Clara Button */}
          <TouchableOpacity className="bg-primary-blue rounded-xl py-4 flex-row items-center justify-center mb-6">
            <MessageIcon width={24} height={24} />
            <Text className="text-white text-base font-semibold ml-2">Ask to Clara</Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </CandidateLayout>

      {/* Search Modal */}
      <SearchModal visible={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );

  // Show Pricing Screen
  if (showPricing) {
    return (
      <PricingScreen
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          setShowPricing(false); // Close pricing screen when tab changes
          handleTabChange(tabId);
        }}
        onBack={() => setShowPricing(false)}
      />
    );
  }

  // Show Subscription Success Screen
  if (showSubscriptionSuccess) {
    return (
      <SubscriptionSuccessScreen
        onContinue={() => {
          setShowSubscriptionSuccess(false);
          setActiveTab('home');
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Home Tab */}
      <Animated.View
        style={{
          flex: 1,
          opacity: homeOpacity,
          position: activeTab === 'home' ? 'relative' : 'absolute',
          width: '100%',
          height: '100%',
        }}
        pointerEvents={activeTab === 'home' ? 'auto' : 'none'}
      >
        {HomeContent}
      </Animated.View>

      {/* Jobs Tab */}
      <Animated.View
        style={{
          flex: 1,
          opacity: jobsOpacity,
          position: activeTab === 'jobs' ? 'relative' : 'absolute',
          width: '100%',
          height: '100%',
        }}
        pointerEvents={activeTab === 'jobs' ? 'auto' : 'none'}
      >
        <JobsScreen
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={userName}
          onJobPress={handleJobPress}
          onApplicationTrackerPress={handleApplicationTrackerPress}
          onCVUploadPress={handleCVUploadPress}
        />
      </Animated.View>

      {/* AI Coach Tab */}
      <Animated.View
        style={{
          flex: 1,
          opacity: aiCoachOpacity,
          position: activeTab === 'aiCoach' ? 'relative' : 'absolute',
          width: '100%',
          height: '100%',
        }}
        pointerEvents={activeTab === 'aiCoach' ? 'auto' : 'none'}
      >
        <InterviewCoachScreen
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onClaraPress={handleClaraPress}
        />
      </Animated.View>

      {/* Profile Tab */}
      <Animated.View
        style={{
          flex: 1,
          opacity: profileOpacity,
          position: activeTab === 'profile' ? 'relative' : 'absolute',
          width: '100%',
          height: '100%',
        }}
        pointerEvents={activeTab === 'profile' ? 'auto' : 'none'}
      >
        <ProfileScreen
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onViewFullProfile={handleViewFullProfile}
          onLogout={onLogout}
          onViewPricing={() => setShowPricing(true)}
        />
      </Animated.View>
    </View>
  );
}
