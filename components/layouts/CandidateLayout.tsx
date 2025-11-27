import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LogoWhite from '../../assets/images/logoWhite.svg';
import SearchIcon from '../../assets/images/search.svg';
import BottomNavBar from '../BottomNavBar';

interface CandidateLayoutProps {
  children: React.ReactNode;
  userName?: string;
  showSearch?: boolean;
  onSearchPress?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function CandidateLayout({
  children,
  userName = 'User',
  showSearch = true,
  onSearchPress,
  activeTab = 'home',
  onTabChange,
}: CandidateLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          {/* Logo */}
          <LogoWhite width={39} height={33} />

          {/* CPDash AI Title */}
          <View className="flex-1 mx-4">
            <Text className="text-white text-xl font-bold">
              CPDash AI
            </Text>
          </View>

          {/* Search Icon */}
          {showSearch && (
            <TouchableOpacity
              onPress={onSearchPress}
              className="p-2"
              activeOpacity={0.7}
            >
              <SearchIcon width={24} height={24} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {children}
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
