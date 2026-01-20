import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { GlassButton } from '../../../components/ui/GlassButton';
import { GlassSectionCard } from '../../../components/ui/GlassSectionCard';
import MissionCard from '../../../components/MissionCard';
import { useAlert } from '../../../contexts/AlertContext';
import {
  useGetMyMissionsQuery,
  useGetMissionStatsQuery,
  useGenerateWeeklyMissionsMutation,
  Mission,
} from '../../../services/api';
import { handleApiError } from '../../../utils/errorHandler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icons
const BackArrowIcon = ({ color = '#1F2937' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrophyIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 21h8M12 17v4M17 5V3H7v2M7 5H4v4c0 2.21 1.79 4 4 4M17 5h3v4c0 2.21-1.79 4-4 4M7 5c0 4.97 2.02 9 5 9M17 5c0 4.97-2.02 9-5 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FlameIcon = ({ color = '#EF4444' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c4.97 0 9-4.03 9-9 0-4.03-2.67-7.47-5.33-9.47-.67-.5-1.67 0-1.67.87 0 1.27-.53 2.4-1.4 3.2L12 8l-.6-.4c-.87-.8-1.4-1.93-1.4-3.2 0-.87-1-.87-1.67-.87C5.67 5.53 3 9 3 13c0 4.97 4.03 9 9 9z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TargetIcon = ({ color = '#10B981' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const SparklesIcon = ({ color = '#8B5CF6' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v2M19.07 4.93l-1.41 1.41M21 12h-2M19.07 19.07l-1.41-1.41M12 21v-2M5.93 19.07l1.41-1.41M3 12h2M5.93 4.93l1.41 1.41"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

const StarIcon = ({ color = '#F59E0B' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

type FilterTab = 'all' | 'active' | 'completed' | 'skipped';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'skipped', label: 'Skipped' },
];

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // API hooks - fetch all user missions
  const {
    data: missionsData,
    isLoading,
    refetch,
    error,
  } = useGetMyMissionsQuery();

  // Fetch mission stats (streaks, total points)
  const { data: statsData } = useGetMissionStatsQuery();

  const [generateMissions, { isLoading: isGenerating }] = useGenerateWeeklyMissionsMutation();

  // Extract data from API responses
  const myMissions = missionsData?.myMissions;
  const missions = myMissions?.missions || [];
  const missionStats = statsData?.missionStats;

  // Calculate stats from API response or fallback to local calculation
  const stats = useMemo(() => {
    const active = myMissions?.activeCount ?? missions.filter(m => m.status.toUpperCase() === 'ACTIVE' || m.status.toUpperCase() === 'IN_PROGRESS').length;
    const completed = myMissions?.completedCount ?? missions.filter(m => m.status.toUpperCase() === 'COMPLETED').length;
    const skipped = missions.filter(m => m.status.toUpperCase() === 'SKIPPED').length;
    const total = myMissions?.totalCount ?? missions.length;

    return { active, completed, skipped, total };
  }, [missions, myMissions]);

  // Calculate points from missions
  const totalPointsAvailable = useMemo(() => {
    return missions.reduce((sum, m) => sum + (m.crsPointsReward || 0), 0);
  }, [missions]);

  const pointsEarned = useMemo(() => {
    return missions
      .filter(m => m.status.toUpperCase() === 'COMPLETED')
      .reduce((sum, m) => sum + (m.crsPointsReward || 0), 0);
  }, [missions]);

  const completionRate = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }, [stats]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Generate weekly missions
  const handleGenerateMissions = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await generateMissions().unwrap();

      if (result.generateWeeklyMissions.__typename === 'MissionSuccessType' && result.generateWeeklyMissions.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: 'success',
          title: 'Missions Generated!',
          message: result.generateWeeklyMissions.mission
            ? `New mission "${result.generateWeeklyMissions.mission.title}" is ready!`
            : 'Your weekly missions are ready!',
          buttons: [{ text: 'Let\'s Go!' }],
        });
        refetch();
      } else if (result.generateWeeklyMissions.__typename === 'ErrorType') {
        throw new Error(result.generateWeeklyMissions.message || 'Failed to generate missions');
      }
    } catch (error) {
      await handleApiError(error, showAlert, {
        onRetry: handleGenerateMissions,
        featureName: 'Weekly Missions',
      });
    }
  };

  // Filter change handler
  const handleFilterChange = (filter: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  // Navigation
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Filter and sort missions by status (skipped missions always at the end)
  const filteredMissions = useMemo(() => {
    const filtered = missions.filter((mission) => {
      const statusUpper = mission.status.toUpperCase();
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return statusUpper === 'ACTIVE' || statusUpper === 'IN_PROGRESS';
      if (activeFilter === 'completed') return statusUpper === 'COMPLETED';
      if (activeFilter === 'skipped') return statusUpper === 'SKIPPED';
      return true;
    });

    // Sort: Active first, then Completed, then Skipped at the end
    return filtered.sort((a, b) => {
      const statusA = a.status.toUpperCase();
      const statusB = b.status.toUpperCase();

      const getStatusPriority = (status: string) => {
        if (status === 'ACTIVE' || status === 'IN_PROGRESS') return 0;
        if (status === 'COMPLETED') return 1;
        if (status === 'SKIPPED') return 2;
        return 3;
      };

      return getStatusPriority(statusA) - getStatusPriority(statusB);
    });
  }, [missions, activeFilter]);

  return (
    <CandidateLayout hideHeader>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>My Missions</Text>
          </View>
          {/* Empty spacer for layout balance - invisible */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsCardsRow}>
          {/* Streak Card */}
          <View style={styles.miniStatCard}>
            <View style={[styles.miniStatIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <FlameIcon color="#EF4444" />
            </View>
            <Text style={styles.miniStatValue}>{missionStats?.currentStreak || 0}</Text>
            <Text style={styles.miniStatLabel}>Day Streak</Text>
          </View>

          {/* Completed Card */}
          <View style={styles.miniStatCard}>
            <View style={[styles.miniStatIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <TargetIcon color="#10B981" />
            </View>
            <Text style={styles.miniStatValue}>{missionStats?.totalCompleted || stats.completed}</Text>
            <Text style={styles.miniStatLabel}>Completed</Text>
          </View>

          {/* Points Card */}
          <View style={styles.miniStatCard}>
            <View style={[styles.miniStatIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <TrophyIcon color="#F59E0B" />
            </View>
            <Text style={styles.miniStatValue}>{missionStats?.totalPointsEarned || pointsEarned}</Text>
            <Text style={styles.miniStatLabel}>CRS Points</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{Math.round(completionRate)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${completionRate}%` }]}
              />
            </View>
          </View>

          {/* Progress Stats */}
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>{stats.completed}/{stats.total}</Text>
              <Text style={styles.progressStatLabel}>missions done</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>+{pointsEarned}</Text>
              <Text style={styles.progressStatLabel}>points earned</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatValue}>{totalPointsAvailable - pointsEarned}</Text>
              <Text style={styles.progressStatLabel}>available</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#437EF4"
            colors={['#437EF4']}
          />
        }
      >
        {/* Filter Header with Dropdown */}
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Your Missions</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.filterDropdownButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilterDropdown(!showFilterDropdown);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownText}>
                {FILTER_TABS.find(t => t.id === activeFilter)?.label}
              </Text>
              <View style={styles.filterDropdownBadge}>
                <Text style={styles.filterDropdownBadgeText}>
                  {activeFilter === 'all' ? stats.total :
                   activeFilter === 'active' ? stats.active :
                   activeFilter === 'completed' ? stats.completed :
                   stats.skipped}
                </Text>
              </View>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: showFilterDropdown ? '180deg' : '0deg' }] }}>
                <Path d="M6 9l6 6 6-6" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showFilterDropdown && (
              <View style={styles.filterDropdownMenu}>
                {FILTER_TABS.map((tab) => {
                  const count = tab.id === 'all' ? stats.total :
                               tab.id === 'active' ? stats.active :
                               tab.id === 'completed' ? stats.completed :
                               stats.skipped;
                  const isSelected = activeFilter === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.filterDropdownItem,
                        isSelected && styles.filterDropdownItemSelected,
                      ]}
                      onPress={() => {
                        handleFilterChange(tab.id);
                        setShowFilterDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.filterDropdownItemContent}>
                        <Text style={[
                          styles.filterDropdownItemText,
                          isSelected && styles.filterDropdownItemTextSelected,
                        ]}>
                          {tab.label}
                        </Text>
                        <View style={[
                          styles.filterDropdownItemBadge,
                          isSelected && styles.filterDropdownItemBadgeSelected,
                        ]}>
                          <Text style={[
                            styles.filterDropdownItemBadgeText,
                            isSelected && styles.filterDropdownItemBadgeTextSelected,
                          ]}>
                            {count}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#437EF4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Overlay to close dropdown when clicking outside */}
        {showFilterDropdown && (
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => setShowFilterDropdown(false)}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#437EF4" />
            <Text style={styles.loadingText}>Loading your missions...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <GlassSectionCard style={styles.stateCard}>
            <View style={styles.stateIconContainer}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
                <Path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateSubtitle}>
              We couldn't load your missions. Please check your connection and try again.
            </Text>
            <GlassButton
              text="Retry"
              colors={['#437EF4', '#6366F1']}
              width={150}
              height={44}
              onPress={() => refetch()}
              style={{ marginTop: 20 }}
            />
          </GlassSectionCard>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredMissions.length === 0 && (
          <GlassSectionCard style={styles.stateCard}>
            <View style={styles.stateIconContainer}>
              <SparklesIcon color="#8B5CF6" />
            </View>
            <Text style={styles.stateTitle}>
              {activeFilter === 'all'
                ? 'No missions yet'
                : `No ${activeFilter} missions`}
            </Text>
            <Text style={styles.stateSubtitle}>
              {activeFilter === 'all'
                ? 'Generate your weekly missions to start earning CRS points and boost your career readiness!'
                : `You don't have any ${activeFilter} missions this week.`}
            </Text>
            {activeFilter === 'all' && (
              <GlassButton
                text={isGenerating ? 'Generating...' : 'Generate My Missions'}
                colors={['#8B5CF6', '#6366F1']}
                width={220}
                height={50}
                onPress={handleGenerateMissions}
                disabled={isGenerating}
                loading={isGenerating}
                style={{ marginTop: 24 }}
              />
            )}
          </GlassSectionCard>
        )}

        {/* Missions List */}
        {!isLoading && !error && filteredMissions.length > 0 && (
          <View style={styles.missionsList}>
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission as Mission}
                onRefresh={refetch}
              />
            ))}
          </View>
        )}

        {/* Generate More Button */}
        {!isLoading && !error && stats.active === 0 && missions.length > 0 && (
          <View style={styles.generateMoreContainer}>
            <Text style={styles.generateMoreText}>
              All caught up! Generate new missions to keep progressing.
            </Text>
            <GlassButton
              text={isGenerating ? 'Generating...' : 'Generate New Missions'}
              colors={['#437EF4', '#6366F1']}
              width={SCREEN_WIDTH - 48}
              height={52}
              onPress={handleGenerateMissions}
              disabled={isGenerating}
              loading={isGenerating}
            />
          </View>
        )}

        {/* Best Streak Banner (if applicable) */}
        {missionStats && missionStats.bestStreak > 0 && missionStats.bestStreak > (missionStats.currentStreak || 0) && (
          <View style={styles.streakBanner}>
            <View style={styles.streakBannerContent}>
              <StarIcon color="#F59E0B" />
              <Text style={styles.streakBannerText}>
                Your best streak: {missionStats.bestStreak} days! Keep going to beat it!
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </CandidateLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  miniStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#437EF4',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  progressStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 100,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 101,
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterDropdownBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  filterDropdownBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#437EF4',
  },
  filterDropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 6,
    minWidth: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 102,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    borderRadius: 10,
  },
  filterDropdownItemSelected: {
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
  },
  filterDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterDropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  filterDropdownItemTextSelected: {
    fontWeight: '600',
    color: '#437EF4',
  },
  filterDropdownItemBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 26,
    alignItems: 'center',
  },
  filterDropdownItemBadgeSelected: {
    backgroundColor: '#EBF5FF',
  },
  filterDropdownItemBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterDropdownItemBadgeTextSelected: {
    color: '#437EF4',
    fontWeight: '700',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  stateCard: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  stateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  missionsList: {
    gap: 14,
  },
  generateMoreContainer: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
  },
  generateMoreText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  streakBanner: {
    marginTop: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  streakBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
});
