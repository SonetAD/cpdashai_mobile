import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useCheckSubscriptionStatusQuery } from '../services/api';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  featureType: 'parse' | 'improve' | 'keywords' | 'summary';
  onUpgrade?: () => void;
  disabled?: boolean;
}

const LockIcon = () => (
  <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"
      stroke="#437EF4"
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  featureType,
  onUpgrade,
  disabled = false,
}) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { data, isLoading } = useCheckSubscriptionStatusQuery();

  const subscriptionStatus = data?.subscriptionStatus;
  const canUseAiFeatures = subscriptionStatus?.canUseAiFeatures || false;

  const featureNames = {
    parse: 'AI Resume Parsing',
    improve: 'AI Content Improvement',
    keywords: 'ATS Keyword Optimization',
    summary: 'Professional Summary Generation',
  };

  const remainingUsage = {
    parse: subscriptionStatus?.aiResumeParsesRemaining,
    improve: subscriptionStatus?.aiContentImprovementsRemaining,
    keywords: subscriptionStatus?.aiContentImprovementsRemaining,
    summary: subscriptionStatus?.aiContentImprovementsRemaining,
  };

  const handlePress = () => {
    // Check if user has subscription access
    if (!canUseAiFeatures) {
      setShowUpgradeModal(true);
      return;
    }

    // Check quota
    const remaining = remainingUsage[featureType];
    if (remaining !== null && remaining !== undefined && remaining <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    // All checks passed - this shouldn't execute here as children handle the click
    // This guard is just for protection
  };

  const getUsageText = () => {
    if (!canUseAiFeatures) {
      return 'Subscribe to unlock this feature';
    }

    const remaining = remainingUsage[featureType];
    if (remaining === null || remaining === undefined) {
      return 'Unlimited uses available';
    }

    if (remaining <= 0) {
      return 'Usage limit reached - Upgrade to continue';
    }

    return `${remaining} uses remaining this month`;
  };

  // Clone children and inject subscription check
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as any, {
        onPress: handlePress,
        disabled: disabled || isLoading || !canUseAiFeatures || (remainingUsage[featureType] !== null && remainingUsage[featureType] !== undefined && remainingUsage[featureType] <= 0),
      });
    }
    return child;
  });

  return (
    <>
      <View>
        {childrenWithProps}

        {/* Usage Indicator */}
        {!isLoading && canUseAiFeatures && (
          <View className="mt-2 px-1">
            <Text className={`text-xs ${
              remainingUsage[featureType] !== null && remainingUsage[featureType] !== undefined && remainingUsage[featureType] <= 5 && remainingUsage[featureType] > 0
                ? 'text-orange-600'
                : remainingUsage[featureType] === 0
                ? 'text-red-600'
                : 'text-gray-500'
            }`}>
              {getUsageText()}
            </Text>
          </View>
        )}

        {!isLoading && !canUseAiFeatures && (
          <View className="mt-2 px-1">
            <Text className="text-xs text-primary-blue font-medium">
              {getUsageText()}
            </Text>
          </View>
        )}
      </View>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-2 z-10"
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#6B7280"/>
              </Svg>
            </TouchableOpacity>

            {/* Content */}
            <View className="items-center pt-4">
              <LockIcon />

              <Text className="text-gray-900 text-2xl font-bold mt-6 mb-3 text-center">
                Unlock {featureNames[featureType]}
              </Text>

              <Text className="text-gray-600 text-base text-center mb-6 leading-6">
                {!canUseAiFeatures
                  ? 'Subscribe to a premium plan to access this AI-powered feature and boost your career.'
                  : 'You\'ve reached your usage limit. Upgrade to a higher plan to continue using this feature.'}
              </Text>

              {/* Features */}
              <View className="bg-gray-50 rounded-2xl p-4 mb-6 w-full">
                <Text className="text-gray-900 text-sm font-bold mb-3">
                  Premium Features Include:
                </Text>

                <View className="space-y-2">
                  <View className="flex-row items-center mb-2">
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text className="text-gray-700 text-sm ml-2">AI-powered resume parsing</Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text className="text-gray-700 text-sm ml-2">Professional content improvements</Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text className="text-gray-700 text-sm ml-2">ATS keyword optimization</Text>
                  </View>

                  <View className="flex-row items-center">
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text className="text-gray-700 text-sm ml-2">Professional summary generation</Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View className="flex-row w-full gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                  onPress={() => setShowUpgradeModal(false)}
                >
                  <Text className="text-gray-700 text-base font-semibold">Maybe Later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-primary-blue rounded-xl py-4 items-center"
                  onPress={() => {
                    setShowUpgradeModal(false);
                    onUpgrade?.();
                  }}
                >
                  <Text className="text-white text-base font-bold">View Plans</Text>
                </TouchableOpacity>
              </View>

              {/* Trial Badge */}
              <View className="mt-4 bg-green-50 rounded-full px-4 py-2">
                <Text className="text-green-700 text-xs font-medium">
                  🎉 7-day free trial available
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SubscriptionGuard;
