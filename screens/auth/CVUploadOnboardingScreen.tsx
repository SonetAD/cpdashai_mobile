import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { useUpdateOnboardingStepMutation } from '../../services/api';
import LogoWhite from '../../assets/images/logoWhite.svg';
import DocumentIcon from '../../assets/images/document.svg';
import { styles } from '../../styles/CVUploadOnboardingStyles';

interface CVUploadOnboardingScreenProps {
  onComplete: () => void;
  onCreateCV: () => void;
  onBack?: () => void;
}

// Back arrow icon - stroke color #131A29
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#131A29"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function CVUploadOnboardingScreen({
  onComplete,
  onCreateCV,
  onBack,
}: CVUploadOnboardingScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [updateOnboardingStep] = useUpdateOnboardingStepMutation();

  const handleCreateCV = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Don't mark as complete - user is going to CV builder
    // Step will be marked complete when user actually uploads/creates CV
    onCreateCV();
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      await updateOnboardingStep({ step: 'cv', completed: true });
      onComplete();
    } catch (error) {
      console.error('Error updating onboarding step:', error);
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Blue Header */}
      <LinearGradient
        colors={['#437EF4', '#3B71E0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <LogoWhite width={48} height={48} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>CV Upload</Text>
            <Text style={styles.headerSubtitle}>
              Manage your resumes, update,{'\n'}improve and export.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Back Button Row */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.backText}>Create Your CV</Text>
        </View>

        {/* Main Card - Glass Effect */}
        <View style={styles.mainCard}>
          {/* Empty State */}
          <View style={styles.emptyState}>
            <DocumentIcon width={64} height={81} />
            <Text style={styles.emptyTitle}>No CV Yet</Text>
          </View>

          {/* Create CV Card */}
          <View style={styles.createCard}>
            <View style={styles.createCardContent}>
              <Text style={styles.createTitle}>Create a New CV</Text>
              <Text style={styles.createDescription}>
                Utilize our advanced CV builder to craft a professional resume.
              </Text>
            </View>

            {/* Create Button with Glass Effect */}
            <TouchableOpacity
              onPress={handleCreateCV}
              disabled={isLoading}
              activeOpacity={0.9}
              style={styles.createButtonWrapper}
            >
              <View style={styles.createButton}>
                <View style={styles.createButtonInner}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Create Your First CV</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          disabled={isLoading}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
