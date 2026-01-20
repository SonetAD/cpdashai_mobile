import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFeatureAccess, useFeatureGates } from '../contexts/FeatureGateContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// CRS Level Configuration with colors and icons
const LEVEL_CONFIG: Record<string, { primary: string; secondary: string; icon: string; minScore: number; maxScore: number }> = {
  early_awareness: { primary: '#94A3B8', secondary: '#64748B', icon: '🌱', minScore: 0, maxScore: 20 },
  skill_building: { primary: '#3B82F6', secondary: '#2563EB', icon: '📚', minScore: 21, maxScore: 40 },
  interview_ready: { primary: '#8B5CF6', secondary: '#7C3AED', icon: '🎯', minScore: 41, maxScore: 60 },
  hire_ready: { primary: '#10B981', secondary: '#059669', icon: '⭐', minScore: 61, maxScore: 80 },
  thriving: { primary: '#F59E0B', secondary: '#D97706', icon: '🏆', minScore: 81, maxScore: 100 },
};

// Get level config from level key (handles both snake_case and display names)
const getLevelConfig = (levelKey: string | null) => {
  if (!levelKey) return LEVEL_CONFIG.skill_building;

  // Normalize the key to snake_case
  const normalizedKey = levelKey.toLowerCase().replace(/\s+/g, '_');
  return LEVEL_CONFIG[normalizedKey] || LEVEL_CONFIG.skill_building;
};

// Calculate progress within current level range
const calculateLevelProgress = (crsScore: number, nextLevel: string | null): number => {
  const config = getLevelConfig(nextLevel);
  const { minScore, maxScore } = config;
  const rangeSize = maxScore - minScore;

  if (rangeSize <= 0) return 100;

  // Calculate how far we are within the current level's range
  const progressInRange = Math.max(0, crsScore - (minScore > 0 ? minScore - 20 : 0));
  const progress = (progressInRange / rangeSize) * 100;

  return Math.min(Math.max(progress, 0), 100);
};

// Helper to format level key to display name
const formatLevelName = (levelKey: string | null): string => {
  if (!levelKey) return 'next level';
  // Convert snake_case to Title Case (e.g., "interview_ready" -> "Interview Ready")
  return levelKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Lock Icon Component
const LockIcon = memo(({ size = 32, color = '#6B7280' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Level Icons as SVG components
const SeedlingIcon = memo(({ size = 20, color = '#94A3B8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22V12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 12C12 12 12 8 8 5C4 8 4 12 4 12C4 12 8 12 12 12Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 12C12 12 12 6 17 3C22 6 20 12 20 12C20 12 16 12 12 12Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

const BookIcon = memo(({ size = 20, color = '#3B82F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

const TargetIcon = memo(({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
));

const StarIcon = memo(({ size = 20, color = '#10B981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

const TrophyIcon = memo(({ size = 20, color = '#F59E0B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9H4.5C3.83696 9 3.20107 8.73661 2.73223 8.26777C2.26339 7.79893 2 7.16304 2 6.5C2 5.83696 2.26339 5.20107 2.73223 4.73223C3.20107 4.26339 3.83696 4 4.5 4H6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 9H19.5C20.163 9 20.7989 8.73661 21.2678 8.26777C21.7366 7.79893 22 7.16304 22 6.5C22 5.83696 21.7366 5.20107 21.2678 4.73223C20.7989 4.26339 20.163 4 19.5 4H18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 4H18V12C18 13.5913 17.3679 15.1174 16.2426 16.2426C15.1174 17.3679 13.5913 18 12 18C10.4087 18 8.88258 17.3679 7.75736 16.2426C6.63214 15.1174 6 13.5913 6 12V4Z" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 18V22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 22H16" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
));

// Level icon component selector
const LevelIcon = memo(({ levelKey, size = 20, color }: { levelKey: string | null; size?: number; color?: string }) => {
  const normalizedKey = levelKey?.toLowerCase().replace(/\s+/g, '_') || 'skill_building';
  const levelColor = color || getLevelConfig(levelKey).primary;

  switch (normalizedKey) {
    case 'early_awareness':
      return <SeedlingIcon size={size} color={levelColor} />;
    case 'skill_building':
      return <BookIcon size={size} color={levelColor} />;
    case 'interview_ready':
      return <TargetIcon size={size} color={levelColor} />;
    case 'hire_ready':
      return <StarIcon size={size} color={levelColor} />;
    case 'thriving':
      return <TrophyIcon size={size} color={levelColor} />;
    default:
      return <BookIcon size={size} color={levelColor} />;
  }
});

// Progress Bar Component
const ProgressBar = memo(({ progress, color = '#2563EB' }: { progress: number; color?: string }) => (
  <View style={styles.progressBarContainer}>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
  </View>
));

interface LockedFeatureOverlayProps {
  featureId: string;
  featureName?: string;
  children: React.ReactNode;
  compact?: boolean;
}

// Locked Feature Overlay - shows blur with lock info
export const LockedFeatureOverlay = memo(({
  featureId,
  featureName,
  children,
  compact = false,
}: LockedFeatureOverlayProps) => {
  const router = useRouter();
  const { requiredLevelDisplay, requiredLevel, crsScore } = useFeatureAccess(featureId);
  const { nextLevel, pointsToNextLevel } = useFeatureGates();

  // Fade-in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Get level-specific styling
  const levelConfig = getLevelConfig(requiredLevel || nextLevel);
  const levelColor = levelConfig.primary;

  // Calculate progress using proper CRS level ranges
  const progressToNextLevel = calculateLevelProgress(crsScore, nextLevel);

  const handleCompleteProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(candidate)/(tabs)/profile/full-profile' as any);
  };

  const handleViewRequirements = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Could open a modal with detailed requirements
    // For now, navigate to profile which shows CRS
    router.push('/(candidate)/(tabs)/profile' as any);
  };

  // Compact mode for small UI elements
  if (compact) {
    return (
      <View style={styles.overlayContainer}>
        {/* Original content (will be blurred) */}
        <View style={styles.contentWrapper}>
          {children}
        </View>

        {/* Blur overlay */}
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={6}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
        />

        {/* Compact lock overlay with animation */}
        <Animated.View
          style={[
            styles.compactLockContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity
            style={[styles.compactLockBadge, { borderColor: levelColor }]}
            onPress={handleCompleteProfile}
            activeOpacity={0.8}
          >
            <LevelIcon levelKey={requiredLevel || nextLevel} size={16} color={levelColor} />
            <LockIcon size={16} color={levelColor} />
            <Text style={[styles.compactLockText, { color: levelColor }]}>
              {requiredLevelDisplay || 'Locked'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.overlayContainer}>
      {/* Original content (will be blurred) */}
      <View style={styles.contentWrapper}>
        {children}
      </View>

      {/* Blur overlay */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={8}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
      />

      {/* Lock card overlay with animation */}
      <Animated.View
        style={[
          styles.lockCardContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.lockCard}>
          {/* Level icon badge */}
          <View style={[styles.levelIconBadge, { backgroundColor: `${levelColor}15` }]}>
            <LevelIcon levelKey={requiredLevel || nextLevel} size={22} color={levelColor} />
          </View>

          {/* Lock icon */}
          <View style={[styles.lockIconContainer, { backgroundColor: `${levelColor}15` }]}>
            <LockIcon size={28} color={levelColor} />
          </View>

          {/* Title */}
          <Text style={styles.lockTitle}>
            {featureName || 'Feature'} Locked
          </Text>

          {/* Level requirement with icon */}
          <View style={styles.levelRequirementRow}>
            <Text style={[styles.lockSubtitle, { color: levelColor }]}>
              Unlock at {requiredLevelDisplay || 'next'} Badge
            </Text>
            <View style={{ marginLeft: 6 }}>
              <LevelIcon levelKey={requiredLevel || nextLevel} size={18} color={levelColor} />
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Progress to {formatLevelName(nextLevel)}</Text>
            <ProgressBar progress={progressToNextLevel} color={levelColor} />
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaPrimary, { backgroundColor: levelColor }]}
            onPress={handleCompleteProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPrimaryText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

interface FeatureGateProps {
  featureId: string;
  featureName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockedState?: boolean;
  compact?: boolean;
}

// Main FeatureGate Component
const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  featureName,
  children,
  fallback = null,
  showLockedState = true,
  compact = false,
}) => {
  const { hasAccess, isLoading } = useFeatureAccess(featureId);

  // While loading, show nothing or a skeleton
  if (isLoading) {
    return <>{children}</>;
  }

  // If has access, show children normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access and should show locked state
  if (showLockedState) {
    return (
      <LockedFeatureOverlay featureId={featureId} featureName={featureName} compact={compact}>
        {children}
      </LockedFeatureOverlay>
    );
  }

  // If no access and not showing locked state, show fallback
  return <>{fallback}</>;
};

export default memo(FeatureGate);

// Small inline badge for showing lock status
export const LockedBadge = memo(({
  featureId,
  size = 'small',
}: {
  featureId: string;
  size?: 'small' | 'medium' | 'large';
}) => {
  const { hasAccess, requiredLevelDisplay } = useFeatureAccess(featureId);

  if (hasAccess) return null;

  const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 22;

  return (
    <View style={[styles.lockedBadge, styles[`lockedBadge_${size}`]]}>
      <LockIcon size={iconSize} color="#9CA3AF" />
      {size !== 'small' && (
        <Text style={styles.lockedBadgeText}>{requiredLevelDisplay}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'relative',
    overflow: 'visible',
    borderRadius: 16,
    minHeight: 450,
    flex: 1,
  },
  contentWrapper: {
    opacity: 0.15,
    minHeight: 450,
  },
  lockCardContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  lockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    // Premium shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  levelIconBadge: {
    position: 'absolute',
    top: -18,
    right: -18,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 35,
    textAlign: 'right',
  },
  ctaPrimary: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    gap: 4,
  },
  lockedBadge_small: {
    padding: 4,
  },
  lockedBadge_medium: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  lockedBadge_large: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  lockedBadgeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Compact mode styles
  compactLockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactLockText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
