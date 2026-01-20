import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, Animated, Modal, ActivityIndicator, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import CandidateLayout from '../../../../components/layouts/CandidateLayout';
import SearchModal from '../../../../components/SearchModal';
import PremiumUpgradeBanner from '../../../../components/PremiumUpgradeBanner';
import JobMatchCard from '../../../../components/JobMatchCard';
import CRSInfoPopup from '../../../../components/CRSInfoPopup';
import { useParseAndCreateResumeMutation, useCheckSubscriptionStatusQuery, useGetMyProfileQuery, useGetMyCRSQuery, useGetRecentActivityQuery, useGetMyJobMatchesQuery } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { RootState } from '../../../../store/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// CRS Score Ring Component - Pie chart style with glass overlay and animation
const CRSScoreRing = ({ score, size = 81, animate = false }: { score: number; size?: number; animate?: boolean }) => {
  const center = size / 2;
  const radius = size / 2;
  const innerCircleSize = 67;

  // Animated score value
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);

  // Animate score from 0 to actual value
  useEffect(() => {
    if (animate && score > 0) {
      const duration = 1200; // Animation duration in ms
      const startTime = Date.now();
      const startScore = 0;

      const animateScore = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function for smooth animation (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentScore = Math.round(startScore + (score - startScore) * easeOut);

        setDisplayScore(currentScore);

        if (progress < 1) {
          requestAnimationFrame(animateScore);
        }
      };

      // Delay animation start slightly
      const timer = setTimeout(() => {
        requestAnimationFrame(animateScore);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setDisplayScore(score);
    }
  }, [score, animate]);

  // Calculate the arc path for the filled portion
  // Start from 180 degrees (left/9 o'clock) and go clockwise
  const percentage = Math.min(Math.max(displayScore, 0), 100);
  const endAngle = (percentage / 100) * 360;

  // Convert angle to radians and calculate points
  // Start at 180 degrees (left side)
  const startAngleRad = 180 * (Math.PI / 180);
  const endAngleRad = (180 + endAngle) * (Math.PI / 180);

  const startX = center + radius * Math.cos(startAngleRad);
  const startY = center + radius * Math.sin(startAngleRad);
  const endX = center + radius * Math.cos(endAngleRad);
  const endY = center + radius * Math.sin(endAngleRad);

  // Large arc flag: 1 if angle > 180 degrees
  const largeArcFlag = endAngle > 180 ? 1 : 0;

  // Create pie slice path (from center to arc and back)
  const piePath = percentage === 100
    ? `M ${center} ${center} m -${radius}, 0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`
    : percentage === 0
    ? ''
    : `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Gradient filled pie */}
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="crsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="-8.38%" stopColor="#06B6D4" />
            <Stop offset="86.81%" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>
        {/* The pie slice showing the score */}
        {percentage > 0 && (
          <Path
            d={piePath}
            fill="url(#crsGradient)"
          />
        )}
      </Svg>

      {/* Inner glass circle overlay */}
      <View style={[crsStyles.innerCircle, { width: innerCircleSize, height: innerCircleSize, borderRadius: Math.floor(innerCircleSize / 2) }]}>
        <Text style={crsStyles.scoreText}>{displayScore}%</Text>
      </View>
    </View>
  );
};

// Career Readiness Score Card Component
const CRSCard = ({ score, onPress, animate = false }: { score: number; onPress?: () => void; animate?: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  // Generate dynamic message based on score
  const getMessage = () => {
    const roundedScore = Math.round(score);
    if (score >= 80) {
      return `Excellent! Your CV is ${roundedScore}% optimized. You're ready for top opportunities!`;
    } else if (score >= 60) {
      return `Nice! Your CV is ${roundedScore}% optimized. Quick win: add metrics to one experience bullet.`;
    } else if (score >= 40) {
      return `Good start! Your CV is ${roundedScore}% optimized. Add more skills to boost your score.`;
    } else {
      return `Your CV is ${roundedScore}% optimized. Complete your profile to improve your score.`;
    }
  };

  return (
    <Animated.View
      style={[
        crsStyles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={crsStyles.cardTouchable}
      >
        {/* Glass background */}
        <BlurView
          style={crsStyles.blurView}
          blurType="light"
          blurAmount={2}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.75)"
        />
        <View style={crsStyles.cardOverlay} />

        {/* Card content */}
        <View style={crsStyles.cardContent}>
          <CRSScoreRing score={score} animate={animate} />
          <View style={crsStyles.textContainer}>
            <Text style={crsStyles.titleText}>Career Score</Text>
            <Text style={crsStyles.descriptionText}>{getMessage()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const crsStyles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  cardTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingHorizontal: 25,
    gap: 15,
  },
  innerCircle: {
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: 'rgba(241, 245, 249, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
  },
});

// Import SVG assets
import UploadCVIcon from '../../../../assets/images/homepage/uploadCV.svg';
import FindJobsIcon from '../../../../assets/images/homepage/findJobs.svg';
import SkillGraphIcon from '../../../../assets/images/homepage/skillGraph.svg';
import WeeklyTasksIcon from '../../../../assets/images/homepage/weeklyTasks.svg';
import RayIcon from '../../../../assets/images/aiInterview/ray.svg';
import ClaraIcon from '../../../../assets/images/clara.svg';

// RAY Career Coach Card Component with glass effect
const RayCareerCoachCard = memo(({ onPress }: { onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[
        rayCardStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={rayCardStyles.touchable}
      >
        <ExpoLinearGradient
          colors={[
            '#06B6D4',
            '#818CF8',
            '#8B5CF6',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={rayCardStyles.gradient}
        >
          <View style={rayCardStyles.content}>
            <View style={rayCardStyles.textContainer}>
              <Text style={rayCardStyles.title}>Meet with the RAY Career Coach.</Text>
              <Text style={rayCardStyles.description}>
                Explore additional opportunities to secure a new job and accumulate points.
              </Text>
            </View>
            <View style={rayCardStyles.iconContainer}>
              <RayIcon width={64} height={64} />
            </View>
          </View>
        </ExpoLinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
});

const rayCardStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow for glow effect
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    padding: 10,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 16,
    opacity: 0.9,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
});

// CLARA AI Companion Card Component with glass effect
const ClaraAICompanionCard = memo(({ onPress }: { onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 100, // Slight delay after Ray card
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[
        claraCardStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={claraCardStyles.touchable}
      >
        {/* Glass background */}
        <BlurView
          style={claraCardStyles.blurView}
          blurType="light"
          blurAmount={2}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.75)"
        />
        <View style={claraCardStyles.cardOverlay} />

        {/* Card content - Icon on LEFT, text on RIGHT */}
        <View style={claraCardStyles.content}>
          <View style={claraCardStyles.iconContainer}>
            <ClaraIcon width={64} height={64} />
          </View>
          <View style={claraCardStyles.textContainer}>
            <Text style={claraCardStyles.title}>Meet CLARA, Your AI Companion.</Text>
            <Text style={claraCardStyles.description}>
              Your AI support system for career progress, confidence, and overall well-being.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const claraCardStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
    // Shadow for glow effect (blue/purple like other glass cards)
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingHorizontal: 20,
    gap: 15,
  },
  textContainer: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    lineHeight: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
});

// Quick Action Card Styles
const quickActionStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 180,
    // Shadow for the blue/purple glow effect
    shadowColor: '#818CF8',
    shadowOffset: { width: -4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
});

// Quick Action Card Component with haptics and animations
interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  delay?: number;
}

const QuickActionCard = memo(({ icon, title, description, onPress, delay = 0 }: QuickActionCardProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[
        quickActionStyles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={quickActionStyles.card}
        activeOpacity={1}
      >
        <View style={quickActionStyles.iconContainer}>
          {icon}
        </View>
        <Text style={quickActionStyles.title}>{title}</Text>
        <Text style={quickActionStyles.description}>{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

// Activity Item Component with haptics and animations
interface ActivityItemProps {
  title: string;
  subtitle: string;
  dotColor: string;
  actionText: string;
  onActionPress: () => void;
  isLast?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  subtitle,
  dotColor,
  actionText,
  onActionPress,
  isLast = false,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress();
  };

  return (
    <View style={[activityStyles.item, !isLast && activityStyles.itemBorder]}>
      <View style={activityStyles.itemContent}>
        <View style={[activityStyles.dot, { backgroundColor: dotColor }]} />
        <View style={activityStyles.textContainer}>
          <Text style={activityStyles.title}>{title}</Text>
          <Text style={activityStyles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Text style={activityStyles.actionText}>{actionText}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Recent Activity Card Styles
const activityStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#437EF4',
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.email?.split('@')[0] || 'User';

  // Header height for scroll padding (safe area + header content)
  const HEADER_HEIGHT = insets.top + 70;

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCRSInfoPopup, setShowCRSInfoPopup] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Page entrance animation
  const pageOpacity = useRef(new Animated.Value(0)).current;
  const aiCompanionFade = useRef(new Animated.Value(0)).current;
  const aiCompanionSlide = useRef(new Animated.Value(30)).current;
  const aiCompanionScale = useRef(new Animated.Value(1)).current;

  // API hooks
  const [parseAndCreateResume] = useParseAndCreateResumeMutation();
  const { showAlert } = useAlert();

  // Subscription status
  const { data: subscriptionData, refetch: refetchSubscription } = useCheckSubscriptionStatusQuery();
  const canUseAiFeatures = subscriptionData?.subscriptionStatus?.canUseAiFeatures || false;

  // Profile data for avatar
  const { data: profileData } = useGetMyProfileQuery();

  // Memoize profile picture URL to prevent unnecessary re-renders
  const profilePictureUrl = useMemo(
    () => profileData?.myProfile?.profilePicture || null,
    [profileData?.myProfile?.profilePicture]
  );

  // CRS (Career Readiness Score) data from API
  const { data: crsData, isLoading: isCrsLoading, refetch: refetchCRS } = useGetMyCRSQuery();
  const crsScore = crsData?.myCrs?.totalScore || 0;

  // Recent Activity data from API
  const { data: activityData, refetch: refetchActivity } = useGetRecentActivityQuery({ limit: 3 });
  const recentActivities = activityData?.recentActivity?.activities || [];
  const hasMoreActivities = activityData?.recentActivity?.hasMore ?? false;

  // Job Matches data from API
  const { data: jobMatchesData, refetch: refetchJobMatches } = useGetMyJobMatchesQuery({ pageSize: 3 });
  const jobMatches = jobMatchesData?.myJobMatches?.matches || [];

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refetch all dashboard data when screen is focused
      refetchActivity();
      refetchCRS();
      refetchJobMatches();
    }, [refetchActivity, refetchCRS, refetchJobMatches])
  );

  useEffect(() => {
    refetchSubscription();
  }, [userName]);

  // Page entrance animation
  useEffect(() => {
    // Fade in the page
    Animated.timing(pageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Animate AI Companion section
    Animated.parallel([
      Animated.timing(aiCompanionFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(aiCompanionSlide, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAiCompanionPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(aiCompanionScale, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(aiCompanionScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    router.push('/(candidate)/(tabs)/ai-coach/clara-assistant' as any);
  };

  const handleQuickUploadCV = async () => {
    // Check subscription before allowing upload
    if (!canUseAiFeatures) {
      showAlert({
        type: 'warning',
        title: 'Premium Feature',
        message: 'CV upload and AI parsing is a premium feature. Please upgrade your subscription to use this feature.',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => router.push('/(candidate)/subscription/pricing' as any),
          },
        ],
      });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const maxSize = 10 * 1024 * 1024;

      if (file.size && file.size > maxSize) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select a file smaller than 10MB.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Only PDF and DOCX files are supported.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Start loading
      setIsUploading(true);
      setUploadStatus('Reading file...');

      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      const fileData = `data:${file.mimeType};base64,${base64}`;

      setUploadStatus('Parsing resume with AI...');

      const data = await parseAndCreateResume({
        fileName: file.name,
        fileData: fileData,
      }).unwrap();

      setIsUploading(false);

      if (data.parseAndCreateResume.__typename === 'ResumeBuilderSuccessType') {
        const resume = data.parseAndCreateResume.resume;
        showAlert({
          type: 'success',
          title: 'Success!',
          message: `Resume parsed successfully!\n\nName: ${resume.fullName}\nATS Score: ${resume.atsScore}%`,
          buttons: [{
            text: 'View Resumes',
            style: 'default',
            onPress: () => router.push('/(candidate)/(tabs)/jobs/cv-upload' as any)
          }],
        });
      }
    } catch (error: any) {
      setIsUploading(false);
      console.error('Upload failed:', error);
      showAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error?.message || 'Failed to upload resume. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Memoize callbacks to prevent CandidateLayout re-renders
  const handleSearchPress = useCallback(() => {
    setShowSearchModal(true);
  }, []);

  const handleNotificationPress = useCallback(() => {
    router.push('/(candidate)/notifications' as any);
  }, [router]);

  const handleProfilePress = useCallback(() => {
    router.push('/(candidate)/(tabs)/profile' as any);
  }, [router]);

  return (
    <>
      <CandidateLayout
        onSearchPress={handleSearchPress}
        hideHeader={false}
        showGlassPill={true}
        profilePictureUrl={profilePictureUrl}
        onNotificationPress={handleNotificationPress}
        onProfilePress={handleProfilePress}
      >
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: 100 }}
          style={{ opacity: pageOpacity }}
        >
          <View className="px-6 mt-6">
            {/* Career Readiness Score Section */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Career Readiness Score</Text>
              <CRSCard
                score={crsScore}
                onPress={() => setShowCRSInfoPopup(true)}
                animate={!isCrsLoading}
              />
            </View>

            {/* RAY Career Coach Card */}
            <RayCareerCoachCard
              onPress={() => router.push('/(candidate)/(tabs)/ai-coach' as any)}
            />

            {/* CLARA AI Companion Card */}
            <ClaraAICompanionCard
              onPress={handleAiCompanionPress}
            />

            {/* Quick Actions Section */}
            <View className="mb-6">
              <Text className="text-gray-900 text-lg font-bold mb-4">Quick Actions</Text>
              <View className="flex-row mb-3" style={{ gap: 12 }}>
                <QuickActionCard
                  icon={<UploadCVIcon width={56} height={56} />}
                  title="Edit Your CV"
                  description="Manage your resumes, create new ones, and get AI-powered improvements."
                  onPress={() => router.push('/(candidate)/(tabs)/jobs/cv-upload' as any)}
                  delay={100}
                />
                <QuickActionCard
                  icon={<FindJobsIcon width={56} height={56} />}
                  title="Find Jobs"
                  description="Your UX Research experience fits perfectly with this company's focus on Human-Centered Design."
                  onPress={() => router.push('/(candidate)/(tabs)/jobs' as any)}
                  delay={200}
                />
              </View>
              <View className="flex-row" style={{ gap: 12 }}>
                <QuickActionCard
                  icon={<SkillGraphIcon width={56} height={56} />}
                  title="Career Dashboard"
                  description="Track your career progress, view skill stats, and get personalized recommendations"
                  onPress={() => router.push('/(candidate)/career-dashboard' as any)}
                  delay={300}
                />
                <QuickActionCard
                  icon={<WeeklyTasksIcon width={56} height={56} />}
                  title="Weekly Missions"
                  description="Complete missions to earn CRS points and level up your career readiness."
                  onPress={() => router.push('/(candidate)/missions' as any)}
                  delay={400}
                />
              </View>
            </View>

            {/* Premium Upgrade Banner */}
            {!canUseAiFeatures && (
              <PremiumUpgradeBanner onUpgrade={() => router.push('/(candidate)/subscription/pricing' as any)} />
            )}

            {/* Top Job Matches */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 text-lg font-bold">Top Jobs Matches for you</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/(candidate)/(tabs)/jobs' as any);
                  }}
                  activeOpacity={0.7}
                  className="flex-row items-center"
                >
                  <Text className="text-primary-blue text-sm font-medium mr-1">View All</Text>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path d="M6 12L10 8L6 4" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Horizontal Job Cards - Outside padding container */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}
            style={{ marginBottom: 8, overflow: 'visible' }}
          >
            {jobMatches.length > 0 ? (
              jobMatches.slice(0, 3).map((match) => (
                <JobMatchCard
                  key={match.id}
                  data={{
                    id: match.id,
                    matchPercentage: parseFloat(String(match.matchPercentage)) || 0,
                    matchedSkills: match.matchedSkills || [],
                    missingSkills: match.missingSkills || [],
                    recommendation: match.recommendation,
                    isSaved: match.isSaved,
                    isApplied: match.isApplied,
                    jobPosting: {
                      id: match.jobPosting.id,
                      title: match.jobPosting.title,
                      companyName: match.jobPosting.companyName,
                      description: match.jobPosting.description || '',
                      location: match.jobPosting.location || '',
                      workMode: match.jobPosting.workMode || 'onsite',
                      jobType: match.jobPosting.jobType || 'full_time',
                      requiredSkills: match.jobPosting.requiredSkills || [],
                      salaryMin: match.jobPosting.salaryMin,
                      salaryMax: match.jobPosting.salaryMax,
                      salaryCurrency: match.jobPosting.salaryCurrency,
                    },
                  }}
                  width={SCREEN_WIDTH - 64}
                  onViewDetails={() => router.push(`/(candidate)/jobs/${match.jobPosting.id}` as any)}
                  onApply={() => router.push(`/(candidate)/jobs/${match.jobPosting.id}/apply` as any)}
                />
              ))
            ) : (
              <View style={{ width: SCREEN_WIDTH - 64, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 40, alignItems: 'center', shadowColor: '#818CF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 }}>
                <Text style={{ color: '#6B7280', fontSize: 15, textAlign: 'center' }}>No job matches yet. Complete your profile to get personalized matches!</Text>
                <TouchableOpacity
                  style={{ marginTop: 16, backgroundColor: '#437EF4', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 20 }}
                  onPress={() => router.push('/(candidate)/(tabs)/profile' as any)}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Complete Profile</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View className="px-6">

            {/* Recent Activity */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 text-lg font-bold">Recent Activity</Text>
                {hasMoreActivities && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/(candidate)/activity' as any);
                    }}
                    activeOpacity={0.7}
                    className="flex-row items-center"
                  >
                    <Text className="text-primary-blue text-sm font-medium mr-1">View All</Text>
                    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <Path d="M6 12L10 8L6 4" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>
              <View style={activityStyles.container}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    // Determine dot color based on activity type
                    const getDotColor = (type: string) => {
                      switch (type) {
                        case 'CV_UPLOAD':
                          return '#437EF4'; // Blue
                        case 'PRACTICE_SESSION':
                        case 'JOB_MATCH':
                          return '#F59E0B'; // Orange/Amber
                        case 'MISSION_COMPLETED':
                          return '#10B981'; // Green
                        case 'APPLICATION_SUBMITTED':
                          return '#8B5CF6'; // Purple
                        default:
                          return '#437EF4';
                      }
                    };

                    // Handle navigation based on activity type
                    const handleActivityPress = () => {
                      switch (activity.activityType) {
                        case 'CV_UPLOAD':
                          router.push('/(candidate)/(tabs)/jobs/cv-upload' as any);
                          break;
                        case 'PRACTICE_SESSION':
                          router.push('/(candidate)/(tabs)/ai-coach' as any);
                          break;
                        case 'JOB_MATCH':
                          router.push('/(candidate)/(tabs)/jobs' as any);
                          break;
                        case 'APPLICATION_SUBMITTED':
                          router.push('/(candidate)/(tabs)/jobs' as any);
                          break;
                        case 'MISSION_COMPLETED':
                          router.push('/(candidate)/missions' as any);
                          break;
                        default:
                          if (activity.actionUrl) {
                            router.push(activity.actionUrl as any);
                          }
                      }
                    };

                    return (
                      <ActivityItem
                        key={activity.id}
                        title={activity.title}
                        subtitle={activity.description}
                        dotColor={getDotColor(activity.activityType)}
                        actionText={activity.actionLabel}
                        onActionPress={handleActivityPress}
                        isLast={index === recentActivities.length - 1}
                      />
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No recent activity</Text>
                  </View>
                )}
              </View>
            </View>

          </View>
        </Animated.ScrollView>
      </CandidateLayout>

      <SearchModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(route) => {
          setShowSearchModal(false);
          router.push(route as any);
        }}
      />

      {/* CRS Info Popup */}
      <CRSInfoPopup
        visible={showCRSInfoPopup}
        onClose={() => setShowCRSInfoPopup(false)}
      />

      {/* Upload Loading Modal */}
      <Modal
        visible={isUploading}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 32, alignItems: 'center', marginHorizontal: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
            <View style={{ backgroundColor: '#EEF4FF', borderRadius: 50, padding: 16, marginBottom: 20 }}>
              <ActivityIndicator size="large" color="#437EF4" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              Uploading Resume
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
              {uploadStatus}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
