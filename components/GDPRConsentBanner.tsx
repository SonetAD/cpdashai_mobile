import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Cookie icon component
const CookieIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#4F5B93" />
    <Circle cx="8" cy="9" r="1.5" fill="#2D3561" />
    <Circle cx="14" cy="8" r="1" fill="#2D3561" />
    <Circle cx="16" cy="13" r="1.5" fill="#2D3561" />
    <Circle cx="10" cy="14" r="1" fill="#2D3561" />
    <Circle cx="7" cy="13" r="0.8" fill="#2D3561" />
    <Circle cx="13" cy="16" r="1" fill="#2D3561" />
  </Svg>
);

export interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdParty: boolean;
  dataProcessing: boolean;
  privacyPolicy: boolean;
  termsOfService: boolean;
}

interface GDPRConsentBannerProps {
  visible: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSavePreferences: (preferences: ConsentPreferences) => void;
  onClose?: () => void;
}

const POLICY_VERSION = '1.0';

export default function GDPRConsentBanner({
  visible,
  onAcceptAll,
  onRejectAll,
  onSavePreferences,
  onClose,
}: GDPRConsentBannerProps) {
  const insets = useSafeAreaInsets();
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true, // Always true, cannot be changed
    analytics: false,
    marketing: false,
    personalization: false,
    thirdParty: false,
    dataProcessing: true,
    privacyPolicy: true,
    termsOfService: true,
  });

  const handleAcceptAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAcceptAll();
  };

  const handleRejectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRejectAll();
  };

  const handleCustomize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCustomize(true);
  };

  const handleSaveCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSavePreferences(preferences);
    setShowCustomize(false);
  };

  const togglePreference = (key: keyof ConsentPreferences) => {
    // Cannot toggle essential, privacyPolicy, termsOfService, or dataProcessing - these are required
    if (key === 'essential' || key === 'privacyPolicy' || key === 'termsOfService' || key === 'dataProcessing') {
      return;
    }
    Haptics.selectionAsync();
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!visible) return null;

  // Customize Modal - Back button goes back to main consent banner (not dismiss entirely)
  if (showCustomize) {
    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Go back to main consent banner, not dismiss
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowCustomize(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[styles.customizeModal, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Text style={styles.customizeTitle}>Customize Consent</Text>
            <Text style={styles.customizeSubtitle}>
              Choose which data collection you allow
            </Text>

            <ScrollView style={styles.preferencesScroll} showsVerticalScrollIndicator={false}>
              {/* Essential - Required */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Essential Cookies (Required)</Text>
                  <Text style={styles.preferenceDesc}>
                    Required for the app to function properly
                  </Text>
                </View>
                <Switch
                  value={true}
                  disabled
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor="#3B82F6"
                />
              </View>

              {/* Analytics */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Analytics</Text>
                  <Text style={styles.preferenceDesc}>
                    Help us improve by tracking app usage
                  </Text>
                </View>
                <Switch
                  value={preferences.analytics}
                  onValueChange={() => togglePreference('analytics')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={preferences.analytics ? '#3B82F6' : '#9CA3AF'}
                />
              </View>

              {/* Marketing */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Marketing</Text>
                  <Text style={styles.preferenceDesc}>
                    Personalized ads and promotional content
                  </Text>
                </View>
                <Switch
                  value={preferences.marketing}
                  onValueChange={() => togglePreference('marketing')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={preferences.marketing ? '#3B82F6' : '#9CA3AF'}
                />
              </View>

              {/* Personalization */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Personalization</Text>
                  <Text style={styles.preferenceDesc}>
                    Tailored content based on your preferences
                  </Text>
                </View>
                <Switch
                  value={preferences.personalization}
                  onValueChange={() => togglePreference('personalization')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={preferences.personalization ? '#3B82F6' : '#9CA3AF'}
                />
              </View>

              {/* Third Party */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Third-Party Services</Text>
                  <Text style={styles.preferenceDesc}>
                    Integration with external services
                  </Text>
                </View>
                <Switch
                  value={preferences.thirdParty}
                  onValueChange={() => togglePreference('thirdParty')}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={preferences.thirdParty ? '#3B82F6' : '#9CA3AF'}
                />
              </View>

              {/* Data Processing - Required */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Data Processing (Required)</Text>
                  <Text style={styles.preferenceDesc}>
                    Process your data to provide services
                  </Text>
                </View>
                <Switch
                  value={true}
                  disabled
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor="#3B82F6"
                />
              </View>

              {/* Privacy Policy - Required */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Privacy Policy (Required)</Text>
                  <Text style={styles.preferenceDesc}>
                    Accept our privacy policy
                  </Text>
                </View>
                <Switch
                  value={true}
                  disabled
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor="#3B82F6"
                />
              </View>

              {/* Terms of Service - Required */}
              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Terms of Service (Required)</Text>
                  <Text style={styles.preferenceDesc}>
                    Accept our terms of service
                  </Text>
                </View>
                <Switch
                  value={true}
                  disabled
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor="#3B82F6"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.customizeActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCustomize(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCustom}>
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Main Consent Banner - User must explicitly choose an option (cannot dismiss by back button or tapping outside)
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Prevent closing with back button - user must make a choice
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }}
    >
      <View style={styles.bannerOverlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.bannerContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.banner}>
            {/* Icon and Text */}
            <View style={styles.bannerContent}>
              <View style={styles.iconContainer}>
                <CookieIcon />
              </View>
              <Text style={styles.bannerText}>
                We collect your data in order to improve your experience in the form of cookies.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.acceptAllButton} onPress={handleAcceptAll}>
                <Text style={styles.acceptAllText}>Accept All</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.customizeButton} onPress={handleCustomize}>
                <Text style={styles.customizeText}>Customize</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rejectButton} onPress={handleRejectAll}>
                <Text style={styles.rejectText}>Reject All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bannerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bannerContainer: {
    paddingHorizontal: 16,
  },
  banner: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptAllButton: {
    flex: 1.2,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  customizeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customizeText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  rejectText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Customize Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  customizeModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  customizeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  customizeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  preferencesScroll: {
    maxHeight: 350,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  customizeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export { POLICY_VERSION };
