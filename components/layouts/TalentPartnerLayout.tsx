import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import BottomNavBar from '../BottomNavBar';

interface TalentPartnerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const BellIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6.43994V9.76994M12.02 2C8.34002 2 5.36002 4.98 5.36002 8.66V10.76C5.36002 11.44 5.08002 12.46 4.73002 13.04L3.46002 15.16C2.68002 16.47 3.22002 17.93 4.66002 18.41C9.44002 20 14.61 20 19.39 18.41C20.74 17.96 21.32 16.38 20.59 15.16L19.32 13.04C18.97 12.46 18.69 11.43 18.69 10.76V8.66C18.68 5 15.68 2 12.02 2Z"
      stroke="white"
      strokeWidth={1.5}
      strokeMiterlimit={10}
      strokeLinecap="round"
    />
    <Path
      d="M15.33 18.8201C15.33 20.6501 13.83 22.1501 12 22.1501C11.09 22.1501 10.25 21.7701 9.65004 21.1701C9.05004 20.5701 8.67004 19.7301 8.67004 18.8201"
      stroke="white"
      strokeWidth={1.5}
      strokeMiterlimit={10}
    />
  </Svg>
);

export default function TalentPartnerLayout({
  children,
  title = 'Dashboard',
  subtitle = 'Welcome to your talent hub',
  activeTab = 'home',
  onTabChange,
}: TalentPartnerLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header with Pattern */}
      <LinearGradient
        colors={['#437EF4', '#3B71E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-8"
      >
        {/* Header Content */}
        <View className="px-6 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold mb-1">{title}</Text>
              <Text className="text-white/80 text-sm">{subtitle}</Text>
            </View>
            <TouchableOpacity className="p-2">
              <BellIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative Pattern Overlay */}
        <View className="absolute top-0 right-0 opacity-10">
          <Svg width="200" height="200" viewBox="0 0 200 200">
            <Circle cx="100" cy="50" r="40" fill="white" opacity="0.3" />
            <Circle cx="150" cy="100" r="30" fill="white" opacity="0.2" />
            <Circle cx="50" cy="120" r="25" fill="white" opacity="0.25" />
          </Svg>
        </View>
      </LinearGradient>

      {/* Content */}
      <View className="flex-1">
        {children}
      </View>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} userRole="recruiter" />
    </SafeAreaView>
  );
}
