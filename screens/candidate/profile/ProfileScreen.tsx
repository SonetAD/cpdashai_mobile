import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import SearchModal from '../../../components/SearchModal';
import SettingsScreen from './SettingsScreen';
import ProfilePictureUpload from '../../../components/profile/ProfilePictureUpload';
import { useCheckSubscriptionStatusQuery, useGetMyProfileQuery, useGetMySubscriptionQuery, useGetMyResumesQuery, useGetMyCRSQuery } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

// Import icons
import LogoutIcon from '../../../assets/images/logoutIcon.svg';

// Chevron Right Icon
const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke="#9CA3AF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Gradient Arc around avatar with progress fill
const GradientArc = ({ size = 140, progress = 0 }: { size?: number; progress?: number }) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc parameters - gap at bottom left (9 o'clock position)
  const gapAngle = 60; // degrees of gap
  const totalArcAngle = 360 - gapAngle; // 300 degrees of arc
  const startAngle = 210; // Start at 10 o'clock (right side of gap)
  const endAngle = 150; // End at 8 o'clock (left side of gap)

  // Convert angles to cartesian coordinates
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const arcStart = polarToCartesian(startAngle);
  const arcEnd = polarToCartesian(endAngle);
  const largeArcFlag = totalArcAngle > 180 ? 1 : 0;

  // Background arc path (full arc from start to end)
  const backgroundArc = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${arcEnd.x} ${arcEnd.y}`;

  // Progress arc - fills based on percentage (minimum 5% if > 0)
  const displayProgress = progress === 0 ? 0 : Math.max(progress, 5);
  const progressAngle = (displayProgress / 100) * totalArcAngle;

  // Progress fills from start angle clockwise
  const progressEndAngle = startAngle + progressAngle;
  const progressEnd = polarToCartesian(progressEndAngle > 360 ? progressEndAngle - 360 : progressEndAngle);
  const progressLargeArc = progressAngle > 180 ? 1 : 0;
  const progressArc = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`;

  return (
    <Svg width={size} height={size} style={styles.gradientArc}>
      <Defs>
        <LinearGradient id="arcGradientProfile" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0E3FC8" />
          <Stop offset="100%" stopColor="#8C6BFF" />
        </LinearGradient>
      </Defs>
      {/* Background arc - gray */}
      <Path
        d={backgroundArc}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
      />
      {/* Progress arc - gradient fill */}
      {displayProgress > 0 && (
        <Path
          d={progressArc}
          stroke="url(#arcGradientProfile)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </Svg>
  );
};

interface MenuItemProps {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  icon?: React.ReactNode;
  isLast?: boolean;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress, showChevron = true, icon, isLast = false, isDestructive = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View
        className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <Text className={`text-base ${isDestructive ? 'text-red-500' : 'text-gray-900'}`}>{label}</Text>
        {showChevron ? <ChevronRightIcon /> : icon}
      </Animated.View>
    </Pressable>
  );
};

interface ProfileScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onAIAssistantPress?: () => void;
  onLogout?: () => void;
  onViewPricing?: () => void;
  onViewBillingHistory?: () => void;
  onSearchNavigate?: (route: string) => void;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export default function ProfileScreen({
  activeTab = 'home', // Default to home since this is accessed from top navbar
  onTabChange,
  onAIAssistantPress,
  onLogout,
  onViewPricing,
  onViewBillingHistory,
  onSearchNavigate,
  onBack,
  onNotificationPress,
  onProfilePress,
}: ProfileScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Safe area for dynamic header height
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 70;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(30)).current;

  // Get user data from Redux store
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';

  // Get profile and subscription data
  const { refetch: refetchSubscriptionStatus } = useCheckSubscriptionStatusQuery();
  const { data: profileData, refetch: refetchProfile } = useGetMyProfileQuery();
  const { data: subscriptionData, refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const { data: resumesData, refetch: refetchResumes } = useGetMyResumesQuery();
  const { data: crsData, refetch: refetchCRS } = useGetMyCRSQuery();
  const { showAlert } = useAlert();

  // Get CRS level display and score
  const levelDisplay = crsData?.myCrs?.levelDisplay;
  const crsScore = crsData?.myCrs?.totalScore;

  const subscription = subscriptionData?.mySubscription;

  // Check if user has uploaded a resume
  const hasResume = resumesData?.myResumes && resumesData.myResumes.length > 0;

  // Entrance animations
  useEffect(() => {
    // Profile section fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Card section fade in with delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(cardFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);
  }, []);

  // Avatar press animations
  const handleAvatarPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(avatarScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleAvatarPressOut = () => {
    Animated.spring(avatarScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // Generate initials from user name
  const getInitials = () => {
    // First check profile data (has fullName from API)
    if (profileData?.myProfile?.__typename === 'CandidateType') {
      const profileUser = (profileData.myProfile as any).user;
      if (profileUser?.fullName) {
        const parts = profileUser.fullName.trim().split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return profileUser.fullName.substring(0, 2).toUpperCase();
      }
      if (profileUser?.firstName && profileUser?.lastName) {
        return `${profileUser.firstName[0]}${profileUser.lastName[0]}`.toUpperCase();
      }
      if (profileUser?.firstName) {
        return profileUser.firstName.substring(0, 2).toUpperCase();
      }
    }
    // Fallback to Redux auth user
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  // Get full name
  const getFullName = () => {
    // First check profile data (has fullName from API)
    if (profileData?.myProfile?.__typename === 'CandidateType') {
      const profileUser = (profileData.myProfile as any).user;
      if (profileUser?.fullName) {
        return profileUser.fullName;
      }
      if (profileUser?.firstName && profileUser?.lastName) {
        return `${profileUser.firstName} ${profileUser.lastName}`;
      }
      if (profileUser?.firstName) {
        return profileUser.firstName;
      }
    }
    // Fallback to Redux auth user
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return userName;
  };

  // Get job title from profile data
  const getJobTitle = () => {
    if (profileData?.myProfile?.__typename === 'CandidateType') {
      const profile = profileData.myProfile as any;
      return profile.currentJobTitle || profile.headline || 'Job Seeker';
    }
    return 'Job Seeker';
  };

  // Handle refresh with haptic feedback
  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const refetchPromises = [];
      if (refetchSubscriptionStatus) refetchPromises.push(refetchSubscriptionStatus().catch(() => console.log('Subscription status refetch skipped')));
      if (refetchSubscription) refetchPromises.push(refetchSubscription().catch(() => console.log('Subscription refetch skipped')));
      if (refetchProfile) refetchPromises.push(refetchProfile().catch(() => console.log('Profile refetch skipped')));
      if (refetchResumes) refetchPromises.push(refetchResumes().catch(() => console.log('Resumes refetch skipped')));
      if (refetchCRS) refetchPromises.push(refetchCRS().catch(() => console.log('CRS refetch skipped')));
      await Promise.all(refetchPromises);
      // Success haptic on completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error refreshing data:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setRefreshing(false);
    }
  };

  // Memoize profile picture URL to prevent unnecessary re-renders
  const profilePictureUrl = useMemo(
    () => profileData?.myProfile?.profilePicture || null,
    [profileData?.myProfile?.profilePicture]
  );

  // Memoize search press handler to prevent CandidateLayout re-renders
  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSearchModal(true);
  }, []);

  // Handle logout with confirmation
  const handleLogoutPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout from your account?',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            onLogout?.();
          },
        },
      ],
    });
  };

  // If settings screen is shown, render it instead
  if (showSettings) {
    return (
      <SettingsScreen
        activeTab={activeTab}
        onTabChange={(tabId: string) => {
          if (tabId !== activeTab) {
            setShowSettings(false);
          }
          onTabChange?.(tabId);
        }}
        onBack={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSettings(false);
        }}
        onViewPricing={onViewPricing}
        onViewBillingHistory={onViewBillingHistory}
      />
    );
  }

  return (
    <>
      <CandidateLayout
        onSearchPress={handleSearchPress}
        showBackButton={true}
        onBack={onBack}
        showGlassPill={true}
        profilePictureUrl={profilePictureUrl}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      >
        <ScrollView
          className="flex-1 bg-gray-50"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#437EF4']}
              tintColor="#437EF4"
            />
          }
        >
          {/* Profile Avatar Section with entrance animation */}
          <Animated.View
            className="items-center mt-8 mb-8"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Pressable
              onPressIn={handleAvatarPressIn}
              onPressOut={handleAvatarPressOut}
            >
              <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
                {/* Gradient Arc */}
                <GradientArc size={110} progress={crsScore || 0} />
                {/* Avatar with white ring */}
                <View style={styles.avatarContainer}>
                  <View style={styles.whiteRing}>
                    <ProfilePictureUpload
                      initials={getInitials()}
                      size={80}
                      editable={false}
                    />
                  </View>
                </View>
              </Animated.View>
            </Pressable>
            <Text className="text-gray-900 text-2xl font-bold mt-4">{getFullName()}</Text>
            <Text className="text-gray-500 text-sm mt-1">{getJobTitle()}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{user?.email || 'No email'}</Text>

            {/* CRS Level Badge */}
            {(levelDisplay || crsScore !== undefined) && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>
                  {levelDisplay}{levelDisplay && crsScore !== undefined ? ' • ' : ''}{crsScore !== undefined ? `${Math.round(crsScore)} CRS` : ''}
                </Text>
              </View>
            )}

            {/* Subscription Badge */}
            {subscription && (
              <View style={styles.subscriptionBadge}>
                <View style={[
                  styles.planBadge,
                  subscription.plan === 'free' ? styles.freePlanBadge : styles.premiumPlanBadge
                ]}>
                  <Text style={[
                    styles.planText,
                    subscription.plan === 'free' ? styles.freePlanText : styles.premiumPlanText
                  ]}>
                    {subscription.plan === 'free' ? 'Free Plan' : `${subscription.plan} Plan`}
                  </Text>
                  {subscription.isActive && subscription.plan !== 'free' && (
                    <View style={styles.activeDot} />
                  )}
                </View>
              </View>
            )}

          </Animated.View>

          {/* Subscription Section */}
          {subscription && subscription.plan !== 'free' && (
            <Animated.View
              className="px-4 mb-4"
              style={{
                opacity: cardFadeAnim,
                transform: [{ translateY: cardSlideAnim }],
              }}
            >
              <Text className="text-gray-900 text-lg font-bold mb-3">Subscription</Text>
              <View className="bg-white rounded-2xl px-4" style={styles.card}>
                {/* Cancellation Warning Banner */}
                {(subscription.cancelAtPeriodEnd || subscription.status === 'canceled') && subscription.isActive && (
                  <View style={{
                    backgroundColor: '#FEF3C7',
                    borderWidth: 1,
                    borderColor: '#FCD34D',
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 12,
                    marginBottom: 4,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400E', marginLeft: 6 }}>
                        Won't Renew
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#92400E' }}>
                      Access until {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {/* Current Plan Row */}
                <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                  <Text className="text-gray-600 text-base">Current Plan</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-900 text-base font-semibold capitalize mr-2">
                      {subscription.plan}
                    </Text>
                    {subscription.cancelAtPeriodEnd || subscription.status === 'canceled' ? (
                      <View style={{ backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '700' }}>CANCELING</Text>
                      </View>
                    ) : subscription.isActive ? (
                      <View className="bg-green-500 rounded px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">ACTIVE</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Manage Settings */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowSettings(true);
                  }}
                  className="flex-row items-center justify-between py-4"
                >
                  <Text className="text-primary-blue text-base">
                    {subscription.cancelAtPeriodEnd || subscription.status === 'canceled'
                      ? 'Manage Subscription'
                      : 'Manage Subscription'}
                  </Text>
                  <ChevronRightIcon />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Manage Account Section with entrance animation */}
          <Animated.View
            className="px-4"
            style={{
              opacity: cardFadeAnim,
              transform: [{ translateY: cardSlideAnim }],
            }}
          >
            <Text className="text-gray-900 text-lg font-bold mb-3">Manage Account</Text>
            <View className="bg-white rounded-2xl px-4" style={styles.card}>
              <MenuItem
                label="Setting & Privacy"
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowSettings(true);
                }}
              />
              <MenuItem
                label="Help"
                onPress={() => {
                  showAlert({
                    type: 'info',
                    title: 'Help',
                    message: 'Need help? Contact us at support@cpdash.ai',
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }}
              />
              <MenuItem
                label="Activity"
                onPress={() => {
                  showAlert({
                    type: 'info',
                    title: 'Activity',
                    message: 'Your activity history will be available in Milestone 3.',
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }}
              />
              <MenuItem
                label="Logout"
                onPress={handleLogoutPress}
                showChevron={false}
                icon={<LogoutIcon width={24} height={24} />}
                isLast={true}
                isDestructive={true}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </CandidateLayout>

      {/* Search Modal */}
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

const styles = StyleSheet.create({
  avatarWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientArc: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  levelBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  subscriptionBadge: {
    marginTop: 12,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  freePlanBadge: {
    backgroundColor: '#F3F4F6',
  },
  premiumPlanBadge: {
    backgroundColor: '#EEF2FF',
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  freePlanText: {
    color: '#6B7280',
  },
  premiumPlanText: {
    color: '#4F46E5',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
});
