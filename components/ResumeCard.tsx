import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Import SVG icons
import EditIcon from '../assets/images/cvUpload/edit.svg';
import DeleteIcon from '../assets/images/cvUpload/delete.svg';
import DownloadIcon from '../assets/images/cvUpload/download.svg';

export interface ResumeCardData {
  id: string;
  fullName: string;
  email?: string;
  title?: string;
  atsScore?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  updatedAt?: string;
  createdAt?: string;
}

interface ResumeCardProps {
  resume: ResumeCardData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onPress?: () => void;
}

// Format relative time
const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const ResumeCard = memo(({ resume, onEdit, onDelete, onDownload, onPress }: ResumeCardProps) => {
  const { fullName, title, atsScore, status, updatedAt, createdAt } = resume;

  const displayTitle = title || fullName || 'My Resume';
  const lastUpdated = formatRelativeTime(updatedAt || createdAt);
  const showAtsScore = status === 'completed' && atsScore !== undefined;

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit?.();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDelete?.();
  };

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDownload?.();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {displayTitle}
          </Text>
          {lastUpdated && (
            <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
          )}
        </View>

        {/* ATS Score Badge with mixed horizontal gradient */}
        {showAtsScore && (
          <LinearGradient
            colors={['#06B6D4', '#6366F1', '#8B5CF6', '#A855F7']}
            locations={[0, 0.4, 0.7, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.atsBadge}
          >
            <Text style={styles.atsText}>ATS Score: {atsScore}%</Text>
          </LinearGradient>
        )}

        {/* Status Badge for non-completed */}
        {status !== 'completed' && (
          <View style={[
            styles.statusBadge,
            status === 'processing' && styles.statusProcessing,
            status === 'pending' && styles.statusPending,
            status === 'failed' && styles.statusFailed,
          ]}>
            <Text style={[
              styles.statusText,
              status === 'processing' && styles.statusTextProcessing,
              status === 'failed' && styles.statusTextFailed,
            ]}>
              {status === 'processing' ? 'Processing...' :
               status === 'pending' ? 'Pending' :
               status === 'failed' ? 'Failed' : status}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Edit Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleEdit();
          }}
        >
          <EditIcon width={70} height={40} />
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <DeleteIcon width={70} height={40} />
        </TouchableOpacity>

        {/* Download Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          <DownloadIcon width={70} height={40} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    // Glass effect border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Dense shadow like job card fit badge
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  atsBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  atsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  statusProcessing: {
    backgroundColor: '#FEF3C7',
  },
  statusPending: {
    backgroundColor: '#E5E7EB',
  },
  statusFailed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusTextProcessing: {
    color: '#D97706',
  },
  statusTextFailed: {
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});

export default ResumeCard;
