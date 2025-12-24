import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import BottomNavBar from '../../../components/BottomNavBar';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';

interface InterviewCoachScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onClaraPress?: () => void;
  onAIInterviewPress?: () => void;
}

interface QuestionItemProps {
  question: string;
  onPractice: () => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, onPractice }) => {
  return (
    <View className="bg-white rounded-xl px-4 py-3 mb-3 flex-row items-center justify-between border border-blue-200">
      <Text className="flex-1 text-gray-600 text-sm">{question}</Text>
      <TouchableOpacity
        className="bg-primary-blue rounded-lg px-4 py-2 ml-3"
        onPress={onPractice}
      >
        <Text className="text-white text-xs font-semibold">Practice</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function InterviewCoachScreen({
  activeTab = 'aiCoach',
  onTabChange,
  onClaraPress,
  onAIInterviewPress,
}: InterviewCoachScreenProps) {
  const [textInput, setTextInput] = useState('');

  const questions = [
    'Tell me about yourself',
    'What are your strengths?',
    'Why should we hire you?',
    'Where do you see yourself in 5 years?',
  ];

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
          <LogoWhite width={39} height={33} />
          <View className="flex-1 ml-4">
            <Text className="text-white text-lg font-bold">Interview Coach</Text>
            <Text className="text-white/90 text-xs mt-0.5">
              Practice real interview questions with text or voice
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <KeyboardDismissWrapper>
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question Bank */}
        <View className="mt-6 mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Question Bank</Text>

          {questions.map((question, index) => (
            <QuestionItem
              key={index}
              question={question}
              onPractice={() => console.log('Practice:', question)}
            />
          ))}
        </View>

        {/* Text Practice */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Text Practice</Text>

          <View className="bg-white rounded-xl px-4 py-3 border border-gray-200 mb-4">
            <TextInput
              placeholder="Add your Experience..."
              placeholderTextColor="#9CA3AF"
              className="text-gray-900 text-sm"
              multiline
              numberOfLines={6}
              value={textInput}
              onChangeText={setTextInput}
              style={{ minHeight: 120 }}
            />
          </View>

          {/* Get AI Feedback Button */}
          <TouchableOpacity className="bg-primary-blue rounded-xl py-4 items-center mb-4">
            <Text className="text-white text-base font-semibold">Get AI FeedBack</Text>
          </TouchableOpacity>

          {/* AI Interview Button */}
          <TouchableOpacity
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-4 items-center mb-4"
            style={{ backgroundColor: '#8B5CF6' }}
            onPress={onAIInterviewPress}
          >
            <Text className="text-white text-base font-semibold">AI Interview Practice</Text>
          </TouchableOpacity>

          {/* Clara Interview Button */}
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-4 items-center mb-6"
            onPress={onClaraPress}
          >
            <Text className="text-white text-base font-semibold">Clara Interview</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardDismissWrapper>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
