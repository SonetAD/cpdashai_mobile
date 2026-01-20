import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useLazyGetRecentActivityQuery, RecentActivityItem } from '../../services/api';

const PAGE_SIZE = 20;

// Activity type colors
const getActivityDotColor = (type: string): string => {
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

// Activity type icons
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'CV_UPLOAD':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M14 2V8H20" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M12 18V12" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M9 15L12 12L15 15" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    case 'PRACTICE_SESSION':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    case 'JOB_MATCH':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    case 'MISSION_COMPLETED':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M22 4L12 14.01L9 11.01" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    case 'APPLICATION_SUBMITTED':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M22 2L11 13" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
    default:
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
      );
  }
};

// Activity Item Component
const ActivityListItem = ({ item, onPress }: { item: RecentActivityItem; onPress: () => void }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.activityItem} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: `${getActivityDotColor(item.activityType)}15` }]}>
        {getActivityIcon(item.activityType)}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTime}>{item.relativeTime}</Text>
      </View>
      <View style={styles.actionContainer}>
        <Text style={styles.actionText}>{item.actionLabel}</Text>
        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <Path d="M6 12L10 8L6 4" stroke="#437EF4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State for pagination
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lazy query for pagination
  const [fetchActivities, { isLoading, isFetching }] = useLazyGetRecentActivityQuery();

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const result = await fetchActivities({ limit: PAGE_SIZE, offset: 0 }).unwrap();
      if (result?.recentActivity) {
        setActivities(result.recentActivity.activities || []);
        setHasMore(result.recentActivity.hasMore ?? false);
        setOffset(PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadMore = useCallback(async () => {
    if (!hasMore || isFetching) return;

    try {
      const result = await fetchActivities({ limit: PAGE_SIZE, offset }).unwrap();
      if (result?.recentActivity) {
        setActivities(prev => [...prev, ...(result.recentActivity.activities || [])]);
        setHasMore(result.recentActivity.hasMore ?? false);
        setOffset(prev => prev + PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more activities:', error);
    }
  }, [hasMore, isFetching, offset, fetchActivities]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchActivities({ limit: PAGE_SIZE, offset: 0 }).unwrap();
      if (result?.recentActivity) {
        setActivities(result.recentActivity.activities || []);
        setHasMore(result.recentActivity.hasMore ?? false);
        setOffset(PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchActivities]);

  const handleActivityPress = useCallback((activity: RecentActivityItem) => {
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
        // Fallback to actionUrl if provided, otherwise go to home
        if (activity.actionUrl) {
          router.push(activity.actionUrl as any);
        } else {
          router.push('/(candidate)/(tabs)/home' as any);
        }
    }
  }, [router]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const renderItem = useCallback(({ item }: { item: RecentActivityItem }) => (
    <ActivityListItem item={item} onPress={() => handleActivityPress(item)} />
  ), [handleActivityPress]);

  const keyExtractor = useCallback((item: RecentActivityItem) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <Path d="M12 6V12L16 14" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </Svg>
      <Text style={styles.emptyTitle}>No Activity Yet</Text>
      <Text style={styles.emptyDescription}>
        Your recent activities will appear here. Start by uploading your CV or exploring job matches!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/(candidate)/(tabs)/home' as any)}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || activities.length === 0) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMore}
        disabled={isFetching}
        activeOpacity={0.8}
      >
        {isFetching ? (
          <ActivityIndicator size="small" color="#437EF4" />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  }, [hasMore, activities.length, isFetching, loadMore]);

  // Show loading only on initial load when no activities exist
  const showInitialLoading = isLoading && activities.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M12 19L5 12L12 5" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recent Activity</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Activity List */}
      {showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#437EF4" />
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            activities.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#437EF4',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#437EF4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#437EF4',
  },
});
