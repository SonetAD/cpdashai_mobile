import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Import all navbar icons from assets
import HomeIcon from '../assets/images/navbar/home.svg';
import JobsIcon from '../assets/images/navbar/jobs.svg';
import AICoachIcon from '../assets/images/navbar/aiCoach.svg';
import ProfileIcon from '../assets/images/navbar/profile.svg';
import MessageIcon from '../assets/images/navbar/message.svg';

// Import selected state icons
import SelectedHomeIcon from '../assets/images/navbar/selectedHome.svg';
import SelectedJobsIcon from '../assets/images/navbar/selectedJobs.svg';
import SelectedAICoachIcon from '../assets/images/navbar/selectedAICoach.svg';
import SelectedProfileIcon from '../assets/images/navbar/selectedProfile.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design constants from Figma
const TAB_BAR_HEIGHT = 60;
const TAB_BAR_HORIZONTAL_PADDING = 16;
const FAB_SIZE = 60;
const INDICATOR_HEIGHT = 48;
const INDICATOR_BORDER_RADIUS = 24; // Half of height for rounded sides, flat top/bottom

// Colors from Figma
const ACTIVE_COLOR = '#2563EB';
const INACTIVE_COLOR = '#1F2937';

// Icon size
const ICON_SIZE = 24;

interface NavItem {
  id: string;
  label: string;
  Icon: React.FC<{ width: number; height: number; color?: string }>;
  SelectedIcon: React.FC<{ width: number; height: number }>;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon, SelectedIcon: SelectedHomeIcon },
  { id: 'jobs', label: 'Jobs', Icon: JobsIcon, SelectedIcon: SelectedJobsIcon },
  { id: 'aiCoach', label: 'AI Coach', Icon: AICoachIcon, SelectedIcon: SelectedAICoachIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon, SelectedIcon: SelectedProfileIcon },
];

interface CandidateNavBarProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
}

export default function CandidateNavBar({
  activeTab = 'home',
  onTabPress,
  onAIAssistantPress,
}: CandidateNavBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(navItems.map(() => new Animated.Value(1))).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // Calculate tab bar width (screen width - padding - FAB - gap)
  const tabBarWidth = SCREEN_WIDTH - (TAB_BAR_HORIZONTAL_PADDING * 2) - FAB_SIZE - 10;
  const tabWidth = tabBarWidth / navItems.length;
  // Get index of active tab
  const activeIndex = navItems.findIndex((item) => item.id === activeTab);

  // Calculate indicator width - wider for AI Coach tab (index 2) to fit longer text
  const isAICoachTab = activeIndex === 2;
  const indicatorHorizontalMargin = isAICoachTab ? -4 : 1;
  const indicatorWidth = tabWidth - (indicatorHorizontalMargin * 2);

  // Animate indicator position when active tab changes
  useEffect(() => {
    const toValue = activeIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
    Animated.spring(indicatorPosition, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  }, [activeIndex, tabWidth, indicatorWidth]);

  const handleTabPress = (tabId: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onTabPress?.(tabId);
  };

  const handleFABPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onAIAssistantPress?.();
  };

  // Safe bottom padding - account for Android navigation bar
  const bottomPadding = Platform.select({
    ios: Math.max(insets.bottom, 16),
    android: Math.max(insets.bottom, 24),
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navRow}>
        {/* Tab Bar with glassmorphism */}
        <View style={[styles.tabBarWrapper, { width: tabBarWidth }]}>
          {/* Glassmorphic background */}
          {Platform.OS === 'ios' && (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.glassBackground]} />

          {/* Animated selection indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorPosition }],
              },
            ]}
          />

          {/* Tab items */}
          <View style={styles.tabBarContent}>
            {navItems.map((item, index) => {
              const isActive = activeTab === item.id;
              const { Icon, SelectedIcon } = item;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleTabPress(item.id, index)}
                  activeOpacity={1}
                  style={[styles.tabItem, { width: tabWidth }]}
                >
                  <Animated.View
                    style={[
                      styles.tabItemContent,
                      { transform: [{ scale: scaleAnims[index] }] },
                    ]}
                  >
                    {isActive ? (
                      <SelectedIcon width={ICON_SIZE} height={ICON_SIZE} />
                    ) : (
                      <Icon
                        width={ICON_SIZE}
                        height={ICON_SIZE}
                        color={INACTIVE_COLOR}
                      />
                    )}
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Assistant FAB */}
        <TouchableOpacity
          onPress={handleFABPress}
          activeOpacity={0.8}
          style={styles.fabContainer}
        >
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <MessageIcon width={84} height={85} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarWrapper: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  glassBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    backgroundColor: '#E8E9ED',
    borderRadius: INDICATOR_BORDER_RADIUS,
    top: (TAB_BAR_HEIGHT - INDICATOR_HEIGHT) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  fabContainer: {
    marginLeft: -2,
  },
});
