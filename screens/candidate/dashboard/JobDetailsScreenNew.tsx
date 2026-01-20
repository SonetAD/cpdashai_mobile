import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  useGetJobPostingQuery,
  useApplyToJobMutation,
  useWithdrawApplicationMutation,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useGetCandidateProfileQuery,
  useGetMyApplicationsQuery,
  useGetMyProfileQuery,
  useGenerateCoverLetterMutation,
  useGetMyResumesQuery,
  useLazyGetCoverLetterGenerationQuery,
} from '../../../services/api';
import { handleApiError } from '../../../utils/errorHandler';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';
import { GlassButton } from '../../../components/ui/GlassButton';
import { useAlert } from '../../../contexts/AlertContext';
import { useFeatureAccess } from '../../../contexts/FeatureGateContext';
import AiIcon from '../../../assets/images/jobs/ai.svg';
import ApplicationSuccessPopup from '../../../components/ApplicationSuccessPopup';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = 20;

// Icons
const CheckCircleIcon = ({ size = 22, color = '#437EF4' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XCircleIcon = ({ size = 22, color = '#EF4444' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const BackArrowIcon = ({ color = '#1F2937' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface JobDetailsScreenNewProps {
  jobId: string;
  onBack?: () => void;
  onNavigateToProfile?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export default function JobDetailsScreenNew({
  jobId,
  onBack,
  onNavigateToProfile,
  activeTab = 'jobs',
  onTabChange,
}: JobDetailsScreenNewProps) {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Track full generation including polling

  // Profile data for avatar
  const { data: profileData } = useGetMyProfileQuery();
  const profilePictureUrl = profileData?.myProfile?.profilePicture || null;

  // Fetch job details
  const { data: jobData, isLoading: jobLoading, refetch: refetchJob } = useGetJobPostingQuery({ jobId });
  const { data: candidateProfileData } = useGetCandidateProfileQuery();
  const { data: applicationsData, refetch: refetchApplications } = useGetMyApplicationsQuery({});

  // Mutations
  const [applyToJob, { isLoading: isApplying }] = useApplyToJobMutation();
  const [withdrawApplication, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();
  const [generateCoverLetter, { isLoading: isGeneratingCoverLetter }] = useGenerateCoverLetterMutation();
  const [getCoverLetterGeneration] = useLazyGetCoverLetterGenerationQuery();

  // Get user's resumes for cover letter generation
  const { data: resumesData } = useGetMyResumesQuery();

  const job = jobData?.jobPosting;
  const match = job?.candidateMatch;
  const applicationStatus = job?.applicationStatus;
  const rejectionReason = job?.rejectionReason;

  // Find the application for this job
  const application = applicationsData?.myApplications?.find(
    (app: any) => app.jobPosting.id === jobId
  );
  const applicationId = application?.id;

  // Check if user can withdraw
  const canWithdraw = applicationId && ['pending', 'reviewed'].includes(applicationStatus || '');

  // Get candidate profile
  const candidateProfile = candidateProfileData?.myProfile?.__typename === 'CandidateType'
    ? candidateProfileData.myProfile
    : null;

  // Check feature access for job match insights (Fit Breakdown)
  const { hasAccess: hasMatchInsightsAccess } = useFeatureAccess('job_match_basic');

  // Check location for application
  const checkLocation = useCallback(() => {
    return candidateProfile?.preferredLocations && candidateProfile.preferredLocations.length > 0;
  }, [candidateProfile]);

  // Get the first/primary resume for cover letter generation
  const primaryResume = resumesData?.myResumes?.[0];

  // Handle AI cover letter generation
  const handleGenerateCoverLetter = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if user has a resume
    if (!primaryResume?.id) {
      showAlert({
        type: 'warning',
        title: 'Resume Required',
        message: 'Please create or upload a resume first to generate a personalized cover letter.',
        buttons: [
          {
            text: 'Go to CV Builder',
            onPress: () => {
              setShowApplicationModal(false);
              // Navigate to CV builder if callback exists
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      });
      return;
    }

    // Check if job has description
    if (!job?.description) {
      showAlert({
        type: 'warning',
        title: 'Job Details Missing',
        message: 'Job description is required to generate a cover letter.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }

    // Start generation - track the entire process
    setIsGenerating(true);

    try {
      // Backend auto-fetches resume from user profile, just need job description text
      const result = await generateCoverLetter({
        jobDescriptionText: job.description,
      }).unwrap();

      if (result.generateCoverLetter.__typename === 'CoverLetterGenerationSuccessType') {
        const generation = result.generateCoverLetter.generation;

        // If already completed, use it directly
        if (generation?.status === 'completed' && generation.generatedCoverLetter) {
          setCoverLetter(generation.generatedCoverLetter);
          setIsGenerating(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAlert({
            type: 'success',
            title: 'Cover Letter Generated',
            message: 'Your personalized cover letter is ready! Feel free to edit it before applying.',
            buttons: [{ text: 'Great!' }],
          });
          return;
        }

        // If pending/processing, poll for completion
        if (generation?.id && (generation.status === 'pending' || generation.status === 'processing')) {
          const pollForCompletion = async (generationId: string, attempts = 0): Promise<void> => {
            if (attempts >= 30) { // Max 30 attempts (30 seconds)
              throw new Error('Cover letter generation timed out. Please try again.');
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

            const pollResult = await getCoverLetterGeneration({ id: generationId }).unwrap();
            const polledGeneration = pollResult.coverLetterGeneration;

            if (polledGeneration?.status === 'completed' && polledGeneration.generatedCoverLetter) {
              setCoverLetter(polledGeneration.generatedCoverLetter);
              setIsGenerating(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showAlert({
                type: 'success',
                title: 'Cover Letter Generated',
                message: 'Your personalized cover letter is ready! Feel free to edit it before applying.',
                buttons: [{ text: 'Great!' }],
              });
              return;
            }

            if (polledGeneration?.status === 'failed') {
              throw new Error(polledGeneration.errorMessage || 'Cover letter generation failed');
            }

            // Still processing, continue polling
            return pollForCompletion(generationId, attempts + 1);
          };

          await pollForCompletion(generation.id);
        }
      } else if (result.generateCoverLetter.__typename === 'ErrorType') {
        throw new Error(result.generateCoverLetter.message || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
      setIsGenerating(false);
      await handleApiError(error, showAlert, {
        onRetry: handleGenerateCoverLetter,
        featureName: 'AI Cover Letter',
      });
    }
  };

  const handleApply = async () => {
    if (!checkLocation()) {
      showAlert({
        type: 'warning',
        title: 'Location Required',
        message: 'Please add your preferred locations in your profile before applying to jobs.',
        buttons: [
          {
            text: 'Add Location',
            onPress: () => {
              setShowApplicationModal(false);
              onNavigateToProfile?.();
            },
          },
          { text: 'Cancel' },
        ],
      });
      return;
    }

    try {
      const result = await applyToJob({
        jobId,
        coverLetter: coverLetter || undefined,
      }).unwrap();

      if (result.applyToJob.__typename === 'JobApplicationSuccessType' && result.applyToJob.success) {
        setShowApplicationModal(false);
        setCoverLetter('');
        await Promise.all([refetchJob(), refetchApplications()]);
        // Show success popup instead of alert
        setShowSuccessPopup(true);
      } else if (result.applyToJob.__typename === 'ErrorType') {
        showAlert({
          type: 'error',
          title: 'Application Error',
          message: result.applyToJob.message || 'Failed to submit application',
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error?.data?.applyToJob?.message || error?.message || 'Failed to submit application',
      });
    }
  };

  const handleWithdraw = async () => {
    if (!applicationId) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Application ID not found.',
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Withdraw Application',
      message: 'Are you sure you want to withdraw your application?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await withdrawApplication({ applicationId }).unwrap();
              if (result.withdrawApplication.success) {
                await Promise.all([refetchJob(), refetchApplications()]);
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Application withdrawn successfully',
                });
              }
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: error?.message || 'Failed to withdraw application',
              });
            }
          },
        },
      ],
    });
  };

  const formatSalary = () => {
    if (job?.salaryMin && job?.salaryMax) {
      const formatNum = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);
      return `${formatNum(job.salaryMin)} - ${formatNum(job.salaryMax)} / year`;
    }
    return 'Salary not disclosed';
  };

  const formatWorkMode = (mode: string) => {
    const formats: Record<string, string> = {
      remote: 'Remote',
      onsite: 'On-site',
      hybrid: 'Hybrid',
    };
    return formats[mode] || mode;
  };

  const formatJobType = (type: string) => {
    const formats: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
      freelance: 'Freelance',
    };
    return formats[type] || type;
  };

  // Calculate header height - add extra padding to ensure content is below header
  const HEADER_HEIGHT = insets.top + 110;

  if (jobLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#437EF4" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Job Not Found</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack?.();
          }}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Mock data for demo - use real data when available
  const matchPercentage = match?.matchPercentage || 92;
  const matchedSkills = match?.matchedSkills || ['React.js', 'UI Development', 'JavaScript'];
  const missingSkills = match?.missingSkills || ['TypeScript', 'API Integration'];
  const responsibilities = job?.responsibilities || [
    'Build responsive UI using React.js',
    'Collaborate with design & backend teams',
    'Optimise app performance & loading time',
    'Maintain clean, reusable code',
  ];
  const requiredSkills = job?.requiredSkills || ['React', 'JavaScript', 'REST APIs', 'CSS/SCSS', 'Git'];

  return (
    <View style={styles.container}>
      {/* Use CandidateLayout for header */}
      <CandidateLayout
        showBackButton={true}
        onBack={onBack}
        headerTitle="Job Details"
        headerSubtitle="Sorted by your best career fit"
        showGlassPill={true}
        profilePictureUrl={profilePictureUrl}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Job Info Card */}
          <View style={styles.jobInfoCard}>
            {/* Match Badge - Only show if user has access */}
            {hasMatchInsightsAccess && (
              <View style={styles.matchBadge}>
                <View style={styles.matchDot} />
                <Text style={styles.matchText}>{Math.round(matchPercentage)}% Fit</Text>
              </View>
            )}

            {/* Job Title */}
            <Text style={styles.jobTitle}>{job.title}</Text>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text
                style={styles.jobDescription}
                numberOfLines={showFullDescription ? undefined : 4}
              >
                {job.description}
              </Text>
              {job.description && job.description.length > 150 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowFullDescription(!showFullDescription);
                  }}
                  style={styles.moreButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreButtonText}>
                    {showFullDescription ? 'Show less' : 'Read more'}
                  </Text>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4 }}>
                    <Path
                      d={showFullDescription ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}
                      stroke="#437EF4"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Company Name */}
            <Text style={styles.companyName}>{job.companyName}</Text>

            {/* Job Details List */}
            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <View style={styles.bullet} />
                <Text style={styles.detailText}>
                  {formatWorkMode(job.workMode)} - {job.location}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.bullet} />
                <Text style={styles.detailText}>{formatJobType(job.jobType)}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.bullet} />
                <Text style={styles.detailText}>{formatSalary()}</Text>
              </View>
            </View>
          </View>

          {/* Fit Breakdown Section - Only show if user has access */}
          {hasMatchInsightsAccess && (matchedSkills.length > 0 || missingSkills.length > 0) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Fit Breakdown</Text>

              {/* Matched Skills */}
              {matchedSkills.length > 0 && (
                <View style={styles.matchedSkillsContainer}>
                  {matchedSkills.map((skill: string, index: number) => (
                    <View key={`matched-${index}`} style={styles.skillRow}>
                      <CheckCircleIcon size={22} color="#437EF4" />
                      <Text style={styles.skillText}>{skill} (Matched)</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Missing Skills */}
              {missingSkills.length > 0 && (
                <View style={styles.missingSkillsContainer}>
                  {missingSkills.map((skill: string, index: number) => (
                    <View key={`missing-${index}`} style={styles.skillRow}>
                      <XCircleIcon size={22} color="#EF4444" />
                      <Text style={styles.skillTextMissing}>{skill} (Missing)</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Improve my Fit Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onNavigateToProfile?.();
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#437EF4', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.improveFitButton}
                >
                  <Text style={styles.improveFitButtonText}>Improve my Fit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Key Responsibilities & Required Skills Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Key Responsibilities</Text>
            <View style={styles.responsibilitiesList}>
              {responsibilities.map((resp: string, index: number) => (
                <View key={index} style={styles.responsibilityItem}>
                  <View style={styles.responsibilityBullet} />
                  <Text style={styles.responsibilityText}>{resp}</Text>
                </View>
              ))}
            </View>

            {/* Required Skills */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Required Skills</Text>
            <View style={styles.skillTagsContainer}>
              {requiredSkills.map((skill: string, index: number) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prepare Application Section */}
          <View style={styles.prepareApplicationCard}>
            <Text style={styles.prepareApplicationTitle}>Prepare Application</Text>

            {/* Step 1 */}
            <View style={styles.applicationStep}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Attach cover letter</Text>
            </View>

            {/* Step 2 */}
            <View style={styles.applicationStep}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>Final Review</Text>
            </View>
          </View>

          {/* Apply Now Button - At bottom of content */}
          <View style={styles.applyButtonContainer}>
            {canWithdraw ? (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleWithdraw();
                }}
                disabled={isWithdrawing}
                activeOpacity={0.8}
                style={styles.withdrawButton}
              >
                <Text style={styles.withdrawButtonText}>
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                </Text>
              </TouchableOpacity>
            ) : applicationId && applicationStatus && applicationStatus !== 'withdrawn' ? (
              <View style={styles.appliedButton}>
                <Text style={styles.appliedButtonText}>
                  {applicationStatus === 'pending' ? 'Applied' : applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                </Text>
              </View>
            ) : (
              <GlassButton
                text={isApplying ? 'Applying...' : 'Apply Now'}
                fullWidth
                height={54}
                borderRadius={27}
                colors={['#437EF4', '#2563EB']}
                shadowColor="rgba(67, 126, 244, 0.5)"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowApplicationModal(true);
                }}
                disabled={isApplying}
                loading={isApplying}
                textStyle={{ fontSize: 16, fontWeight: '700' }}
              />
            )}
          </View>
        </ScrollView>
      </CandidateLayout>

      {/* Bottom Nav Bar */}
      <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />

      {/* Application Modal - Full Screen using CandidateLayout */}
      <Modal
        visible={showApplicationModal}
        animationType="slide"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <CandidateLayout
          showBackButton={true}
          onBack={() => setShowApplicationModal(false)}
          headerTitle="Write your Cover"
          headerSubtitle="Sorted by your best career fit"
          showGlassPill={true}
          profilePictureUrl={profilePictureUrl}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              style={styles.applicationScrollView}
              contentContainerStyle={[styles.applicationScrollContent, { paddingTop: HEADER_HEIGHT }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Job Info Card */}
              <View style={styles.applicationJobCard}>
                {/* Job Title */}
                <Text style={styles.applicationJobTitle}>{job.title}</Text>

                {/* Job Description */}
                <Text style={styles.applicationJobDescription} numberOfLines={5}>
                  {job.description}
                </Text>
                {job.description && job.description.length > 180 && (
                  <TouchableOpacity style={styles.moreButtonRight}>
                    <Text style={styles.moreButtonText}>more</Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.applicationDivider} />

                {/* Company Name */}
                <Text style={styles.applicationCompanyName}>{job.companyName}</Text>

                {/* Job Details */}
                <View style={styles.applicationDetailsList}>
                  <View style={styles.applicationDetailItem}>
                    <View style={styles.applicationBullet} />
                    <Text style={styles.applicationDetailText}>
                      {formatWorkMode(job.workMode)} - {job.location}
                    </Text>
                  </View>
                  <View style={styles.applicationDetailItem}>
                    <View style={styles.applicationBullet} />
                    <Text style={styles.applicationDetailText}>{formatJobType(job.jobType)}</Text>
                  </View>
                  <View style={styles.applicationDetailItem}>
                    <View style={styles.applicationBullet} />
                    <Text style={styles.applicationDetailText}>{formatSalary()}</Text>
                  </View>
                </View>

                {/* Cover Letter Section */}
                <View style={styles.coverLetterSection}>
                  <View style={styles.coverLetterHeader}>
                    <Text style={styles.coverLetterLabel}>Cover Letter</Text>
                    <GlassButton
                      width={180}
                      height={44}
                      colors={isGenerating ? ['#9CA3AF', '#6B7280', '#4B5563'] : ['#06B6D4', '#2563EB', '#8B5CF6']}
                      shadowColor="rgba(37, 99, 235, 0.4)"
                      onPress={handleGenerateCoverLetter}
                      disabled={isGenerating}
                      loading={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                          <Text style={styles.writeMyCoverText}>Generating...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.writeMyCoverText}>Write my Cover</Text>
                          <AiIcon width={24} height={24} style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </GlassButton>
                  </View>

                  {/* Cover Letter Input with Loading Overlay */}
                  <View style={styles.coverLetterInputContainer}>
                    {isGenerating ? (
                      <View style={styles.coverLetterLoadingOverlay}>
                        <ActivityIndicator size="large" color="#437EF4" />
                        <Text style={styles.coverLetterLoadingText}>AI is writing your cover letter...</Text>
                        <Text style={styles.coverLetterLoadingSubtext}>This may take a few seconds</Text>
                      </View>
                    ) : (
                      <TextInput
                        style={styles.coverLetterInput}
                        placeholder="Type your cover letter here or use AI to generate one..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        textAlignVertical="top"
                        value={coverLetter}
                        onChangeText={setCoverLetter}
                      />
                    )}
                  </View>
                </View>

                {/* Apply Now Button */}
                <View style={styles.applicationApplyContainer}>
                  <GlassButton
                    text={isApplying ? 'Applying...' : 'Apply Now'}
                    fullWidth
                    height={52}
                    borderRadius={26}
                    colors={['#437EF4', '#2563EB']}
                    shadowColor="rgba(37, 99, 235, 0.25)"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      handleApply();
                    }}
                    disabled={isApplying || isGenerating}
                    loading={isApplying}
                    textStyle={{ fontSize: 16, fontWeight: '600' }}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </CandidateLayout>
      </Modal>

      {/* Application Success Popup */}
      <ApplicationSuccessPopup
        visible={showSuccessPopup}
        onClose={() => {
          setShowSuccessPopup(false);
          onBack?.();
        }}
        onFindMoreJobs={() => {
          setShowSuccessPopup(false);
          onBack?.();
        }}
        onTrackApplications={() => {
          setShowSuccessPopup(false);
          // Navigate to track applications - can be customized via props
          onTabChange?.('jobs');
          onBack?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: '#437EF4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingBottom: 120,
  },
  // Job Info Card
  jobInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    // Shadow
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  matchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#437EF4',
    marginRight: 8,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  jobDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(67, 126, 244, 0.2)',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#437EF4',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#437EF4',
    marginBottom: 12,
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 10,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  // Fit Breakdown Section
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  matchedSkillsContainer: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  missingSkillsContainer: {
    backgroundColor: 'rgba(254, 226, 226, 0.5)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  skillTextMissing: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F1D1D',
    marginLeft: 12,
  },
  improveFitButton: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#437EF4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  improveFitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Key Responsibilities
  responsibilitiesList: {
    gap: 12,
  },
  responsibilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  responsibilityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#437EF4',
    marginRight: 12,
    marginTop: 6,
  },
  responsibilityText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
  // Required Skills Tags
  skillTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  // Prepare Application Section
  prepareApplicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#437EF4',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  prepareApplicationTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#111827',
    marginBottom: 20,
  },
  applicationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#437EF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#437EF4',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Apply Button Container
  applyButtonContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
    width: '100%',
  },
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  appliedButton: {
    backgroundColor: '#D1D5DB',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  appliedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Application Modal
  applicationScrollView: {
    flex: 1,
  },
  applicationScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  applicationJobCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Glass shadow
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  applicationJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  applicationBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  applicationJobTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  applicationJobDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 4,
  },
  moreButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(67, 126, 244, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(67, 126, 244, 0.2)',
  },
  applicationDivider: {
    height: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    marginVertical: 16,
  },
  applicationCompanyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#437EF4',
    marginBottom: 12,
  },
  applicationDetailsList: {
    marginBottom: 24,
  },
  applicationDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  applicationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F2937',
    marginRight: 10,
  },
  applicationDetailText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
  },
  coverLetterSection: {
    marginBottom: 24,
  },
  coverLetterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  coverLetterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  writeMyCoverButton: {
    borderRadius: 33.5,
    overflow: 'hidden',
    // Glass Effect shadow from Figma CSS
    shadowColor: 'rgba(37, 99, 235, 1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  writeMyCoverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 33.5,
  },
  writeMyCoverText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
    // Text shadow from Figma CSS
    textShadowColor: 'rgba(37, 99, 235, 0.25)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
  },
  coverLetterInputContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.5)',
    minHeight: 200,
    // Glass shadow effect
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  coverLetterInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 200,
    lineHeight: 22,
  },
  coverLetterLoadingOverlay: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  coverLetterLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#437EF4',
    marginTop: 16,
    textAlign: 'center',
  },
  coverLetterLoadingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  applicationApplyContainer: {
    marginTop: 8,
    width: '100%',
  },
});
