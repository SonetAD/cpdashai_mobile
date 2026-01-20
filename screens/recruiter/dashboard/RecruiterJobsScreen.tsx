import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  useGetMyJobPostingsQuery,
  useDeleteJobPostingMutation,
} from '../../../services/api';
import TalentPartnerLayout from '../../../components/layouts/TalentPartnerLayout';
import { useAlert } from '../../../contexts/AlertContext';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassSectionCard } from '../../../components/ui/GlassSectionCard';

// Glass styling constants
const GLASS_COLORS = {
  cardBg: 'rgba(255, 255, 255, 0.85)',
  cardBorder: 'rgba(255, 255, 255, 0.6)',
  filterActive: 'rgba(67, 126, 244, 0.95)',
  filterInactive: 'rgba(255, 255, 255, 0.8)',
  statusActive: 'rgba(16, 185, 129, 0.9)',
  statusDraft: 'rgba(156, 163, 175, 0.9)',
  statusPaused: 'rgba(255, 204, 0, 0.9)',
  statusClosed: 'rgba(239, 68, 68, 0.9)',
  statusFilled: 'rgba(67, 126, 244, 0.9)',
};

interface JobPostingCardProps {
  jobPosting: any;
  onPress: (jobId: string) => void;
  onEdit: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onViewApplications: (jobId: string) => void;
}

const JobPostingCard: React.FC<JobPostingCardProps> = ({
  jobPosting,
  onPress,
  onEdit,
  onDelete,
  onViewApplications,
}) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: GLASS_COLORS.statusDraft,
      active: GLASS_COLORS.statusActive,
      paused: GLASS_COLORS.statusPaused,
      closed: GLASS_COLORS.statusClosed,
      filled: GLASS_COLORS.statusFilled,
    };
    return colors[status] || GLASS_COLORS.statusDraft;
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(jobPosting.id);
  };

  const handleViewApplications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewApplications(jobPosting.id);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(jobPosting.id);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(jobPosting.id);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={glassStyles.jobCard}
      activeOpacity={0.7}
    >
      {/* Status Badge */}
      <View style={glassStyles.cardHeader}>
        <View
          style={[
            glassStyles.statusBadge,
            { backgroundColor: getStatusColor(jobPosting.status) }
          ]}
        >
          <Text style={glassStyles.statusText}>
            {getStatusText(jobPosting.status)}
          </Text>
        </View>
        <Text style={glassStyles.dateText}>
          Posted: {new Date(jobPosting.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Job Title */}
      <Text style={glassStyles.jobTitle}>{jobPosting.title}</Text>

      {/* Company Name */}
      <Text style={glassStyles.companyName}>
        {jobPosting.companyName}
      </Text>

      {/* Stats */}
      <View style={glassStyles.statsContainer}>
        <View style={glassStyles.statItem}>
          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
            <Path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#6B7280" />
          </Svg>
          <Text style={glassStyles.statText}>{jobPosting.applicationsCount} applications</Text>
        </View>
      </View>

      {/* Actions - Glass Buttons */}
      <View style={glassStyles.actionsContainer}>
        <View style={glassStyles.actionButtonWrapper}>
          <GlassButton
            text="Applications"
            colors={['#437EF4', '#6366F1']}
            onPress={handleViewApplications}
            height={40}
            borderRadius={12}
            fullWidth
            textStyle={glassStyles.actionButtonText}
            style={glassStyles.actionButton}
          />
        </View>
        <View style={glassStyles.actionButtonWrapperSmall}>
          <GlassButton
            text="Edit"
            colors={['#10B981', '#34D399']}
            onPress={handleEdit}
            height={40}
            borderRadius={12}
            fullWidth
            textStyle={glassStyles.actionButtonText}
            style={glassStyles.actionButton}
          />
        </View>
        <View style={glassStyles.actionButtonWrapperSmall}>
          <GlassButton
            text="Delete"
            colors={['#EF4444', '#F87171']}
            onPress={handleDelete}
            height={40}
            borderRadius={12}
            fullWidth
            textStyle={glassStyles.actionButtonText}
            style={glassStyles.actionButton}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface RecruiterJobsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  userName?: string;
  onBack?: () => void;
  onCreateJob?: () => void;
  onEditJob?: (jobId: string) => void;
  onViewJob?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
}

export default function RecruiterJobsScreen({
  activeTab = 'dashboard',
  onTabChange,
  userName = 'User',
  onBack,
  onCreateJob,
  onEditJob,
  onViewJob,
  onViewApplications,
}: RecruiterJobsScreenProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { showAlert } = useAlert();

  const { data, isLoading, error, refetch } = useGetMyJobPostingsQuery({
    status: statusFilter,
  });

  const [deleteJobPosting, { isLoading: isDeleting }] = useDeleteJobPostingMutation();

  const handleDelete = async (jobId: string) => {
    showAlert({
      type: 'error',
      title: 'Delete Job Posting',
      message: 'Are you sure you want to delete this job posting? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteJobPosting({ jobId }).unwrap();
              if (result.deleteJobPosting.success) {
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Job posting deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }]
                });
                refetch();
              }
            } catch (err: any) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: err?.data?.deleteJobPosting?.message || 'Failed to delete job posting',
                buttons: [{ text: 'OK', style: 'default' }]
              });
            }
          },
        },
      ]
    });
  };

  const handleEdit = (jobId: string) => {
    if (onEditJob) {
      onEditJob(jobId);
    }
  };

  const handleViewApplicationsAction = (jobId: string) => {
    if (onViewApplications) {
      onViewApplications(jobId);
    }
  };

  const handleJobPress = (jobId: string) => {
    if (onViewJob) {
      onViewJob(jobId);
    }
  };

  const handleCreateJob = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onCreateJob) {
      onCreateJob();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    }
  };

  const handleFilterChange = (value: string | undefined) => {
    Haptics.selectionAsync();
    setStatusFilter(value);
  };

  const statusOptions = [
    { label: 'All', value: undefined },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' },
    { label: 'Paused', value: 'paused' },
    { label: 'Closed', value: 'closed' },
    { label: 'Filled', value: 'filled' },
  ];

  return (
    <TalentPartnerLayout
      title="Job Postings"
      subtitle={`${data?.myJobPostings?.length || 0} active posting(s)`}
    >
      {/* Create Job Button */}
      <View style={glassStyles.headerContainer}>
        <View style={glassStyles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={handleBack} style={glassStyles.backButton}>
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Path
                  d="M15 18L9 12L15 6"
                  stroke="#437EF4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={glassStyles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <GlassButton
            onPress={handleCreateJob}
            colors={['#437EF4', '#5B8AF5']}
            height={44}
            borderRadius={12}
            fullWidth={false}
            style={{ paddingHorizontal: 20, minWidth: 130 }}
          >
            <View style={glassStyles.createButtonContent}>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                <Path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={glassStyles.createButtonText}>New Job</Text>
            </View>
          </GlassButton>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View style={glassStyles.contentContainer}>
          {/* Filter Tabs - Glass Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={glassStyles.filterScrollView}
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => handleFilterChange(option.value)}
                style={[
                  glassStyles.filterPill,
                  statusFilter === option.value
                    ? glassStyles.filterPillActive
                    : glassStyles.filterPillInactive
                ]}
              >
                <Text
                  style={[
                    glassStyles.filterPillText,
                    statusFilter === option.value
                      ? glassStyles.filterPillTextActive
                      : glassStyles.filterPillTextInactive
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Loading State */}
          {isLoading && !data && (
            <GlassSectionCard style={glassStyles.loadingCard}>
              <ActivityIndicator size="large" color="#437EF4" />
              <Text style={glassStyles.loadingText}>Loading job postings...</Text>
            </GlassSectionCard>
          )}

          {/* Error State */}
          {error && (
            <GlassSectionCard style={glassStyles.errorCard}>
              <Text style={glassStyles.errorText}>
                Error loading job postings. Please try again.
              </Text>
            </GlassSectionCard>
          )}

          {/* No Jobs State */}
          {!isLoading && data?.myJobPostings?.length === 0 && (
            <GlassSectionCard style={glassStyles.emptyCard}>
              <Text style={glassStyles.emptyTitle}>
                No Job Postings Yet
              </Text>
              <Text style={glassStyles.emptySubtitle}>
                Create your first job posting to start receiving applications
              </Text>
              <GlassButton
                text="Create Job Posting"
                colors={['#437EF4', '#5B8AF5']}
                onPress={handleCreateJob}
                height={44}
                borderRadius={12}
                fullWidth
              />
            </GlassSectionCard>
          )}

          {/* Job Postings List */}
          {data?.myJobPostings?.map((jobPosting: any) => (
            <JobPostingCard
              key={jobPosting.id}
              jobPosting={jobPosting}
              onPress={handleJobPress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewApplications={handleViewApplicationsAction}
            />
          ))}

          {/* Bottom padding for navbar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </TalentPartnerLayout>
  );
}

// Glass design styles
const glassStyles = StyleSheet.create({
  // Header styles
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#437EF4',
    fontWeight: '600',
    fontSize: 14,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Content container
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // Filter pills
  filterScrollView: {
    marginBottom: 24,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillActive: {
    backgroundColor: GLASS_COLORS.filterActive,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterPillInactive: {
    backgroundColor: GLASS_COLORS.filterInactive,
    borderColor: 'rgba(200, 200, 200, 0.3)',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#4B5563',
  },

  // Job Card styles
  jobCard: {
    backgroundColor: GLASS_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GLASS_COLORS.cardBorder,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  jobTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  companyName: {
    color: '#437EF4',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#6B7280',
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButtonWrapper: {
    flex: 1.4,
    shadowColor: '#437EF4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 12,
  },
  actionButtonWrapperSmall: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 12,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Loading state
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 16,
    fontSize: 14,
  },

  // Error state
  errorCard: {
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
