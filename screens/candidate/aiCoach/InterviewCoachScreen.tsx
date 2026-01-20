import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Animated,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import RayAvatar from '../../../assets/images/aiInterview/ray.svg';
import DotsDecoration from '../../../assets/images/aiInterview/dots.svg';
import DefaultAvatar from '../../../assets/images/default.svg';
import MicIconSvg from '../../../assets/images/aiInterview/mic.svg';
import ChatIconSvg from '../../../assets/images/aiInterview/chat.svg';
import PlayIconSvg from '../../../assets/images/aiInterview/play.svg';
import ChevronRightSvg from '../../../assets/images/aiInterview/chevron-right.svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';
import SearchModal from '../../../components/SearchModal';
import { useFeatureAccess } from '../../../contexts/FeatureGateContext';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useStartInterviewSessionMutation,
  useGetInterviewCoachSessionsQuery,
  useGetInterviewCoachStatsQuery,
  useGetMyProfileQuery,
} from '../../../services/api';

// Icon Components
const MicIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18V22M12 22H8M12 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChatIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlayIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 3L19 12L5 21V3Z" fill={color}/>
  </Svg>
);

const HistoryIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrophyIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 21H16M12 17V21M6 4H18V7C18 10.3137 15.3137 13 12 13C8.68629 13 6 10.3137 6 7V4ZM6 4H4C4 6.20914 5.79086 8 8 8M18 4H20C20 6.20914 18.2091 8 16 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChartIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3V21H21M18 17V10M13 17V7M8 17V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ size = 24, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LockIcon = ({ size = 24, color = "#6B7280" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BriefcaseIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ArrowRightIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export interface InterviewSessionData {
  sessionId: string;
  mode: string;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    questionCategory: string;
    difficulty: string;
    orderIndex: number;
    idealResponsePoints?: string[];
  }>;
  session: {
    id: string;
    totalQuestions: number;
    interviewType: string;
    jobRole: string;
    industry: string;
    difficulty: string;
    mode: string;
    status: string;
  };
}

interface InterviewCoachScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
  onStartSession?: (data: InterviewSessionData) => void;
  onViewSession?: (sessionId: string) => void;
  onAskRay?: () => void;
  onSearchNavigate?: (route: string) => void;
}

// Interview Type Card Component
interface InterviewTypeCardProps {
  type: { value: string; label: string; description: string };
  selected: boolean;
  onSelect: () => void;
}

// Interview Type Icons (dark outline style)
const BehavioralIcon = ({ size = 24, color = "#1F2937" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19.4003 18C19.7837 17.2499 20 16.4002 20 15.5C20 12.4624 17.5376 10 14.5 10C11.4624 10 9 12.4624 9 15.5C9 18.5376 11.4624 21 14.5 21L21 21C21 21 20 20 19.4143 18.0292M18.85 12C18.9484 11.5153 19 11.0137 19 10.5C19 6.35786 15.6421 3 11.5 3C7.35786 3 4 6.35786 4 10.5C4 11.3766 4.15039 12.2181 4.42676 13C5.50098 16.0117 3 18 3 18H9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TechnicalIcon = ({ size = 24, color = "#1F2937" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SituationalIcon = ({ size = 24, color = "#1F2937" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3V21H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18 17V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13 17V5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M8 17V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HRCulturalIcon = ({ size = 24, color = "#1F2937" }) => (
  <Svg width={size} height={size} viewBox="0 0 35 35" fill="none">
    <Path d="M17.5003 24.7917C12.2651 24.7917 8.02116 20.5477 8.02116 15.3125V6.64352C8.02116 5.88786 8.02116 5.51003 8.15779 5.21702C8.30269 4.90628 8.55244 4.65653 8.86317 4.51163C9.15619 4.375 9.53402 4.375 10.2897 4.375H24.711C25.4666 4.375 25.8445 4.375 26.1375 4.51163C26.4482 4.65653 26.698 4.90628 26.8429 5.21702C26.9795 5.51003 26.9795 5.88786 26.9795 6.64352V15.3125C26.9795 20.5477 22.7355 24.7917 17.5003 24.7917ZM17.5003 24.7917V30.625M24.792 30.625H10.2087M32.0837 7.29167V14.5833M2.91699 7.29167V14.5833" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MixedIcon = ({ size = 24, color = "#1F2937" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18V22M12 22H8M12 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const InterviewTypeCard: React.FC<InterviewTypeCardProps> = ({ type, selected, onSelect }) => {
  const getIcon = () => {
    const iconColor = selected ? "#FFF" : "#1F2937";
    switch (type.value) {
      case 'behavioral':
        return <BehavioralIcon size={24} color={iconColor} />;
      case 'technical':
        return <TechnicalIcon size={24} color={iconColor} />;
      case 'situational':
        return <SituationalIcon size={24} color={iconColor} />;
      case 'hr_cultural':
        return <HRCulturalIcon size={24} color={iconColor} />;
      case 'mixed':
        return <MixedIcon size={24} color={iconColor} />;
      default:
        return <BehavioralIcon size={24} color={iconColor} />;
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  if (selected) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1, marginBottom: 12 }
        ]}
      >
        <LinearGradient
          colors={['#6B8BF5', '#5B7EE5', '#4B6FD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.interviewTypeCardSelected}
        >
          <View style={styles.interviewTypeIconContainer}>
            {getIcon()}
          </View>
          <View style={styles.interviewTypeContent}>
            <Text style={styles.interviewTypeTextSelected}>{type.label}</Text>
            <Text style={styles.interviewTypeDescSelected}>{type.description}</Text>
          </View>
          <View style={styles.interviewTypeCheckmark}>
            <CheckIcon size={18} color="#FFF" />
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1, marginBottom: 12 }
      ]}
    >
      <View style={styles.interviewTypeCard}>
        <View style={[styles.interviewTypeIconContainer, { backgroundColor: 'transparent' }]}>
          {getIcon()}
        </View>
        <View style={styles.interviewTypeContent}>
          <Text style={styles.interviewTypeText}>{type.label}</Text>
          <Text style={styles.interviewTypeDesc}>{type.description}</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function InterviewCoachScreen({
  activeTab = 'aiCoach',
  onTabChange,
  onAIAssistantPress,
  onStartSession,
  onViewSession,
  onAskRay,
  onSearchNavigate,
}: InterviewCoachScreenProps) {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Feature access check
  const { hasAccess: hasInterviewAccess, requiredLevelDisplay } = useFeatureAccess('interview_coach_full');

  // Profile data for avatar
  const { data: profileData } = useGetMyProfileQuery();
  const profilePictureUrl = profileData?.myProfile?.profilePicture || null;

  // Navigation handlers
  const handleNotificationPress = useCallback(() => {
    router.push('/(candidate)/notifications' as any);
  }, [router]);

  const handleProfilePress = useCallback(() => {
    router.push('/(candidate)/(tabs)/profile' as any);
  }, [router]);

  // State
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedType, setSelectedType] = useState('behavioral');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice'>('text');
  const [jobRole, setJobRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);

  // Animation values
  const modeModalScale = useRef(new Animated.Value(0.9)).current;
  const modeModalOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  // API Hooks
  const [startSession, { isLoading: isStarting }] = useStartInterviewSessionMutation();
  const { data: sessionsData, isLoading: isLoadingSessions, refetch: refetchSessions } = useGetInterviewCoachSessionsQuery({ limit: 10 });
  const { data: statsData } = useGetInterviewCoachStatsQuery();

  const sessions = sessionsData?.interviewCoachSessions || [];
  const stats = statsData?.interviewCoachStats;

  // Entrance animations
  useEffect(() => {
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
  }, []);

  // Mode modal animation
  const showModeModalWithAnimation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModeModal(true);
    Animated.parallel([
      Animated.spring(modeModalScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(modeModalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(modeModalScale, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modeModalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModeModal(false);
      modeModalScale.setValue(0.9);
      modeModalOpacity.setValue(0);
    });
  };

  const handleModeSelect = (mode: 'text' | 'voice') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedMode(mode);
    hideModeModal();
    setTimeout(() => {
      setShowSetupModal(true);
    }, 200);
  };

  // Handle refresh with haptics
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetchSessions();
  };

  // Default interview types with labels and descriptions (always use these since backend doesn't have this feature yet)
  const interviewTypes = [
    { value: 'behavioral', label: 'Behavioral Interview', description: 'Questions about past experiences and behaviors' },
    { value: 'technical', label: 'Technical Interview', description: 'Role-specific technical knowledge questions' },
    { value: 'situational', label: 'Situational Interview', description: 'Hypothetical scenario-based questions' },
    { value: 'hr_cultural', label: 'HR & Cultural Fit', description: 'Questions about values, goals, and teamwork' },
    { value: 'mixed', label: 'Mixed Interview', description: 'Combination of all question types' },
  ];

  // Default difficulty levels (always use these since backend doesn't have this feature yet)
  const difficultyLevels = [
    { value: 'easy', label: 'Easy', description: 'Entry level questions' },
    { value: 'medium', label: 'Medium', description: 'Intermediate level questions' },
    { value: 'hard', label: 'Hard', description: 'Senior level questions' },
  ];

  const handleStartNewSession = async () => {
    if (!jobRole.trim()) {
      showAlert({
        type: 'warning',
        title: 'Job Role Required',
        message: 'Please enter the job role you want to practice for.',
      });
      return;
    }

    if (!industry.trim()) {
      showAlert({
        type: 'warning',
        title: 'Industry Required',
        message: 'Please enter your target industry.',
      });
      return;
    }

    try {
      const result = await startSession({
        interviewType: selectedType,
        jobRole: jobRole.trim(),
        industry: industry.trim(),
        difficulty: selectedDifficulty,
        numQuestions,
        mode: selectedMode,
      }).unwrap();

      console.log('StartSession Result:', JSON.stringify(result, null, 2));

      // Handle null response (backend not available)
      if (!result || !result.startInterviewSession) {
        console.log('No startInterviewSession in result');
        showAlert({
          type: 'error',
          title: 'Service Unavailable',
          message: 'Interview Coach is not available yet. Please try again later.',
        });
        return;
      }

      const response = result.startInterviewSession;

      if (response.__typename === 'InterviewCoachSessionSuccessType' && response.success && response.session) {
        setShowSetupModal(false);
        // Reset form
        setJobRole('');
        setIndustry('');
        setSelectedType('behavioral');
        setSelectedDifficulty('medium');
        setNumQuestions(5);

        showAlert({
          type: 'success',
          title: 'Session Started!',
          message: response.message || 'Your interview practice session is ready. Good luck!',
          buttons: [{
            text: 'Start Interview',
            onPress: () => {
              if (onStartSession && response.questions && response.session) {
                onStartSession({
                  sessionId: response.session.id,
                  mode: selectedMode,
                  questions: response.questions,
                  session: response.session,
                });
              }
            },
          }],
        });

        refetchSessions();
      } else {
        showAlert({
          type: 'error',
          title: 'Failed to Start Session',
          message: response.message || 'Something went wrong. Please try again.',
        });
      }
    } catch (error: any) {
      console.log('StartSession Error:', JSON.stringify(error, null, 2));
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.errors?.[0]?.message || error.message || 'Failed to start interview session.',
      });
    }
  };

  return (
    <>
    <CandidateLayout
      headerTitle="AI Career Coach"
      headerSubtitle="AI powered career companion"
      showGlassPill={true}
      onSearchPress={() => setShowSearchModal(true)}
      onNotificationPress={handleNotificationPress}
      onProfilePress={handleProfilePress}
      profilePictureUrl={profilePictureUrl}
    >
      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingSessions}
            onRefresh={handleRefresh}
            tintColor="#437EF4"
          />
        }
      >
        <Animated.View
          className="px-6 py-6"
          style={{
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
          }}
        >
          {/* Stats Cards */}
          {stats && (
            <View className="flex-row mb-6 -mx-1">
              <View className="flex-1 mx-1">
                <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-blue-50 rounded-lg p-2 mr-2">
                      <TrophyIcon size={20} color="#437EF4" />
                    </View>
                    <Text className="text-xs text-gray-500">Sessions</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">{stats.completedSessions}</Text>
                  <Text className="text-xs text-gray-400">of {stats.totalSessions} total</Text>
                </View>
              </View>
              <View className="flex-1 mx-1">
                <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-green-50 rounded-lg p-2 mr-2">
                      <ChartIcon size={20} color="#10B981" />
                    </View>
                    <Text className="text-xs text-gray-500">Avg Score</Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-900">
                    {stats.averageScore ? `${Math.round(stats.averageScore)}%` : '-'}
                  </Text>
                  <Text className="text-xs text-gray-400">{stats.totalQuestionsAnswered} questions</Text>
                </View>
              </View>
            </View>
          )}

          {/* Start New Session Card */}
          {hasInterviewAccess ? (
            <Pressable
              onPress={showModeModalWithAnimation}
              style={({ pressed }) => [
                styles.startPracticeCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <LinearGradient
                colors={['rgba(6, 182, 212, 0.9)', 'rgba(37, 99, 235, 0.8)', 'rgba(6, 182, 212, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0.16, 0.5, 1]}
                style={styles.startPracticeGradient}
              >
                <View style={styles.startPracticeContent}>
                  <View style={styles.startPracticeLeft}>
                    <View style={styles.startPracticeHeader}>
                      <PlayIconSvg width={28} height={28} />
                      <Text style={styles.startPracticeTitle}>Start New Practice</Text>
                    </View>
                    <Text style={styles.startPracticeDescription}>
                      Practice with AI Powered Interview Companion RAY
                    </Text>
                  </View>
                  <ChevronRightSvg width={24} height={24} />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                showAlert({
                  type: 'info',
                  title: 'Feature Locked',
                  message: `Unlock Interview Coach at ${requiredLevelDisplay || 'next'} Badge. Complete your profile to level up!`,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <View style={styles.startPracticeCardLocked}>
                <View style={styles.startPracticeContent}>
                  <View style={styles.startPracticeLeft}>
                    <View style={styles.startPracticeHeader}>
                      <View style={styles.lockedIconCircle}>
                        <LockIcon size={20} color="#9CA3AF" />
                      </View>
                      <Text style={styles.startPracticeTitleLocked}>Start New Practice</Text>
                    </View>
                    <Text style={styles.startPracticeDescriptionLocked}>
                      Unlock at {requiredLevelDisplay || 'next'} Badge
                    </Text>
                  </View>
                  <LockIcon size={24} color="#9CA3AF" />
                </View>
              </View>
            </Pressable>
          )}

          {/* Practice Modes */}
          <Text style={styles.recentSessionsTitle}>Practice Mode</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 24 }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (hasInterviewAccess) {
                  setSelectedMode('voice');
                  setShowSetupModal(true);
                } else {
                  showAlert({
                    type: 'info',
                    title: 'Feature Locked',
                    message: `Unlock Practice Modes at ${requiredLevelDisplay || 'next'} Badge. Complete your profile to level up!`,
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              }}
            >
              {({ pressed }) => (
                <View style={[styles.practiceModeCard, { transform: [{ scale: pressed ? 0.95 : 1 }], opacity: pressed ? 0.8 : 1 }]}>
                  <View style={styles.practiceModeIconContainer}>
                    <MicIconSvg width={56} height={56} />
                  </View>
                  <Text style={styles.practiceModeTitle}>Voice Mode</Text>
                  <Text style={styles.practiceModeDescription}>
                    Speak naturally and{'\n'}get audio feedback.
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (hasInterviewAccess) {
                  setSelectedMode('text');
                  setShowSetupModal(true);
                } else {
                  showAlert({
                    type: 'info',
                    title: 'Feature Locked',
                    message: `Unlock Practice Modes at ${requiredLevelDisplay || 'next'} Badge. Complete your profile to level up!`,
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              }}
            >
              {({ pressed }) => (
                <View style={[styles.practiceModeCard, { transform: [{ scale: pressed ? 0.95 : 1 }], opacity: pressed ? 0.8 : 1 }]}>
                  <View style={styles.practiceModeIconContainer}>
                    <ChatIconSvg width={56} height={56} />
                  </View>
                  <Text style={styles.practiceModeTitle}>Chat Mode</Text>
                  <Text style={styles.practiceModeDescription}>
                    Type your answers{'\n'}at your own pace.
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Ask Ray Card */}
          <Pressable
            style={styles.askRayContainer}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAskRay?.();
            }}
          >
            {({ pressed }) => (
              <View style={[styles.askRayRow, { opacity: pressed ? 0.9 : 1 }]}>
                {/* Ray Avatar - Outside the gradient */}
                <View style={styles.askRayAvatarCircle}>
                  <RayAvatar width={48} height={48} />
                </View>
                {/* Glass Card */}
                <View style={styles.askRayGlassCard}>
                  <BlurView
                    style={StyleSheet.absoluteFill}
                    blurType="light"
                    blurAmount={20}
                    reducedTransparencyFallbackColor="rgba(6, 182, 212, 0.5)"
                  />
                  <LinearGradient
                    colors={['rgba(6, 182, 212, 0.7)', 'rgba(37, 99, 235, 0.6)', 'rgba(6, 182, 212, 0.7)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    locations={[0.16, 0.5, 1]}
                    style={styles.askRayGradient}
                  >
                    <View style={styles.askRayContent}>
                      <View style={styles.askRayTextContainer}>
                        <Text style={styles.askRayTitle}>Ask Ray</Text>
                        <Text style={styles.askRaySubtitle}>Chat With AI Career Coach</Text>
                      </View>
                      <ArrowRightIcon size={24} color="rgba(255, 255, 255, 0.9)" />
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}
          </Pressable>

          {/* Recent Sessions */}
          <View style={styles.recentSessionsHeader}>
            <Text style={styles.recentSessionsTitle}>Recent Sessions</Text>
            <Pressable
              style={styles.viewAllButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              {({ pressed }) => (
                <Text style={[styles.viewAllText, { opacity: pressed ? 0.7 : 1 }]}>View All</Text>
              )}
            </Pressable>
          </View>

          {isLoadingSessions ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <ActivityIndicator size="large" color="#437EF4" />
            </View>
          ) : sessions.length === 0 ? (
            <View style={styles.sessionCard}>
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <View style={{ backgroundColor: '#F3F4F6', borderRadius: 24, padding: 16, marginBottom: 16 }}>
                  <HistoryIcon size={32} color="#9CA3AF" />
                </View>
                <Text style={styles.sessionTitle}>No Sessions Yet</Text>
                <Text style={[styles.sessionMeta, { textAlign: 'center' }]}>
                  Start your first practice session to see your history here
                </Text>
              </View>
            </View>
          ) : (
            sessions.slice(0, 5).map((session, index) => {
              const dotColors = ['#437EF4', '#F59E0B', '#F59E0B'];
              const dotColor = dotColors[index % dotColors.length];
              const statusText = session.status === 'completed' ? 'View' : 'Review';
              return (
                <Pressable
                  key={session.id}
                  onPress={() => onViewSession?.(session.id)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionCardContent}>
                      <View style={[styles.sessionDot, { backgroundColor: dotColor }]} />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{session.jobRole || 'Practice Session'}</Text>
                        <Text style={styles.sessionMeta}>
                          Difficulty: {session.difficulty} | Total: {session.totalQuestions || 0}
                        </Text>
                      </View>
                      <Pressable style={styles.sessionViewButton}>
                        <Text style={styles.sessionViewText}>{statusText}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* Mode Selection Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="none"
        onRequestClose={hideModeModal}
      >
        <BlurView
          intensity={40}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.modeModalOverlay}>
            <Animated.View
              style={[
                styles.modeModalContainer,
                {
                  opacity: modeModalOpacity,
                  transform: [{ scale: modeModalScale }],
                },
              ]}
            >
              {/* Close Button */}
              <Pressable
                onPress={hideModeModal}
                style={styles.modeModalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.modeModalCloseCircle}>
                  <CloseIcon size={16} color="#FFF" />
                </View>
              </Pressable>

              {/* Interview Coach Image */}
              <View style={styles.modeModalImageContainer}>
                <DotsDecoration width={200} height={200} style={styles.dotsDecoration} />
                <View style={styles.girlAvatarContainer}>
                  <RayAvatar width={150} height={150} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.modeModalTitle}>Choose Interview Mode</Text>

              {/* Mode Options */}
              <View style={styles.modeOptionsContainer}>
                {/* Voice Mode */}
                <Pressable
                  onPress={() => handleModeSelect('voice')}
                  style={({ pressed }) => [
                    styles.modeOptionCard,
                    pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
                  ]}
                >
                  <View style={styles.modeOptionIconContainer}>
                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="#437EF4"/>
                      <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke="#437EF4" strokeWidth="2" strokeLinecap="round"/>
                      <Path d="M12 18V22M12 22H8M12 22H16" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <Path d="M7 3L5 5M17 3L19 5" stroke="#437EF4" strokeWidth="1.5" strokeLinecap="round"/>
                    </Svg>
                  </View>
                  <Text style={styles.modeOptionTitle}>Voice Mode</Text>
                  <Text style={styles.modeOptionDescription}>
                    Speak naturally and{'\n'}get audio feedback.
                  </Text>
                </Pressable>

                {/* Chat Mode */}
                <Pressable
                  onPress={() => handleModeSelect('text')}
                  style={({ pressed }) => [
                    styles.modeOptionCard,
                    pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
                  ]}
                >
                  <View style={styles.modeOptionIconContainer}>
                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                      <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="#437EF4"/>
                      <Path d="M8 8L16 8M8 12H13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      <Path d="M6 2L4 4M18 2L20 4" stroke="#437EF4" strokeWidth="1.5" strokeLinecap="round"/>
                    </Svg>
                  </View>
                  <Text style={styles.modeOptionTitle}>Chat Mode</Text>
                  <Text style={styles.modeOptionDescription}>
                    Type your answers{'\n'}at your own pace.
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </BlurView>
      </Modal>

      {/* Session Setup Modal */}
      <Modal
        visible={showSetupModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSetupModal(false);
        }}
      >
        <View style={styles.setupModalContainer}>
          {/* Gradient Header */}
          <LinearGradient
            colors={['#8BB4F8', '#6B9CF4', '#4A7EF0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.setupModalHeader, { paddingTop: insets.top + 12 }]}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSetupModal(false);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                styles.setupBackButton,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }
              ]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </Pressable>
            <View style={styles.setupHeaderContent}>
              <Text style={styles.setupHeaderTitle}>New Practice Session</Text>
              <Text style={styles.setupHeaderSubtitle}>Your AI-powered career snapshot is ready.</Text>
            </View>
            {/* Header Right - Glass Pill (matching CandidateLayout style) */}
            <View style={styles.headerGlassPill}>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSetupModal(false);
                  setShowSearchModal(true);
                }}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </Pressable>
              <Pressable
                style={styles.headerIconButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSetupModal(false);
                  handleNotificationPress();
                }}
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </Pressable>
              <Pressable
                style={styles.headerAvatar}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSetupModal(false);
                  handleProfilePress();
                }}
              >
                {profilePictureUrl ? (
                  <Image
                    source={{ uri: profilePictureUrl }}
                    style={{ width: 36, height: 36, borderRadius: 18 }}
                    resizeMode="cover"
                  />
                ) : (
                  <DefaultAvatar width={36} height={36} />
                )}
              </Pressable>
            </View>
          </LinearGradient>

          <KeyboardDismissWrapper>
            <ScrollView
              style={styles.setupScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
              onScrollBeginDrag={() => Haptics.selectionAsync()}
            >
              {/* Glass Card - Mode & Inputs */}
              <View style={styles.glassCard}>
                <Text style={styles.glassCardTitle}>
                  {selectedMode === 'voice' ? 'Voice Mode' : 'Text Mode'} / {selectedMode === 'voice' ? 'Text Mode' : 'Voice Mode'}
                </Text>

                {/* Job Role Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Job Role *</Text>
                  <TextInput
                    style={styles.glassInput}
                    placeholder="E.g., Software Eng, Product manager"
                    placeholderTextColor="#9CA3AF"
                    value={jobRole}
                    onChangeText={setJobRole}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                </View>

                {/* Industry Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Industry *</Text>
                  <TextInput
                    style={styles.glassInput}
                    placeholder="e.g., School, Hospitality"
                    placeholderTextColor="#9CA3AF"
                    value={industry}
                    onChangeText={setIndustry}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                </View>
              </View>

              {/* Interview Type Selection */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Interview Type</Text>
                {interviewTypes.map((type) => (
                  <InterviewTypeCard
                    key={type.value}
                    type={type}
                    selected={selectedType === type.value}
                    onSelect={() => setSelectedType(type.value)}
                  />
                ))}
              </View>

              {/* Difficulty Level */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Difficulty Level</Text>
                <View style={styles.pillsContainer}>
                  {difficultyLevels.map((level) => (
                    <Pressable
                      key={level.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDifficulty(level.value);
                      }}
                      style={({ pressed }) => [
                        { transform: [{ scale: pressed ? 0.95 : 1 }] }
                      ]}
                    >
                      <View
                        style={[
                          styles.glassPill,
                          selectedDifficulty === level.value && styles.glassPillSelected
                        ]}
                      >
                        <Text style={[
                          styles.glassPillText,
                          selectedDifficulty === level.value && styles.glassPillTextSelected
                        ]}>
                          {level.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Number of Questions */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Number of Questions</Text>
                <View style={styles.pillsContainer}>
                  {[5, 10, 15, 20].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNumQuestions(num);
                      }}
                      style={({ pressed }) => [
                        { transform: [{ scale: pressed ? 0.95 : 1 }] }
                      ]}
                    >
                      <View
                        style={[
                          styles.glassPillSmall,
                          numQuestions === num && styles.glassPillSelected
                        ]}
                      >
                        <Text style={[
                          styles.glassPillText,
                          numQuestions === num && styles.glassPillTextSelected
                        ]}>
                          {num}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
          </KeyboardDismissWrapper>

          {/* Fixed Start Button */}
          <View style={[styles.startButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleStartNewSession();
              }}
              disabled={isStarting}
              style={({ pressed }) => [
                {
                  opacity: isStarting ? 0.6 : pressed ? 0.9 : 1,
                  transform: [{ scale: pressed && !isStarting ? 0.98 : 1 }],
                }
              ]}
            >
              <LinearGradient
                colors={isStarting ? ['#9CA3AF', '#9CA3AF'] : ['#6B8BF5', '#4A6FD5', '#3A5FC5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButton}
              >
                {isStarting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={styles.startButtonContent}>
                    <PlayIcon size={20} color="#FFF" />
                    <Text style={styles.startButtonText}>Start Practice Session</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav Bar */}
      <CandidateNavBar
        activeTab={activeTab}
        onTabPress={onTabChange}
        onAIAssistantPress={onAIAssistantPress}
      />
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

const styles = StyleSheet.create({
  modeModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modeModalContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    paddingTop: 40,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  modeModalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modeModalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeModalImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotsDecoration: {
    position: 'absolute',
  },
  girlAvatarContainer: {
    position: 'absolute',
  },
  modeModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  modeOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modeOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modeOptionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  modeOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Start New Practice Card Styles
  startPracticeCard: {
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: 'rgba(6, 182, 212, 1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  startPracticeGradient: {
    borderRadius: 12,
    padding: 15,
  },
  startPracticeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startPracticeLeft: {
    flex: 1,
    gap: 15,
  },
  startPracticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  startPracticeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },
  startPracticeDescription: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 24,
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },
  startPracticeCardLocked: {
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 15,
  },
  startPracticeTitleLocked: {
    fontSize: 24,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  startPracticeDescriptionLocked: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 24,
  },
  lockedIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Practice Mode Cards
  practiceModeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  practiceModeIconContainer: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  practiceModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  practiceModeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Ask Ray Card Styles
  askRayContainer: {
    marginBottom: 24,
  },
  askRayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  askRayAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  askRayGlassCard: {
    flex: 1,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: 'rgba(6, 182, 212, 1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  askRayGradient: {
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  askRayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  askRayTextContainer: {
    flex: 1,
  },
  askRayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  askRaySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  // Recent Sessions
  recentSessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentSessionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#437EF4',
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  sessionViewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sessionViewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#437EF4',
  },
  // Setup Modal Styles
  setupModalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  setupModalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setupBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },
  setupHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  setupHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  setupScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Glass Card Styles
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  glassCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  glassInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Section Styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Interview Type Card Styles
  interviewTypeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  interviewTypeCardSelected: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#437EF4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  interviewTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interviewTypeContent: {
    flex: 1,
    marginLeft: 14,
  },
  interviewTypeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  interviewTypeTextSelected: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  interviewTypeDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  interviewTypeDescSelected: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  interviewTypeCheckmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pills Styles
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  glassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  glassPillSmall: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  glassPillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#437EF4',
    borderWidth: 2,
  },
  glassPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  glassPillTextSelected: {
    color: '#437EF4',
  },
  // Start Button Styles
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.95)',
  },
  startButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#437EF4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
