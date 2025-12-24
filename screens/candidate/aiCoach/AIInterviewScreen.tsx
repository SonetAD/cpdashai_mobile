import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Svg, { Path, Circle } from 'react-native-svg';

// Icon Components
const MicIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18V22M12 22H8M12 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MicOffIcon = ({ size = 24, color = "#9CA3AF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 9.34V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 14C13.66 14 15 12.66 15 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18V22M12 22H8M12 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M2 2L22 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const ArrowBackIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CloseIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckmarkCircleIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={color} opacity="0.2"/>
    <Path d="M7 13L10 16L17 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const VolumeHighIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChatBubbleIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const AnalyticsIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3V21H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18 17V10M13 17V7M8 17V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TimeIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const BulbIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 11.0769 7.08773 12.8876 8.71929 14C9.30343 14.4362 9.78139 15.0281 10 15.75V18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18V15.75C14.2186 15.0281 14.6966 14.4362 15.2807 14C16.9123 12.8876 18 11.0769 18 9C18 5.68629 15.3137 3 12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const InfoCircleIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M12 16V12M12 8H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

interface AIInterviewScreenProps {
  navigation?: any;
}

interface Question {
  id: number;
  text: string;
  category: string;
}

interface Answer {
  questionId: number;
  transcript: string;
  duration: number;
}

interface InterviewResults {
  confidenceLevel: number;
  correctAnswers: number;
  totalQuestions: number;
  avgResponseTime: number;
  fluencyScore: number;
  professionalismScore: number;
}

// Dummy questions for now
const DUMMY_QUESTIONS: Question[] = [
  { id: 1, text: 'Tell me about yourself and your professional background.', category: 'Introduction' },
  { id: 2, text: 'What are your greatest strengths and how do they apply to this role?', category: 'Strengths' },
  { id: 3, text: 'Describe a challenging situation you faced at work and how you resolved it.', category: 'Problem Solving' },
  { id: 4, text: 'Why are you interested in this position and our company?', category: 'Motivation' },
  { id: 5, text: 'Where do you see yourself in five years?', category: 'Career Goals' },
];

export default function AIInterviewScreen({ navigation }: AIInterviewScreenProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [results, setResults] = useState<InterviewResults | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    requestPermissions();
    return () => {
      stopRecording();
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSpeaking]);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required for the AI interview feature.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request audio permissions.');
    }
  };

  const speakQuestion = async (questionText: string) => {
    setIsSpeaking(true);
    
    return new Promise<void>((resolve) => {
      Speech.speak(questionText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: () => {
          setIsSpeaking(false);
          resolve();
        },
      });
    });
  };

  const startInterview = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Please grant audio permission to start the interview.');
      await requestPermissions();
      return;
    }

    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    
    // Small delay before starting
    setTimeout(() => {
      askNextQuestion();
    }, 1000);
  };

  const askNextQuestion = async () => {
    if (currentQuestionIndex >= DUMMY_QUESTIONS.length) {
      completeInterview();
      return;
    }

    const question = DUMMY_QUESTIONS[currentQuestionIndex];
    await speakQuestion(question.text);
    
    // Auto start recording after question is spoken
    setTimeout(() => {
      startRecording();
    }, 500);
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Save answer (using dummy transcript for now)
      const newAnswer: Answer = {
        questionId: DUMMY_QUESTIONS[currentQuestionIndex].id,
        transcript: `Sample answer for question ${currentQuestionIndex + 1}`,
        duration: recordingTime,
      };
      
      setAnswers([...answers, newAnswer]);
      setRecording(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleNextQuestion = async () => {
    await stopRecording();
    
    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    if (nextIndex < DUMMY_QUESTIONS.length) {
      // Small delay before next question
      setTimeout(() => {
        askNextQuestion();
      }, 1500);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    await stopRecording();
    Speech.stop();
    
    // Calculate results (dummy values for now)
    const calculatedResults: InterviewResults = {
      confidenceLevel: Math.floor(Math.random() * 30) + 70, // 70-100
      correctAnswers: Math.floor(Math.random() * 2) + 4, // 4-5
      totalQuestions: DUMMY_QUESTIONS.length,
      avgResponseTime: Math.floor(Math.random() * 20) + 40, // 40-60 seconds
      fluencyScore: Math.floor(Math.random() * 20) + 75, // 75-95
      professionalismScore: Math.floor(Math.random() * 20) + 80, // 80-100
    };
    
    setResults(calculatedResults);
    setInterviewCompleted(true);
    setInterviewStarted(false);
  };

  const restartInterview = () => {
    setInterviewCompleted(false);
    setInterviewStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResults(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permissionGranted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <MicOffIcon size={80} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-900 mt-6 text-center">
            Audio Permission Required
          </Text>
          <Text className="text-gray-600 text-center mt-3 mb-6">
            To use the AI Interview feature, we need access to your microphone to record your answers.
          </Text>
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-4 px-8"
            onPress={requestPermissions}
          >
            <Text className="text-white font-semibold">Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (interviewCompleted && results) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#437EF4', '#437EF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation?.goBack()} className="mr-4">
              <ArrowBackIcon size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Interview Results</Text>
              <Text className="text-white/90 text-xs mt-0.5">
                Your performance analysis
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Success Icon */}
          <View className="items-center mt-8 mb-6">
            <View className="bg-green-100 rounded-full p-6 mb-4">
              <CheckmarkCircleIcon size={80} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">Interview Completed!</Text>
            <Text className="text-gray-600 text-center mt-2">
              Great job! Here's your performance summary
            </Text>
          </View>

          {/* Main Score Card */}
          <View className="bg-white rounded-2xl p-6 mb-4 border border-blue-100 shadow-sm">
            <View className="items-center pb-4 border-b border-gray-100">
              <Text className="text-gray-600 text-sm mb-2">Overall Confidence Level</Text>
              <Text className="text-5xl font-bold text-primary-blue">{results.confidenceLevel}%</Text>
            </View>
            
            <View className="flex-row justify-between mt-4">
              <View className="items-center flex-1">
                <Text className="text-gray-600 text-xs mb-1">Questions</Text>
                <Text className="text-2xl font-bold text-gray-900">{results.totalQuestions}</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-gray-600 text-xs mb-1">Correct</Text>
                <Text className="text-2xl font-bold text-green-600">{results.correctAnswers}</Text>
              </View>
            </View>
          </View>

          {/* Performance Metrics */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</Text>
            
            {/* Fluency Score */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Fluency Score</Text>
                <Text className="text-gray-900 font-bold">{results.fluencyScore}%</Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${results.fluencyScore}%` }}
                />
              </View>
            </View>

            {/* Professionalism */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Professionalism</Text>
                <Text className="text-gray-900 font-bold">{results.professionalismScore}%</Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="bg-green-500 h-full rounded-full"
                  style={{ width: `${results.professionalismScore}%` }}
                />
              </View>
            </View>

            {/* Average Response Time */}
            <View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Avg. Response Time</Text>
                <Text className="text-gray-900 font-bold">{results.avgResponseTime}s</Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="bg-purple-500 h-full rounded-full"
                  style={{ width: `${Math.min((results.avgResponseTime / 60) * 100, 100)}%` }}
                />
              </View>
            </View>
          </View>

          {/* Key Insights */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Key Insights</Text>
            
            <View className="flex-row items-start mb-3">
              <CheckmarkCircleIcon size={20} color="#10B981" />
              <Text className="flex-1 text-gray-700 ml-2">
                Strong confidence level indicates good interview presence
              </Text>
            </View>
            
            <View className="flex-row items-start mb-3">
              <CheckmarkCircleIcon size={20} color="#10B981" />
              <Text className="flex-1 text-gray-700 ml-2">
                Good fluency and professional communication style
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <InfoCircleIcon size={20} color="#F59E0B" />
              <Text className="flex-1 text-gray-700 ml-2">
                Consider being more concise in your responses for better impact
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-4 items-center mb-4"
            onPress={restartInterview}
          >
            <Text className="text-white text-base font-semibold">Try Another Interview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white border-2 border-primary-blue rounded-xl py-4 items-center mb-8"
            onPress={() => navigation?.goBack()}
          >
            <Text className="text-primary-blue text-base font-semibold">Back to AI Coach</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (interviewStarted) {
    const currentQuestion = DUMMY_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / DUMMY_QUESTIONS.length) * 100;

    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#437EF4', '#437EF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Exit Interview?',
                'Are you sure you want to exit? Your progress will be lost.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Exit',
                    style: 'destructive',
                    onPress: () => {
                      stopRecording();
                      Speech.stop();
                      navigation?.goBack();
                    },
                  },
                ]
              );
            }}>
              <CloseIcon size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-semibold">
              Question {currentQuestionIndex + 1} of {DUMMY_QUESTIONS.length}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress Bar */}
          <View className="bg-white/30 rounded-full h-2 overflow-hidden">
            <View
              className="bg-white h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-8">
            {/* Category Badge */}
            <View className="self-start bg-blue-100 px-4 py-2 rounded-full mb-4">
              <Text className="text-primary-blue font-semibold text-xs">
                {currentQuestion.category}
              </Text>
            </View>

            {/* Question Card */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 shadow-sm">
              <View className="flex-row items-start mb-4">
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  {isSpeaking ? (
                    <VolumeHighIcon size={32} color="#437EF4" />
                  ) : (
                    <ChatBubbleIcon size={32} color="#437EF4" />
                  )}
                </Animated.View>
                <View className="flex-1 ml-4">
                  <Text className="text-xs text-gray-500 mb-1">
                    {isSpeaking ? 'Speaking...' : 'Interview Question'}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-900 text-lg font-medium leading-7">
                {currentQuestion.text}
              </Text>
            </View>

            {/* Recording Status */}
            <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
              <View className="items-center">
                {isRecording ? (
                  <>
                    <View className="bg-red-500 rounded-full p-6 mb-4">
                      <MicIcon size={48} color="white" />
                    </View>
                    <Text className="text-xl font-bold text-gray-900 mb-2">Recording...</Text>
                    <Text className="text-3xl font-bold text-red-500 mb-4">
                      {formatTime(recordingTime)}
                    </Text>
                    <Text className="text-gray-600 text-center text-sm">
                      Speak clearly and take your time to answer
                    </Text>
                  </>
                ) : (
                  <>
                    <View className="bg-gray-200 rounded-full p-6 mb-4">
                      <MicOffIcon size={48} color="#9CA3AF" />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900">
                      {isSpeaking ? 'Listen to the question...' : 'Waiting to record...'}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Next Button */}
            {isRecording && (
              <TouchableOpacity
                className="bg-primary-blue rounded-xl py-4 items-center"
                onPress={handleNextQuestion}
              >
                <Text className="text-white text-base font-semibold">
                  {currentQuestionIndex === DUMMY_QUESTIONS.length - 1
                    ? 'Finish Interview'
                    : 'Next Question'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Welcome Screen
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation?.goBack()} className="mr-4">
            <ArrowBackIcon size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">AI Interview Practice</Text>
            <Text className="text-white/90 text-xs mt-0.5">
              Practice with voice-based AI interviews
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="items-center mt-8 mb-6">
          <View className="bg-blue-100 rounded-full p-8 mb-4">
            <MicIcon size={80} color="#437EF4" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Ready for Your Interview?
          </Text>
          <Text className="text-gray-600 text-center">
            Practice with AI-powered voice interviews to boost your confidence
          </Text>
        </View>

        {/* Features */}
        <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">What to Expect</Text>
          
          <View className="flex-row items-start mb-4">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <VolumeHighIcon size={20} color="#437EF4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">Voice Questions</Text>
              <Text className="text-gray-600 text-sm">
                AI will speak each question aloud for a realistic experience
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <MicIcon size={20} color="#437EF4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">Voice Answers</Text>
              <Text className="text-gray-600 text-sm">
                Record your answers naturally as you would in a real interview
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-4">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <AnalyticsIcon size={20} color="#437EF4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">AI Analysis</Text>
              <Text className="text-gray-600 text-sm">
                Get detailed feedback on your performance and confidence level
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="bg-blue-100 rounded-full p-2 mr-3">
              <TimeIcon size={20} color="#437EF4" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 mb-1">
                {DUMMY_QUESTIONS.length} Questions
              </Text>
              <Text className="text-gray-600 text-sm">
                About 10-15 minutes to complete the full interview
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-200">
          <View className="flex-row items-center mb-3">
            <BulbIcon size={24} color="#F59E0B" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Pro Tips</Text>
          </View>
          <Text className="text-gray-700 text-sm mb-2">
            • Find a quiet space with minimal background noise
          </Text>
          <Text className="text-gray-700 text-sm mb-2">
            • Speak clearly and at a natural pace
          </Text>
          <Text className="text-gray-700 text-sm">
            • Take your time to think before answering
          </Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          className="bg-primary-blue rounded-xl py-4 items-center mb-8"
          onPress={startInterview}
        >
          <Text className="text-white text-base font-semibold">Start Interview</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
