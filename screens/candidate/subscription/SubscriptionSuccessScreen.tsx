import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useCheckSubscriptionStatusQuery } from '../../../services/api';

interface SubscriptionSuccessScreenProps {
  onContinue?: () => void;
}

const SuccessIcon = () => (
  <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#10B981" />
    <Path d="M8 12l2 2 4-4" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function SubscriptionSuccessScreen({
  onContinue,
}: SubscriptionSuccessScreenProps) {
  const { refetch } = useCheckSubscriptionStatusQuery();

  useEffect(() => {
    // Refetch subscription status to update UI
    refetch();
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#437EF4', '#3B71E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Success Icon */}
          <View className="mb-8">
            <SuccessIcon />
          </View>

          {/* Success Message */}
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            Subscription Activated!
          </Text>
          <Text className="text-white/90 text-base text-center mb-8 leading-6">
            Welcome to the premium experience! You now have access to all AI-powered features.
          </Text>

          {/* Features List */}
          <View className="bg-white/10 rounded-3xl p-6 mb-8 w-full">
            <Text className="text-white text-lg font-bold mb-4 text-center">
              What's Unlocked
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center mb-3">
                <View className="bg-white rounded-full p-2 mr-3">
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text className="text-white text-sm flex-1">AI-powered resume parsing</Text>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="bg-white rounded-full p-2 mr-3">
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text className="text-white text-sm flex-1">Professional content improvements</Text>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="bg-white rounded-full p-2 mr-3">
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text className="text-white text-sm flex-1">ATS keyword optimization</Text>
              </View>

              <View className="flex-row items-center">
                <View className="bg-white rounded-full p-2 mr-3">
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text className="text-white text-sm flex-1">Professional summary generation</Text>
              </View>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            className="bg-white rounded-xl py-4 px-8 w-full items-center shadow-lg"
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text className="text-primary-blue text-base font-bold">
              Start Using AI Features
            </Text>
          </TouchableOpacity>

          {/* Footer Text */}
          <Text className="text-white/70 text-xs text-center mt-6">
            You can manage your subscription anytime from Settings
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
