import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

interface PremiumUpgradeBannerProps {
  onUpgrade: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 380;

const StarIcon = () => (
  <Svg width={isSmallScreen ? 18 : 20} height={isSmallScreen ? 18 : 20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="white"
    />
  </Svg>
);

const RocketIcon = () => (
  <Svg width={isSmallScreen ? 24 : 28} height={isSmallScreen ? 24 : 28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
      fill="white"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PremiumUpgradeBanner: React.FC<PremiumUpgradeBannerProps> = ({ onUpgrade }) => {
  return (
    <TouchableOpacity
      className="mx-6 mb-6 rounded-3xl overflow-hidden"
      style={{
        shadowColor: '#437EF4',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      }}
      onPress={onUpgrade}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={['#437EF4', '#3B71E0', '#2E5CD1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: isSmallScreen ? 16 : 20 }}
      >
        {/* Background Pattern - Responsive */}
        <View className="absolute top-0 right-0 opacity-15" pointerEvents="none">
          <Svg width={isSmallScreen ? "120" : "140"} height={isSmallScreen ? "120" : "140"} viewBox="0 0 140 140">
            <Circle cx="90" cy="25" r="35" fill="white" opacity="0.3" />
            <Circle cx="115" cy="70" r="25" fill="white" opacity="0.2" />
            <Circle cx="35" cy="90" r="22" fill="white" opacity="0.25" />
          </Svg>
        </View>

        {/* Header Section */}
        <View className="flex-row items-center mb-4">
          <View className="bg-white/20 rounded-full mr-3" style={{ padding: isSmallScreen ? 8 : 10 }}>
            <RocketIcon />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap mb-1">
              <Text
                className="text-white font-bold mr-2"
                style={{ fontSize: isSmallScreen ? 18 : 22 }}
              >
                Go Premium
              </Text>
              <StarIcon />
            </View>
            <Text
              className="text-white/90"
              style={{ fontSize: isSmallScreen ? 12 : 13, lineHeight: isSmallScreen ? 16 : 18 }}
            >
              Unlock AI-powered features
            </Text>
          </View>
        </View>

        {/* Features List - More Compact */}
        <View className="bg-white/10 rounded-2xl mb-4" style={{ padding: isSmallScreen ? 12 : 14 }}>
          <View className="flex-row items-start mb-2">
            <View className="mt-0.5 mr-2">
              <CheckIcon />
            </View>
            <Text
              className="text-white flex-1"
              style={{ fontSize: isSmallScreen ? 12 : 13, lineHeight: isSmallScreen ? 16 : 18 }}
              numberOfLines={2}
            >
              AI Resume Parsing & Analysis
            </Text>
          </View>
          <View className="flex-row items-start mb-2">
            <View className="mt-0.5 mr-2">
              <CheckIcon />
            </View>
            <Text
              className="text-white flex-1"
              style={{ fontSize: isSmallScreen ? 12 : 13, lineHeight: isSmallScreen ? 16 : 18 }}
              numberOfLines={2}
            >
              Professional Content Improvements
            </Text>
          </View>
          <View className="flex-row items-start">
            <View className="mt-0.5 mr-2">
              <CheckIcon />
            </View>
            <Text
              className="text-white flex-1"
              style={{ fontSize: isSmallScreen ? 12 : 13, lineHeight: isSmallScreen ? 16 : 18 }}
              numberOfLines={2}
            >
              ATS Keyword Optimization
            </Text>
          </View>
        </View>

        {/* CTA Button - Responsive */}
        <View
          className="bg-white rounded-full flex-row items-center justify-between"
          style={{
            paddingHorizontal: isSmallScreen ? 16 : 20,
            paddingVertical: isSmallScreen ? 12 : 14
          }}
        >
          <View className="flex-1 mr-2">
            <Text
              className="text-primary-blue font-bold"
              style={{ fontSize: isSmallScreen ? 13 : 15 }}
              numberOfLines={1}
            >
              Upgrade to Premium
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontSize: isSmallScreen ? 10 : 11, marginTop: 2 }}
              numberOfLines={1}
            >
              Billed monthly
            </Text>
          </View>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M8.91 19.92L15.43 13.4C16.2 12.63 16.2 11.37 15.43 10.6L8.91 4.08"
              stroke="#437EF4"
              strokeWidth="2"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PremiumUpgradeBanner;
