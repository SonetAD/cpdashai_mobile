import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';
import SearchModal from '../../../components/SearchModal';

// Ray Avatar Component - AI Career Coach
const RayAvatar = ({ size = 120 }: { size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
    <Image
      source={require('../../../assets/images/aiInterview/ray.jpg')}
      style={{ width: size, height: size }}
      resizeMode="cover"
    />
  </View>
);

interface AIRayAssistantScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  onSearchNavigate?: (route: string) => void;
}

export default function AIRayAssistantScreen({
  activeTab = 'aiCoach',
  onTabChange,
  onBack,
  onSearchNavigate,
}: AIRayAssistantScreenProps) {
  const [message, setMessage] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  return (
    <>
    <CandidateLayout
      showBackButton={true}
      onBack={onBack}
      headerTitle="Ray"
      headerSubtitle="Your AI Career Coach"
      onSearchPress={() => setShowSearchModal(true)}
    >
      {/* Content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Haptics.selectionAsync()}
        >
          <View className="flex-1 items-center justify-center px-6 py-8">
            {/* Ray Avatar and Welcome Message */}
            <View className="bg-white rounded-3xl p-8 items-center border border-gray-100 shadow-sm mb-8">
              {/* Ray Image */}
              <View className="mb-6">
                <RayAvatar size={120} />
              </View>

              {/* Welcome Text */}
              <Text className="text-primary-blue text-xl font-bold mb-3">Welcome to Ray</Text>
              <Text className="text-gray-500 text-sm text-center leading-5">
                Your AI-powered career coach.{'\n'}Ask me about interviews, career advice, and more.
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View className="w-full">
              <Text className="text-gray-700 text-sm font-semibold mb-3">Quick Actions</Text>
              <View className="flex-row flex-wrap gap-2">
                <TouchableOpacity
                  className="bg-white border border-blue-200 rounded-full px-4 py-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMessage('Help me prepare for a job interview');
                  }}
                >
                  <Text className="text-primary-blue text-sm">Interview prep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-white border border-blue-200 rounded-full px-4 py-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMessage('Give me career growth advice');
                  }}
                >
                  <Text className="text-primary-blue text-sm">Career growth</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-white border border-blue-200 rounded-full px-4 py-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMessage('How to negotiate salary');
                  }}
                >
                  <Text className="text-primary-blue text-sm">Salary negotiation</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-white border border-blue-200 rounded-full px-4 py-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMessage('Help me with common interview questions');
                  }}
                >
                  <Text className="text-primary-blue text-sm">Common questions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Input Area - Fixed at bottom */}
        <View className="px-6 pb-32 pt-2 bg-gray-50">
          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center border border-blue-200 shadow-sm">
            {/* Plus Icon */}
            <TouchableOpacity
              className="mr-3"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
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
              placeholder="Ask Ray anything..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-gray-900 text-sm"
              value={message}
              onChangeText={setMessage}
              onFocus={() => Haptics.selectionAsync()}
            />

            {/* Microphone Icon */}
            <TouchableOpacity
              className="ml-2"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M19 12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12M12 19V22M12 22H15M12 22H9"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Send Button */}
            <TouchableOpacity
              className="ml-2 bg-primary-blue rounded-full p-2"
              onPress={() => {
                if (message.trim()) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Handle send message
                  console.log('Send message to Ray:', message);
                  setMessage('');
                }
              }}
              disabled={!message.trim()}
              style={{ opacity: message.trim() ? 1 : 0.5 }}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="white"
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
      <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />
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
