import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Modal,
  LayoutAnimation,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  RoundedRect,
  Shadow,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import { useGetAvailablePlansQuery, useCreateSubscriptionSetupMutation, useUpdateOnboardingStepMutation, useLazySyncSubscriptionStatusQuery, useCreatePaypalSubscriptionMutation, useCapturePaypalSubscriptionMutation } from '../../services/api';
import { useAlert } from '../../contexts/AlertContext';
import { processPayment } from '../../services/stripePayment';
import { openPayPalApproval, PAYPAL_RETURN_URL, PAYPAL_CANCEL_URL } from '../../services/paypalPayment';
import PaymentMethodModal, { PaymentMethod } from '../../components/PaymentMethodModal';

// Import SVG assets
import Eclipse from '../../assets/images/eclipse.svg';
import Eclipse2 from '../../assets/images/eclipse2.svg';
import RecommendedStar from '../../assets/images/recommendedStar.svg';

// Import reusable components
import { GlassButton } from '../../components/ui/GlassButton';
import StarFilled from '../../assets/images/startFilled.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32; // 16px padding on each side
const PARENT_CARD_HEIGHT = 390;
const PLAN_CARD_HEIGHT = 60;
const FEATURES_CARD_HEIGHT = 140;
const BUTTON_WIDTH = SCREEN_WIDTH - 32;
const BUTTON_HEIGHT = 50;

interface SubscriptionHardgateScreenProps {
  onSubscriptionComplete: () => void;
  onViewMorePlans: () => void;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  priceSubtext: string;
  discount?: string;
  isRecommended?: boolean;
  stripePriceId?: string;
}

// Default plans with discount info
const defaultPlans: PlanOption[] = [
  {
    id: 'basic',
    name: 'Standard',
    price: '$ 9.99',
    priceSubtext: 'every month',
    discount: '-53% discount',
    isRecommended: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$ 19.99',
    priceSubtext: 'every month',
    discount: '-40% discount',
    isRecommended: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$ 29.99',
    priceSubtext: 'every month',
    discount: '-66% discount',
    isRecommended: false,
  },
];

// Features per plan type - 4 bullet points each
const planFeatures: Record<string, string[]> = {
  basic: [
    'AI CV Builder',
    'Basic Interview Prep',
    'RAY Assistant',
    'Email Support',
  ],
  professional: [
    'AI CV Builder',
    'Interview Intelligence',
    'RAY & Clara',
    'Priority Support',
  ],
  premium: [
    'AI CV Builder',
    'Interview Intelligence',
    'RAY & Clara',
    'Upskilling',
  ],
  default: [
    'AI CV Builder',
    'Basic Interview Prep',
    'RAY Assistant',
    'Email Support',
  ],
};

// LayoutAnimation is enabled by default in New Architecture
// No need to call setLayoutAnimationEnabledExperimental

export default function SubscriptionHardgateScreen({
  onSubscriptionComplete,
  onViewMorePlans,
}: SubscriptionHardgateScreenProps) {
  // Auto-select the recommended plan (first plan - basic/Standard)
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: plansData, isLoading: plansLoading } = useGetAvailablePlansQuery();
  const [createSubscriptionSetup] = useCreateSubscriptionSetupMutation();
  const [updateOnboardingStep] = useUpdateOnboardingStepMutation();
  const [syncSubscriptionStatus] = useLazySyncSubscriptionStatusQuery();
  const [createPaypalSubscription] = useCreatePaypalSubscriptionMutation();
  const [capturePaypalSubscription] = useCapturePaypalSubscriptionMutation();
  const { showAlert } = useAlert();

  // Payment method modal state
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // Helper to wait for a specified duration
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Poll backend to verify subscription is active
  const verifySubscriptionWithBackend = async (maxAttempts = 5, delayMs = 1500): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Verifying subscription status (attempt ${attempt}/${maxAttempts})...`);

      try {
        const result = await syncSubscriptionStatus().unwrap();
        const status = result?.syncSubscriptionStatus?.status?.toLowerCase();

        console.log(`Subscription status: ${status}`);

        // Check if subscription is active or trialing
        if (status === 'active' || status === 'trialing') {
          console.log('Subscription verified successfully!');
          return true;
        }

        // If not yet active and we have more attempts, wait and retry
        if (attempt < maxAttempts) {
          await wait(delayMs);
        }
      } catch (error) {
        console.error(`Verification attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          await wait(delayMs);
        }
      }
    }

    return false;
  };

  // Map backend plans to UI plans - Show 2-3 paid plans (excluding free and enterprise)
  const plans: PlanOption[] = plansData?.availablePlans?.plans
    ? plansData.availablePlans.plans
        .filter(p => {
          const key = p.planKey.toLowerCase();
          // Exclude free and enterprise plans
          return key !== 'free' && key !== 'enterprise' && p.price < 99999;
        })
        .slice(0, 3) // Show max 3 plans
        .map((p, index) => {
          const planKey = p.planKey.toLowerCase();

          // Map display names based on planKey
          let displayName = p.name;
          if (planKey === 'basic') displayName = 'Standard';
          else if (planKey === 'professional') displayName = 'Professional';
          else if (planKey === 'premium') displayName = 'Premium';

          // Calculate discount text based on plan
          let discountText = '';
          if (planKey === 'basic') discountText = '-53% discount';
          else if (planKey === 'professional') discountText = '-40% discount';
          else if (planKey === 'premium') discountText = '-66% discount';

          return {
            id: planKey,
            name: displayName,
            price: `$ ${(p.price / 100).toFixed(2)}`,
            priceSubtext: 'every month',
            discount: discountText,
            isRecommended: index === 0, // First plan is recommended
            stripePriceId: p.stripePriceId,
          };
        })
    : defaultPlans;

  // Auto-select Standard (basic) plan by default, or first available plan
  useEffect(() => {
    if (plans.length > 0) {
      // Check if currently selected plan exists in available plans
      const planExists = plans.some(p => p.id === selectedPlan);
      if (!planExists || !selectedPlan) {
        // Select basic/standard plan if available, otherwise first plan
        const standardPlan = plans.find(p => p.id === 'basic');
        setSelectedPlan(standardPlan?.id || plans[0].id);
      }
    }
  }, [plans]);

  const handleSelectPlan = (planId: string) => {
    Haptics.selectionAsync();
    // Smooth transition animation for plan change
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan?.stripePriceId) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Please select a valid plan',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Show payment method selection modal
    setShowPaymentMethodModal(true);
  };

  // Process Stripe payment
  const processStripePayment = async () => {
    try {
      setIsLoading(true);

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan?.stripePriceId) {
        setIsLoading(false);
        return;
      }

      // Create subscription setup with 4-day trial
      const result = await createSubscriptionSetup({
        priceId: plan.stripePriceId,
      }).unwrap();

      const setupData = result?.createSubscriptionSetup;

      if (!setupData?.success || !setupData?.setupIntentClientSecret) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: setupData?.message || 'Failed to initialize payment. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setIsLoading(false);
        return;
      }

      // Process payment with PaymentSheet
      const paymentResult = await processPayment({
        setupIntentClientSecret: setupData.setupIntentClientSecret,
        ephemeralKey: setupData.ephemeralKey!,
        customerId: setupData.customerId!,
        publishableKey: setupData.publishableKey!,
        merchantDisplayName: 'CP Dash AI',
      });

      if (paymentResult.success) {
        // Show verifying state while we wait for webhook to process
        setIsLoading(false);
        setIsVerifying(true);

        console.log('Payment successful, verifying subscription with backend...');

        // Poll backend to confirm subscription is active
        const isVerified = await verifySubscriptionWithBackend(5, 1500);

        setIsVerifying(false);

        if (isVerified) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Update onboarding step
          await updateOnboardingStep({
            step: 'subscription',
            completed: true,
          });

          showAlert({
            type: 'success',
            title: 'Welcome to CP Dash AI!',
            message: 'Your 4-day free trial has started. Enjoy all premium features!',
            buttons: [{
              text: 'Continue',
              style: 'default',
              onPress: onSubscriptionComplete,
            }],
          });
        } else {
          // Subscription not verified after multiple attempts
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showAlert({
            type: 'warning',
            title: 'Verification Pending',
            message: 'Your payment was processed, but subscription verification is taking longer than expected. Please wait a moment and try again, or contact support if the issue persists.',
            buttons: [
              {
                text: 'Retry',
                style: 'default',
                onPress: async () => {
                  setIsVerifying(true);
                  const retryVerified = await verifySubscriptionWithBackend(3, 2000);
                  setIsVerifying(false);
                  if (retryVerified) {
                    await updateOnboardingStep({ step: 'subscription', completed: true });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSubscriptionComplete();
                  }
                },
              },
              { text: 'Continue Anyway', style: 'cancel', onPress: onSubscriptionComplete },
            ],
          });
        }
      } else if (paymentResult.cancelled) {
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
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'An error occurred. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process PayPal payment
  const processPayPalPayment = async () => {
    try {
      setIsLoading(true);

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        setIsLoading(false);
        return;
      }

      console.log('[SubscriptionHardgate] Creating PayPal subscription for plan:', selectedPlan);

      const result = await createPaypalSubscription({
        planKey: selectedPlan,
        returnUrl: PAYPAL_RETURN_URL,
        cancelUrl: PAYPAL_CANCEL_URL,
      }).unwrap();

      const paypalData = result?.createPaypalSubscription;

      if (!paypalData?.success || !paypalData?.approvalUrl) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: paypalData?.message || 'Failed to create PayPal subscription. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setIsLoading(false);
        return;
      }

      // Open PayPal approval in browser
      const paypalResult = await openPayPalApproval(paypalData.approvalUrl, PAYPAL_RETURN_URL);

      if (paypalResult.cancelled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsLoading(false);
        return;
      }

      if (!paypalResult.success || !paypalResult.subscriptionId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'PayPal Error',
          message: paypalResult.error || 'PayPal payment could not be completed. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setIsLoading(false);
        return;
      }

      // Capture the PayPal subscription
      setIsVerifying(true);
      setIsLoading(false);

      const captureResult = await capturePaypalSubscription({
        subscriptionId: paypalResult.subscriptionId,
        token: paypalResult.token,
      }).unwrap();

      const captureData = captureResult?.capturePaypalSubscription;

      if (captureData?.success) {
        const isVerified = await verifySubscriptionWithBackend(5, 1500);

        setIsVerifying(false);

        if (isVerified) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          await updateOnboardingStep({
            step: 'subscription',
            completed: true,
          });

          showAlert({
            type: 'success',
            title: 'Welcome to CP Dash AI!',
            message: 'Your PayPal subscription has been activated. Enjoy all premium features!',
            buttons: [{
              text: 'Continue',
              style: 'default',
              onPress: onSubscriptionComplete,
            }],
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          showAlert({
            type: 'warning',
            title: 'Verification Pending',
            message: 'Your PayPal payment was processed, but subscription verification is taking longer than expected.',
            buttons: [
              {
                text: 'Retry',
                style: 'default',
                onPress: async () => {
                  setIsVerifying(true);
                  const retryVerified = await verifySubscriptionWithBackend(3, 2000);
                  setIsVerifying(false);
                  if (retryVerified) {
                    await updateOnboardingStep({ step: 'subscription', completed: true });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSubscriptionComplete();
                  }
                },
              },
              { text: 'Continue Anyway', style: 'cancel', onPress: onSubscriptionComplete },
            ],
          });
        }
      } else {
        setIsVerifying(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Subscription Failed',
          message: captureData?.message || 'Could not activate your PayPal subscription. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('PayPal subscription error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsVerifying(false);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'PayPal payment failed. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setShowPaymentMethodModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (method === 'stripe') {
      await processStripePayment();
    } else {
      await processPayPalPayment();
    }
  };

  const handleViewMorePlans = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewMorePlans();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Decorative Elements - Eclipse SVGs */}
      <View style={styles.decorativeContainer}>
        <View style={styles.eclipseFilled}>
          <Eclipse width={101} height={101} />
        </View>
        <View style={styles.eclipseStroke}>
          <Eclipse2 width={133} height={136} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose your{'\n'}subscription plan</Text>
          <Text style={styles.subtitle}>And get a 4-day free trial</Text>
        </View>

        {plansLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        ) : (
          /* Parent Card with Skia Glassmorphism */
          <View style={styles.parentCard}>
            {/* Skia Canvas for card shadows and gradients (transparent background) */}
            <Canvas style={StyleSheet.absoluteFill}>
              {/* Plan card 1 - shadow then fill */}
              <RoundedRect x={16} y={16} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <Shadow dx={0} dy={6} blur={16} color="rgba(100, 116, 139, 0.18)" />
              </RoundedRect>
              <RoundedRect x={16} y={16} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <LinearGradient start={vec(0, 16)} end={vec(0, 16 + PLAN_CARD_HEIGHT)} colors={['#FFFFFF', '#F8FAFC']} />
              </RoundedRect>

              {/* Plan card 2 - shadow then fill */}
              <RoundedRect x={16} y={16 + PLAN_CARD_HEIGHT + 8} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <Shadow dx={0} dy={6} blur={16} color="rgba(100, 116, 139, 0.18)" />
              </RoundedRect>
              <RoundedRect x={16} y={16 + PLAN_CARD_HEIGHT + 8} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <LinearGradient start={vec(0, 16 + PLAN_CARD_HEIGHT + 8)} end={vec(0, 16 + PLAN_CARD_HEIGHT * 2 + 8)} colors={['#FFFFFF', '#F8FAFC']} />
              </RoundedRect>

              {/* Plan card 3 - shadow then fill */}
              <RoundedRect x={16} y={16 + (PLAN_CARD_HEIGHT + 8) * 2} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <Shadow dx={0} dy={6} blur={16} color="rgba(100, 116, 139, 0.18)" />
              </RoundedRect>
              <RoundedRect x={16} y={16 + (PLAN_CARD_HEIGHT + 8) * 2} width={CARD_WIDTH - 32} height={PLAN_CARD_HEIGHT} r={16}>
                <LinearGradient start={vec(0, 16 + (PLAN_CARD_HEIGHT + 8) * 2)} end={vec(0, 16 + (PLAN_CARD_HEIGHT + 8) * 2 + PLAN_CARD_HEIGHT)} colors={['#FFFFFF', '#F8FAFC']} />
              </RoundedRect>

              {/* Features card - shadow then glass fill with hex colors */}
              <RoundedRect x={16} y={16 + (PLAN_CARD_HEIGHT + 8) * 3 + 10} width={CARD_WIDTH - 32} height={FEATURES_CARD_HEIGHT} r={16}>
                <Shadow dx={0} dy={6} blur={16} color="rgba(100, 116, 139, 0.15)" />
              </RoundedRect>
              <RoundedRect x={16} y={16 + (PLAN_CARD_HEIGHT + 8) * 3 + 10} width={CARD_WIDTH - 32} height={FEATURES_CARD_HEIGHT} r={16}>
                <LinearGradient start={vec(0, 16 + (PLAN_CARD_HEIGHT + 8) * 3 + 10)} end={vec(0, 16 + (PLAN_CARD_HEIGHT + 8) * 3 + 10 + FEATURES_CARD_HEIGHT)} colors={['#EEF2FF', '#E0E7FF']} />
              </RoundedRect>
            </Canvas>

            {/* Native content overlay */}
            <View style={styles.parentCardContent}>
              {/* Plan Cards */}
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isRecommended = plan.isRecommended;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => handleSelectPlan(plan.id)}
                    activeOpacity={0.8}
                    style={[styles.planCardWrapper, isSelected && styles.planCardSelected]}
                  >
                    {isRecommended && (
                      <View style={styles.recommendedBadge}>
                        <RecommendedStar width={28} height={30} />
                      </View>
                    )}
                    <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                      {isSelected && <View style={styles.radioButtonInner} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>{plan.name}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPriceSubtext}>{plan.priceSubtext}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Features Card */}
              <View style={styles.featuresCardWrapper}>
                <View style={styles.featuresInnerCard}>
                  <Text style={styles.featuresTitle}>You'll get:</Text>
                  {(planFeatures[selectedPlan] || planFeatures.default).map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <View style={styles.featureIcon}>
                        <StarFilled width={12} height={12} />
                      </View>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* See More Plans Link */}
        <TouchableOpacity
          onPress={handleViewMorePlans}
          style={styles.seeMoreButton}
          activeOpacity={0.7}
        >
          <Text style={styles.seeMoreText}>See more Plans</Text>
        </TouchableOpacity>

        {/* Subscribe Button with Skia Glass Effect */}
        <GlassButton
          text="Subscribe"
          width={BUTTON_WIDTH}
          height={BUTTON_HEIGHT}
          onPress={handleSubscribe}
          disabled={plansLoading || isVerifying}
          loading={isLoading}
        />
      </ScrollView>

      {/* Verification Loading Modal */}
      <Modal
        visible={isVerifying}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.verifyingTitle}>Verifying Subscription</Text>
            <Text style={styles.verifyingSubtitle}>
              Please wait while we confirm your subscription...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
        planName={plans.find(p => p.id === selectedPlan)?.name || 'Selected Plan'}
        price={plans.find(p => p.id === selectedPlan)?.price || ''}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Figma: rgba(241, 245, 249, 1)
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  eclipseFilled: {
    position: 'absolute',
    top: 65,
    right: 40,
  },
  eclipseStroke: {
    position: 'absolute',
    top: 25,
    right: -30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  // Parent card container - white background via React Native (Skia Canvas is transparent)
  parentCard: {
    borderRadius: 25,
    height: PARENT_CARD_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // React Native handles the white background
    // Shadow for parent card (React Native)
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  // Content overlay on top of Canvas
  parentCardContent: {
    padding: 16,
    zIndex: 1,
  },
  // Plan card wrapper - transparent to show Skia glass
  planCardWrapper: {
    height: PLAN_CARD_HEIGHT,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  // Selected plan card style - elevated with blue shadow glow
  planCardSelected: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: -4,
    zIndex: 10,
  },
  // Radio button
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  planPriceSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  // Features card wrapper - transparent, Skia handles glass effect
  featuresCardWrapper: {
    height: FEATURES_CARD_HEIGHT,
    borderRadius: 16,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  // Features inner card - content styling
  featuresInnerCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    gap: 6,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  featureIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 20,
  },
  seeMoreText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  // Verification Modal Styles
  verifyingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  verifyingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
