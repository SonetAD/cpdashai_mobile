import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Pressable, ActivityIndicator, Platform, Share, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { useAlert } from '../../../contexts/AlertContext';
import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { clearTokens } from '../../../utils/authUtils';
import {
  useGetMySubscriptionQuery,
  useCheckSubscriptionStatusQuery,
  useCancelSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useExportMyDataMutation,
  useDeleteAccountMutation,
  useCreateSubscriptionSetupMutation,
  useGetAvailablePlansQuery,
} from '../../../services/api';
import { processPayment } from '../../../services/stripePayment';

interface SettingsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  onViewPricing?: () => void;
  onViewBillingHistory?: () => void;
}

// Chevron Right Icon
const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke="#9CA3AF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Menu Item Component with animations
interface MenuItemProps {
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress, isLast = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View
        className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <Text className="text-gray-600 text-base">{label}</Text>
        <ChevronRightIcon />
      </Animated.View>
    </Pressable>
  );
};

export default function SettingsScreen({
  activeTab = 'profile',
  onTabChange,
  onBack,
  onViewPricing,
  onViewBillingHistory,
}: SettingsScreenProps) {
  const { showAlert } = useAlert();
  const dispatch = useAppDispatch();
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<'choose' | 'confirm-period' | 'confirm-immediate'>('choose');
  const cancelModalAnim = useRef(new Animated.Value(0)).current;

  // Subscription queries and mutations
  const { data: subData, isLoading: subLoading, refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const { refetch: refetchSubscriptionStatus } = useCheckSubscriptionStatusQuery();
  const { data: plansData } = useGetAvailablePlansQuery();
  const [cancelSub] = useCancelSubscriptionMutation();
  const [reactivateSub] = useReactivateSubscriptionMutation();
  const [createSubscriptionSetup] = useCreateSubscriptionSetupMutation();

  // GDPR mutations
  const [exportMyData] = useExportMyDataMutation();
  const [deleteAccount] = useDeleteAccountMutation();

  const subscription = subData?.mySubscription;

  // Helper to refresh all subscription data
  const refreshSubscriptionData = async () => {
    try {
      await Promise.all([
        refetchSubscription(),
        refetchSubscriptionStatus(),
      ]);
    } catch (error) {
      console.log('Error refreshing subscription data:', error);
    }
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Subscription handlers
  const handleManagePayment = async () => {
    try {
      setActionLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Get the current plan's stripePriceId
      const currentPlanKey = subscription?.plan?.toLowerCase();
      const currentPlan = plansData?.availablePlans?.plans?.find(
        (p) => p.planKey.toLowerCase() === currentPlanKey
      );

      if (!currentPlan?.stripePriceId) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Unable to find your current plan. Please contact support.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setActionLoading(false);
        return;
      }

      // Create a SetupIntent to update payment method in-app
      const result = await createSubscriptionSetup({
        priceId: currentPlan.stripePriceId,
      }).unwrap();

      const setupData = result?.createSubscriptionSetup;

      if (!setupData?.success || !setupData?.setupIntentClientSecret) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: setupData?.message || 'Failed to initialize payment update. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setActionLoading(false);
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
          title: 'Payment Method Updated',
          message: 'Your payment method has been successfully updated.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        // Refresh subscription data
        refreshSubscriptionData();
      } else if (paymentResult.cancelled) {
        // User cancelled - no action needed
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Update Failed',
          message: paymentResult.error || 'Could not update payment method. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Manage payment error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.createSubscriptionSetup?.message || 'An error occurred. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for viewing billing history
  const handleViewBillingHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewBillingHistory?.();
  };

  // Open cancel modal
  const openCancelModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCancelStep('choose');
    setShowCancelModal(true);
    Animated.spring(cancelModalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  // Close cancel modal
  const closeCancelModal = () => {
    Animated.timing(cancelModalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCancelModal(false);
      setCancelStep('choose');
    });
  };

  // Process the actual cancellation
  const processCancellation = async (cancelAtPeriodEnd: boolean) => {
    try {
      setActionLoading(true);
      const result = await cancelSub({
        cancelAtPeriodEnd,
        reason: cancelAtPeriodEnd ? 'User requested cancellation' : 'User requested immediate cancellation',
      }).unwrap();

      closeCancelModal();

      if (result.cancelSubscription.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const accessEndsAt = result.cancelSubscription.accessEndsAt
          ? new Date(result.cancelSubscription.accessEndsAt).toLocaleDateString()
          : null;

        if (cancelAtPeriodEnd && accessEndsAt) {
          showAlert({
            type: 'success',
            title: 'Subscription Canceled',
            message: `Your subscription will end on ${accessEndsAt}. You'll keep access until then.`,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        } else {
          showAlert({
            type: 'success',
            title: 'Subscription Canceled',
            message: 'Your subscription has been canceled. Access has been removed.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
        refreshSubscriptionData();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.cancelSubscription.message || 'Failed to cancel subscription',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch {
      closeCancelModal();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to cancel subscription',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    openCancelModal();
  };

  // Get formatted period end date
  const periodEndDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Cancel Modal Content
  const renderCancelModalContent = () => {
    if (cancelStep === 'choose') {
      return (
        <>
          {/* Header */}
          <View style={cancelModalStyles.header}>
            <View style={cancelModalStyles.iconContainer}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth={2} />
                <Path d="M12 8v4M12 16h.01" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={cancelModalStyles.title}>Cancel Subscription</Text>
            <Text style={cancelModalStyles.subtitle}>Choose how you'd like to cancel</Text>
          </View>

          {/* Options */}
          <View style={cancelModalStyles.optionsContainer}>
            {/* Keep Access Option (Recommended) */}
            <TouchableOpacity
              style={[cancelModalStyles.optionCard, cancelModalStyles.recommendedOption]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCancelStep('confirm-period');
              }}
            >
              <View style={cancelModalStyles.recommendedBadge}>
                <Text style={cancelModalStyles.recommendedText}>RECOMMENDED</Text>
              </View>
              <View style={cancelModalStyles.optionIconContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={cancelModalStyles.optionTitle}>Keep Access Until Period End</Text>
              <Text style={cancelModalStyles.optionDescription}>
                {periodEndDate
                  ? `Continue using all features until ${periodEndDate}`
                  : 'Continue using all features until your billing period ends'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Immediately Option */}
            <TouchableOpacity
              style={[cancelModalStyles.optionCard, cancelModalStyles.immediateOption]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCancelStep('confirm-immediate');
              }}
            >
              <View style={cancelModalStyles.optionIconContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={[cancelModalStyles.optionTitle, { color: '#DC2626' }]}>Cancel Immediately</Text>
              <Text style={cancelModalStyles.optionDescription}>
                Lose access right away. No refund will be provided.
              </Text>
            </TouchableOpacity>
          </View>

          {/* Keep Subscription Button */}
          <TouchableOpacity
            style={cancelModalStyles.keepButton}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              closeCancelModal();
            }}
          >
            <Text style={cancelModalStyles.keepButtonText}>Keep My Subscription</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (cancelStep === 'confirm-period') {
      return (
        <>
          <View style={cancelModalStyles.header}>
            <View style={[cancelModalStyles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={cancelModalStyles.title}>Confirm Cancellation</Text>
            <Text style={cancelModalStyles.subtitle}>
              {periodEndDate
                ? `You'll keep access until ${periodEndDate}`
                : "You'll keep access until your billing period ends"}
            </Text>
          </View>

          <View style={cancelModalStyles.confirmInfo}>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={cancelModalStyles.infoText}>All features remain available</Text>
            </View>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={cancelModalStyles.infoText}>No charges after cancellation</Text>
            </View>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={cancelModalStyles.infoText}>Can reactivate anytime</Text>
            </View>
          </View>

          <View style={cancelModalStyles.buttonGroup}>
            <TouchableOpacity
              style={cancelModalStyles.backButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCancelStep('choose');
              }}
            >
              <Text style={cancelModalStyles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cancelModalStyles.confirmButton, actionLoading && { opacity: 0.7 }]}
              activeOpacity={0.7}
              disabled={actionLoading}
              onPress={() => processCancellation(true)}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={cancelModalStyles.confirmButtonText}>Confirm Cancellation</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (cancelStep === 'confirm-immediate') {
      return (
        <>
          <View style={cancelModalStyles.header}>
            <View style={[cancelModalStyles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={cancelModalStyles.title}>Cancel Immediately?</Text>
            <Text style={[cancelModalStyles.subtitle, { color: '#DC2626' }]}>
              This action cannot be undone
            </Text>
          </View>

          <View style={[cancelModalStyles.confirmInfo, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[cancelModalStyles.infoText, { color: '#991B1B' }]}>Access removed immediately</Text>
            </View>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[cancelModalStyles.infoText, { color: '#991B1B' }]}>No refund for unused time</Text>
            </View>
            <View style={cancelModalStyles.infoRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M6 18L18 6M6 6l12 12" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={[cancelModalStyles.infoText, { color: '#991B1B' }]}>Premium features disabled</Text>
            </View>
          </View>

          <View style={cancelModalStyles.buttonGroup}>
            <TouchableOpacity
              style={cancelModalStyles.backButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCancelStep('choose');
              }}
            >
              <Text style={cancelModalStyles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cancelModalStyles.dangerButton, actionLoading && { opacity: 0.7 }]}
              activeOpacity={0.7}
              disabled={actionLoading}
              onPress={() => processCancellation(false)}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={cancelModalStyles.confirmButtonText}>Cancel Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return null;
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await reactivateSub().unwrap();

      if (result.reactivateSubscription.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Subscription reactivated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        refreshSubscriptionData();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.reactivateSubscription.message || 'Failed to reactivate subscription',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to reactivate subscription',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle menu item presses
  const handleChangePassword = () => {
    showAlert({
      type: 'info',
      title: 'Change Password',
      message: 'Password change functionality will be available in Milestone 3.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleTwoFactor = () => {
    showAlert({
      type: 'info',
      title: 'Two-Factor Authentication',
      message: 'Two-factor authentication setup will be available in Milestone 3.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleActiveSessions = () => {
    showAlert({
      type: 'info',
      title: 'Active Sessions',
      message: 'View and manage your active sessions. Available in Milestone 3.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleProfileUpdate = () => {
    showAlert({
      type: 'info',
      title: 'Profile Update',
      message: 'Profile update settings will be available in Milestone 3.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleTerms = () => {
    showAlert({
      type: 'info',
      title: 'Terms & Conditions',
      message: 'Terms and conditions will be displayed here.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handlePrivacyPolicy = () => {
    showAlert({
      type: 'info',
      title: 'Privacy Policy',
      message: 'Privacy policy will be displayed here.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleVersion = () => {
    showAlert({
      type: 'info',
      title: 'Version Info',
      message: 'CPDashAI Version 1.0.0\nBuild: 2024.12.30',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleReviewConsent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: 'info',
      title: 'Manage Consent',
      message: 'Review and manage your data consent preferences. Available in Milestone 3.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  // Handle data export (GDPR - Data Portability)
  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert({
      type: 'info',
      title: 'Export Your Data',
      message: 'This will download all your personal data stored in CPDashAI. The export includes your profile, applications, interviews, and more.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          style: 'default',
          onPress: async () => {
            try {
              setExportLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              const result = await exportMyData().unwrap();

              if (result.exportMyData.__typename === 'DataExportSuccessType' && result.exportMyData.success) {
                const exportData = result.exportMyData.exportData;
                const fileName = `cpdash-data-export-${new Date().toISOString().split('T')[0]}.json`;

                // Format JSON with indentation
                const formattedData = JSON.stringify(JSON.parse(exportData), null, 2);

                // Save to file system
                const fileUri = `${FileSystem.documentDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(fileUri, formattedData);

                // Use native Share API to share/save the data
                try {
                  await Share.share({
                    message: formattedData,
                    title: 'CPDashAI Data Export',
                  });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (shareError) {
                  // If share fails, show success message with file location
                  showAlert({
                    type: 'success',
                    title: 'Export Complete',
                    message: `Your data has been saved to: ${fileUri}`,
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              } else {
                const errorMessage = result.exportMyData.__typename === 'ErrorType'
                  ? result.exportMyData.message
                  : 'Failed to export data';
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                showAlert({
                  type: 'error',
                  title: 'Export Failed',
                  message: errorMessage,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              console.error('Export error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              showAlert({
                type: 'error',
                title: 'Export Failed',
                message: 'An error occurred while exporting your data. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            } finally {
              setExportLoading(false);
            }
          },
        },
      ],
    });
  };

  // State to track delete confirmation step
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirming' | 'deleting'>('idle');

  // Handle account deletion (GDPR - Right to be Forgotten)
  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteStep('confirming');

    // Single confirmation with clear consent message
    showAlert({
      type: 'warning',
      title: 'Delete Account Permanently?',
      message: 'This action cannot be undone. All your data will be permanently removed:\n\n• Profile and resume\n• Job applications\n• Interview sessions\n• Saved jobs and matches\n• Subscription data\n\nBy clicking "Delete Forever", you consent to permanent deletion.',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setDeleteStep('idle');
          }
        },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            setDeleteStep('deleting');
            // Use setTimeout to ensure alert closes before mutation runs
            setTimeout(() => {
              executeAccountDeletion();
            }, 100);
          },
        },
      ],
    });
  };

  const executeAccountDeletion = async () => {
    try {
      setDeleteLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const result = await deleteAccount().unwrap();

      if (result.deleteAccount.__typename === 'SuccessType' && result.deleteAccount.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Clear auth immediately
        await clearTokens();
        dispatch(logout());

        showAlert({
          type: 'success',
          title: 'Account Deleted',
          message: result.deleteAccount.message || 'Your account has been successfully deleted. We\'re sorry to see you go.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        const errorMessage = result.deleteAccount.__typename === 'ErrorType'
          ? result.deleteAccount.message
          : 'Failed to delete account';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Deletion Failed',
          message: errorMessage,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: 'error',
        title: 'Deletion Failed',
        message: error?.data?.message || error?.message || 'An error occurred while deleting your account. Please try again or contact support.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setDeleteLoading(false);
      setDeleteStep('idle');
    }
  };

  return (
    <CandidateLayout
      activeTab={activeTab}
      onTabChange={onTabChange}
      showBackButton={true}
      onBack={onBack}
      headerTitle="Settings & Privacy"
      showSearch={false}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Manage Consent Card */}
          <View className="px-4 pt-6">
            <View className="bg-white rounded-2xl p-5" style={styles.card}>
              <Text className="text-gray-900 text-xl font-bold mb-2">Manage Consent</Text>
              <Text className="text-gray-500 text-sm mb-5">
                Review what data CPDashAI uses to personalize your experience.
              </Text>
              <Pressable
                onPress={handleReviewConsent}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={['#4F7DF3', '#3B5FD4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.consentButton}
                >
                  <Text className="text-white font-semibold text-base">Review Consent</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Subscription Section */}
          <View className="px-4 pt-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">Subscription</Text>
            <View className="bg-white rounded-2xl px-4" style={styles.card}>
              {subLoading ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#4F7DF3" />
                  <Text className="text-gray-500 text-sm mt-2">Loading...</Text>
                </View>
              ) : subscription && subscription.plan !== 'free' && subscription.isActive ? (
                <>
                  {/* Period End Cancellation Banner - Still Has Access */}
                  {subscription.cancelAtPeriodEnd && subscription.isActive && (
                    <View style={{
                      backgroundColor: '#FEF3C7',
                      borderWidth: 1,
                      borderColor: '#FCD34D',
                      borderRadius: 12,
                      padding: 12,
                      marginTop: 12,
                      marginBottom: 4,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#92400E', marginLeft: 8 }}>
                          Subscription Canceled
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18 }}>
                        Your subscription won't renew. You'll have access until{' '}
                        <Text style={{ fontWeight: '600' }}>
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        .
                      </Text>
                    </View>
                  )}

                  {/* Current Plan Row */}
                  <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                    <Text className="text-gray-600 text-base">Current Plan</Text>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 text-base font-semibold capitalize mr-2">
                        {subscription.plan}
                      </Text>
                      {!subscription.isActive ? (
                        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: '700' }}>CANCELED</Text>
                        </View>
                      ) : subscription.cancelAtPeriodEnd ? (
                        <View style={{ backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: '#D97706', fontSize: 11, fontWeight: '700' }}>CANCELING</Text>
                        </View>
                      ) : (
                        <View className="bg-green-500 rounded px-2 py-0.5">
                          <Text className="text-white text-xs font-bold">ACTIVE</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Next Billing / Access End Date - Only show if still active */}
                  {subscription.isActive && (
                    <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                      <Text className="text-gray-600 text-base">
                        {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing'}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: subscription.cancelAtPeriodEnd || subscription.status === 'canceled' ? '#D97706' : '#374151'
                    }}>
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  )}

                  {/* Update Payment Method - only show if not canceled */}
                  {!subscription.cancelAtPeriodEnd && subscription.status !== 'canceled' && (
                    <Pressable
                      onPress={handleManagePayment}
                      disabled={actionLoading}
                      className="flex-row items-center justify-between py-4 border-b border-gray-100"
                      style={({ pressed }) => [{ opacity: pressed || actionLoading ? 0.7 : 1 }]}
                    >
                      <Text className="text-primary-blue text-base">
                        {actionLoading ? 'Loading...' : 'Update Payment Method'}
                      </Text>
                      <ChevronRightIcon />
                    </Pressable>
                  )}

                  {/* Billing History */}
                  <TouchableOpacity
                    onPress={handleViewBillingHistory}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                  >
                    <Text className="text-primary-blue text-base">Billing History</Text>
                    <ChevronRightIcon />
                  </TouchableOpacity>

                  {/* Cancel or Reactivate */}
                  {subscription.cancelAtPeriodEnd || subscription.status === 'canceled' ? (
                    <Pressable
                      onPress={handleReactivate}
                      disabled={actionLoading}
                      className="py-4"
                      style={({ pressed }) => [{ opacity: pressed || actionLoading ? 0.7 : 1 }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                          <Path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                        <Text className="text-green-600 text-base font-medium">Reactivate Subscription</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleCancelSubscription}
                      disabled={actionLoading}
                      className="py-4"
                      style={({ pressed }) => [{ opacity: pressed || actionLoading ? 0.7 : 1 }]}
                    >
                      <Text className="text-red-500 text-base">Cancel Subscription</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <>
                  {/* Free Plan or Immediately Canceled */}
                  <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                    <Text className="text-gray-600 text-base">Current Plan</Text>
                    <Text className="text-gray-900 text-base font-semibold">
                      {subscription && !subscription.isActive ? 'None' : 'Free'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      onViewPricing?.();
                    }}
                    className="py-4"
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text className="text-primary-blue text-base">
                      {subscription && !subscription.isActive ? 'Subscribe Now' : 'Upgrade to Premium'}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Security Section */}
          <View className="px-4 pt-6">
            <Text className="text-gray-500 text-base font-semibold mb-3">Security</Text>
            <View className="bg-white rounded-2xl px-4" style={styles.card}>
              <MenuItem
                label="Change Password"
                onPress={handleChangePassword}
              />
              <MenuItem
                label="Two-Factor Authentication"
                onPress={handleTwoFactor}
              />
              <MenuItem
                label="Active Sessions"
                onPress={handleActiveSessions}
              />
              <MenuItem
                label="Profile Update"
                onPress={handleProfileUpdate}
                isLast={true}
              />
            </View>
          </View>

          {/* About CPDashAI Section */}
          <View className="px-4 pt-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">About CPDashAI</Text>
            <View className="bg-white rounded-2xl px-4" style={styles.card}>
              <MenuItem
                label="Terms & Conditions"
                onPress={handleTerms}
              />
              <MenuItem
                label="Privacy Policy"
                onPress={handlePrivacyPolicy}
              />
              <MenuItem
                label="Version 1.0.0"
                onPress={handleVersion}
                isLast={true}
              />
            </View>
          </View>

          {/* Data & Privacy Section (GDPR) */}
          <View className="px-4 pt-6">
            <Text className="text-gray-900 text-lg font-bold mb-3">Data & Privacy</Text>
            <View className="bg-white rounded-2xl px-4" style={styles.card}>
              {/* Export My Data */}
              <Pressable
                onPress={handleExportData}
                disabled={exportLoading}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
                style={({ pressed }) => [{ opacity: pressed || exportLoading ? 0.7 : 1 }]}
              >
                <View className="flex-1">
                  <Text className="text-gray-900 text-base">Export My Data</Text>
                  <Text className="text-gray-500 text-xs mt-1">Download all your personal data</Text>
                </View>
                {exportLoading ? (
                  <ActivityIndicator size="small" color="#4F7DF3" />
                ) : (
                  <ChevronRightIcon />
                )}
              </Pressable>

              {/* Delete Account */}
              <Pressable
                onPress={handleDeleteAccount}
                disabled={deleteLoading}
                className="py-4"
                style={({ pressed }) => [{ opacity: pressed || deleteLoading ? 0.7 : 1 }]}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-red-500 text-base">Delete My Account</Text>
                    <Text className="text-gray-500 text-xs mt-1">Permanently remove all your data</Text>
                  </View>
                  {deleteLoading && (
                    <ActivityIndicator size="small" color="#EF4444" />
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* Spacing at bottom */}
          <View className="h-8" />
        </Animated.View>
      </ScrollView>

      {/* Cancel Subscription Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="none"
        onRequestClose={closeCancelModal}
      >
        <Pressable
          style={cancelModalStyles.overlay}
          onPress={closeCancelModal}
        >
          <Animated.View
            style={[
              cancelModalStyles.modalContainer,
              {
                opacity: cancelModalAnim,
                transform: [
                  {
                    scale: cancelModalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {renderCancelModalContent()}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </CandidateLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  consentButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const cancelModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: SCREEN_WIDTH - 40,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  recommendedOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  immediateOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  keepButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  keepButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmInfo: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 10,
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
});
