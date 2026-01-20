import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient as SkiaLinearGradient,
  vec,
  Shadow,
  Circle,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { useGetMyCRSQuery } from '../services/api';
import { CRSData } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

// CRS Level configurations with colors and icons
const CRS_LEVELS: Record<string, { color: string; gradient: string[]; icon: string; description: string }> = {
  early_awareness: {
    color: '#94A3B8',
    gradient: ['#94A3B8', '#64748B'],
    icon: '🌱',
    description: 'Just getting started',
  },
  skill_building: {
    color: '#3B82F6',
    gradient: ['#60A5FA', '#3B82F6'],
    icon: '📚',
    description: 'Building your skills',
  },
  interview_ready: {
    color: '#8B5CF6',
    gradient: ['#A78BFA', '#8B5CF6'],
    icon: '🎯',
    description: 'Ready for interviews',
  },
  hire_ready: {
    color: '#10B981',
    gradient: ['#34D399', '#10B981'],
    icon: '⭐',
    description: 'Strong candidate',
  },
  thriving: {
    color: '#F59E0B',
    gradient: ['#FBBF24', '#F59E0B'],
    icon: '🏆',
    description: 'Top performer',
  },
};

interface CRSBadgeDisplayProps {
  compact?: boolean;
  onPress?: () => void;
  showScore?: boolean;
  showLevel?: boolean;
  showMissions?: boolean;
}

export const CRSBadgeDisplay: React.FC<CRSBadgeDisplayProps> = ({
  compact = false,
  onPress,
  showScore = true,
  showLevel = true,
  showMissions = false,
}) => {
  const { data: crsData, isLoading, error } = useGetMyCRSQuery();

  const crs = crsData?.myCrs;
  const levelConfig = crs?.level ? CRS_LEVELS[crs.level] || CRS_LEVELS.early_awareness : CRS_LEVELS.early_awareness;

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading CRS...</Text>
        </View>
      </View>
    );
  }

  if (error || !crs) {
    // Return null silently if no CRS data yet - user might be new
    return null;
  }

  const scorePercentage = crs.totalScore / 100;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference * (1 - scorePercentage);

  // Create the arc path for the score ring
  const createArcPath = () => {
    const path = Skia.Path.Make();
    const radius = 40;
    const centerX = 50;
    const centerY = 50;
    const startAngle = -90; // Start from top
    const sweepAngle = 360 * scorePercentage;

    path.addArc(
      { x: centerX - radius, y: centerY - radius, width: radius * 2, height: radius * 2 },
      startAngle,
      sweepAngle
    );
    return path;
  };

  const content = (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Glass Background */}
      <Canvas style={[styles.glassCanvas, compact && styles.glassCanvasCompact]}>
        <RoundedRect
          x={0}
          y={0}
          width={compact ? 180 : SCREEN_WIDTH - 40}
          height={compact ? 70 : 120}
          r={16}
        >
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(compact ? 180 : SCREEN_WIDTH - 40, compact ? 70 : 120)}
            colors={[
              'rgba(255, 255, 255, 0.95)',
              'rgba(241, 245, 249, 0.9)',
              'rgba(255, 255, 255, 0.85)',
            ]}
          />
          <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
        </RoundedRect>
        {/* Top highlight */}
        <RoundedRect
          x={1}
          y={1}
          width={compact ? 178 : SCREEN_WIDTH - 42}
          height={30}
          r={15}
        >
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, 30)}
            colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
          />
        </RoundedRect>
      </Canvas>

      {/* Content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Score Circle */}
        {showScore && (
          <View style={[styles.scoreContainer, compact && styles.scoreContainerCompact]}>
            <Canvas style={compact ? styles.scoreCanvasCompact : styles.scoreCanvas}>
              {/* Background circle */}
              <Circle
                cx={compact ? 25 : 50}
                cy={compact ? 25 : 50}
                r={compact ? 20 : 40}
                style="stroke"
                strokeWidth={compact ? 4 : 6}
                color="rgba(226, 232, 240, 0.5)"
              />
              {/* Progress arc */}
              <Circle
                cx={compact ? 25 : 50}
                cy={compact ? 25 : 50}
                r={compact ? 20 : 40}
                style="stroke"
                strokeWidth={compact ? 4 : 6}
                color={levelConfig.color}
                strokeCap="round"
                transform={[{ rotate: -Math.PI / 2 }]}
                origin={{ x: compact ? 25 : 50, y: compact ? 25 : 50 }}
              >
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(compact ? 50 : 100, compact ? 50 : 100)}
                  colors={levelConfig.gradient}
                />
              </Circle>
            </Canvas>
            <View style={[styles.scoreTextContainer, compact && styles.scoreTextContainerCompact]}>
              <Text style={[styles.scoreNumber, compact && styles.scoreNumberCompact]}>
                {Math.round(crs.totalScore)}
              </Text>
              {!compact && <Text style={styles.scoreLabel}>CRS</Text>}
            </View>
          </View>
        )}

        {/* Level Info */}
        {showLevel && (
          <View style={[styles.levelContainer, compact && styles.levelContainerCompact]}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelIcon}>{levelConfig.icon}</Text>
            </View>
            <View style={styles.levelTextContainer}>
              <Text style={[styles.levelTitle, compact && styles.levelTitleCompact]}>
                {crs.levelDisplay || 'Career Level'}
              </Text>
              {!compact && (
                <Text style={styles.levelDescription}>{levelConfig.description}</Text>
              )}
            </View>
          </View>
        )}

        {/* Progress to next level */}
        {!compact && crs.pointsToNextLevel > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {crs.pointsToNextLevel} pts to {crs.nextLevel ? CRS_LEVELS[crs.nextLevel]?.icon : '🎯'} {crs.nextLevel?.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Compact inline badge for displaying in profile headers
export const CRSBadgeInline: React.FC<{ score?: number; level?: string; onPress?: () => void }> = ({
  score,
  level,
  onPress,
}) => {
  const { data: crsData, isLoading } = useGetMyCRSQuery();

  const crs = crsData?.myCrs;
  const displayScore = score ?? crs?.totalScore ?? 0;
  const displayLevel = level ?? crs?.level ?? 'early_awareness';
  const levelConfig = CRS_LEVELS[displayLevel] || CRS_LEVELS.early_awareness;

  if (isLoading && !score) {
    return null;
  }

  const content = (
    <View style={styles.inlineContainer}>
      <Canvas style={styles.inlineCanvas}>
        <RoundedRect x={0} y={0} width={70} height={28} r={14}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(70, 28)}
            colors={[...levelConfig.gradient, levelConfig.gradient[1]]}
          />
          <Shadow dx={0} dy={2} blur={4} color="rgba(0, 0, 0, 0.1)" />
        </RoundedRect>
      </Canvas>
      <View style={styles.inlineContent}>
        <Text style={styles.inlineIcon}>{levelConfig.icon}</Text>
        <Text style={styles.inlineScore}>{Math.round(displayScore)}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Score breakdown component for detailed view
export const CRSScoreBreakdown: React.FC = () => {
  const { data: crsData, isLoading } = useGetMyCRSQuery();

  if (isLoading || !crsData?.myCrs) {
    return null;
  }

  const crs = crsData.myCrs;
  const components = [
    { label: 'CV Quality', score: crs.cvQualityScore, weight: '25%', color: '#3B82F6' },
    { label: 'Skills Evidence', score: crs.skillsEvidenceScore, weight: '20%', color: '#8B5CF6' },
    { label: 'Interview Ready', score: crs.interviewReadinessScore, weight: '20%', color: '#10B981' },
    { label: 'Market Alignment', score: crs.marketAlignmentScore, weight: '15%', color: '#F59E0B' },
    { label: 'Engagement', score: crs.engagementConsistencyScore, weight: '10%', color: '#EC4899' },
    { label: 'Wellbeing', score: crs.wellbeingStabilityScore, weight: '10%', color: '#06B6D4' },
  ];

  return (
    <View style={styles.breakdownContainer}>
      <Text style={styles.breakdownTitle}>Score Breakdown</Text>
      {components.map((component, index) => (
        <View key={index} style={styles.breakdownItem}>
          <View style={styles.breakdownHeader}>
            <Text style={styles.breakdownLabel}>{component.label}</Text>
            <Text style={styles.breakdownWeight}>({component.weight})</Text>
          </View>
          <View style={styles.breakdownBarContainer}>
            <View
              style={[
                styles.breakdownBar,
                { width: `${component.score}%`, backgroundColor: component.color },
              ]}
            />
          </View>
          <Text style={[styles.breakdownScore, { color: component.color }]}>
            {Math.round(component.score)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  containerCompact: {
    marginHorizontal: 0,
    marginVertical: 0,
    width: 180,
  },
  glassCanvas: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 120,
  },
  glassCanvasCompact: {
    width: 180,
    height: 70,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    height: 120,
  },
  contentCompact: {
    padding: 10,
    height: 70,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },

  // Score Circle
  scoreContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainerCompact: {
    width: 50,
    height: 50,
  },
  scoreCanvas: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  scoreCanvasCompact: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  scoreTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreTextContainerCompact: {
    position: 'absolute',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  scoreNumberCompact: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -2,
  },

  // Level
  levelContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  levelContainerCompact: {
    marginLeft: 8,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelIcon: {
    fontSize: 18,
  },
  levelTextContainer: {
    marginTop: 4,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  levelTitleCompact: {
    fontSize: 12,
    fontWeight: '500',
  },
  levelDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  // Progress
  progressContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
  },
  progressText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Inline Badge
  inlineContainer: {
    width: 70,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inlineCanvas: {
    position: 'absolute',
    width: 70,
    height: 28,
  },
  inlineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  inlineIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  inlineScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Breakdown
  breakdownContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownHeader: {
    width: 110,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#475569',
  },
  breakdownWeight: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownScore: {
    width: 30,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default CRSBadgeDisplay;
