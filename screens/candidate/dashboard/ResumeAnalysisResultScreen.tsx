import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { AnalyzeResumeResponse } from '../../../services/api';

interface ResumeAnalysisResultScreenProps {
  analysis: AnalyzeResumeResponse;
  resumeName: string;
  onBack: () => void;
}

export default function ResumeAnalysisResultScreen({
  analysis,
  resumeName,
  onBack,
}: ResumeAnalysisResultScreenProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            className="mr-4 p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#FFFFFF"/>
            </Svg>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">Resume Analysis</Text>
            <Text className="text-white/90 text-xs mt-0.5">{resumeName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Overall Score Card */}
        <View className="mt-6 mb-4 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <View className="items-center">
            <Text className="text-gray-600 text-sm font-medium mb-3">Overall Score</Text>
            <View className="relative items-center justify-center mb-3">
              <Svg width="120" height="120" viewBox="0 0 120 120">
                {/* Background circle */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={getScoreColor(analysis.overall_score)}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(analysis.overall_score / 100) * 314} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </Svg>
              <View className="absolute items-center">
                <Text className="text-4xl font-bold" style={{ color: getScoreColor(analysis.overall_score) }}>
                  {Math.round(analysis.overall_score)}
                </Text>
                <Text className="text-gray-500 text-xs">out of 100</Text>
              </View>
            </View>
            <View
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: `${getScoreColor(analysis.overall_score)}20` }}
            >
              <Text className="font-semibold" style={{ color: getScoreColor(analysis.overall_score) }}>
                {getScoreLabel(analysis.overall_score)}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Match Score (if available) */}
        {analysis.job_match_score !== undefined && (
          <View className="mb-4 rounded-2xl p-5 shadow-lg border border-blue-200" style={{ backgroundColor: '#EFF6FF' }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-blue-600 text-sm font-medium mb-1">Job Match Score</Text>
                <Text className="text-blue-900 text-3xl font-bold">{Math.round(analysis.job_match_score)}%</Text>
                <Text className="text-blue-600 text-xs mt-1">
                  How well you match this position
                </Text>
              </View>
              <View className="bg-blue-500 rounded-full p-4">
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#FFFFFF"/>
                </Svg>
              </View>
            </View>
          </View>
        )}

        {/* Strong Points */}
        <View className="mb-4 bg-green-50 rounded-2xl p-5 border border-green-200">
          <View className="flex-row items-center mb-3">
            <View className="bg-green-500 rounded-full p-2 mr-3">
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#FFFFFF"/>
              </Svg>
            </View>
            <Text className="text-green-800 text-lg font-bold">Strong Points</Text>
          </View>
          {analysis.strong_points.map((point, index) => (
            <View key={index} className="flex-row mb-3" style={{ alignItems: 'flex-start' }}>
              <Text className="text-green-600 mr-2" style={{ marginTop: 2 }}>✓</Text>
              <Text className="text-green-700 text-sm" style={{ flex: 1, flexWrap: 'wrap' }}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Weak Points */}
        <View className="mb-4 bg-red-50 rounded-2xl p-5 border border-red-200">
          <View className="flex-row items-center mb-3">
            <View className="bg-red-500 rounded-full p-2 mr-3">
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#FFFFFF"/>
              </Svg>
            </View>
            <Text className="text-red-800 text-lg font-bold">Areas for Improvement</Text>
          </View>
          {analysis.weak_points.map((point, index) => (
            <View key={index} className="flex-row mb-3" style={{ alignItems: 'flex-start' }}>
              <Text className="text-red-600 mr-2" style={{ marginTop: 2 }}>!</Text>
              <Text className="text-red-700 text-sm" style={{ flex: 1, flexWrap: 'wrap' }}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Matching Skills (if available) */}
        {analysis.matching_skills && analysis.matching_skills.length > 0 && (
          <View className="mb-4 bg-blue-50 rounded-2xl p-5 border border-blue-200">
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-500 rounded-full p-2 mr-3">
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#FFFFFF"/>
                </Svg>
              </View>
              <Text className="text-blue-800 text-lg font-bold">Matching Skills</Text>
            </View>
            <View className="flex-row flex-wrap">
              {analysis.matching_skills.map((skill, index) => (
                <View key={index} className="bg-blue-200 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-blue-800 text-xs font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Missing Skills (if available) */}
        {analysis.missing_skills && analysis.missing_skills.length > 0 && (
          <View className="mb-4 bg-orange-50 rounded-2xl p-5 border border-orange-200">
            <View className="flex-row items-center mb-3">
              <View className="bg-orange-500 rounded-full p-2 mr-3">
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#FFFFFF"/>
                </Svg>
              </View>
              <Text className="text-orange-800 text-lg font-bold">Skills to Add</Text>
            </View>
            <View className="flex-row flex-wrap">
              {analysis.missing_skills.map((skill, index) => (
                <View key={index} className="bg-orange-200 rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-orange-800 text-xs font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detailed Feedback */}
        <View className="mb-6 bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <View className="flex-row items-center mb-3">
            <View className="bg-gray-200 rounded-full p-2 mr-3">
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#6B7280"/>
              </Svg>
            </View>
            <Text className="text-gray-800 text-lg font-bold">Detailed Feedback</Text>
          </View>
          <Text className="text-gray-700 text-sm leading-6" style={{ flexWrap: 'wrap' }}>{analysis.detailed_feedback}</Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="rounded-xl py-4 items-center"
          style={{ backgroundColor: '#437EF4' }}
          onPress={onBack}
        >
          <Text className="text-white text-base font-bold">Back to Resumes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
