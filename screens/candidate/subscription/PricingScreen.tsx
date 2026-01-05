import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { useGetAvailablePlansQuery, useCreateSubscriptionSetupMutation, useCheckSubscriptionStatusQuery, useChangePlanMutation, useGetMySubscriptionQuery } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';
import { processPayment } from '../../../services/stripePayment';
import { CONTACT_SALES_CONFIG } from '../../../config/stripe.config';
import LogoWhite from '../../../assets/images/logoWhite.svg';

interface PricingScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 380;

// Back arrow icon
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Blue filled checkmark icon
const CheckmarkIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#2563EB" />
    <Path d="M8 12l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface Plan {
  name: string;
  planKey: string;
  price: number;
  stripePriceId?: string;
  aiResumeParses: number;
  aiContentImprovements: number;
  features: string[];
}

interface PlanCardProps {
  plan: Plan;
  onSubscribe: () => void;
  isLoading: boolean;
  isSelected?: boolean;
  isCurrentPlan?: boolean;
  displayName?: string;
  priceDisplay?: string;
  buttonText?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSubscribe,
  isLoading,
  isSelected,
  isCurrentPlan,
  displayName,
  priceDisplay,
  buttonText,
}) => {
  const isFree = plan.planKey === 'free';
  const isEnterprise = plan.planKey === 'enterprise' || plan.price >= 99999;

  // Format price display
  const formattedPrice = priceDisplay || (isFree
    ? 'Free'
    : isEnterprise
      ? 'Custom'
      : `$${(plan.price / 100).toFixed(2)} /month`);

  const planDisplayName = displayName || plan.name;
  const actionButtonText = buttonText || (isFree ? 'Start Free' : isEnterprise ? 'Contact Sales' : 'Upgrade Now');

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubscribe();
  };

  // Card wrapper with gradient border for selected state
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isSelected && !isCurrentPlan) {
      return (
        <LinearGradient
          colors={['#06B6D4', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: 2,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 18,
              overflow: 'hidden',
            }}
          >
            {children}
          </View>
        </LinearGradient>
      );
    }

    return (
      <View
        style={{
          backgroundColor: 'white',
          borderRadius: 20,
          marginBottom: 20,
          borderWidth: isCurrentPlan ? 2 : 1,
          borderColor: isCurrentPlan ? '#10B981' : '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    );
  };

  return (
    <CardWrapper>
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <View style={{ backgroundColor: '#10B981', paddingVertical: 8 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700', fontSize: 12 }}>
            YOUR CURRENT PLAN
          </Text>
        </View>
      )}

      {/* Card Content */}
      <View style={{ padding: isSmallScreen ? 20 : 24 }}>
        {/* Header Row: Plan Name & Price */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text
            style={{
              fontSize: isSmallScreen ? 22 : 26,
              fontWeight: '700',
              color: '#1F2937',
            }}
          >
            {planDisplayName}
          </Text>
          <Text
            style={{
              fontSize: isSmallScreen ? 18 : 20,
              fontWeight: '600',
              color: '#2563EB',
            }}
          >
            {formattedPrice}
          </Text>
        </View>

        {/* Tagline */}
        <Text
          style={{
            fontSize: isSmallScreen ? 14 : 15,
            color: '#6B7280',
            marginBottom: 20,
          }}
        >
          CPDashAI adapts to your journey
        </Text>

        {/* Subscribe Button */}
        <TouchableOpacity
          onPress={handlePress}
          disabled={isLoading || isCurrentPlan}
          activeOpacity={0.85}
          style={{ marginBottom: 24 }}
        >
          {isCurrentPlan ? (
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 100,
                paddingVertical: isSmallScreen ? 14 : 16,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#9CA3AF', fontWeight: '600', fontSize: isSmallScreen ? 15 : 16 }}>
                Current Plan
              </Text>
            </View>
          ) : (
            <View style={{ borderRadius: 100, overflow: 'hidden' }}>
              {/* Base blue color */}
              <View style={{ backgroundColor: '#2563EB' }}>
                {/* Gradient overlay */}
                <LinearGradient
                  colors={['rgba(6, 182, 212, 0.4)', 'rgba(139, 92, 246, 0)', 'rgba(139, 92, 246, 0.4)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{
                    paddingVertical: isSmallScreen ? 14 : 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: isSmallScreen ? 15 : 16 }}>
                      {actionButtonText}
                    </Text>
                  )}
                </LinearGradient>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 }} />

        {/* Features List */}
        <View>
          {plan.features.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: index === plan.features.length - 1 ? 0 : 14,
              }}
            >
              <CheckmarkIcon />
              <Text
                style={{
                  fontSize: isSmallScreen ? 14 : 15,
                  color: '#4B5563',
                  marginLeft: 12,
                  flex: 1,
                }}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </CardWrapper>
  );
};

export default function PricingScreen({
  onBack,
}: PricingScreenProps) {
  const insets = useSafeAreaInsets();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useGetAvailablePlansQuery();
  const { data: subscriptionData, refetch: refetchSubscriptionStatus } = useCheckSubscriptionStatusQuery();
  const { refetch: refetchMySubscription } = useGetMySubscriptionQuery();
  const [createSubscriptionSetup] = useCreateSubscriptionSetupMutation();
  const [changePlan] = useChangePlanMutation();
  const { showAlert } = useAlert();

  // Get the user's current plan and subscription status
  const currentUserPlan = subscriptionData?.subscriptionStatus?.plan?.toLowerCase() || 'free';
  const hasActiveSubscription = subscriptionData?.subscriptionStatus?.isActive && currentUserPlan !== 'free';

  // Helper to refresh all subscription data with delay and retry
  const refreshAllSubscriptionData = async (retryCount = 3, delayMs = 1500) => {
    // Initial delay to allow backend to process
    await new Promise(resolve => setTimeout(resolve, delayMs));

    for (let i = 0; i < retryCount; i++) {
      try {
        const [statusResult] = await Promise.all([
          refetchSubscriptionStatus(),
          refetchMySubscription(),
          refetchPlans(),
        ]);

        // Check if subscription is now active
        const newStatus = statusResult?.data?.subscriptionStatus;
        if (newStatus?.isActive && newStatus?.plan?.toLowerCase() !== 'free') {
          // Subscription is active, we're done
          return;
        }

        // If not yet active and more retries left, wait and try again
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.log('Error refreshing subscription data, attempt', i + 1, error);
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([refetchPlans(), refetchSubscriptionStatus(), refetchMySubscription()]);
    } catch (error) {
      console.error('Error refreshing pricing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  const handleSubscribe = async (planKey: string, stripePriceId?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLoadingPlan(planKey);
      setSelectedPlan(planKey);

      // Handle enterprise plans - redirect to contact sales
      if (CONTACT_SALES_CONFIG.enterprisePlanKeys.includes(planKey)) {
        const contactUrl = `mailto:${CONTACT_SALES_CONFIG.email}?subject=${encodeURIComponent(CONTACT_SALES_CONFIG.subject)}`;
        const canOpen = await Linking.canOpenURL(contactUrl);
        if (canOpen) {
          await Linking.openURL(contactUrl);
        } else {
          showAlert({
            type: 'info',
            title: 'Contact Sales',
            message: `Please email ${CONTACT_SALES_CONFIG.email} for enterprise pricing.`,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
        setLoadingPlan(null);
        return;
      }

      // Handle free plan
      if (planKey === 'free') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: 'success',
          title: 'Welcome!',
          message: 'You are now on the Free plan. Explore the platform and upgrade anytime!',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setLoadingPlan(null);
        return;
      }

      // Validate stripe price ID
      if (!stripePriceId) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Invalid plan configuration. Please contact support.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setLoadingPlan(null);
        return;
      }

      // Check if this is a plan change for existing subscriber
      if (hasActiveSubscription && planKey !== currentUserPlan) {
        // Use changePlan mutation for existing subscribers
        console.log('Calling changePlan with priceId:', stripePriceId);

        const changeResult = await changePlan({
          newPriceId: stripePriceId,
        }).unwrap();

        console.log('changePlan result:', JSON.stringify(changeResult, null, 2));

        const changeData = changeResult?.changePlan;

        if (!changeData) {
          console.error('No changeData in response:', changeResult);
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Failed to change plan. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          setLoadingPlan(null);
          return;
        }

        if (changeData.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Show proration info if available
          let message = 'Your plan has been successfully changed!';
          if (changeData.prorationAmount !== null && changeData.prorationAmount !== 0) {
            const prorationFormatted = Math.abs(changeData.prorationAmount / 100).toFixed(2);
            if (changeData.prorationAmount > 0) {
              message += ` You will be charged $${prorationFormatted} for the upgrade.`;
            } else {
              message += ` You will receive a credit of $${prorationFormatted}.`;
            }
          }

          showAlert({
            type: 'success',
            title: 'Plan Changed!',
            message,
            buttons: [{ text: 'OK', style: 'default' }],
          });

          // Refresh subscription data
          refreshAllSubscriptionData();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showAlert({
            type: 'error',
            title: 'Plan Change Failed',
            message: changeData.message || 'Could not change your plan. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }

        setLoadingPlan(null);
        return;
      }

      // Create subscription setup for new subscribers (PaymentSheet)
      console.log('Calling createSubscriptionSetup with priceId:', stripePriceId);

      const result = await createSubscriptionSetup({
        priceId: stripePriceId,
      }).unwrap();

      console.log('createSubscriptionSetup result:', JSON.stringify(result, null, 2));

      const setupData = result?.createSubscriptionSetup;

      if (!setupData) {
        console.error('No setupData in response:', result);
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to initialize payment. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setLoadingPlan(null);
        return;
      }

      if (!setupData.success || !setupData.setupIntentClientSecret) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: setupData.message || 'Failed to initialize payment. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setLoadingPlan(null);
        return;
      }

      // Process payment with PaymentSheet (in-app)
      const paymentResult = await processPayment({
        setupIntentClientSecret: setupData.setupIntentClientSecret,
        ephemeralKey: setupData.ephemeralKey!,
        customerId: setupData.customerId!,
        publishableKey: setupData.publishableKey!,
        merchantDisplayName: 'CP Dash AI',
      });

      if (paymentResult.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: 'success',
          title: 'Subscription Activated!',
          message: 'Your subscription has been successfully activated. Enjoy your new features!',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        // Refresh subscription data
        refreshAllSubscriptionData();
      } else if (paymentResult.cancelled) {
        // User cancelled - no action needed
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Payment Failed',
          message: paymentResult.error || 'Payment could not be processed. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Handle different error types
      const errorMessage = error?.data?.changePlan?.message ||
                          error?.data?.createSubscriptionSetup?.message ||
                          'An error occurred. Please try again.';

      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // Plan display configuration
  const getPlanConfig = (planKey: string, isCurrentPlan: boolean) => {
    // Determine the appropriate button text based on subscription status
    const getButtonText = (defaultText: string) => {
      if (isCurrentPlan) return 'Current Plan';
      if (hasActiveSubscription && planKey !== 'free' && planKey !== 'enterprise') {
        return 'Change Plan';
      }
      return defaultText;
    };

    const configs: Record<string, { displayName: string; priceDisplay?: string; buttonText: string }> = {
      free: { displayName: 'Starter', buttonText: getButtonText('Start Free') },
      basic: { displayName: 'Career Boost', priceDisplay: '$9.99 /month', buttonText: getButtonText('Upgrade Now') },
      professional: { displayName: 'Elite Growth', priceDisplay: '$19.99 /month', buttonText: getButtonText('Upgrade Now') },
      premium: { displayName: 'Premium', buttonText: getButtonText('Upgrade Now') },
      enterprise: { displayName: 'Enterprise', priceDisplay: 'Custom', buttonText: 'Contact Sales' },
    };
    return configs[planKey] || { displayName: planKey, buttonText: getButtonText('Subscribe') };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }} edges={['top']}>
      {/* Blue Header */}
      <LinearGradient
        colors={['#437EF4', '#3B71E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LogoWhite width={48} height={48} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: 'white' }}>
              Subscription
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 }}>
              Choose Your Plan
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Back Navigation Section */}
      <View
        style={{
          backgroundColor: '#F3F4F6',
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <BackArrowIcon />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
            Choose Your Plan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Loading State */}
        {plansLoading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={{ color: '#6B7280', marginTop: 16, fontSize: 15 }}>
              Loading plans...
            </Text>
          </View>
        )}

        {/* Error State */}
        {!plansLoading && plansError && (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#991B1B', marginBottom: 8 }}>
              Unable to Load Plans
            </Text>
            <Text style={{ fontSize: 14, color: '#DC2626', marginBottom: 16 }}>
              We couldn't fetch the available subscription plans. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                refetchPlans();
              }}
              style={{
                backgroundColor: '#DC2626',
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Plans Available */}
        {!plansLoading && !plansError && (!data?.availablePlans?.plans || data.availablePlans.plans.length === 0) && (
          <View
            style={{
              backgroundColor: '#FFFBEB',
              borderWidth: 1,
              borderColor: '#FDE68A',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#92400E', marginBottom: 8 }}>
              No Plans Available
            </Text>
            <Text style={{ fontSize: 14, color: '#B45309' }}>
              No subscription plans are currently available. Please contact support for assistance.
            </Text>
          </View>
        )}

        {/* Plans List */}
        {!plansLoading && !plansError && data?.availablePlans?.plans && data.availablePlans.plans.length > 0 && (
          <View>
            {data.availablePlans.plans.map((plan) => {
              const isCurrentPlan = plan.planKey.toLowerCase() === currentUserPlan;
              const config = getPlanConfig(plan.planKey, isCurrentPlan);
              const isSelected = selectedPlan === plan.planKey || plan.planKey === 'basic'; // Default selected plan

              return (
                <PlanCard
                  key={plan.planKey}
                  plan={plan}
                  onSubscribe={() => handleSubscribe(plan.planKey, plan.stripePriceId)}
                  isLoading={loadingPlan === plan.planKey}
                  isSelected={isSelected}
                  isCurrentPlan={isCurrentPlan}
                  displayName={config.displayName}
                  priceDisplay={config.priceDisplay}
                  buttonText={config.buttonText}
                />
              );
            })}
          </View>
        )}

        {/* Trust Section */}
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="#2563EB"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path d="M9 12l2 2 4-4" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginLeft: 8 }}>
              Safe & Secure
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#2563EB', fontWeight: '600', fontSize: 12 }}>
                🔒 SSL Encrypted
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#059669', fontWeight: '600', fontSize: 12 }}>
                💳 Stripe Secure
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 18 }}>
            Your payment information is encrypted and secure. We never store your credit card details.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
