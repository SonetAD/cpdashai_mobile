import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import TickIcon from '../../../assets/images/jobs/tick.svg';
import CrossIcon from '../../../assets/images/jobs/cross.svg';
import IdeaIcon from '../../../assets/images/homepage/idea.svg';
import {
  useGetJobPostingQuery,
  useApplyToJobMutation,
  useWithdrawApplicationMutation,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useGetCandidateProfileQuery,
  useGetMyApplicationsQuery,
} from '../../../services/api';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import { useAlert } from '../../../contexts/AlertContext';

interface JobDetailsScreenNewProps {
  jobId: string;
  onBack?: () => void;
  onNavigateToProfile?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface FitItemProps {
  skill: string;
  matched: boolean;
}

const FitItem: React.FC<FitItemProps> = ({ skill, matched }) => {
  return (
    <View className="flex-row items-center py-2.5">
      <View className={`w-5 h-5 rounded-full items-center justify-center mr-3 ${
        matched ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {matched ? <TickIcon width={12} height={12} /> : <CrossIcon width={12} height={12} />}
      </View>
      <Text className="flex-1 text-sm text-gray-700">
        {skill}
      </Text>
    </View>
  );
};

export default function JobDetailsScreen({ jobId, onBack, onNavigateToProfile, activeTab = 'home', onTabChange }: JobDetailsScreenNewProps) {
  const { showAlert } = useAlert();

  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  // Fetch job details (includes candidateMatch)
  const { data: jobData, isLoading: jobLoading, refetch: refetchJob } = useGetJobPostingQuery({ jobId });
  const { data: profileData } = useGetCandidateProfileQuery();
  const { data: applicationsData, refetch: refetchApplications } = useGetMyApplicationsQuery({});

  // Mutations
  const [applyToJob, { isLoading: isApplying }] = useApplyToJobMutation();
  const [withdrawApplication, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();

  const job = jobData?.jobPosting;
  const match = job?.candidateMatch; // Use candidateMatch from job posting
  const applicationStatus = job?.applicationStatus; // Get status from job posting
  const rejectionReason = job?.rejectionReason; // Get rejection reason from job posting
  
  // Find the application for this job from myApplications (only needed for applicationId for withdrawal)
  const application = applicationsData?.myApplications?.find(
    (app: any) => app.jobPosting.id === jobId
  );
  const applicationId = application?.id;
  
  // Debug logging
  console.log('JobDetailsScreen Debug:', {
    jobId,
    hasMatch: !!match,
    applicationId,
    applicationStatus,
    rejectionReason,
    shouldShowMatch: !!match && !!applicationId
  });
  
  // Check if user can withdraw (only if status is pending or reviewed)
  const canWithdraw = applicationId && ['pending', 'reviewed'].includes(applicationStatus || '');
  
  // Get candidate profile - myProfile query returns data in myProfile field
  const candidateProfile = profileData?.myProfile?.__typename === 'CandidateType' ? profileData.myProfile : null;

  // Check if user has location
  const checkLocation = () => {
    console.log('Profile Data:', profileData);
    console.log('Candidate Profile:', candidateProfile);
    console.log('Checking candidate locations:', {
      preferredLocations: candidateProfile?.preferredLocations,
      hasLocations: (candidateProfile?.preferredLocations?.length || 0) > 0,
    });
    
    const hasLocation = candidateProfile?.preferredLocations && 
                        candidateProfile.preferredLocations.length > 0;
    return hasLocation;
  };

  const handleApply = async () => {
    // Check if user has location first
    console.log('Applying to job - checking location requirement');
    if (!checkLocation()) {
      console.log('Location check failed - user needs to add locations');

      showAlert({
        type: 'warning',
        title: 'Location Required',
        message: 'Please add your preferred locations in your profile before applying to jobs. This helps employers understand your location preferences.',
        buttons: [
          {
            text: 'Add Location',
            onPress: () => {
              setShowApplicationModal(false);
              if (onNavigateToProfile) {
                onNavigateToProfile();
              }
            },
          },
          { text: 'Cancel' },
        ]
      });
      return;
    }

    try {
      console.log('Applying to job:', jobId);
      console.log('Cover letter length:', coverLetter?.length || 0);
      
      const result = await applyToJob({
        jobId,
        coverLetter: coverLetter || undefined,
      }).unwrap();

      console.log('Apply result:', JSON.stringify(result, null, 2));

      if (result.applyToJob.__typename === 'JobApplicationSuccessType' && result.applyToJob.success) {
        setShowApplicationModal(false);
        setCoverLetter('');
        
        // Give backend a moment to process, then refetch
        await new Promise(resolve => setTimeout(resolve, 500));
        await Promise.all([refetchJob(), refetchApplications()]);
        
        showAlert({
          type: 'success',
          title: 'Success',
          message: result.applyToJob.message || 'Application submitted successfully!'
        });
      } else if (result.applyToJob.__typename === 'ErrorType') {
        const errorMsg = result.applyToJob.message || 'Failed to submit application';
        showAlert({
          type: 'error',
          title: 'Application Error',
          message: errorMsg
        });
        console.error('Application error:', result.applyToJob.message);
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Unexpected response from server'
        });
        console.error('Unexpected response:', result);
      }
    } catch (error: any) {
      console.error('Apply catch error:', error);
      console.error('Error data:', error?.data);
      const errorMessage = error?.data?.applyToJob?.message || error?.message || 'Failed to submit application';
      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleWithdraw = async () => {
    if (!applicationId) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Application ID not found. Please try refreshing the page.'
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Withdraw Application',
      message: 'Are you sure you want to withdraw your application? This action cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Withdrawing application with ID:', applicationId);
              const result = await withdrawApplication({ applicationId }).unwrap();
              console.log('Withdraw result:', result);
              
              if (result.withdrawApplication.success) {
                // Give backend a moment to process, then refetch
                await new Promise(resolve => setTimeout(resolve, 1000));
                await Promise.all([refetchJob(), refetchApplications()]);
                
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: result.withdrawApplication.message || 'Application withdrawn successfully'
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result.withdrawApplication.message || 'Failed to withdraw application'
                });
              }
            } catch (error: any) {
              const errorMessage = error?.data?.withdrawApplication?.message || error?.message || 'Failed to withdraw application';
              showAlert({
                type: 'error',
                title: 'Error',
                message: errorMessage
              });
            }
          }
        }
      ]
    });
  };

  const handleSaveToggle = async () => {
    try {
      if (match?.isSaved) {
        await unsaveJob({ savedJobId: match.id }).unwrap();
      } else {
        await saveJob({ jobId }).unwrap();
      }
      refetchJob();
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to save/unsave job'
      });
    }
  };

  const getBadgeColor = (percentage: number) => {
    if (percentage >= 85) return '#10B981';
    if (percentage >= 70) return '#437EF4';
    if (percentage >= 50) return '#8B5CF6';
    return '#6B7280';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 85) return '#10B981';
    if (percentage >= 70) return '#437EF4';
    if (percentage >= 50) return '#8B5CF6';
    return '#9CA3AF';
  };

  const formatSalary = () => {
    if (job?.salaryMin && job?.salaryMax) {
      const currency = job.salaryCurrency || 'USD';
      return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} / ${job.salaryPeriod || 'year'}`;
    }
    return 'Salary not disclosed';
  };

  if (jobLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#437EF4" />
        <Text className="text-gray-500 mt-4">Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-600 text-lg font-semibold mb-2">Job Not Found</Text>
        <TouchableOpacity
          onPress={onBack}
          className="bg-primary-blue rounded-xl py-3 px-6 mt-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <CandidateLayout
      activeTab={activeTab}
      onTabChange={onTabChange}
      showBackButton={true}
      onBack={onBack}
      title="Job Details"
      subtitle={job?.companyName}
      showSearch={false}
    >
      <View className="px-5 py-5">
          {/* Match Score Card - Only show if user has applied and not withdrawn */}
          {match && applicationId && applicationStatus !== 'withdrawn' && (
            <View className="bg-white rounded-2xl mb-4" style={{ borderWidth: 2, borderColor: getBadgeColor(match.matchPercentage) }}>
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Match Score</Text>
                    <View className="flex-row items-baseline">
                      <Text className="text-gray-900 text-5xl font-extrabold">{Math.round(match.matchPercentage)}</Text>
                      <Text className="text-gray-500 text-2xl font-bold ml-1">%</Text>
                    </View>
                  </View>
                  <View className="px-4 py-2.5 rounded-xl" style={{ backgroundColor: getBadgeColor(match.matchPercentage) + '15' }}>
                    <Text className="font-bold text-sm" style={{ color: getBadgeColor(match.matchPercentage) }}>
                      {match.matchPercentage >= 85 ? 'Excellent' : match.matchPercentage >= 70 ? 'Great' : match.matchPercentage >= 50 ? 'Good' : 'Fair'}
                    </Text>
                  </View>
                </View>

                {/* Score Breakdown */}
                <View className="space-y-4">
                  <View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-700 text-sm font-semibold">Skills</Text>
                      <Text className="text-gray-900 font-bold text-sm">{Math.round(match.skillsMatchScore)}%</Text>
                    </View>
                    <View className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${match.skillsMatchScore}%`, backgroundColor: '#437EF4' }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-700 text-sm font-semibold">Experience</Text>
                      <Text className="text-gray-900 font-bold text-sm">{Math.round(match.experienceMatchScore)}%</Text>
                    </View>
                    <View className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${match.experienceMatchScore}%`, backgroundColor: '#10B981' }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-700 text-sm font-semibold">Qualifications</Text>
                      <Text className="text-gray-900 font-bold text-sm">{Math.round(match.qualificationsMatchScore)}%</Text>
                    </View>
                    <View className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${match.qualificationsMatchScore}%`, backgroundColor: '#8B5CF6' }} />
                    </View>
                  </View>
                  <View>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-700 text-sm font-semibold">Location</Text>
                      <Text className="text-gray-900 font-bold text-sm">{Math.round(match.locationMatchScore)}%</Text>
                    </View>
                    <View className="bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${match.locationMatchScore}%`, backgroundColor: '#F59E0B' }} />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Application Status Badge - Show if user has applied */}
          {applicationId && applicationStatus && applicationStatus !== 'pending' && applicationStatus !== 'withdrawn' && (
            <View className="bg-white rounded-2xl p-4 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-600 text-sm font-medium">Application Status</Text>
                <View
                  className="rounded-full px-3 py-1.5"
                  style={{ 
                    backgroundColor: 
                      applicationStatus === 'pending' ? '#FFCC00' :
                      applicationStatus === 'reviewed' ? '#437EF4' :
                      applicationStatus === 'shortlisted' ? '#10B981' :
                      applicationStatus === 'interview' ? '#8B5CF6' :
                      applicationStatus === 'offered' ? '#10B981' :
                      applicationStatus === 'rejected' ? '#EF4444' :
                      applicationStatus === 'withdrawn' ? '#6B7280' :
                      applicationStatus === 'accepted' ? '#10B981' : '#9CA3AF'
                  }}
                >
                  <Text className="text-white text-xs font-bold">
                    {applicationStatus === 'pending' ? 'Submitted' : applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                  </Text>
                </View>
              </View>
              {applicationStatus === 'rejected' && rejectionReason && (
                <View className="mt-3 bg-red-50 rounded-xl p-3 border border-red-200">
                  <Text className="text-red-600 text-xs font-semibold mb-1">Rejection Reason:</Text>
                  <Text className="text-gray-700 text-sm">{rejectionReason}</Text>
                </View>
              )}
            </View>
          )}

          {/* Job Title & Company */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text className="text-gray-900 text-2xl font-bold mb-2">{job.title}</Text>
            <Text className="text-primary-blue text-base font-semibold mb-4">{job.companyName}</Text>

            {/* Job Info */}
            <View className="space-y-2.5">
              <View className="flex-row items-center">
                <View className="w-9 h-9 bg-blue-50 rounded-lg items-center justify-center mr-3">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#437EF4" />
                  </Svg>
                </View>
                <Text className="text-gray-700 text-sm flex-1">{job.location}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-9 h-9 bg-green-50 rounded-lg items-center justify-center mr-3">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#10B981" />
                  </Svg>
                </View>
                <Text className="text-gray-700 text-sm flex-1">
                  {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)} • {job.jobType.replace('_', ' ')}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-9 h-9 bg-purple-50 rounded-lg items-center justify-center mr-3">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#8B5CF6" />
                  </Svg>
                </View>
                <Text className="text-gray-700 text-sm flex-1">
                  {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)} Level
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-9 h-9 bg-amber-50 rounded-lg items-center justify-center mr-3">
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#F59E0B" />
                  </Svg>
                </View>
                <Text className="text-gray-700 text-sm flex-1">{formatSalary()}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text className="text-gray-900 text-base font-bold mb-3">About the Role</Text>
            <Text className="text-gray-600 text-sm leading-6">{job.description}</Text>
          </View>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
              <Text className="text-gray-900 text-base font-bold mb-3">Key Responsibilities</Text>
              <View className="space-y-2.5">
                {job.responsibilities.map((resp: string, index: number) => (
                  <View key={index} className="flex-row items-start">
                    <View className="bg-primary-blue rounded-full w-1.5 h-1.5 mt-2 mr-3" />
                    <Text className="text-gray-600 text-sm leading-6 flex-1">{resp}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Required Skills */}
          <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text className="text-gray-900 text-base font-bold mb-3">Required Skills</Text>
            <View className="flex-row flex-wrap">
              {job.requiredSkills?.map((skill: string, index: number) => (
                <View key={index} className="bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2" style={{ borderWidth: 1, borderColor: '#DBEAFE' }}>
                  <Text className="text-primary-blue text-sm font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Skills Fit Analysis - Only show if user has applied and not withdrawn */}
          {match && applicationId && applicationStatus !== 'withdrawn' && (
            <>
              {/* Matched Skills */}
              {match.matchedSkills && match.matchedSkills.length > 0 && (
                <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View className="flex-row items-center mb-3">
                    <View className="bg-green-100 rounded-lg p-1.5 mr-2.5">
                      <TickIcon width={16} height={16} />
                    </View>
                    <Text className="text-gray-900 text-base font-bold">Your Matching Skills</Text>
                  </View>
                  {match.matchedSkills.map((skill: string, index: number) => (
                    <FitItem key={index} skill={skill} matched={true} />
                  ))}
                </View>
              )}

              {/* Missing Skills */}
              {match.missingSkills && match.missingSkills.length > 0 && (
                <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View className="flex-row items-center mb-3">
                    <View className="bg-gray-100 rounded-lg p-1.5 mr-2.5">
                      <CrossIcon width={16} height={16} />
                    </View>
                    <Text className="text-gray-900 text-base font-bold">Skills to Develop</Text>
                  </View>
                  {match.missingSkills.map((skill: string, index: number) => (
                    <FitItem key={index} skill={skill} matched={false} />
                  ))}
                </View>
              )}

              {/* AI Recommendation */}
              {match.recommendation && (
                <View className="bg-amber-50 rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#FDE68A' }}>
                  <View className="flex-row items-center mb-3">
                    <View className="bg-amber-100 rounded-lg p-2 mr-2.5">
                      <IdeaIcon width={18} height={18} />
                    </View>
                    <Text className="text-gray-900 text-base font-bold">AI Career Insight</Text>
                  </View>
                  <Text className="text-gray-700 text-sm leading-6">{match.recommendation}</Text>
                </View>
              )}

              {/* Suggestions */}
              {match.suggestions && match.suggestions.length > 0 && (
                <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View className="flex-row items-center mb-3">
                    <View className="bg-blue-100 rounded-lg p-1.5 mr-2.5">
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#437EF4" />
                      </Svg>
                    </View>
                    <Text className="text-gray-900 text-base font-bold flex-1">
                      How to Improve
                    </Text>
                  </View>
                  <View className="space-y-2.5">
                    {match.suggestions.map((suggestion: string, index: number) => (
                      <View key={index} className="flex-row items-start">
                        <View className="bg-blue-50 rounded-lg w-6 h-6 items-center justify-center mr-3 mt-0.5" style={{ borderWidth: 1, borderColor: '#DBEAFE' }}>
                          <Text className="text-primary-blue text-xs font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-gray-600 text-sm leading-6 flex-1">{suggestion}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            {canWithdraw ? (
              <TouchableOpacity
                onPress={handleWithdraw}
                disabled={isWithdrawing}
                activeOpacity={0.8}
                style={{ flex: 1 }}
              >
                <View className="bg-white rounded-xl py-3 items-center justify-center" style={{ borderWidth: 1.5, borderColor: '#EF4444', height: 50 }}>
                  <Text className="text-red-600 text-sm font-semibold">
                    {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : applicationId && applicationStatus && applicationStatus !== 'withdrawn' ? (
              <View className="flex-1 bg-gray-300 rounded-2xl py-4 items-center justify-center">
                <Text className="text-gray-600 text-base font-bold">
                  {applicationStatus === 'pending' ? 'Applied' : 
                   applicationStatus === 'reviewed' ? 'Under Review' :
                   applicationStatus === 'shortlisted' ? 'Shortlisted' :
                   applicationStatus === 'interview' ? 'Interview Scheduled' :
                   applicationStatus === 'offered' ? 'Offer Received' :
                   applicationStatus === 'rejected' ? 'Application Closed' :
                   applicationStatus === 'accepted' ? 'Offer Accepted' : 'Applied'}
                </Text>
              </View>
            ) : applicationStatus === 'withdrawn' ? (
              <TouchableOpacity
                onPress={() => setShowApplicationModal(true)}
                disabled={isApplying}
                className="flex-1"
              >
                <LinearGradient
                  colors={['#437EF4', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-4 items-center"
                  style={{ shadowColor: '#437EF4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  <Text className="text-white text-base font-bold">
                    {isApplying ? 'Applying...' : 'Reapply'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowApplicationModal(true)}
                disabled={isApplying}
                className="flex-1"
              >
                <LinearGradient
                  colors={['#437EF4', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-2xl py-4 items-center"
                  style={{ shadowColor: '#437EF4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  <Text className="text-white text-base font-bold">
                    {isApplying ? 'Applying...' : 'Apply Now'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSaveToggle}
              disabled={isSaving || isUnsaving}
              className="px-6"
            >
              <View
                className={`rounded-2xl py-4 px-6 items-center ${
                  match?.isSaved ? 'bg-green-500' : 'bg-gray-100'
                }`}
                style={match?.isSaved ? { shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 } : {}}
              >
                <Text className={`text-base font-bold ${match?.isSaved ? 'text-white' : 'text-gray-700'}`}>
                  {match?.isSaved ? '✓ Saved' : 'Save'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

      {/* Application Modal */}
      <Modal
        visible={showApplicationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowApplicationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setShowApplicationModal(false)}
            className="flex-1 bg-black/50 justify-end"
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <SafeAreaView edges={['bottom']}>
                <View className="bg-white rounded-t-3xl p-6">
                  <Text className="text-gray-900 text-xl font-bold mb-4">Apply to {job.title}</Text>

                  <Text className="text-gray-700 text-sm mb-2">Cover Letter (Optional)</Text>
                  <ScrollView 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: 200 }}
                  >
                    <TextInput
                      className="bg-gray-50 rounded-xl p-4 mb-4 text-gray-900"
                      placeholder="Tell the employer why you're a great fit..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      value={coverLetter}
                      onChangeText={setCoverLetter}
                      style={{ minHeight: 120 }}
                    />
                  </ScrollView>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setShowApplicationModal(false)}
                      className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                    >
                      <Text className="text-gray-700 font-semibold">Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleApply}
                      className="flex-1 bg-primary-blue rounded-xl py-4 items-center"
                      disabled={isApplying}
                    >
                      <Text className="text-white font-semibold">
                        {isApplying ? 'Submitting...' : 'Submit Application'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </CandidateLayout>
  );
}
