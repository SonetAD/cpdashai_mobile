import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import ClaraIcon from '../../../assets/images/clara.svg';
import BottomNavBar from '../../../components/BottomNavBar';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';

interface AIClaraAssistantScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

export default function AIClaraAssistantScreen({
  activeTab = 'aiCoach',
  onTabChange,
  onBack,
}: AIClaraAssistantScreenProps) {
  const [message, setMessage] = useState('');

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
            <Text className="text-white text-lg font-bold">Ai Clara Assistant</Text>
            <Text className="text-white/90 text-xs mt-0.5">
              Your voice will be analyzed for clarity, confidence & tone.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Back Navigation */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={onBack} className="mr-4">
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text className="text-gray-900 text-lg font-bold">Ai Clara Assistant</Text>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Clara Avatar and Welcome Message */}
          <View className="bg-blue-50 rounded-3xl p-8 items-center border-2 border-blue-200 mb-8">
            {/* Clara Image */}
            <View className="mb-6">
              <ClaraIcon width={120} height={120} />
            </View>

            {/* Welcome Text */}
            <Text className="text-primary-blue text-xl font-bold mb-3">Welcome to Ai Clara</Text>
            <Text className="text-gray-500 text-sm text-center leading-5">
              Start chatting with Chat Ai Clara now.{'\n'}You can ask me anything.
            </Text>
          </View>
        </View>

        {/* Input Area */}
        <View className="px-6 pb-4">
          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-blue-200 shadow-sm">
            {/* Plus Icon */}
            <TouchableOpacity className="mr-3">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#437EF4" strokeWidth="2" />
                <Path
                  d="M12 8V16M8 12H16"
                  stroke="#437EF4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
              placeholder="Write Here ......."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-900 text-sm"
              value={message}
              onChangeText={setMessage}
            />

            {/* Microphone Icon */}
            <TouchableOpacity className="ml-3">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z"
                  stroke="#437EF4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M19 12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12M12 19V22M12 22H15M12 22H9"
                  stroke="#437EF4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
