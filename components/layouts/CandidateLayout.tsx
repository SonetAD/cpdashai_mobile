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
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export default function CandidateLayout({
  children,
  userName = 'User',
  showSearch = true,
  onSearchPress,
  activeTab = 'home',
  onTabChange,
  showBackButton = false,
  onBack,
  title,
  subtitle,
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
          {showBackButton && onBack ? (
            <>
              <TouchableOpacity onPress={onBack} className="mr-4">
                <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>‹</Text>
                </View>
              </TouchableOpacity>
              <View className="flex-1">
                {title && <Text className="text-white text-lg font-bold">{title}</Text>}
                {subtitle && <Text className="text-white/80 text-sm">{subtitle}</Text>}
              </View>
            </>
          ) : (
            <>
              {/* Logo */}
              <LogoWhite width={39} height={33} />

              {/* CPDash AI Title */}
              <View className="flex-1 mx-4">
                <Text className="text-white text-xl font-bold">
                  CPDash AI
                </Text>
              </View>
            </>
          )}

          {/* Search Icon */}
          {showSearch && !showBackButton && (
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
