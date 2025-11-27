import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { useGetMySubscriptionQuery, useCancelSubscriptionMutation, useReactivateSubscriptionMutation, useCreatePortalSessionMutation } from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import BottomNavBar from '../../../components/BottomNavBar';

interface SettingsScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  onViewPricing?: () => void;
}

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SettingItem = ({
  icon,
  title,
  description,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}) => (
  <TouchableOpacity
    className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
    onPress={onPress}
    activeOpacity={showSwitch ? 1 : 0.7}
    disabled={showSwitch}
  >
    <View className="bg-primary-blue/10 rounded-full p-3 mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-gray-900 text-base font-semibold mb-1">{title}</Text>
      {description && <Text className="text-gray-500 text-xs">{description}</Text>}
    </View>
    {showSwitch ? (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#D1D5DB', true: '#437EF4' }}
        thumbColor="#FFFFFF"
      />
    ) : (
      <ChevronRightIcon />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen({
  activeTab = 'profile',
  onTabChange,
  onBack,
  onViewPricing,
}: SettingsScreenProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: subData, isLoading: subLoading, refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const [cancelSub] = useCancelSubscriptionMutation();
  const [reactivateSub] = useReactivateSubscriptionMutation();
  const [createPortal] = useCreatePortalSessionMutation();
  const { showAlert } = useAlert();

  const subscription = subData?.mySubscription;

  const handleManagePayment = async () => {
    try {
      setActionLoading(true);
      const result = await createPortal('cpdash://settings').unwrap();

      if (result.createPortalSession.success && result.createPortalSession.portalUrl) {
        const canOpen = await Linking.canOpenURL(result.createPortalSession.portalUrl);
        if (canOpen) {
          await Linking.openURL(result.createPortalSession.portalUrl);
        }
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to open payment portal',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to open payment portal',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    showAlert({
      type: 'warning',
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? Your access will continue until the end of the billing period.',
      buttons: [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const result = await cancelSub({
                cancelAtPeriodEnd: true,
                reason: 'User requested cancellation',
              }).unwrap();

              if (result.cancelSubscription.success) {
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Subscription will be canceled at the end of the billing period',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                refetchSubscription();
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.cancelSubscription.message || 'Failed to cancel subscription',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to cancel subscription',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      const result = await reactivateSub().unwrap();

      if (result.reactivateSubscription.success) {
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Subscription reactivated successfully',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        refetchSubscription();
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.reactivateSubscription.message || 'Failed to reactivate subscription',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
            <BackIcon />
          </TouchableOpacity>
          <LogoWhite width={39} height={33} />
          <View className="flex-1 mx-4">
            <Text className="text-white text-xl font-bold">Settings</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Account Settings Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Account Settings</Text>

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="8" r="4" stroke="#437EF4" strokeWidth={2} />
                <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Edit Profile"
            description="Update your personal information"
            onPress={() => console.log('Edit Profile')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#437EF4" strokeWidth={2} fill="none" />
                <Path d="m22 6-10 7L2 6" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Email"
            description={user?.email || 'Not set'}
            onPress={() => console.log('Change Email')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="#437EF4" strokeWidth={2} fill="none" />
              </Svg>
            }
            title="Phone Number"
            description={user?.phoneNumber || 'Not set'}
            onPress={() => console.log('Change Phone')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 15v5M7 10h10M7 10a5 5 0 0 1 5-5m-5 5a5 5 0 0 0 5 5m5-5a5 5 0 0 0-5-5m5 5a5 5 0 0 1-5 5m0-10V1m0 14v5" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Change Password"
            description="Update your password"
            onPress={() => console.log('Change Password')}
          />
        </View>

        {/* Subscription Settings Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Subscription</Text>

          {subLoading ? (
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-gray-500 text-center">Loading subscription details...</Text>
            </View>
          ) : subscription ? (
            <>
              <View className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-200">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-700 text-sm font-semibold">Current Plan</Text>
                  {subscription.isActive && (
                    <View className="bg-green-500 rounded-full px-2 py-0.5">
                      <Text className="text-white text-xs font-bold">ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text className="text-blue-900 text-xl font-bold capitalize mb-2">
                  {subscription.plan} Plan
                </Text>

                {/* AI Usage Stats */}
                <View className="mt-3 pt-3 border-t border-blue-200">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-600 text-xs">AI Resume Parses</Text>
                    <Text className="text-gray-900 text-xs font-semibold">
                      {subscription.aiResumeParsesUsed}/{subscription.aiResumeParsesLimit === -1 ? '∞' : subscription.aiResumeParsesLimit}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600 text-xs">AI Content Improvements</Text>
                    <Text className="text-gray-900 text-xs font-semibold">
                      {subscription.aiContentImprovementsUsed}/{subscription.aiContentImprovementsLimit === -1 ? '∞' : subscription.aiContentImprovementsLimit}
                    </Text>
                  </View>
                </View>

                {/* Billing Info */}
                {subscription.plan !== 'free' && (
                  <View className="mt-3 pt-3 border-t border-blue-200">
                    {subscription.lastPaymentAmount && (
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-600 text-xs">Last Payment</Text>
                        <Text className="text-gray-900 text-xs">
                          ${(subscription.lastPaymentAmount / 100).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {subscription.currentPeriodEnd && (
                      <View className="flex-row justify-between">
                        <Text className="text-gray-600 text-xs">
                          {subscription.status === 'canceled' ? 'Access Until' : 'Next Billing'}
                        </Text>
                        <Text className="text-gray-900 text-xs">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Cancellation Notice */}
                {subscription.status === 'canceled' && (
                  <View className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Text className="text-yellow-800 text-xs text-center">
                      Subscription canceled - Access continues until end of billing period
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {subscription.plan !== 'free' && (
                <View className="gap-3">
                  <SettingItem
                    icon={
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#437EF4" strokeWidth={2} />
                        <Path d="M12 11v6M8 11v6M16 11v6" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    }
                    title="Manage Payment Method"
                    description="Update your billing information"
                    onPress={handleManagePayment}
                    loading={actionLoading}
                  />

                  {subscription.status === 'active' ? (
                    <SettingItem
                      icon={
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth={2} />
                          <Path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                      }
                      title="Cancel Subscription"
                      description="Stop auto-renewal"
                      onPress={handleCancelSubscription}
                      loading={actionLoading}
                    />
                  ) : subscription.status === 'canceled' && (
                    <SettingItem
                      icon={
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path d="M4 12a8 8 0 0 1 8-8V2.5M12 4a8 8 0 0 1 0 16v1.5M12 20a8 8 0 0 1-8-8h-1.5M4 12a8 8 0 0 0 8 8h1.5" stroke="#10B981" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                      }
                      title="Reactivate Subscription"
                      description="Resume your subscription"
                      onPress={handleReactivate}
                      loading={actionLoading}
                    />
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <View className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
                <Text className="text-gray-700 text-sm font-semibold mb-1">Current Plan</Text>
                <Text className="text-gray-900 text-xl font-bold mb-2">Free Plan</Text>
                <Text className="text-gray-500 text-xs">Limited access to basic features</Text>
              </View>

              <TouchableOpacity
                className="bg-primary-blue rounded-xl py-4 items-center"
                activeOpacity={0.8}
                onPress={onViewPricing}
              >
                <Text className="text-white text-base font-semibold">Upgrade to Premium</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Notification Settings Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Notifications</Text>

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Push Notifications"
            description="Receive push notifications"
            showSwitch
            switchValue={pushNotifications}
            onSwitchChange={setPushNotifications}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#437EF4" strokeWidth={2} fill="none" />
                <Path d="m22 6-10 7L2 6" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Email Notifications"
            description="Receive email updates"
            showSwitch
            switchValue={emailNotifications}
            onSwitchChange={setEmailNotifications}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M21 10h-5l-3 3-3-3H5M4 6h16v12H4z" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Job Alerts"
            description="Get notified about new jobs"
            showSwitch
            switchValue={jobAlerts}
            onSwitchChange={setJobAlerts}
          />
        </View>

        {/* Security Settings Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Security</Text>

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M9 12l2 2 4-4" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Two-Factor Authentication"
            description="Add an extra layer of security"
            showSwitch
            switchValue={twoFactorAuth}
            onSwitchChange={setTwoFactorAuth}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="3" stroke="#437EF4" strokeWidth={2} />
                <Path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Biometric Authentication"
            description="Use fingerprint or face ID"
            showSwitch
            switchValue={biometricAuth}
            onSwitchChange={setBiometricAuth}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Privacy Settings"
            description="Manage your privacy preferences"
            onPress={() => console.log('Privacy Settings')}
          />
        </View>

        {/* About Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">About</Text>

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#437EF4" strokeWidth={2} />
                <Path d="M12 16v-4m0-4h.01" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Help & Support"
            description="Get help and contact support"
            onPress={() => console.log('Help & Support')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M14 2v6h6M16 13H8m8 4H8m2-8H8" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            title="Terms & Conditions"
            description="Read our terms and conditions"
            onPress={() => console.log('Terms & Conditions')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M12 15l-3-3h6l-3 3zM12 9l3 3H9l3-3z" fill="#437EF4" />
                <Path d="M20 12h-2M6 12H4M12 6V4M12 20v-2" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="Privacy Policy"
            description="Learn how we protect your data"
            onPress={() => console.log('Privacy Policy')}
          />

          <SettingItem
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#437EF4" strokeWidth={2} />
                <Path d="M12 8v8m-4-4h8" stroke="#437EF4" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            }
            title="App Version"
            description="Version 1.0.0"
          />
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-gray-900 text-lg font-bold mb-4">Danger Zone</Text>

          <TouchableOpacity
            className="bg-red-50 rounded-2xl p-4 border-2 border-red-200 flex-row items-center"
            onPress={() => console.log('Delete Account')}
            activeOpacity={0.7}
          >
            <View className="bg-red-500 rounded-full p-3 mr-4">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <View className="flex-1">
              <Text className="text-red-600 text-base font-semibold mb-1">Delete Account</Text>
              <Text className="text-red-500 text-xs">Permanently delete your account and data</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </SafeAreaView>
  );
}
