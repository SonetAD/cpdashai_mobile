import React, { useState, useRef, useEffect } from 'react';
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
import LogoWhite from '../../../assets/images/logoWhite.svg';
import GirlAvatar from '../../../assets/images/aiInterview/girl.svg';
import DotsDecoration from '../../../assets/images/aiInterview/dots.svg';
import CandidateNavBar from '../../../components/CandidateNavBar';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useStartInterviewSessionMutation,
  useGetInterviewCoachSessionsQuery,
  useGetInterviewCoachStatsQuery,
  InterviewCoachSession,
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
  onAskClara?: () => void;
  onAskRay?: () => void;
}

// Interview Type Card Component
interface InterviewTypeCardProps {
  type: { value: string; label: string; description: string };
  selected: boolean;
  onSelect: () => void;
}

const InterviewTypeCard: React.FC<InterviewTypeCardProps> = ({ type, selected, onSelect }) => {
  const getIcon = () => {
    switch (type.value) {
      case 'behavioral':
        return <ChatIcon size={28} color={selected ? "#FFF" : "#437EF4"} />;
      case 'technical':
        return <BriefcaseIcon size={28} color={selected ? "#FFF" : "#437EF4"} />;
      case 'situational':
        return <ChartIcon size={28} color={selected ? "#FFF" : "#10B981"} />;
      case 'hr_cultural':
        return <TrophyIcon size={28} color={selected ? "#FFF" : "#F59E0B"} />;
      default:
        return <MicIcon size={28} color={selected ? "#FFF" : "#437EF4"} />;
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <View
        className={`p-4 rounded-2xl border-2 mb-3 ${
          selected
            ? 'border-primary-blue bg-primary-blue'
            : 'border-gray-200 bg-white'
        }`}
      >
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-xl items-center justify-center ${
            selected ? 'bg-white/20' : 'bg-blue-50'
          }`}>
            {getIcon()}
          </View>
          <View className="flex-1 ml-4">
            <Text className={`text-base font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>
              {type.label}
            </Text>
            <Text className={`text-xs mt-1 ${selected ? 'text-white/80' : 'text-gray-500'}`}>
              {type.description}
            </Text>
          </View>
          {selected && (
            <View className="bg-white rounded-full p-1">
              <CheckIcon size={20} color="#437EF4" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// Session History Card Component
interface SessionCardProps {
  session: InterviewCoachSession;
  onPress: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onPress }) => {
  const getStatusColor = () => {
    switch (session.status) {
      case 'completed':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'abandoned':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getStatusColor() }} />
            <Text className="text-xs font-semibold capitalize" style={{ color: getStatusColor() }}>
              {session.status.replace('_', ' ')}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">{formatDate(session.createdAt)}</Text>
        </View>

        <Text className="text-base font-bold text-gray-900 mb-1 capitalize">
          {session.interviewType.replace('_', ' ')} Interview
        </Text>
        <Text className="text-sm text-gray-600 mb-2">{session.jobRole}</Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500">
              {session.totalQuestions} Questions
            </Text>
          </View>
          {session.overallScore !== null && session.overallScore !== undefined && (
            <View className="bg-blue-50 px-3 py-1 rounded-full">
              <Text className="text-primary-blue text-xs font-bold">
                Score: {Math.round(session.overallScore)}%
              </Text>
            </View>
          )}
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
  onAskClara,
  onAskRay,
}: InterviewCoachScreenProps) {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  // State
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
  const headerFade = useRef(new Animated.Value(0)).current;
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
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

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
    }, 150);
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <Animated.View style={{ opacity: headerFade }}>
        <LinearGradient
          colors={['#437EF4', '#437EF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center">
            <LogoWhite width={39} height={33} />
            <View className="flex-1 ml-4">
              <Text className="text-white text-lg font-bold">AI Career Coach</Text>
              <Text className="text-white/90 text-xs mt-0.5">
                AI powered career companion with chat, interview and more
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
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
          <Pressable
            onPress={showModeModalWithAnimation}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <LinearGradient
              colors={['#437EF4', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-6 mb-6"
            >
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-2xl p-4">
                  <PlayIcon size={32} color="#FFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold">Start New Practice</Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Practice with AI Powered Interview Companion Ray
                  </Text>
                </View>
                <ArrowRightIcon size={24} color="#FFF" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Practice Modes */}
          <Text className="text-lg font-bold text-gray-900 mb-4">Practice Modes</Text>
          <View className="flex-row mb-3 -mx-1">
            <Pressable
              className="flex-1 mx-1"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedMode('text');
                setShowSetupModal(true);
              }}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }], opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                  <ChatIcon size={28} color="#437EF4" />
                </View>
                <Text className="text-base font-bold text-gray-900">Text Mode</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">
                  Type your answers
                </Text>
              </View>
            </Pressable>
            <Pressable
              className="flex-1 mx-1"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedMode('voice');
                setShowSetupModal(true);
              }}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.95 : 1 }], opacity: pressed ? 0.8 : 1 }
              ]}
            >
              <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
                <View className="bg-purple-50 rounded-xl p-3 mb-3">
                  <MicIcon size={28} color="#8B5CF6" />
                </View>
                <Text className="text-base font-bold text-gray-900">Voice Mode</Text>
                <Text className="text-xs text-gray-500 text-center mt-1">
                  Speak your answers
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Ask Ray Button */}
          <Pressable
            className="mb-6"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAskRay?.();
            }}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.98 : 1 }], opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-row items-center">
              <View className="rounded-full w-14 h-14 items-center justify-center overflow-hidden">
                <Image
                  source={require('../../../assets/images/aiInterview/ray.jpg')}
                  style={{ width: 56, height: 56 }}
                  resizeMode="cover"
                />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-base font-bold text-gray-900">Ask Ray</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Chat with your AI career coach
                </Text>
              </View>
              <ArrowRightIcon size={20} color="#437EF4" />
            </View>
          </Pressable>

          {/* Recent Sessions */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Recent Sessions</Text>
            <Pressable
              className="flex-row items-center"
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <HistoryIcon size={18} color="#437EF4" />
              <Text className="text-primary-blue text-sm font-semibold ml-1">View All</Text>
            </Pressable>
          </View>

          {isLoadingSessions ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#437EF4" />
            </View>
          ) : sessions.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 border border-gray-100 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <HistoryIcon size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 font-bold text-base mb-1">No Sessions Yet</Text>
              <Text className="text-gray-500 text-sm text-center">
                Start your first practice session to see your history here
              </Text>
            </View>
          ) : (
            sessions.slice(0, 5).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => onViewSession?.(session.id)}
              />
            ))
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
                  <GirlAvatar width={150} height={150} />
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
        presentationStyle="pageSheet"
        onRequestClose={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSetupModal(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <View>
              <Text className="text-xl font-bold text-gray-900">New Practice Session</Text>
              <Text className="text-sm text-gray-500 mt-1">
                {selectedMode === 'voice' ? '🎤 Voice Mode' : '💬 Text Mode'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSetupModal(false);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }
              ]}
              className="bg-gray-100 rounded-full p-2"
            >
              <CloseIcon size={24} />
            </Pressable>
          </View>

          <KeyboardDismissWrapper>
            <ScrollView
              className="flex-1 px-6 py-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              onScrollBeginDrag={() => Haptics.selectionAsync()}
            >
              {/* Job Role Input */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Job Role *</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
                  placeholder="e.g., Software Engineer, Product Manager"
                  placeholderTextColor="#9CA3AF"
                  value={jobRole}
                  onChangeText={setJobRole}
                  onFocus={() => Haptics.selectionAsync()}
                />
              </View>

              {/* Industry Input */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Industry *</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
                  placeholder="e.g., Technology, Finance, Healthcare"
                  placeholderTextColor="#9CA3AF"
                  value={industry}
                  onChangeText={setIndustry}
                  onFocus={() => Haptics.selectionAsync()}
                />
              </View>

              {/* Interview Type Selection */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Interview Type</Text>
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
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Difficulty Level</Text>
                <View className="flex-row -mx-1">
                  {difficultyLevels.map((level) => (
                    <Pressable
                      key={level.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDifficulty(level.value);
                      }}
                      style={({ pressed }) => [
                        { flex: 1, marginHorizontal: 4, transform: [{ scale: pressed ? 0.95 : 1 }] }
                      ]}
                    >
                      <View
                        className={`py-3 rounded-xl border-2 items-center ${
                          selectedDifficulty === level.value
                            ? 'border-primary-blue bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text className={`font-semibold ${
                          selectedDifficulty === level.value ? 'text-primary-blue' : 'text-gray-600'
                        }`}>
                          {level.label}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Number of Questions */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                  Number of Questions: {numQuestions}
                </Text>
                <View className="flex-row items-center -mx-1">
                  {[5, 10, 15, 20].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNumQuestions(num);
                      }}
                      style={({ pressed }) => [
                        { flex: 1, marginHorizontal: 4, transform: [{ scale: pressed ? 0.95 : 1 }] }
                      ]}
                    >
                      <View
                        className={`py-3 rounded-xl border-2 items-center ${
                          numQuestions === num
                            ? 'border-primary-blue bg-blue-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text className={`font-semibold ${
                          numQuestions === num ? 'text-primary-blue' : 'text-gray-600'
                        }`}>
                          {num}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Start Button */}
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
                <View
                  className={`rounded-2xl py-4 items-center ${
                    isStarting ? 'bg-gray-300' : 'bg-primary-blue'
                  }`}
                >
                  {isStarting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View className="flex-row items-center">
                      <PlayIcon size={20} color="#FFF" />
                      <Text className="text-white text-base font-bold ml-2">
                        Start Practice Session
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </ScrollView>
          </KeyboardDismissWrapper>
        </SafeAreaView>
      </Modal>

      {/* Bottom Nav Bar */}
      <CandidateNavBar
        activeTab={activeTab}
        onTabPress={onTabChange}
        onAIAssistantPress={onAIAssistantPress}
      />
    </SafeAreaView>
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
});
