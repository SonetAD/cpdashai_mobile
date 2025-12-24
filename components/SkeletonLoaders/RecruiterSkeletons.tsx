import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import TalentPartnerLayout from '../layouts/TalentPartnerLayout';

const SkeletonPulse = ({ children }: { children: React.ReactNode }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  return (
    <TalentPartnerLayout
      title="Talent Command Center"
      subtitle="Loading..."
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="flex-1 px-6 pt-2">
        {/* Hero Cards Skeleton */}
        <View className="mb-6">
          <View className="flex-row mb-3" style={{ gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SkeletonPulse>
                <View
                  className="rounded-3xl p-5"
                  style={{
                    height: 160,
                    backgroundColor: '#E5E7EB',
                  }}
                />
              </SkeletonPulse>
            </View>
            <View style={{ flex: 1 }}>
              <SkeletonPulse>
                <View
                  className="rounded-3xl p-5"
                  style={{
                    height: 160,
                    backgroundColor: '#E5E7EB',
                  }}
                />
              </SkeletonPulse>
            </View>
          </View>
          <SkeletonPulse>
            <View
              className="rounded-3xl p-5"
              style={{
                height: 160,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        </View>

        {/* AI Insights Skeleton */}
        <View className="mb-6">
          <SkeletonPulse>
            <View className="bg-gray-200 h-4 w-32 rounded mb-4" />
          </SkeletonPulse>
          <SkeletonPulse>
            <View
              className="rounded-3xl p-5"
              style={{
                height: 140,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        </View>

        {/* Pipeline Skeleton */}
        <View className="mb-6">
          <SkeletonPulse>
            <View className="bg-gray-200 h-4 w-40 rounded mb-4" />
          </SkeletonPulse>
          <SkeletonPulse>
            <View
              className="rounded-3xl p-5"
              style={{
                height: 200,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        </View>
      </View>
    </TalentPartnerLayout>
  );
};

// Talent Screen Skeleton
export const TalentSkeleton = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  return (
    <TalentPartnerLayout
      title="Talent Pool"
      subtitle="Loading candidates..."
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="flex-1 px-6 pt-4">
        {/* Search Bar Skeleton */}
        <SkeletonPulse>
          <View
            className="rounded-2xl mb-4"
            style={{
              height: 48,
              backgroundColor: '#E5E7EB',
            }}
          />
        </SkeletonPulse>

        {/* Filter Buttons Skeleton */}
        <View className="flex-row mb-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPulse key={i}>
              <View
                className="rounded-full mr-3"
                style={{
                  width: 80,
                  height: 36,
                  backgroundColor: '#E5E7EB',
                }}
              />
            </SkeletonPulse>
          ))}
        </View>

        {/* Candidate Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <SkeletonPulse key={i}>
            <View
              className="rounded-3xl mb-4"
              style={{
                height: 180,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        ))}
      </View>
    </TalentPartnerLayout>
  );
};

// Reports Screen Skeleton
export const ReportsSkeleton = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  return (
    <TalentPartnerLayout
      title="Analytics & Reports"
      subtitle="Loading reports..."
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="flex-1 px-6 pt-4">
        <View className="flex-1 items-center justify-center">
          <SkeletonPulse>
            <View
              className="rounded-2xl"
              style={{
                width: 200,
                height: 40,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        </View>
      </View>
    </TalentPartnerLayout>
  );
};

// Profile Screen Skeleton
export const ProfileSkeleton = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tabId: string) => void }) => {
  return (
    <TalentPartnerLayout
      title="Profile Settings"
      subtitle="Loading profile..."
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      <View className="flex-1 px-6 pt-4">
        <View className="flex-1 items-center justify-center">
          <SkeletonPulse>
            <View
              className="rounded-full mb-4"
              style={{
                width: 80,
                height: 80,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
          <SkeletonPulse>
            <View
              className="rounded-2xl"
              style={{
                width: 150,
                height: 24,
                backgroundColor: '#E5E7EB',
              }}
            />
          </SkeletonPulse>
        </View>
      </View>
    </TalentPartnerLayout>
  );
};
