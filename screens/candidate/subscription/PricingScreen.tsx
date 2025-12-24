import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useGetAvailablePlansQuery, useCreateCheckoutSessionMutation, useCheckSubscriptionStatusQuery } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import BottomNavBar from '../../../components/BottomNavBar';
import { getPriceIdForPlan, CONTACT_SALES_CONFIG } from '../../../config/stripe.config';

interface PricingScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 380;

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = ({ color = "#10B981" }: { color?: string }) => (
  <Svg width={isSmallScreen ? 18 : 20} height={isSmallScreen ? 18 : 20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill={color} opacity={0.15} />
    <Path d="M7 12l3 3 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StarIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill="#FFD700"
    />
  </Svg>
);

const SparkleIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3v18M3 12h18M6.34 6.34l11.32 11.32M17.66 6.34L6.34 17.66"
      stroke="#FFD700"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width={isSmallScreen ? 18 : 20} height={isSmallScreen ? 18 : 20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="#437EF4"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M9 12l2 2 4-4" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = () => (
  <Svg width={isSmallScreen ? 16 : 18} height={isSmallScreen ? 16 : 18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"
      stroke="#10B981"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 11V7a5 5 0 0110 0v4"
      stroke="#10B981"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface PlanCardProps {
  plan: {
    name: string;
    planKey: string;
    price: number;
    stripePriceId?: string; // Optional since backend doesn't return it
    aiResumeParses: number;
    aiContentImprovements: number;
    features: string[];
  };
  onSubscribe: () => void;
  isLoading: boolean;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onSubscribe, isLoading, isPopular, isCurrentPlan }) => {
  const isFree = plan.planKey === 'free';
  const isPremium = plan.planKey === 'premium';
  const isEnterprise = plan.planKey === 'enterprise' || plan.price >= 99999;

  return (
    <View
      className="mb-5"
      style={{
        transform: [{ scale: isPopular ? 1.02 : 1 }],
      }}
    >
      {/* Popular Badge - Outside Card */}
      {isPopular && (
        <View className="items-center mb-3">
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingHorizontal: isSmallScreen ? 16 : 20,
              paddingVertical: isSmallScreen ? 6 : 8,
              borderRadius: 20,
              shadowColor: '#FFD700',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center">
              <StarIcon size={isSmallScreen ? 14 : 16} />
              <Text
                className="text-gray-900 font-bold ml-2"
                style={{ fontSize: isSmallScreen ? 11 : 12, letterSpacing: 1 }}
              >
                MOST POPULAR
              </Text>
              <StarIcon size={isSmallScreen ? 14 : 16} />
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Card Container */}
      <View
        className="bg-white rounded-3xl overflow-hidden"
        style={{
          borderWidth: isCurrentPlan ? 2 : isPopular ? 3 : 1,
          borderColor: isCurrentPlan ? '#10B981' : isPopular ? '#437EF4' : '#E5E7EB',
          shadowColor: isCurrentPlan ? '#10B981' : isPopular ? '#437EF4' : '#000',
          shadowOffset: { width: 0, height: isPopular ? 8 : 4 },
          shadowOpacity: isCurrentPlan ? 0.2 : isPopular ? 0.25 : 0.1,
          shadowRadius: isPopular ? 16 : 8,
          elevation: isPopular ? 8 : 4,
        }}
      >
        {/* Premium Gradient Header */}
        {isPremium && !isEnterprise && (
          <LinearGradient
            colors={['#437EF4', '#2E5CD1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: isSmallScreen ? 16 : 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-white font-bold mb-1"
                  style={{ fontSize: isSmallScreen ? 22 : 26 }}
                >
                  {plan.name}
                </Text>
                <View className="flex-row items-center">
                  <SparkleIcon />
                  <Text
                    className="text-white/90 ml-2"
                    style={{ fontSize: isSmallScreen ? 11 : 12 }}
                  >
                    Most powerful features
                  </Text>
                </View>
              </View>
              <View className="bg-white/20 rounded-full" style={{ padding: isSmallScreen ? 8 : 10 }}>
                <StarIcon size={isSmallScreen ? 24 : 28} />
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Enterprise Gradient Header */}
        {isEnterprise && (
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: isSmallScreen ? 16 : 20 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-white font-bold mb-1"
                  style={{ fontSize: isSmallScreen ? 22 : 26 }}
                >
                  {plan.name}
                </Text>
                <View className="flex-row items-center">
                  <Text style={{ fontSize: isSmallScreen ? 14 : 16 }}>🏢</Text>
                  <Text
                    className="text-white/90 ml-2"
                    style={{ fontSize: isSmallScreen ? 11 : 12 }}
                  >
                    For large organizations
                  </Text>
                </View>
              </View>
              <View className="bg-white/20 rounded-full" style={{ padding: isSmallScreen ? 8 : 10 }}>
                <Svg width={isSmallScreen ? 24 : 28} height={isSmallScreen ? 24 : 28} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M21 10h-8V2h-2v8H3v2h8v8h2v-8h8z"
                    fill="white"
                  />
                  <Circle cx="6" cy="6" r="2" fill="white" />
                  <Circle cx="18" cy="6" r="2" fill="white" />
                  <Circle cx="6" cy="18" r="2" fill="white" />
                  <Circle cx="18" cy="18" r="2" fill="white" />
                </Svg>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <View className="bg-green-500 py-2 px-4">
            <Text className="text-white text-center font-bold text-xs">YOUR CURRENT PLAN</Text>
          </View>
        )}

        {/* Card Content */}
        <View style={{ padding: isSmallScreen ? 20 : 24 }}>
          {/* Plan Name & Price - For non-premium */}
          {!isPremium && (
            <View className="mb-5">
              <Text
                className="text-gray-900 font-bold mb-2"
                style={{ fontSize: isSmallScreen ? 22 : 26 }}
              >
                {plan.name}
              </Text>
              {isEnterprise ? (
                <View>
                  <Text
                    className="text-primary-blue font-bold mb-2"
                    style={{ fontSize: isSmallScreen ? 28 : 32 }}
                  >
                    Custom Pricing
                  </Text>
                  <Text
                    className="text-gray-600"
                    style={{ fontSize: isSmallScreen ? 12 : 13 }}
                  >
                    Tailored to your organization's needs
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-baseline">
                  <Text
                    className="text-primary-blue font-bold"
                    style={{ fontSize: isSmallScreen ? 38 : 44 }}
                  >
                    £{(plan.price / 100).toFixed(2)}
                  </Text>
                  <Text
                    className="text-gray-500 ml-2"
                    style={{ fontSize: isSmallScreen ? 15 : 16 }}
                  >
                    /month
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Price for Premium */}
          {isPremium && (
            <View className="mb-5">
              {isEnterprise ? (
                <View>
                  <Text
                    className="text-gray-900 font-bold mb-2"
                    style={{ fontSize: isSmallScreen ? 28 : 32 }}
                  >
                    Custom Pricing
                  </Text>
                  <Text
                    className="text-gray-600 mb-3"
                    style={{ fontSize: isSmallScreen ? 12 : 13 }}
                  >
                    Tailored to your organization's needs
                  </Text>
                  <View className="bg-purple-50 border border-purple-200 rounded-xl" style={{ padding: isSmallScreen ? 8 : 10 }}>
                    <Text
                      className="text-purple-700 text-center font-semibold"
                      style={{ fontSize: isSmallScreen ? 11 : 12 }}
                    >
                      🏢 Enterprise-grade solution
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-baseline">
                  <Text
                    className="text-gray-900 font-bold"
                    style={{ fontSize: isSmallScreen ? 38 : 44 }}
                  >
                    £{(plan.price / 100).toFixed(2)}
                  </Text>
                  <Text
                    className="text-gray-500 ml-2"
                    style={{ fontSize: isSmallScreen ? 15 : 16 }}
                  >
                    /month
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Trial Badge for Free Plan */}
          {isFree && (
            <View className="bg-blue-50 border border-blue-200 rounded-xl mb-5" style={{ padding: isSmallScreen ? 10 : 12 }}>
              <Text
                className="text-blue-700 text-center font-semibold"
                style={{ fontSize: isSmallScreen ? 11 : 12 }}
              >
                Perfect for trying out the platform
              </Text>
            </View>
          )}

          {/* Usage Stats */}
          <View className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl mb-5" style={{ padding: isSmallScreen ? 14 : 16 }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text
                className="text-gray-700"
                style={{ fontSize: isSmallScreen ? 13 : 14 }}
              >
                AI Resume Parses
              </Text>
              <View className="bg-white rounded-full px-3 py-1">
                <Text
                  className="text-primary-blue font-bold"
                  style={{ fontSize: isSmallScreen ? 13 : 14 }}
                >
                  {plan.aiResumeParses === -1 ? '∞ Unlimited' : plan.aiResumeParses > 0 ? `${plan.aiResumeParses}/mo` : 'None'}
                </Text>
              </View>
            </View>
            <View className="h-px bg-gray-300 mb-3" />
            <View className="flex-row justify-between items-center">
              <Text
                className="text-gray-700"
                style={{ fontSize: isSmallScreen ? 13 : 14 }}
              >
                AI Improvements
              </Text>
              <View className="bg-white rounded-full px-3 py-1">
                <Text
                  className="text-primary-blue font-bold"
                  style={{ fontSize: isSmallScreen ? 13 : 14 }}
                >
                  {plan.aiContentImprovements === -1 ? '∞ Unlimited' : plan.aiContentImprovements > 0 ? `${plan.aiContentImprovements}/mo` : 'None'}
                </Text>
              </View>
            </View>
          </View>

          {/* Features List */}
          <View className="mb-6">
            {plan.features.map((feature, index) => (
              <View key={index} className="flex-row items-start mb-3">
                <View style={{ marginTop: 2, marginRight: isSmallScreen ? 10 : 12 }}>
                  <CheckIcon color={isPremium ? '#437EF4' : '#10B981'} />
                </View>
                <Text
                  className="text-gray-700 flex-1"
                  style={{
                    fontSize: isSmallScreen ? 13 : 14,
                    lineHeight: isSmallScreen ? 18 : 20,
                  }}
                  numberOfLines={2}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={onSubscribe}
            disabled={isLoading || isCurrentPlan}
            activeOpacity={0.85}
            style={{
              borderRadius: 16,
              paddingVertical: isSmallScreen ? 14 : 16,
              shadowColor: isPremium ? '#437EF4' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isPremium ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isCurrentPlan ? (
              <View className="bg-gray-100 rounded-2xl items-center justify-center" style={{ paddingVertical: isSmallScreen ? 14 : 16 }}>
                <Text
                  className="text-gray-500 font-bold"
                  style={{ fontSize: isSmallScreen ? 14 : 15 }}
                >
                  Current Plan
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={
                  isEnterprise
                    ? ['#7C3AED', '#6D28D9']
                    : isPremium
                    ? ['#437EF4', '#2E5CD1']
                    : ['#83E4E1', '#6DD5D2']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: isSmallScreen ? 14 : 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <Text
                      className="text-white font-bold mr-2"
                      style={{ fontSize: isSmallScreen ? 14 : 15 }}
                    >
                      {isEnterprise ? 'Contact Sales' : 'Subscribe Now'}
                    </Text>
                    {isEnterprise ? (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M5 12h14M12 5l7 7-7 7"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                )}
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Subscription Info */}
          {!isFree && !isEnterprise && (
            <Text
              className="text-gray-500 text-center mt-3"
              style={{ fontSize: isSmallScreen ? 11 : 12 }}
            >
              Billed monthly • Cancel anytime
            </Text>
          )}

          {/* Enterprise Contact Info */}
          {isEnterprise && (
            <Text
              className="text-gray-500 text-center mt-3"
              style={{ fontSize: isSmallScreen ? 11 : 12 }}
            >
              Our team will reach out within 24 hours
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default function PricingScreen({
  activeTab = 'profile',
  onTabChange,
  onBack,
}: PricingScreenProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useGetAvailablePlansQuery();
  const { data: subscriptionData, refetch: refetchSubscription } = useCheckSubscriptionStatusQuery();
  const [createCheckout] = useCreateCheckoutSessionMutation();
  const { showAlert } = useAlert();

  // Log initial query state
  console.log('PricingScreen - Initial Query State:', {
    isLoading: plansLoading,
    hasData: !!data,
    hasError: !!plansError
  });

  // Get the user's current plan
  const currentUserPlan = subscriptionData?.subscriptionStatus?.plan?.toLowerCase() || 'free';

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPlans(), refetchSubscription()]);
    } catch (error) {
      console.error('Error refreshing pricing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Log plan data for debugging
  React.useEffect(() => {
    console.log('========== PRICING PAGE DEBUG ==========');
    console.log('Plans Loading:', plansLoading);
    console.log('Raw API Response:', data);

    if (data?.availablePlans?.plans) {
      console.log('Total Plans Found:', data.availablePlans.plans.length);
      console.log('Available plans full data:', JSON.stringify(data.availablePlans.plans, null, 2));

      data.availablePlans.plans.forEach((plan, index) => {
        console.log(`\n--- Plan ${index + 1}: ${plan.name} ---`);
        console.log('Key:', plan.planKey);
        console.log('Price (pence):', plan.price);
        console.log('Price (£):', `£${(plan.price / 100).toFixed(2)}`);
        console.log('Stripe Price ID:', plan.stripePriceId || 'MISSING');
        console.log('AI Resume Parses:', plan.aiResumeParses);
        console.log('AI Content Improvements:', plan.aiContentImprovements);
        console.log('Features:', plan.features);
      });
    } else {
      console.log('No plans data available');
      console.log('data:', data);
      console.log('data?.availablePlans:', data?.availablePlans);
    }

    if (plansError) {
      console.error('Error loading plans:', plansError);
      console.error('Error details:', JSON.stringify(plansError, null, 2));
    }

    console.log('Current User Plan:', subscriptionData?.subscriptionStatus?.plan || 'free');
    console.log('========== END PRICING DEBUG ==========');
  }, [data, plansError, plansLoading, subscriptionData]);

  const handleSubscribe = async (planKey: string, stripePriceId?: string) => {
    try {
      setLoadingPlan(planKey);

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

      // Get price ID with fallback from configuration
      const priceId = stripePriceId || getPriceIdForPlan(planKey, 'monthly');

      // Validate stripe price ID
      if (!priceId) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Invalid plan configuration. Please contact support.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setLoadingPlan(null);
        return;
      }

      // Create checkout session
      const result = await createCheckout({
        priceId: priceId,
        successUrl: 'cpdash://subscription/success',
        cancelUrl: 'cpdash://pricing',
        // No trial period - immediate paid subscription
      }).unwrap();

      if (result.createCheckoutSession.success && result.createCheckoutSession.checkoutUrl) {
        // Open Stripe checkout in browser
        const canOpen = await Linking.canOpenURL(result.createCheckoutSession.checkoutUrl);
        if (canOpen) {
          await Linking.openURL(result.createCheckoutSession.checkoutUrl);
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Unable to open payment page. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.createCheckoutSession.message || 'Failed to create checkout session',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.createCheckoutSession?.message || 'An error occurred. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#437EF4', '#3B71E0', '#2E5CD1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 24, paddingVertical: isSmallScreen ? 16 : 20 }}
      >
        {/* Decorative Background Elements */}
        <View className="absolute top-0 right-0 opacity-10" pointerEvents="none">
          <Svg width="100" height="100" viewBox="0 0 100 100">
            <Circle cx="50" cy="20" r="30" fill="white" />
            <Circle cx="80" cy="60" r="20" fill="white" />
          </Svg>
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onBack} className="p-2 -ml-2" activeOpacity={0.7}>
            <BackIcon />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <LogoWhite width={39} height={33} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Title Section */}
        <View className="mt-4 items-center">
          <Text
            className="text-white font-bold text-center mb-2"
            style={{ fontSize: isSmallScreen ? 24 : 28, letterSpacing: 0.5 }}
          >
            Choose Your Plan
          </Text>
          <Text
            className="text-white/90 text-center"
            style={{ fontSize: isSmallScreen ? 13 : 14, lineHeight: isSmallScreen ? 18 : 20 }}
            numberOfLines={2}
          >
            Unlock AI-powered career tools and features
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: isSmallScreen ? 16 : 20, paddingTop: isSmallScreen ? 20 : 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#437EF4']}
            tintColor="#437EF4"
          />
        }
      >
        {/* Loading State */}
        {plansLoading && (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color="#437EF4" />
            <Text
              className="text-gray-500 mt-4"
              style={{ fontSize: isSmallScreen ? 13 : 14 }}
            >
              Loading plans...
            </Text>
          </View>
        )}

        {/* Error State */}
        {!plansLoading && plansError && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <Text
              className="text-red-800 font-bold mb-2"
              style={{ fontSize: isSmallScreen ? 16 : 18 }}
            >
              Unable to Load Plans
            </Text>
            <Text
              className="text-red-600"
              style={{ fontSize: isSmallScreen ? 13 : 14 }}
            >
              We couldn't fetch the available subscription plans. Please check your internet connection and try again.
            </Text>
            <TouchableOpacity
              onPress={() => refetchPlans()}
              className="mt-4 bg-red-600 rounded-xl py-3 px-6"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* No Plans Available */}
        {!plansLoading && !plansError && (!data?.availablePlans?.plans || data.availablePlans.plans.length === 0) && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <Text
              className="text-yellow-800 font-bold mb-2"
              style={{ fontSize: isSmallScreen ? 16 : 18 }}
            >
              No Plans Available
            </Text>
            <Text
              className="text-yellow-700"
              style={{ fontSize: isSmallScreen ? 13 : 14 }}
            >
              No subscription plans are currently available. Please contact support for assistance.
            </Text>
          </View>
        )}

        {/* Plans Grid */}
        {!plansLoading && !plansError && data?.availablePlans?.plans && data.availablePlans.plans.length > 0 && (
          <View className="mb-6">
            {data.availablePlans.plans.map((plan) => (
              <PlanCard
                key={plan.planKey}
                plan={plan}
                onSubscribe={() => handleSubscribe(plan.planKey, plan.stripePriceId)}
                isLoading={loadingPlan === plan.planKey}
                isPopular={plan.planKey === 'premium'}
                isCurrentPlan={plan.planKey.toLowerCase() === currentUserPlan}
              />
            ))}
          </View>
        )}

        {/* Trust Section */}
        <View className="bg-white rounded-3xl mb-6" style={{ padding: isSmallScreen ? 20 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <View className="flex-row items-center justify-center mb-4">
            <ShieldIcon />
            <Text
              className="text-gray-900 font-bold ml-3"
              style={{ fontSize: isSmallScreen ? 16 : 18 }}
            >
              Safe & Secure
            </Text>
          </View>

          <View className="flex-row justify-center flex-wrap">
            <View className="bg-blue-50 border border-blue-200 rounded-xl mr-2 mb-2" style={{ paddingHorizontal: isSmallScreen ? 12 : 14, paddingVertical: isSmallScreen ? 8 : 10 }}>
              <View className="flex-row items-center">
                <LockIcon />
                <Text
                  className="text-blue-700 font-semibold ml-2"
                  style={{ fontSize: isSmallScreen ? 11 : 12 }}
                >
                  SSL Encrypted
                </Text>
              </View>
            </View>

            <View className="bg-green-50 border border-green-200 rounded-xl mb-2" style={{ paddingHorizontal: isSmallScreen ? 12 : 14, paddingVertical: isSmallScreen ? 8 : 10 }}>
              <View className="flex-row items-center">
                <Text style={{ fontSize: isSmallScreen ? 16 : 18 }}>💳</Text>
                <Text
                  className="text-green-700 font-semibold ml-2"
                  style={{ fontSize: isSmallScreen ? 11 : 12 }}
                >
                  Stripe Secure
                </Text>
              </View>
            </View>
          </View>

          <Text
            className="text-gray-500 text-center mt-4"
            style={{ fontSize: isSmallScreen ? 11 : 12, lineHeight: isSmallScreen ? 16 : 18 }}
          >
            Your payment information is encrypted and secure. We never store your credit card details.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
