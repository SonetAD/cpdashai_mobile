import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { speakWithElevenLabs, stopSpeaking } from '../../../services/elevenLabsTTS';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useSubmitTextResponseMutation,
  useSubmitVoiceResponseMutation,
  useCompleteInterviewSessionMutation,
  useAbandonInterviewSessionMutation,
  useGetInterviewCoachSessionQuery,
  InterviewCoachQuestion,
  InterviewCoachAnalysis,
  InterviewCoachVoiceMetrics,
} from '../../../services/api';

// Icon Components
const MicIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 18V22M12 22H8M12 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const StopIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 6H18V18H6V6Z" fill={color}/>
  </Svg>
);

const CloseIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SendIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ArrowRightIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckCircleIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const StarIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LightbulbIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 11.0769 7.08773 12.8876 8.71929 14C9.30343 14.4362 9.78139 15.0281 10 15.75V18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18V15.75C14.2186 15.0281 14.6966 14.4362 15.2807 14C16.9123 12.8876 18 11.0769 18 9C18 5.68629 15.3137 3 12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SpeakerIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 5L6 9H2V15H6L11 19V5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

interface SessionQuestion {
  id: string;
  questionText: string;
  questionType: string;
  questionCategory: string;
  difficulty: string;
  orderIndex: number;
  idealResponsePoints?: string[];
}

interface SessionData {
  id: string;
  totalQuestions: number;
  interviewType: string;
  jobRole: string;
  industry: string;
  difficulty: string;
  mode: string;
  status: string;
}

interface ActiveInterviewSessionScreenProps {
  sessionId: string;
  mode: 'text' | 'voice';
  onComplete: (sessionId: string) => void;
  onExit: () => void;
  initialQuestions?: SessionQuestion[];
  initialSession?: SessionData;
}

// Feedback Modal Component
interface FeedbackModalProps {
  visible: boolean;
  analysis: InterviewCoachAnalysis | null;
  voiceMetrics: InterviewCoachVoiceMetrics | null;
  onClose: () => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  analysis,
  voiceMetrics,
  onClose,
  onNextQuestion,
  isLastQuestion,
}) => {
  if (!analysis) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60">
        <SafeAreaView className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="px-6 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Response Analysis</Text>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* Score Cards */}
              <View className="flex-row flex-wrap -mx-1 mb-6">
                <View className="w-1/2 px-1 mb-2">
                  <View className="bg-gray-50 rounded-xl p-3 items-center">
                    <Text className="text-xs text-gray-500 mb-1">Content</Text>
                    <Text className="text-2xl font-bold" style={{ color: getScoreColor(analysis.contentScore) }}>
                      {Math.round(analysis.contentScore)}%
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 px-1 mb-2">
                  <View className="bg-gray-50 rounded-xl p-3 items-center">
                    <Text className="text-xs text-gray-500 mb-1">Clarity</Text>
                    <Text className="text-2xl font-bold" style={{ color: getScoreColor(analysis.clarityScore) }}>
                      {Math.round(analysis.clarityScore)}%
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 px-1 mb-2">
                  <View className="bg-gray-50 rounded-xl p-3 items-center">
                    <Text className="text-xs text-gray-500 mb-1">Relevance</Text>
                    <Text className="text-2xl font-bold" style={{ color: getScoreColor(analysis.relevanceScore) }}>
                      {Math.round(analysis.relevanceScore)}%
                    </Text>
                  </View>
                </View>
                <View className="w-1/2 px-1 mb-2">
                  <View className="bg-gray-50 rounded-xl p-3 items-center">
                    <Text className="text-xs text-gray-500 mb-1">Specificity</Text>
                    <Text className="text-2xl font-bold" style={{ color: getScoreColor(analysis.specificityScore) }}>
                      {Math.round(analysis.specificityScore)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* STAR Method Score */}
              {analysis.starMethodScore !== undefined && analysis.starMethodScore !== null && (
                <View className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
                  <View className="flex-row items-center mb-2">
                    <StarIcon size={20} color="#F59E0B" />
                    <Text className="text-amber-800 font-bold ml-2">STAR Method Score</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="flex-1 bg-amber-200 rounded-full h-3 overflow-hidden">
                      <View
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${analysis.starMethodScore}%` }}
                      />
                    </View>
                    <Text className="text-amber-800 font-bold ml-3">{Math.round(analysis.starMethodScore)}%</Text>
                  </View>
                </View>
              )}

              {/* Voice Metrics */}
              {voiceMetrics && (
                <View className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                  <Text className="text-purple-800 font-bold mb-3">Voice Analysis</Text>
                  <View className="flex-row flex-wrap">
                    <View className="w-1/2 mb-2">
                      <Text className="text-purple-600 text-xs">Speaking Pace</Text>
                      <Text className="text-purple-900 font-semibold">{voiceMetrics.speakingPaceWpm} WPM</Text>
                    </View>
                    <View className="w-1/2 mb-2">
                      <Text className="text-purple-600 text-xs">Confidence</Text>
                      <Text className="text-purple-900 font-semibold">{Math.round(voiceMetrics.voiceConfidenceScore)}%</Text>
                    </View>
                    <View className="w-1/2">
                      <Text className="text-purple-600 text-xs">Filler Words</Text>
                      <Text className="text-purple-900 font-semibold">{voiceMetrics.fillerWordCount}</Text>
                    </View>
                    <View className="w-1/2">
                      <Text className="text-purple-600 text-xs">Word Count</Text>
                      <Text className="text-purple-900 font-semibold">{voiceMetrics.wordCount}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Strengths */}
              {analysis.feedback?.strengths && analysis.feedback.strengths.length > 0 && (
                <View className="mb-4">
                  <Text className="text-green-700 font-bold mb-2">Strengths</Text>
                  {analysis.feedback.strengths.map((strength, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <CheckCircleIcon size={18} color="#10B981" />
                      <Text className="flex-1 text-gray-700 ml-2 text-sm">{strength}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improvements */}
              {analysis.feedback?.improvements && analysis.feedback.improvements.length > 0 && (
                <View className="mb-4">
                  <Text className="text-amber-700 font-bold mb-2">Areas to Improve</Text>
                  {analysis.feedback.improvements.map((improvement, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <LightbulbIcon size={18} color="#F59E0B" />
                      <Text className="flex-1 text-gray-700 ml-2 text-sm">{improvement}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Suggestions */}
              {analysis.feedback?.suggestions && analysis.feedback.suggestions.length > 0 && (
                <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                  <Text className="text-blue-800 font-bold mb-2">Suggestions</Text>
                  {analysis.feedback.suggestions.map((suggestion, index) => (
                    <Text key={index} className="text-blue-700 text-sm mb-1">• {suggestion}</Text>
                  ))}
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onNextQuestion();
                }}
                className="bg-primary-blue rounded-2xl py-4 items-center mb-6"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-base mr-2">
                    {isLastQuestion ? 'Complete Interview' : 'Next Question'}
                  </Text>
                  <ArrowRightIcon size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default function ActiveInterviewSessionScreen({
  sessionId,
  mode,
  onComplete,
  onExit,
  initialQuestions,
  initialSession,
}: ActiveInterviewSessionScreenProps) {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  // State
  const [questions, setQuestions] = useState<SessionQuestion[]>(initialQuestions || []);
  const [currentQuestion, setCurrentQuestion] = useState<SessionQuestion | null>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions[0] : null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(initialSession?.totalQuestions || 0);
  const [textResponse, setTextResponse] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<InterviewCoachAnalysis | null>(null);
  const [currentVoiceMetrics, setCurrentVoiceMetrics] = useState<InterviewCoachVoiceMetrics | null>(null);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Voice mode - dynamic question reveal state
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [questionWords, setQuestionWords] = useState<string[]>([]);
  const [hasSpokenCurrentQuestion, setHasSpokenCurrentQuestion] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const MAX_REPLAYS = 2; // Maximum number of times user can replay the question

  // Refs
  const recording = useRef<Audio.Recording | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const wordRevealTimer = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const speakerPulseAnim = useRef(new Animated.Value(1)).current;

  // API Hooks - only fetch if we don't have initial data
  const { data: sessionData, isLoading: isLoadingSession } = useGetInterviewCoachSessionQuery(sessionId, {
    skip: !!initialQuestions && initialQuestions.length > 0,
  });
  const [submitTextResponse, { isLoading: isSubmittingText }] = useSubmitTextResponseMutation();
  const [submitVoiceResponse, { isLoading: isSubmittingVoice }] = useSubmitVoiceResponseMutation();
  const [completeSession, { isLoading: isCompleting }] = useCompleteInterviewSessionMutation();
  const [abandonSession] = useAbandonInterviewSessionMutation();

  const isSubmitting = isSubmittingText || isSubmittingVoice;

  // Initialize from props
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0 && initialSession) {
      setQuestions(initialQuestions);
      setTotalQuestions(initialSession.totalQuestions);
      setCurrentQuestion(initialQuestions[0]);
      setCurrentQuestionIndex(0);
    }
  }, [initialQuestions, initialSession]);

  // Fallback to API data if no initial data provided
  useEffect(() => {
    if (!initialQuestions && sessionData?.interviewCoachSession) {
      const session = sessionData.interviewCoachSession;
      setTotalQuestions(session.totalQuestions);

      if (session.questions && session.questions.length > 0) {
        setQuestions(session.questions as SessionQuestion[]);
        const unansweredIdx = session.questions.findIndex(q => !q.response);
        const currentIdx = unansweredIdx >= 0 ? unansweredIdx : 0;
        setCurrentQuestionIndex(currentIdx);

        if (currentIdx < session.questions.length) {
          setCurrentQuestion(session.questions[currentIdx] as SessionQuestion);
        }
      }
    }
  }, [sessionData, initialQuestions]);

  useEffect(() => {
    if (isRecording || isSubmittingVoice) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isSubmittingVoice]);

  useEffect(() => {
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      if (wordRevealTimer.current) clearInterval(wordRevealTimer.current);
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
      stopSpeaking();
    };
  }, []);

  // Speaker pulse animation for voice mode
  useEffect(() => {
    if (isSpeakingQuestion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(speakerPulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(speakerPulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      speakerPulseAnim.setValue(1);
    }
  }, [isSpeakingQuestion]);


  // Speak question function for voice mode using ElevenLabs
  const speakQuestion = useCallback(async (questionText: string, _isReplay: boolean = false) => {
    const words = questionText.split(/\s+/);
    setQuestionWords(words);
    setRevealedWordCount(0);
    setCurrentWordIndex(-1);
    setIsSpeakingQuestion(true);
    setHasSpokenCurrentQuestion(false);

    try {
      await speakWithElevenLabs({
        text: questionText,
        onStart: () => {
          console.log('ElevenLabs speech started');
          setIsSpeakingQuestion(true);
        },
        onWordChange: (wordIndex: number, _word: string) => {
          // Update current word and revealed words based on ElevenLabs timing
          setCurrentWordIndex(wordIndex);
          setRevealedWordCount(wordIndex + 1);
        },
        onComplete: () => {
          console.log('ElevenLabs speech completed');
          setIsSpeakingQuestion(false);
          setHasSpokenCurrentQuestion(true);
          setRevealedWordCount(words.length);
          setCurrentWordIndex(-1);
        },
        onError: (error: Error) => {
          console.log('ElevenLabs speech error:', error);
          setIsSpeakingQuestion(false);
          setHasSpokenCurrentQuestion(true);
          setRevealedWordCount(words.length);
          setCurrentWordIndex(-1);
        },
      });
    } catch (error) {
      console.error('Failed to speak with ElevenLabs:', error);
      setIsSpeakingQuestion(false);
      setHasSpokenCurrentQuestion(true);
      setRevealedWordCount(words.length);
      setCurrentWordIndex(-1);
    }
  }, []);

  // Auto-speak question when it changes in voice mode
  useEffect(() => {
    if (mode === 'voice' && currentQuestion && !hasSpokenCurrentQuestion && !isSpeakingQuestion) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        speakQuestion(currentQuestion.questionText);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, mode, hasSpokenCurrentQuestion, isSpeakingQuestion, speakQuestion]);

  // Reset spoken state when question changes
  useEffect(() => {
    setHasSpokenCurrentQuestion(false);
    setRevealedWordCount(0);
    setCurrentWordIndex(-1);
    setQuestionWords([]);
    setReplayCount(0); // Reset replay count for new question
  }, [currentQuestionIndex]);

  // Function to replay the question (limited attempts)
  const replayQuestion = async () => {
    if (currentQuestion && !isSpeakingQuestion && replayCount < MAX_REPLAYS) {
      await stopSpeaking();
      setReplayCount(prev => prev + 1);
      speakQuestion(currentQuestion.questionText, true);
    }
  };

  const canReplay = replayCount < MAX_REPLAYS && !isSpeakingQuestion;

  // Function to skip speaking and show full question
  const skipSpeaking = async () => {
    await stopSpeaking();
    if (wordRevealTimer.current) {
      clearInterval(wordRevealTimer.current);
      wordRevealTimer.current = null;
    }
    setIsSpeakingQuestion(false);
    setHasSpokenCurrentQuestion(true);
    setRevealedWordCount(questionWords.length);
    setCurrentWordIndex(-1);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          type: 'error',
          title: 'Permission Required',
          message: 'Microphone permission is needed for voice recording.',
        });
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      showAlert({
        type: 'error',
        title: 'Recording Error',
        message: 'Failed to start recording. Please try again.',
      });
    }
  };

  const stopRecordingAndSubmit = async () => {
    if (!recording.current || !currentQuestion) return;

    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();

      if (!uri) {
        showAlert({
          type: 'error',
          title: 'Recording Error',
          message: 'Failed to save recording.',
        });
        return;
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const result = await submitVoiceResponse({
        sessionId: sessionId,
        questionId: currentQuestion.id,
        audioBase64: base64,
      }).unwrap();

      recording.current = null;

      if (result.submitVoiceResponse.__typename === 'SubmitResponseSuccessType') {
        setCurrentVoiceMetrics(result.submitVoiceResponse.voiceMetrics || null);

        // Navigate to next question locally
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= questions.length) {
          // This was the last question - show completion modal
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsSessionComplete(true);
          setShowCompletionModal(true);
        } else {
          // Move to next question
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
        }
      } else {
        showAlert({
          type: 'error',
          title: 'Submission Error',
          message: result.submitVoiceResponse.message || 'Failed to submit response.',
        });
      }
    } catch (error: any) {
      console.error('Failed to submit voice response:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to submit voice response.',
      });
    }
  };

  const handleSubmitTextResponse = async () => {
    if (!textResponse.trim() || !currentQuestion) return;

    try {
      const result = await submitTextResponse({
        sessionId: sessionId,
        questionId: currentQuestion.id,
        responseText: textResponse.trim(),
      }).unwrap();

      if (result.submitTextResponse.__typename === 'SubmitResponseSuccessType') {
        setTextResponse('');
        setCurrentVoiceMetrics(null);
        setCurrentAnalysis(null);

        // Navigate to next question locally
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= questions.length) {
          // This was the last question - show completion modal
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsSessionComplete(true);
          setShowCompletionModal(true);
        } else {
          // Move to next question
          setCurrentQuestionIndex(nextIndex);
          setCurrentQuestion(questions[nextIndex]);
        }
      } else {
        showAlert({
          type: 'error',
          title: 'Submission Error',
          message: result.submitTextResponse.message || 'Failed to submit response.',
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to submit text response.',
      });
    }
  };

  const handleNextQuestion = async () => {
    setShowFeedback(false);
    setCurrentAnalysis(null);
    setCurrentVoiceMetrics(null);

    if (isSessionComplete) {
      try {
        await completeSession(sessionId).unwrap();
        onComplete(sessionId);
      } catch (error: any) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to complete session.',
        });
      }
    }
  };

  const handleExitSession = async () => {
    try {
      await abandonSession(sessionId).unwrap();
      onExit();
    } catch (error) {
      onExit();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoadingSession) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-600 mt-4">Loading session...</Text>
      </SafeAreaView>
    );
  }

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowExitConfirm(true);
            }}
            className="bg-white/20 rounded-full p-2"
          >
            <CloseIcon size={20} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-white font-semibold">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress Bar */}
        <View className="bg-white/30 rounded-full h-2 overflow-hidden">
          <View className="bg-white h-full rounded-full" style={{ width: `${progress}%` }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Question Card */}
          {currentQuestion && (
            <View className="bg-white rounded-2xl p-6 mt-6 border border-gray-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-blue-50 px-3 py-1 rounded-full">
                    <Text className="text-primary-blue text-xs font-semibold capitalize">
                      {currentQuestion.questionCategory}
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-3 py-1 rounded-full ml-2">
                    <Text className="text-gray-600 text-xs font-semibold capitalize">
                      {currentQuestion.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Speaker indicator for voice mode */}
                {mode === 'voice' && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (isSpeakingQuestion) {
                        skipSpeaking();
                      } else {
                        replayQuestion();
                      }
                    }}
                    className="p-2"
                  >
                    <Animated.View style={{ transform: [{ scale: speakerPulseAnim }] }}>
                      <SpeakerIcon
                        size={24}
                        color={isSpeakingQuestion ? '#437EF4' : '#9CA3AF'}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Dynamic word reveal for voice mode, static for text mode */}
              {mode === 'voice' && questionWords.length > 0 ? (
                <View>
                  <Text className="text-lg font-medium leading-8">
                    {questionWords.map((word, index) => {
                      const isCurrentWord = index === currentWordIndex;
                      const isRevealed = index < revealedWordCount;

                      return (
                        <Text
                          key={index}
                          style={{
                            color: isRevealed ? '#111827' : '#D1D5DB',
                            backgroundColor: isCurrentWord ? '#DBEAFE' : 'transparent',
                            fontWeight: isCurrentWord ? '700' : '500',
                            paddingHorizontal: isCurrentWord ? 2 : 0,
                            borderRadius: 4,
                          }}
                        >
                          {word}{' '}
                        </Text>
                      );
                    })}
                  </Text>

                  {/* Speaking progress indicator */}
                  {isSpeakingQuestion && (
                    <View className="mt-4 flex-row items-center">
                      <View className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <View
                          className="bg-primary-blue h-full rounded-full"
                          style={{ width: `${(revealedWordCount / questionWords.length) * 100}%` }}
                        />
                      </View>
                      <Text className="text-gray-400 text-xs ml-3">Speaking...</Text>
                    </View>
                  )}

                  {/* Tap to skip hint while speaking */}
                  {isSpeakingQuestion && (
                    <TouchableOpacity onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      skipSpeaking();
                    }} className="mt-2">
                      <Text className="text-gray-400 text-xs text-center">Tap speaker icon to skip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text className="text-gray-900 text-lg font-medium leading-7">
                  {currentQuestion.questionText}
                </Text>
              )}
            </View>
          )}

          {/* Response Area */}
          <View className="mt-6 mb-6">
            {mode === 'text' ? (
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Your Answer</Text>
                <TextInput
                  className="bg-white rounded-2xl px-4 py-4 text-gray-900 border border-gray-200 min-h-[180px]"
                  placeholder="Type your answer here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={textResponse}
                  onChangeText={setTextResponse}
                  editable={!isSubmitting}
                />

                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleSubmitTextResponse();
                  }}
                  disabled={!textResponse.trim() || isSubmitting}
                  className={`mt-4 rounded-2xl py-4 items-center flex-row justify-center ${
                    !textResponse.trim() || isSubmitting ? 'bg-gray-300' : 'bg-primary-blue'
                  }`}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <SendIcon size={20} color="#FFF" />
                      <Text className="text-white font-bold text-base ml-2">Submit Answer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                <View className="bg-white rounded-2xl p-8 w-full border border-gray-100 items-center">
                  {isSubmittingVoice ? (
                    // Processing/Submitting state
                    <>
                      <Animated.View
                        style={{ transform: [{ scale: pulseAnim }] }}
                        className="bg-primary-blue rounded-full p-6 mb-4"
                      >
                        <ActivityIndicator size={48} color="#FFF" />
                      </Animated.View>
                      <Text className="text-xl font-bold text-gray-900 mb-2">Processing Response...</Text>
                      <Text className="text-gray-500 text-center text-sm mb-4">
                        Analyzing your answer, please wait
                      </Text>
                      <View className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <Animated.View
                          className="bg-primary-blue h-full rounded-full"
                          style={{ width: '100%' }}
                        />
                      </View>
                      <Text className="text-gray-400 text-xs mt-3">This may take a few seconds...</Text>
                    </>
                  ) : isRecording ? (
                    <>
                      <Animated.View
                        style={{ transform: [{ scale: pulseAnim }] }}
                        className="bg-red-500 rounded-full p-6 mb-4"
                      >
                        <MicIcon size={48} color="#FFF" />
                      </Animated.View>
                      <Text className="text-xl font-bold text-gray-900 mb-2">Recording...</Text>
                      <Text className="text-3xl font-bold text-red-500 mb-4">
                        {formatTime(recordingDuration)}
                      </Text>
                      <Text className="text-gray-500 text-center text-sm">
                        Speak clearly and take your time
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          stopRecordingAndSubmit();
                        }}
                        className="mt-6 bg-red-500 rounded-2xl py-4 px-8 flex-row items-center"
                        activeOpacity={0.8}
                      >
                        <StopIcon size={20} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Stop & Submit</Text>
                      </TouchableOpacity>
                    </>
                  ) : isSpeakingQuestion ? (
                    // Show listening state while question is being spoken
                    <>
                      <Animated.View
                        style={{ transform: [{ scale: speakerPulseAnim }] }}
                        className="bg-blue-100 rounded-full p-6 mb-4"
                      >
                        <SpeakerIcon size={48} color="#437EF4" />
                      </Animated.View>
                      <Text className="text-xl font-bold text-gray-900 mb-2">Listen to the Question</Text>
                      <Text className="text-gray-500 text-center text-sm mb-4">
                        The question is being read aloud...
                      </Text>
                      <View className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-4">
                        <View
                          className="bg-primary-blue h-full rounded-full"
                          style={{ width: `${questionWords.length > 0 ? (revealedWordCount / questionWords.length) * 100 : 0}%` }}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          skipSpeaking();
                        }}
                        className="bg-gray-200 rounded-2xl py-3 px-6"
                        activeOpacity={0.8}
                      >
                        <Text className="text-gray-700 font-semibold">Skip & Start Recording</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View className="bg-blue-50 rounded-full p-6 mb-4">
                        <MicIcon size={48} color="#437EF4" />
                      </View>
                      <Text className="text-xl font-bold text-gray-900 mb-2">Ready to Record</Text>
                      <Text className="text-gray-500 text-center text-sm mb-6">
                        Tap the button below to start recording your answer
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          startRecording();
                        }}
                        className="bg-primary-blue rounded-2xl py-4 px-8 flex-row items-center"
                        activeOpacity={0.8}
                      >
                        <MicIcon size={20} color="#FFF" />
                        <Text className="text-white font-bold ml-2">Start Recording</Text>
                      </TouchableOpacity>

                      {/* Replay question button - limited attempts */}
                      {canReplay ? (
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            replayQuestion();
                          }}
                          className="mt-4 flex-row items-center"
                          activeOpacity={0.8}
                        >
                          <SpeakerIcon size={18} color="#6B7280" />
                          <Text className="text-gray-500 font-medium ml-2">
                            Replay Question ({MAX_REPLAYS - replayCount} left)
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="mt-4 flex-row items-center opacity-50">
                          <SpeakerIcon size={18} color="#9CA3AF" />
                          <Text className="text-gray-400 font-medium ml-2">No replays remaining</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Feedback Modal */}
      <FeedbackModal
        visible={showFeedback}
        analysis={currentAnalysis}
        voiceMetrics={currentVoiceMetrics}
        onClose={() => setShowFeedback(false)}
        onNextQuestion={handleNextQuestion}
        isLastQuestion={isSessionComplete}
      />

      {/* Exit Confirmation Modal */}
      <Modal visible={showExitConfirm} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Exit Interview?
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              Your progress will be saved. You can resume this session later.
            </Text>
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowExitConfirm(false);
                }}
                className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  handleExitSession();
                }}
                className="flex-1 bg-red-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interview Completion Success Modal */}
      <Modal visible={showCompletionModal} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full max-w-md p-8 items-center">
            {/* Success Icon */}
            <View className="bg-green-100 rounded-full p-6 mb-6">
              <CheckCircleIcon size={64} color="#10B981" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Interview Complete!
            </Text>
            <Text className="text-gray-600 text-center mb-2">
              Congratulations! You've answered all {totalQuestions} questions.
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-8">
              Your responses are being analyzed. View your detailed performance report now.
            </Text>

            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowCompletionModal(false);
                onComplete(sessionId);
              }}
              className="bg-primary-blue rounded-2xl py-4 px-8 w-full items-center flex-row justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold text-base mr-2">View Results</Text>
              <ArrowRightIcon size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
