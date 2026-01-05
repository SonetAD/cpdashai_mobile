import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import LogoWhite from '../../assets/images/logoWhite.svg';
import SearchIcon from '../../assets/images/search.svg';

// Back Arrow Icon
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface CandidateLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  hideHeader?: boolean;
}

export default function CandidateLayout({
  children,
  showSearch = true,
  onSearchPress,
  showBackButton = false,
  onBack,
  headerTitle,
  headerSubtitle,
  hideHeader = false,
}: CandidateLayoutProps) {
  // Check if we have a custom header (title provided)
  const hasCustomHeader = !!headerTitle;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={hideHeader ? [] : ['top']}>
      {/* Header */}
      {!hideHeader && (
        <LinearGradient
          colors={['#4F7DF3', '#5B7FF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 py-4"
        >
          <View className="flex-row items-center">
            {showBackButton && onBack ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBack();
                  }}
                  className="mr-4"
                >
                  <BackArrowIcon />
                </TouchableOpacity>
                <View className="flex-1">
                  {headerTitle && <Text className="text-white text-lg font-bold">{headerTitle}</Text>}
                  {headerSubtitle && <Text className="text-white/80 text-sm">{headerSubtitle}</Text>}
                </View>
              </>
            ) : hasCustomHeader ? (
              <>
                {/* Logo Icon */}
                <View className="mr-3">
                  <LogoWhite width={44} height={37} />
                </View>
                {/* Custom Title and Subtitle */}
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold">{headerTitle}</Text>
                  {headerSubtitle && (
                    <Text className="text-white/80 text-sm mt-0.5">{headerSubtitle}</Text>
                  )}
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
              </>
            )}
          </View>
        </LinearGradient>
      )}

      {/* Content */}
      <View className="flex-1">
        {children}
      </View>
    </SafeAreaView>
  );
}
