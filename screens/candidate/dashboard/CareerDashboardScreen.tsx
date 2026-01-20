import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { BarChart } from 'react-native-gifted-charts';
import {
  useGetCareerDashboardFullQuery,
  useGetMyProfileQuery,
  CareerDashboardMonthlyData,
} from '../../../services/api';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChevronDownIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface CareerDashboardScreenProps {
  onBack?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onSearchNavigate?: (route: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

// Chart Component using gifted-charts
const ScoreProgressChart = ({
  data,
  timeframe,
}: {
  data: CareerDashboardMonthlyData[];
  timeframe: 'WEEKLY' | 'MONTHLY';
}) => {
  // Take last 4 data points for better fit, or all if less than 4
  const displayData = data.length > 4 ? data.slice(-4) : data;

  // Calculate dynamic spacing based on number of data points
  const numGroups = displayData.length;
  const chartWidth = SCREEN_WIDTH - 100;
  const barWidth = 10;
  const barGap = 2;
  const barsPerGroup = 3;
  const groupWidth = (barWidth * barsPerGroup) + (barGap * (barsPerGroup - 1));

  // Calculate spacing between groups to evenly distribute them
  const yAxisWidth = 35;
  const availableWidth = chartWidth - yAxisWidth;

  // Determine logical position based on timeframe
  // Monthly: 12 slots (Jan=1, Feb=2, ..., Dec=12)
  // Weekly: 4 slots (W1, W2, W3, W4)
  const totalSlots = timeframe === 'WEEKLY' ? 4 : 12;

  // Calculate slot width for even distribution
  const slotWidth = availableWidth / totalSlots;

  // Get the position index from data (1-based)
  const getPositionIndex = (item: CareerDashboardMonthlyData, index: number): number => {
    if (timeframe === 'WEEKLY') {
      // Extract week number from "W1", "W2", etc.
      const weekMatch = item.month?.match(/W(\d+)/i);
      return weekMatch ? parseInt(weekMatch[1], 10) : index + 1;
    } else {
      // Get month index (Jan=1, Feb=2, etc.)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = monthNames.findIndex(m => item.month?.toLowerCase().startsWith(m.toLowerCase()));
      return monthIndex >= 0 ? monthIndex + 1 : index + 1;
    }
  };

  // For proper spacing calculation
  let groupSpacing: number = 20;
  let initialSpacingValue: number = 15;

  // Transform data for grouped bar chart with position-aware spacing
  const { barData, calculatedInitialSpacing } = useMemo(() => {
    const result: any[] = [];

    // Sort data by position index
    const sortedData = [...displayData].sort((a, b) => {
      const posA = getPositionIndex(a, displayData.indexOf(a));
      const posB = getPositionIndex(b, displayData.indexOf(b));
      return posA - posB;
    });

    // Calculate initial spacing based on first item's position
    let firstItemInitialSpacing = 15;
    if (sortedData.length > 0) {
      const firstPos = getPositionIndex(sortedData[0], 0);
      // Position the first bar at its logical slot
      // Slot position = (positionIndex - 1) * slotWidth + some offset to center in slot
      firstItemInitialSpacing = (firstPos - 1) * slotWidth + (slotWidth - groupWidth) / 2;
      // Ensure minimum spacing
      firstItemInitialSpacing = Math.max(firstItemInitialSpacing, 10);
    }

    sortedData.forEach((item, index) => {
      // Get label based on data - backend sends appropriate label for timeframe
      const label = item.month || item.monthFull || (timeframe === 'WEEKLY' ? `W${index + 1}` : `M${index + 1}`);

      // Calculate spacing to next item based on their position difference
      let spacingToNext = groupSpacing;
      if (index < sortedData.length - 1) {
        const currentPos = getPositionIndex(item, index);
        const nextPos = getPositionIndex(sortedData[index + 1], index + 1);
        const positionGap = nextPos - currentPos;
        // Space based on how many slots are between items
        spacingToNext = positionGap * slotWidth - groupWidth;
        spacingToNext = Math.max(spacingToNext, 5); // Minimum spacing
      }

      // CV Strength bar (green)
      result.push({
        value: item.cvStrength || 0,
        label: label,
        frontColor: '#22C55E',
        spacing: barGap,
        labelWidth: groupWidth + (index < sortedData.length - 1 ? spacingToNext : 0),
        labelTextStyle: {
          color: '#6B7280',
          fontSize: 11,
          fontWeight: '500',
        },
      });
      // Skills Match bar (orange)
      result.push({
        value: item.skillsMatch || 0,
        frontColor: '#F59E0B',
        spacing: barGap,
      });
      // Activities bar (red)
      result.push({
        value: item.activities || 0,
        frontColor: '#EF4444',
        spacing: index < sortedData.length - 1 ? spacingToNext : 0,
      });
    });

    return { barData: result, calculatedInitialSpacing: firstItemInitialSpacing };
  }, [displayData, groupSpacing, slotWidth, groupWidth, timeframe]);

  if (!displayData || displayData.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <BarChart
        data={barData}
        barWidth={barWidth}
        spacing={barGap}
        roundedTop
        roundedBottom
        hideRules={false}
        rulesColor="#E5E7EB"
        rulesType="solid"
        xAxisColor="transparent"
        yAxisColor="transparent"
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        noOfSections={4}
        maxValue={100}
        height={140}
        width={chartWidth}
        isAnimated
        animationDuration={600}
        barBorderRadius={5}
        yAxisLabelWidth={yAxisWidth}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 11, fontWeight: '500' }}
        initialSpacing={calculatedInitialSpacing}
        endSpacing={10}
        disableScroll
      />
    </View>
  );
};

// Legend Component
const Legend = ({ cvStrength, skillsMatch, activities }: { cvStrength: number; skillsMatch: number; activities: number }) => (
  <View style={styles.legendContainer}>
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
        <Text style={styles.legendText}>CV Strength: <Text style={styles.legendValue}>{Math.round(cvStrength)}%</Text></Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
        <Text style={styles.legendText}>Skills Match: <Text style={styles.legendValue}>{Math.round(skillsMatch)}%</Text></Text>
      </View>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
      <Text style={styles.legendText}>Activities: <Text style={styles.legendValue}>{Math.round(activities)}%</Text></Text>
    </View>
  </View>
);

// Wellbeing Card
const WellbeingCard = ({
  title,
  value,
  level
}: {
  title: string;
  value: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}) => {
  const getColor = () => {
    switch (level) {
      case 'HIGH': return '#22C55E';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.wellbeingCard}>
      <Text style={styles.wellbeingTitle}>{title}</Text>
      <Text style={[styles.wellbeingValue, { color: getColor() }]}>{value}</Text>
    </View>
  );
};

export default function CareerDashboardScreen({
  onBack,
  activeTab = 'home',
  onTabChange,
  onSearchNavigate,
  onNotificationPress,
  onProfilePress,
}: CareerDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  // Profile data for avatar
  const { data: profileData } = useGetMyProfileQuery();
  const profilePictureUrl = profileData?.myProfile?.profilePicture || null;

  // Career Dashboard data
  const {
    data: dashboardData,
    isLoading,
    isFetching,
    refetch
  } = useGetCareerDashboardFullQuery({ months: 10, timeframe: selectedTimeframe });

  const dashboard = dashboardData?.careerDashboardFull;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setChartKey(prev => prev + 1); // Force chart re-animation
    setRefreshing(false);
  };

  const handleTimeframeChange = (timeframe: 'WEEKLY' | 'MONTHLY') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimeframe(timeframe);
    setShowTimeframeDropdown(false);
    setChartKey(prev => prev + 1); // Force chart re-animation on timeframe change
  };

  // Calculate header padding based on screen
  const headerPadding = insets.top + 120;

  if (isLoading) {
    return (
      <CandidateLayout
        showBackButton
        onBack={onBack}
        headerTitle="Career Dashboard"
        headerSubtitle="Your career, your way"
        showGlassPill
        profilePictureUrl={profilePictureUrl}
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#437EF4" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
        <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout
      showBackButton
      onBack={onBack}
      headerTitle="Career Dashboard"
      headerSubtitle="Your career, your way"
      showGlassPill
      profilePictureUrl={profilePictureUrl}
      onNotificationPress={onNotificationPress}
      onProfilePress={onProfilePress}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerPadding, paddingBottom: 120 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#437EF4"
            progressViewOffset={headerPadding}
          />
        }
      >
        {/* Career Score Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Career Score Progress</Text>

            {/* Timeframe Dropdown */}
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTimeframeDropdown(!showTimeframeDropdown);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedTimeframe === 'MONTHLY' ? 'Monthly' : 'Weekly'}
              </Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            {showTimeframeDropdown && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleTimeframeChange('WEEKLY')}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedTimeframe === 'WEEKLY' && styles.dropdownItemActive
                  ]}>Weekly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleTimeframeChange('MONTHLY')}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedTimeframe === 'MONTHLY' && styles.dropdownItemActive
                  ]}>Monthly</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bar Chart */}
          {dashboard?.scoreProgress?.monthlyData && dashboard.scoreProgress.monthlyData.length > 0 && !isFetching ? (
            <ScoreProgressChart
              key={`chart-${chartKey}`}
              data={dashboard.scoreProgress.monthlyData}
              timeframe={selectedTimeframe}
            />
          ) : isFetching ? (
            <View style={styles.noDataContainer}>
              <ActivityIndicator size="small" color="#437EF4" />
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No chart data available</Text>
            </View>
          )}

          {/* Legend */}
          <Legend
            cvStrength={dashboard?.scoreProgress?.currentCvStrength || 0}
            skillsMatch={dashboard?.scoreProgress?.currentSkillsMatch || 0}
            activities={dashboard?.scoreProgress?.currentActivities || 0}
          />
        </View>

        {/* Well-Being Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Well-Being Summary</Text>

          <View style={styles.wellbeingContainer}>
            <WellbeingCard
              title="Mood Level"
              value={dashboard?.wellbeing?.moodDisplay || 'N/A'}
              level={dashboard?.wellbeing?.moodLevel || 'LOW'}
            />
            <WellbeingCard
              title="Productivity"
              value={dashboard?.wellbeing?.productivityDisplay || 'N/A'}
              level={dashboard?.wellbeing?.productivityLevel || 'LOW'}
            />
            <WellbeingCard
              title="Consistency"
              value={dashboard?.wellbeing?.consistencyDisplay || 'N/A'}
              level={dashboard?.wellbeing?.consistencyLevel || 'LOW'}
            />
          </View>
        </View>

        {/* Quick Stats */}
        {dashboard?.quickStats && dashboard.quickStats.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Stats</Text>
            <View style={styles.quickStatsContainer}>
              {dashboard.quickStats.map((stat, index) => (
                <View key={index} style={styles.quickStatItem}>
                  <Text style={styles.quickStatValue}>{stat.value}</Text>
                  <Text style={styles.quickStatLabel}>{stat.label}</Text>
                  {stat.change && (
                    <Text style={[
                      styles.quickStatChange,
                      { color: stat.changeIsPositive ? '#22C55E' : '#EF4444' }
                    ]}>
                      {stat.changeIsPositive ? '+' : ''}{stat.change}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Next Milestone */}
        {dashboard?.nextMilestone && (
          <View style={styles.milestoneCard}>
            <LinearGradient
              colors={['#437EF4', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.milestoneGradient}
            >
              <Text style={styles.milestoneTitle}>Next Milestone</Text>
              <Text style={styles.milestoneText}>{dashboard.nextMilestone}</Text>
              <Text style={styles.milestoneRecommendation}>
                {dashboard.primaryRecommendation}
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>

      <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </CandidateLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  dropdownText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    minWidth: 110,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
  },
  dropdownItemActive: {
    color: '#437EF4',
    fontWeight: '600',
  },
  // Chart Styles
  chartContainer: {
    marginBottom: 12,
    marginLeft: -8,
  },
  noDataContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  // Legend Styles
  legendContainer: {
    paddingTop: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  legendValue: {
    fontWeight: '600',
    color: '#1F2937',
  },
  // Wellbeing Styles
  wellbeingContainer: {
    marginTop: 12,
    gap: 10,
  },
  wellbeingCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  wellbeingTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  wellbeingValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Quick Stats Styles
  quickStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  quickStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  quickStatChange: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // Milestone Styles
  milestoneCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  milestoneGradient: {
    padding: 16,
  },
  milestoneTitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  milestoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  milestoneRecommendation: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
