import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { GlassSectionCard } from './ui/GlassSectionCard';
import { useAlert } from '../contexts/AlertContext';
import {
  Mission,
  useSkipMissionMutation,
} from '../services/api';
import { handleApiError } from '../utils/errorHandler';

// Mission Type Icons
const DocumentIcon = ({ color = '#437EF4' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MicIcon = ({ color = '#06B6D4' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M19 12C19 15.866 15.866 19 12 19M12 19C8.13401 19 5 15.866 5 12M12 19V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StarIcon = ({ color = '#8B5CF6' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HeartIcon = ({ color = '#EC4899' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LightningIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BriefcaseIcon = ({ color = '#10B981' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ color = '#10B981' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TimerIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="14" r="8" stroke={color} strokeWidth="2" />
    <Path d="M12 10V14L14 16M12 2V6M9 3H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDownIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TargetSmallIcon = ({ color = '#10B981' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// Mission type icon mapping
const getMissionIcon = (missionType: string) => {
  switch (missionType) {
    case 'cv_improvement':
      return <DocumentIcon color="#437EF4" />;
    case 'interview_practice':
      return <MicIcon color="#06B6D4" />;
    case 'skill_evidence':
      return <StarIcon color="#8B5CF6" />;
    case 'wellbeing':
      return <HeartIcon color="#EC4899" />;
    case 'engagement':
      return <LightningIcon color="#F59E0B" />;
    case 'application':
      return <BriefcaseIcon color="#10B981" />;
    default:
      return <StarIcon color="#6B7280" />;
  }
};

// Mission type colors
const getMissionTypeColor = (missionType: string): string => {
  switch (missionType) {
    case 'cv_improvement':
      return '#437EF4';
    case 'interview_practice':
      return '#06B6D4';
    case 'skill_evidence':
      return '#8B5CF6';
    case 'wellbeing':
      return '#EC4899';
    case 'engagement':
      return '#F59E0B';
    case 'application':
      return '#10B981';
    default:
      return '#6B7280';
  }
};

// Difficulty colors
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return '#10B981';
    case 'medium':
      return '#F59E0B';
    case 'hard':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

// Status colors
const getStatusStyles = (status: string, isOverdue: boolean) => {
  if (isOverdue) {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      textColor: '#EF4444',
    };
  }

  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'IN_PROGRESS':
      return {
        backgroundColor: 'rgba(67, 126, 244, 0.1)',
        borderColor: 'rgba(67, 126, 244, 0.3)',
        textColor: '#437EF4',
      };
    case 'COMPLETED':
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        textColor: '#10B981',
      };
    case 'SKIPPED':
      return {
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderColor: 'rgba(107, 114, 128, 0.3)',
        textColor: '#6B7280',
      };
    default:
      return {
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        borderColor: 'rgba(107, 114, 128, 0.3)',
        textColor: '#6B7280',
      };
  }
};

interface MissionCardProps {
  mission: Mission;
  onRefresh: () => void;
}

export default function MissionCard({ mission, onRefresh }: MissionCardProps) {
  const { showAlert } = useAlert();
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // API hooks
  const [skipMission, { isLoading: isSkipping }] = useSkipMissionMutation();

  const statusStyles = getStatusStyles(mission.status, mission.isOverdue);
  const typeColor = getMissionTypeColor(mission.missionType);
  const difficultyColor = getDifficultyColor(mission.difficulty);
  const statusUpper = mission.status.toUpperCase();
  const isActive = statusUpper === 'ACTIVE' || statusUpper === 'IN_PROGRESS';
  const isCompleted = statusUpper === 'COMPLETED';
  const isSkipped = statusUpper === 'SKIPPED';

  // Handle skip mission
  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await skipMission({
        missionId: mission.id,
        reason: skipReason.trim() || undefined,
      }).unwrap();

      if (result.skipMission.__typename === 'MissionSuccessType' && result.skipMission.success) {
        setShowSkipModal(false);
        setSkipReason('');
        onRefresh();
      } else if (result.skipMission.__typename === 'ErrorType') {
        throw new Error(result.skipMission.message || 'Failed to skip mission');
      }
    } catch (error) {
      await handleApiError(error, showAlert, {
        onRetry: handleSkip,
      });
    }
  };

  return (
    <>
      <GlassSectionCard
        style={{
          ...styles.card,
          ...(isSkipped ? styles.cardSkipped : {}),
          ...(mission.isOverdue ? styles.cardOverdue : {}),
        }}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${typeColor}15` }]}>
            {getMissionIcon(mission.missionType)}
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.title, isSkipped && styles.titleSkipped]} numberOfLines={2}>
              {mission.title}
            </Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: `${difficultyColor}20` }]}>
                <Text style={[styles.badgeText, { color: difficultyColor }]}>
                  {mission.difficultyDisplay}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${typeColor}20` }]}>
                <Text style={[styles.badgeText, { color: typeColor }]}>
                  {mission.missionTypeDisplay}
                </Text>
              </View>
            </View>
          </View>
          {/* Only show status badge for completed or overdue missions */}
          {(isCompleted || (mission.isOverdue && !isSkipped)) && (
            <View style={[styles.statusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
              {isCompleted && <CheckIcon color={statusStyles.textColor} />}
              {mission.isOverdue && !isCompleted && !isSkipped && (
                <ClockIcon color={statusStyles.textColor} />
              )}
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, isSkipped && styles.descriptionSkipped]} numberOfLines={isExpanded ? undefined : 2}>
          {mission.description}
        </Text>

        {/* Meta Info Row (estimated time) */}
        {(mission.estimatedTimeMinutes || mission.successCriteria) && (
          <View style={styles.metaRow}>
            {mission.estimatedTimeMinutes && (
              <View style={styles.metaItem}>
                <TimerIcon color="#6B7280" />
                <Text style={styles.metaText}>~{mission.estimatedTimeMinutes} min</Text>
              </View>
            )}
            {mission.successCriteria && (
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isExpanded ? 'Less' : 'Details'}
                </Text>
                <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                  <ChevronDownIcon color="#437EF4" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Expanded Content - Success Criteria */}
        {isExpanded && mission.successCriteria && (
          <View style={styles.expandedContent}>
            <View style={styles.successCriteriaHeader}>
              <TargetSmallIcon color="#10B981" />
              <Text style={styles.successCriteriaTitle}>Success Criteria</Text>
            </View>
            <Text style={styles.successCriteriaText}>{mission.successCriteria}</Text>
          </View>
        )}

        {/* Progress Bar (for active missions) */}
        {isActive && mission.progressPercentage > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${mission.progressPercentage}%`, backgroundColor: typeColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{mission.progressPercentage}%</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>+{mission.crsPointsReward} CRS</Text>
            </View>
            {mission.daysRemaining !== undefined && isActive && (
              <View style={styles.dueDateContainer}>
                <ClockIcon color={mission.isOverdue ? '#EF4444' : '#6B7280'} />
                <Text style={[styles.dueText, mission.isOverdue && styles.dueTextOverdue]}>
                  {mission.isOverdue ? 'Overdue' : `${mission.daysRemaining} days left`}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {isActive && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => setShowSkipModal(true)}
              disabled={isSkipping}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassSectionCard>

      {/* Skip Modal */}
      <Modal
        visible={showSkipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skip Mission?</Text>
            <Text style={styles.modalSubtitle}>
              Don't worry - skipping won't affect your CRS score! Tell us why you're skipping (optional):
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for skipping..."
              placeholderTextColor="#9CA3AF"
              value={skipReason}
              onChangeText={setSkipReason}
              multiline
              maxLength={200}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSkipModal(false);
                  setSkipReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleSkip}
                disabled={isSkipping}
              >
                {isSkipping ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Skip Mission</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  cardSkipped: {
    opacity: 0.6,
  },
  cardOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  titleSkipped: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  descriptionSkipped: {
    color: '#9CA3AF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 36,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 12,
    color: '#6B7280',
  },
  dueTextOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#437EF4',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#437EF4',
  },
  expandedContent: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  successCriteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  successCriteriaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  successCriteriaText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
});
