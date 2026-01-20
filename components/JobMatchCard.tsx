import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { GlassButton } from './ui/GlassButton';
import { useFeatureAccess } from '../contexts/FeatureGateContext';

// Types
export interface JobMatchCardData {
  id: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation?: string;
  isSaved?: boolean;
  isApplied?: boolean;
  jobPosting: {
    id: string;
    title: string;
    companyName: string;
    description: string;
    location: string;
    workMode: 'remote' | 'onsite' | 'hybrid';
    jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
    requiredSkills: string[];
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
  };
}

interface JobMatchCardProps {
  data: JobMatchCardData;
  onViewDetails?: () => void;
  onApply?: () => void;
  width?: number;
}

// Helper function to format job type
const formatJobType = (jobType: string): string => {
  const formats: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    freelance: 'Freelance',
  };
  return formats[jobType] || jobType;
};

// Helper function to format work mode
const formatWorkMode = (workMode: string): string => {
  const formats: Record<string, string> = {
    remote: 'Remote',
    onsite: 'On-site',
    hybrid: 'Hybrid',
  };
  return formats[workMode] || workMode;
};

// Helper function to format salary
const formatSalary = (min?: number, max?: number, currency?: string): string => {
  if (!min && !max) return '';
  const curr = currency || 'USD';
  const formatNum = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };
  if (min && max) {
    return `$${formatNum(min)} - $${formatNum(max)} / year`;
  }
  if (min) return `$${formatNum(min)}+ / year`;
  if (max) return `Up to $${formatNum(max)} / year`;
  return '';
};

// Idea/Lightbulb Icon for AI Insight
const IdeaIcon = () => (
  <Svg width={17} height={18} viewBox="0 0 17 18" fill="none">
    <Path
      d="M8.5 1.5V2.5M8.5 15.5V16.5M1.5 8.5H2.5M14.5 8.5H15.5M3.4 3.4L4.1 4.1M12.9 12.9L13.6 13.6M3.4 13.6L4.1 12.9M12.9 4.1L13.6 3.4"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Path
      d="M6 12.5V13C6 14.1046 6.89543 15 8 15H9C10.1046 15 11 14.1046 11 13V12.5M8.5 12.5V10.5M5.5 8.5C5.5 6.84315 6.84315 5.5 8.5 5.5C10.1569 5.5 11.5 6.84315 11.5 8.5C11.5 9.67816 10.8284 10.7076 9.84849 11.2076C9.32914 11.4729 9 12.0051 9 12.5H8C8 12.0051 7.67086 11.4729 7.15151 11.2076C6.17157 10.7076 5.5 9.67816 5.5 8.5Z"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

// Lock icon for locked features
const LockIconSmall = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
      stroke="#9CA3AF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
      stroke="#9CA3AF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const JobMatchCard = memo(({ data, onViewDetails, onApply, width }: JobMatchCardProps) => {
  const router = useRouter();
  const { matchPercentage, matchedSkills, recommendation, jobPosting } = data;
  const { title, companyName, description, location, workMode, jobType, requiredSkills, salaryMin, salaryMax, salaryCurrency } = jobPosting;

  // Check feature access for job match insights
  const { hasAccess: hasMatchInsightsAccess, requiredLevelDisplay, isLoading: isLoadingFeatures } = useFeatureAccess('job_match_basic');

  // Show unlocked if has access (regardless of loading - uses CRS fallback now)
  const showUnlocked = hasMatchInsightsAccess;

  // Show up to 3 skills
  const displaySkills = (matchedSkills?.length > 0 ? matchedSkills : requiredSkills)?.slice(0, 3) || [];
  const salary = formatSalary(salaryMin, salaryMax, salaryCurrency);

  // Generate AI insight based on match percentage and skills
  const aiInsight = recommendation ||
    (matchPercentage >= 80
      ? `Great match! Your skills align well with this role - ${Math.round(matchPercentage)}% fit.`
      : matchPercentage >= 60
      ? `Good potential! You match ${Math.round(matchPercentage)}% of the requirements.`
      : `Consider upskilling - ${Math.round(matchPercentage)}% match. Review missing skills.`);

  const handleViewDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewDetails?.();
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply?.();
  };

  const handleUnlockPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(candidate)/(tabs)/profile/full-profile' as any);
  };

  // Calculate badge width based on percentage digits
  const badgeText = `${Math.round(matchPercentage)}% Fit`;
  const badgeWidth = badgeText.length * 9 + 44; // Approximate width based on text + dot + padding

  return (
    <View style={[styles.card, width ? { width } : {}]}>
      {/* Match Percentage Badge - Gated by job_match_basic feature */}
      {showUnlocked ? (
        <View style={styles.matchBadge}>
          <View style={styles.matchDot} />
          <Text style={styles.matchText}>{badgeText}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.lockedMatchBadge} onPress={handleUnlockPress} activeOpacity={0.7}>
          <LockIconSmall />
          <Text style={styles.lockedMatchText}>Match % Locked</Text>
          <View style={styles.unlockHint}>
            <Text style={styles.unlockHintText}>{requiredLevelDisplay || 'Skill Building'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Job Title */}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>{description}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Company Name */}
      <Text style={styles.companyName}>{companyName}</Text>

      {/* Job Details */}
      <View style={styles.detailsList}>
        <View style={styles.detailItem}>
          <View style={styles.bullet} />
          <Text style={styles.detailText}>{formatWorkMode(workMode)} - {location}</Text>
        </View>
        <View style={styles.detailItem}>
          <View style={styles.bullet} />
          <Text style={styles.detailText}>{formatJobType(jobType)}</Text>
        </View>
        {salary && (
          <View style={styles.detailItem}>
            <View style={styles.bullet} />
            <Text style={styles.detailText}>{salary}</Text>
          </View>
        )}
      </View>

      {/* Skills Tags */}
      {displaySkills.length > 0 && (
        <View style={styles.skillsContainer}>
          {displaySkills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Insight - Gated by job_match_basic feature */}
      {showUnlocked ? (
        <View style={styles.aiInsightContainer}>
          <IdeaIcon />
          <Text style={styles.aiInsightText}>AI Insight: {aiInsight}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.lockedAiInsightContainer} onPress={handleUnlockPress} activeOpacity={0.7}>
          <LockIconSmall />
          <View style={styles.lockedAiInsightContent}>
            <Text style={styles.lockedAiInsightTitle}>AI Match Insights Locked</Text>
            <Text style={styles.lockedAiInsightSubtext}>
              Complete your profile to unlock personalized job insights
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <GlassButton
          text="View Details"
          width={(width ? (width - 40 - 12) / 2 : 140)}
          height={48}
          borderRadius={24}
          colors={['#F5F5F5', '#EBEBEB']}
          shadowColor="rgba(156, 163, 175, 0.5)"
          onPress={handleViewDetails}
          textStyle={{ color: '#6B7280', fontWeight: '600' }}
        />
        <GlassButton
          text="Apply now"
          width={(width ? (width - 40 - 12) / 2 : 140)}
          height={48}
          borderRadius={24}
          colors={['#437EF4', '#2563EB']}
          shadowColor="rgba(37, 99, 235, 0.7)"
          onPress={handleApply}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    // Glass effect border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Shadow - more dense
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  lockedMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  lockedMatchText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  unlockHint: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unlockHintText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#437EF4',
    marginRight: 8,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#437EF4',
    marginBottom: 12,
  },
  detailsList: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  aiInsightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 10,
    lineHeight: 18,
  },
  lockedAiInsightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  lockedAiInsightContent: {
    flex: 1,
    marginLeft: 12,
  },
  lockedAiInsightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  lockedAiInsightSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    paddingBottom: 8,
  },
});

export default JobMatchCard;
