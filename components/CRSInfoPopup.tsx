import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useGetMyCRSQuery } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// SVG Icon Components
const SeedlingIcon = ({ size = 20, color = '#94A3B8' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22V14M12 14C12 14 12 9 7 9C7 9 7 14 12 14ZM12 14C12 14 12 9 17 9C17 9 17 14 12 14Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14V8C12 8 8 8 8 4C12 4 12 8 12 8C12 8 12 4 16 4C16 8 12 8 12 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BookOpenIcon = ({ size = 20, color = '#3B82F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 7C12 7 12 4 8 4C4 4 2 6 2 6V20C2 20 4 18 8 18C12 18 12 20 12 20M12 7V20M12 7C12 7 12 4 16 4C20 4 22 6 22 6V20C22 20 20 18 16 18C12 18 12 20 12 20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TargetIcon = ({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <SvgCircle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <SvgCircle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <SvgCircle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const StarIcon = ({ size = 20, color = '#10B981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
  </Svg>
);

const TrophyIcon = ({ size = 20, color = '#F59E0B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9H4C4 9 4 3 8 3H16C20 3 20 9 20 9H18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 9C6 9 6 15 12 15C18 15 18 9 18 9H6Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
    <Path
      d="M12 15V19M8 21H16M9 19H15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DocumentIcon = ({ size = 20, color = '#3B82F6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 13H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 17H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckBadgeIcon = ({ size = 20, color = '#8B5CF6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12L11 14L15 10M12 3L13.9101 4.87147L16.5 4.20577L17.2184 6.78155L19.7942 7.5L19.1285 10.0899L21 12L19.1285 13.9101L19.7942 16.5L17.2184 17.2184L16.5 19.7942L13.9101 19.1285L12 21L10.0899 19.1285L7.5 19.7942L6.78155 17.2184L4.20577 16.5L4.87147 13.9101L3 12L4.87147 10.0899L4.20577 7.5L6.78155 6.78155L7.5 4.20577L10.0899 4.87147L12 3Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MicIcon = ({ size = 20, color = '#10B981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 19V23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 23H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClipboardListIcon = ({ size = 20, color = '#F59E0B' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 11H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 11H8.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 15H8.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BriefcaseIcon = ({ size = 20, color = '#EC4899' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RefreshIcon = ({ size = 20, color = '#06B6D4' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 4V10H17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1 20V14H7"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.51 9.00001C4.01717 7.56679 4.87913 6.28542 6.01547 5.27543C7.1518 4.26545 8.52547 3.55978 10.0083 3.22427C11.4911 2.88877 13.0348 2.93436 14.4952 3.35679C15.9556 3.77922 17.2853 4.56472 18.36 5.64001L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckIcon = ({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// CRS Level definitions matching backend with SVG icons
const CRS_LEVELS = [
  {
    key: 'early_awareness',
    name: 'Early Awareness',
    range: '0-20',
    IconComponent: SeedlingIcon,
    color: '#94A3B8',
    gradient: ['#94A3B8', '#64748B'],
    description: 'Just starting out',
    features: [
      'Search and browse job listings',
      'Weekly missions to improve readiness',
      'Build CV with guided templates',
    ],
  },
  {
    key: 'skill_building',
    name: 'Skill Building',
    range: '21-40',
    IconComponent: BookOpenIcon,
    color: '#3B82F6',
    gradient: ['#60A5FA', '#3B82F6'],
    description: 'Building foundations',
    features: [
      'See job match percentages',
      'Practice basic interview questions',
      'Missions tailored to weak areas',
    ],
  },
  {
    key: 'interview_ready',
    name: 'Interview Ready',
    range: '41-60',
    IconComponent: TargetIcon,
    color: '#8B5CF6',
    gradient: ['#A78BFA', '#8B5CF6'],
    description: 'Prepared to interview',
    features: [
      'Advanced interview practice with AI feedback',
      'Challenging missions for career growth',
      'Detailed job match breakdowns',
      'Track all job applications',
    ],
  },
  {
    key: 'hire_ready',
    name: 'Hire Ready',
    range: '61-80',
    IconComponent: StarIcon,
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
    description: 'Ready to be hired',
    features: [
      'Schedule interviews through platform',
      'Google Calendar integration',
    ],
  },
  {
    key: 'thriving',
    name: 'Thriving',
    range: '81-100',
    IconComponent: TrophyIcon,
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'],
    description: 'Career excellence',
    features: [
      'All features unlocked',
    ],
  },
];

// Tips to increase CRS score with SVG icons
const CRS_IMPROVEMENT_TIPS = [
  {
    IconComponent: DocumentIcon,
    title: 'Complete Your CV',
    description: 'Add all your work experience, education, and skills to boost CV Quality score.',
    impact: 'High Impact',
    color: '#3B82F6',
  },
  {
    IconComponent: CheckBadgeIcon,
    title: 'Add Verified Skills',
    description: 'Take skill assessments to verify your abilities and increase Skills Evidence.',
    impact: 'High Impact',
    color: '#8B5CF6',
  },
  {
    IconComponent: MicIcon,
    title: 'Practice Interviews',
    description: 'Complete AI interview practice sessions to improve Interview Readiness.',
    impact: 'Medium Impact',
    color: '#10B981',
  },
  {
    IconComponent: ClipboardListIcon,
    title: 'Complete Weekly Missions',
    description: 'Finish your assigned missions each week to earn CRS points consistently.',
    impact: 'Medium Impact',
    color: '#F59E0B',
  },
  {
    IconComponent: BriefcaseIcon,
    title: 'Apply to Matched Jobs',
    description: 'Apply to jobs with high match percentages to improve Market Alignment.',
    impact: 'Medium Impact',
    color: '#EC4899',
  },
  {
    IconComponent: RefreshIcon,
    title: 'Stay Active',
    description: 'Log in regularly and engage with the platform to maintain your Engagement score.',
    impact: 'Low Impact',
    color: '#06B6D4',
  },
];

// Close X icon
const CloseIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Score Ring Component
const ScoreRing = ({ score, size = 100 }: { score: number; size?: number }) => {
  const center = size / 2;
  const radius = (size / 2) - 8;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="scoreGradientPopup" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#06B6D4" />
            <Stop offset="100%" stopColor="#8B5CF6" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(226, 232, 240, 0.5)"
          strokeWidth={8}
          fill="none"
        />
        {/* Progress circle */}
        <SvgCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#scoreGradientPopup)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.ringScoreText}>{Math.round(score)}</Text>
        <Text style={styles.ringScoreLabel}>CRS</Text>
      </View>
    </View>
  );
};

// Chevron Icon for dropdown
const ChevronDownIcon = ({ size = 20, color = '#64748B', isExpanded = false }: { size?: number; color?: string; isExpanded?: boolean }) => (
  <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// Level Card Component with Dropdown
const LevelCard = ({ level, isCurrentLevel, isUnlocked, defaultExpanded = false }: { level: typeof CRS_LEVELS[0]; isCurrentLevel: boolean; isUnlocked: boolean; defaultExpanded?: boolean }) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded || isCurrentLevel);
  const IconComponent = level.IconComponent;
  // Always use the level's color - no graying out
  const displayColor = level.color;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[
      styles.levelCard,
      isCurrentLevel && styles.levelCardCurrent,
    ]}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={styles.levelCardTouchable}
      >
        <View style={styles.levelCardHeader}>
          <View style={[styles.levelIconContainer, { backgroundColor: `${displayColor}15` }]}>
            <IconComponent size={22} color={displayColor} />
          </View>
          <View style={styles.levelInfo}>
            <View style={styles.levelNameRow}>
              <Text style={styles.levelName}>{level.name}</Text>
            </View>
            <Text style={styles.levelRange}>{level.range} points</Text>
          </View>
          {isCurrentLevel && (
            <View style={[styles.currentBadge, { backgroundColor: level.color }]}>
              <CheckIcon size={12} color="#FFFFFF" />
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          )}
          {isUnlocked && !isCurrentLevel && (
            <View style={[styles.unlockedBadge]}>
              <CheckIcon size={10} color="#10B981" />
            </View>
          )}
          <View style={styles.chevronContainer}>
            <ChevronDownIcon size={20} color={displayColor} isExpanded={isExpanded} />
          </View>
        </View>
        <Text style={styles.levelDescription}>
          {level.description}
        </Text>
      </TouchableOpacity>

      {/* Expandable Features Section */}
      {isExpanded && (
        <View style={styles.featuresContainer}>
          <View style={[styles.featuresDivider, { backgroundColor: `${displayColor}30` }]} />
          <Text style={[styles.featuresTitle, { color: displayColor }]}>
            {isUnlocked ? 'Features Unlocked:' : 'Features at this level:'}
          </Text>
          {level.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[
                styles.featureCheckContainer,
                { backgroundColor: `${level.color}15` }
              ]}>
                <CheckIcon size={10} color={level.color} />
              </View>
              <Text style={styles.featureText}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// Tip Card Component
const TipCard = ({ tip }: { tip: typeof CRS_IMPROVEMENT_TIPS[0] }) => {
  const IconComponent = tip.IconComponent;

  return (
    <View style={[styles.tipCard, { borderLeftColor: tip.color, borderLeftWidth: 3 }]}>
      <View style={[styles.tipIconContainer, { backgroundColor: `${tip.color}12` }]}>
        <IconComponent size={22} color={tip.color} />
      </View>
      <View style={styles.tipContent}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <View style={[
            styles.impactBadge,
            {
              backgroundColor: tip.impact === 'High Impact' ? '#DCFCE7' :
                              tip.impact === 'Medium Impact' ? '#FEF3C7' : '#E0F2FE'
            }
          ]}>
            <Text style={[
              styles.impactText,
              {
                color: tip.impact === 'High Impact' ? '#16A34A' :
                       tip.impact === 'Medium Impact' ? '#D97706' : '#0284C7'
              }
            ]}>
              {tip.impact}
            </Text>
          </View>
        </View>
        <Text style={styles.tipDescription}>{tip.description}</Text>
      </View>
    </View>
  );
};

interface CRSInfoPopupProps {
  visible: boolean;
  onClose: () => void;
}

export default function CRSInfoPopup({ visible, onClose }: CRSInfoPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const { data: crsData } = useGetMyCRSQuery();
  const currentScore = crsData?.myCrs?.totalScore ?? 0;
  const currentLevel = crsData?.myCrs?.level ?? 'early_awareness';
  const apiPointsToNextLevel = crsData?.myCrs?.pointsToNextLevel;

  // Determine current level index and config based on score if level not provided
  const getLevelFromScore = (score: number): number => {
    if (score >= 81) return 4; // thriving
    if (score >= 61) return 3; // hire_ready
    if (score >= 41) return 2; // interview_ready
    if (score >= 21) return 1; // skill_building
    return 0; // early_awareness
  };

  // Level thresholds for calculating points to next level
  const LEVEL_THRESHOLDS = [0, 21, 41, 61, 81, 100];

  const currentLevelIndex = currentLevel
    ? CRS_LEVELS.findIndex(l => l.key === currentLevel)
    : getLevelFromScore(currentScore);

  const validLevelIndex = currentLevelIndex >= 0 ? currentLevelIndex : getLevelFromScore(currentScore);
  const currentLevelConfig = CRS_LEVELS[validLevelIndex] || CRS_LEVELS[0];

  // Calculate points to next level - use API value or calculate from score
  const calculatePointsToNextLevel = (): number => {
    if (apiPointsToNextLevel !== undefined && apiPointsToNextLevel !== null) {
      return apiPointsToNextLevel;
    }
    // Calculate based on score
    if (validLevelIndex >= 4) return 0; // Already at max level
    const nextThreshold = LEVEL_THRESHOLDS[validLevelIndex + 1];
    return Math.max(0, nextThreshold - currentScore);
  };

  const pointsToNextLevel = Math.round(calculatePointsToNextLevel() * 100) / 100; // Round to 2 decimal places

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset animations
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
      contentAnim.setValue(0);

      // Run animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Blur Background */}
        <BlurView
          intensity={80}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <View style={[StyleSheet.absoluteFill, styles.blurOverlay]} />
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </BlurView>

        {/* Popup Content */}
        <Animated.View
          style={[
            styles.popup,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <CloseIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={true}
          >
            {/* Current Level Badge at Top */}
            <View style={[styles.topBadgeContainer, { backgroundColor: `${currentLevelConfig.color}15` }]}>
              <View style={[styles.topBadgeIcon, { backgroundColor: currentLevelConfig.color }]}>
                <currentLevelConfig.IconComponent size={18} color="#FFFFFF" />
              </View>
              <View style={styles.topBadgeInfo}>
                <Text style={[styles.topBadgeLevel, { color: currentLevelConfig.color }]}>
                  {currentLevelConfig.name}
                </Text>
                <Text style={styles.topBadgeRange}>{currentLevelConfig.range} points</Text>
              </View>
              <View style={[styles.topBadgeScore, { backgroundColor: currentLevelConfig.color }]}>
                <Text style={styles.topBadgeScoreText}>{Math.round(currentScore)}</Text>
              </View>
            </View>

            {/* Header Section */}
            <View style={styles.header}>
              <ScoreRing score={currentScore} size={110} />
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Career Readiness Score</Text>
                {pointsToNextLevel > 0 && validLevelIndex < 4 && (
                  <View style={styles.nextLevelContainer}>
                    <Text style={styles.nextLevelHint}>
                      <Text style={styles.nextLevelPoints}>{Math.round(pointsToNextLevel)}</Text> points to next level
                    </Text>
                  </View>
                )}
                {validLevelIndex >= 4 && (
                  <Text style={styles.maxLevelText}>You've reached the highest level!</Text>
                )}
              </View>
            </View>

            {/* How to Increase Section */}
            <Animated.View style={[styles.section, { opacity: contentAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>How to Increase Your CRS</Text>
                <Text style={styles.sectionSubtitle}>Complete these actions to boost your score</Text>
              </View>

              {CRS_IMPROVEMENT_TIPS.map((tip, index) => (
                <TipCard key={index} tip={tip} />
              ))}
            </Animated.View>

            {/* Levels Section */}
            <Animated.View style={[styles.section, { opacity: contentAnim }]}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CRS Levels & Benefits</Text>
                <Text style={styles.sectionSubtitle}>Unlock new features as you progress</Text>
              </View>

              {CRS_LEVELS.map((level, index) => (
                <LevelCard
                  key={level.key}
                  level={level}
                  isCurrentLevel={index === validLevelIndex}
                  isUnlocked={index <= validLevelIndex}
                />
              ))}
            </Animated.View>

            {/* Bottom spacing */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  backdropPressable: {
    flex: 1,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    width: SCREEN_WIDTH - 32,
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.85,
    // Premium shadow
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 25,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },

  // Top Badge
  topBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    marginRight: 24,
  },
  topBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topBadgeLevel: {
    fontSize: 16,
    fontWeight: '700',
  },
  topBadgeRange: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  topBadgeScore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgeScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingRight: 40,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  currentLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  currentLevelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nextLevelContainer: {
    marginTop: 8,
  },
  nextLevelHint: {
    fontSize: 13,
    color: '#64748B',
  },
  nextLevelPoints: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  maxLevelText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 8,
  },
  ringScoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
  },
  ringScoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -2,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Tips
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FAFBFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  tipIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tipDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Level Cards
  levelCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    overflow: 'hidden',
  },
  levelCardTouchable: {
    padding: 16,
  },
  levelCardCurrent: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  levelCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chevronContainer: {
    marginLeft: 8,
    padding: 4,
  },
  levelIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  levelRange: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unlockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  levelDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  featuresContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  featuresDivider: {
    height: 1,
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheckContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  moreFeatures: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 30,
  },
});
