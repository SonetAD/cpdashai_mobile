import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { useCompleteInterviewSessionMutation, SessionReport } from '../../../services/api';

// Icon Components
const ArrowLeftIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrophyIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 21H16M12 17V21M6 4H18V7C18 10.3137 15.3137 13 12 13C8.68629 13 6 10.3137 6 7V4ZM6 4H4C4 6.20914 5.79086 8 8 8M18 4H20C20 6.20914 18.2091 8 16 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckCircleIcon = ({ size = 24, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const AlertCircleIcon = ({ size = 24, color = "#F59E0B" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <Path d="M12 8V12M12 16H12.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LightbulbIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 11.0769 7.08773 12.8876 8.71929 14C9.30343 14.4362 9.78139 15.0281 10 15.75V18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18V15.75C14.2186 15.0281 14.6966 14.4362 15.2807 14C16.9123 12.8876 18 11.0769 18 9C18 5.68629 15.3137 3 12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChartIcon = ({ size = 24, color = "#437EF4" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3V21H21M18 17V10M13 17V7M8 17V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlayIcon = ({ size = 24, color = "#FFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 3L19 12L5 21V3Z" fill={color}/>
  </Svg>
);

interface SessionResultsScreenProps {
  sessionId: string;
  onBack: () => void;
  onStartNewSession: () => void;
}

export default function SessionResultsScreen({
  sessionId,
  onBack,
  onStartNewSession,
}: SessionResultsScreenProps) {
  const insets = useSafeAreaInsets();
  const [completeSession, { isLoading: isLoadingReport }] = useCompleteInterviewSessionMutation();
  const [report, setReport] = useState<SessionReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = isLoadingReport;

  // Fetch report using the mutation
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await completeSession(sessionId).unwrap();
        if (result.completeSessionAndGenerateReport.__typename === 'SessionReportSuccessType' && result.completeSessionAndGenerateReport.report) {
          setReport(result.completeSessionAndGenerateReport.report);
        } else {
          setError(result.completeSessionAndGenerateReport.message || 'Failed to load report');
        }
      } catch (err: any) {
        console.error('Failed to fetch report:', err);
        setError(err.message || 'Failed to load report');
      }
    };

    fetchReport();
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Strong';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Adequate';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-600 mt-4">Loading results...</Text>
      </SafeAreaView>
    );
  }

  if (error || (!isLoading && !report)) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-900 text-lg font-bold mb-2">Unable to Load Results</Text>
        <Text className="text-gray-500 text-center mb-6">
          {error || 'The session results could not be loaded.'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          className="bg-primary-blue rounded-xl py-3 px-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-600 mt-4">Loading results...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        className="px-6 py-4"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            className="mr-4"
          >
            <ArrowLeftIcon size={24} color="#FFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">Session Results</Text>
            <Text className="text-white/80 text-xs">
              Interview Practice Session
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="px-6 py-6">
          {/* Overall Score Card */}
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6 items-center">
            <View className="bg-amber-50 rounded-full p-4 mb-4">
              <TrophyIcon size={48} color="#F59E0B" />
            </View>
            <Text className="text-gray-500 text-sm mb-2">Overall Score</Text>
            <Text
              className="text-5xl font-bold mb-2"
              style={{ color: getScoreColor(report.overallScore) }}
            >
              {Math.round(report.overallScore)}%
            </Text>
            <View
              className="px-4 py-1 rounded-full"
              style={{ backgroundColor: `${getScoreColor(report.overallScore)}20` }}
            >
              <Text
                className="font-semibold text-sm"
                style={{ color: getScoreColor(report.overallScore) }}
              >
                {getScoreLabel(report.overallScore)}
              </Text>
            </View>
          </View>

          {/* Performance Breakdown */}
          <Text className="text-lg font-bold text-gray-900 mb-4">Performance Breakdown</Text>
          <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
            {/* Content Score */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Content Quality</Text>
                <Text
                  className="font-bold"
                  style={{ color: getScoreColor(report.contentAverage) }}
                >
                  {Math.round(report.contentAverage)}%
                </Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${report.contentAverage}%`,
                    backgroundColor: getScoreColor(report.contentAverage),
                  }}
                />
              </View>
            </View>

            {/* Communication Score */}
            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-700 font-medium">Communication</Text>
                <Text
                  className="font-bold"
                  style={{ color: getScoreColor(report.communicationAverage) }}
                >
                  {Math.round(report.communicationAverage)}%
                </Text>
              </View>
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${report.communicationAverage}%`,
                    backgroundColor: getScoreColor(report.communicationAverage),
                  }}
                />
              </View>
            </View>

            {/* Voice Score (if applicable) */}
            {report.voiceAverage !== undefined && report.voiceAverage !== null && (
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-700 font-medium">Voice & Delivery</Text>
                  <Text
                    className="font-bold"
                    style={{ color: getScoreColor(report.voiceAverage) }}
                  >
                    {Math.round(report.voiceAverage)}%
                  </Text>
                </View>
                <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${report.voiceAverage}%`,
                      backgroundColor: getScoreColor(report.voiceAverage),
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Strengths */}
          {report.strongAreas && report.strongAreas.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Your Strengths</Text>
              <View className="bg-green-50 rounded-2xl p-5 border border-green-200">
                {report.strongAreas.map((area, index) => (
                  <View key={index} className="flex-row items-start mb-3 last:mb-0">
                    <CheckCircleIcon size={20} color="#10B981" />
                    <Text className="flex-1 text-green-800 ml-3 text-sm">{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Areas to Improve */}
          {report.weakAreas && report.weakAreas.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Areas to Improve</Text>
              <View className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                {report.weakAreas.map((area, index) => (
                  <View key={index} className="flex-row items-start mb-3 last:mb-0">
                    <AlertCircleIcon size={20} color="#F59E0B" />
                    <Text className="flex-1 text-amber-800 ml-3 text-sm">{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Top Improvements */}
          {report.topImprovements && report.topImprovements.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Recommendations</Text>
              <View className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                {report.topImprovements.map((improvement, index) => (
                  <View key={index} className="flex-row items-start mb-3 last:mb-0">
                    <LightbulbIcon size={20} color="#437EF4" />
                    <Text className="flex-1 text-blue-800 ml-3 text-sm">{improvement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Practice Suggestions */}
          {report.practiceSuggestions && report.practiceSuggestions.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Practice Suggestions</Text>
              <View className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                {report.practiceSuggestions.map((suggestion, index) => (
                  <View key={index} className="flex-row items-start mb-3 last:mb-0">
                    <ChartIcon size={20} color="#8B5CF6" />
                    <Text className="flex-1 text-purple-800 ml-3 text-sm">{suggestion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Industry Benchmark */}
          {report.industryBenchmark !== undefined && report.percentileRank !== undefined && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Industry Comparison</Text>
              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <View className="flex-row justify-between mb-4">
                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs mb-1">Your Score</Text>
                    <Text className="text-2xl font-bold" style={{ color: getScoreColor(report.overallScore) }}>
                      {Math.round(report.overallScore)}%
                    </Text>
                  </View>
                  <View className="w-px bg-gray-200" />
                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs mb-1">Industry Avg</Text>
                    <Text className="text-2xl font-bold text-gray-700">
                      {Math.round(report.industryBenchmark)}%
                    </Text>
                  </View>
                  <View className="w-px bg-gray-200" />
                  <View className="flex-1 items-center">
                    <Text className="text-gray-500 text-xs mb-1">Percentile</Text>
                    <Text className="text-2xl font-bold text-primary-blue">
                      {Math.round(report.percentileRank)}th
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs text-center">
                  You scored better than {report.percentileRank}% of candidates
                </Text>
              </View>
            </View>
          )}

          {/* Resources */}
          {report.resources && report.resources.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Recommended Resources</Text>
              <View className="bg-indigo-50 rounded-2xl p-5 border border-indigo-200">
                {report.resources.map((resource, index) => (
                  <View key={index} className="flex-row items-start mb-3 last:mb-0">
                    <LightbulbIcon size={20} color="#6366F1" />
                    <Text className="flex-1 text-indigo-800 ml-3 text-sm">{resource}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Executive Summary */}
          {report.executiveSummary && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Summary</Text>
              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <Text className="text-gray-700 leading-6">{report.executiveSummary}</Text>
              </View>
            </View>
          )}

          {/* Detailed Analysis */}
          {report.detailedAnalysis && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Detailed Analysis</Text>
              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <Text className="text-gray-700 leading-6">{report.detailedAnalysis}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onStartNewSession();
            }}
            className="bg-primary-blue rounded-2xl py-4 items-center mb-4"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <PlayIcon size={20} color="#FFF" />
              <Text className="text-white font-bold text-base ml-2">Start New Practice</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack();
            }}
            className="bg-white border-2 border-primary-blue rounded-2xl py-4 items-center mb-6"
            activeOpacity={0.8}
          >
            <Text className="text-primary-blue font-bold text-base">Back to Interview Coach</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
