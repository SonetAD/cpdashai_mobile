import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Linking, TextInput, Modal, Keyboard, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import ResumeParsingProgressModal from '../../../components/ResumeParsingProgressModal';
import { GlassSectionCard } from '../../../components/ui/GlassSectionCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import ResumeCard from '../../../components/ResumeCard';
import {
  useGetMyResumesQuery,
  useParseResumeAsyncMutation,
  useDeleteResumeMutation,
  useExportResumePdfMutation,
  useCheckSubscriptionStatusQuery,
  Resume,
  AnalyzeResumeResponse,
} from '../../../services/api';
import { analyzeResume, uriToBlob } from '../../../services/resumeAnalysis';
import { resumeParsingProgressService, ProgressUpdate } from '../../../services/resumeParsingProgress';
import ResumeDetailScreen from './ResumeDetailScreen';
import ResumeAnalysisResultScreen from './ResumeAnalysisResultScreen';
import { useAlert } from '../../../contexts/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CVUploadScreenProps {
  onBack?: () => void;
  onCreateCV?: () => void;
  onEditCV?: (resumeId: string) => void;
  onViewPricing?: () => void;
  onNavigateToProfile?: () => void;
  onViewAllResumes?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  profileImageUrl?: string;
  forceRefresh?: number;
}

export default function CVUploadScreen({
  onBack,
  onCreateCV,
  onEditCV,
  onViewPricing,
  onNavigateToProfile,
  onViewAllResumes,
  onSearch,
  onNotifications,
  profileImageUrl,
  forceRefresh,
}: CVUploadScreenProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [processedResumeIds, setProcessedResumeIds] = useState<Set<string>>(new Set());
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResumeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisTypeModal, setShowAnalysisTypeModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [pendingAnalysisResume, setPendingAnalysisResume] = useState<Resume | null>(null);
  const [showParsingProgress, setShowParsingProgress] = useState(false);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingStage, setParsingStage] = useState('');
  const [parsingStageLabel, setParsingStageLabel] = useState('');
  const [parsingMessage, setParsingMessage] = useState('');
  const [parsingStatus, setParsingStatus] = useState('');
  const accessToken = useSelector((state: any) => state.auth.token);
  const userEmail = useSelector((state: any) => state.auth.user?.email);
  const { showAlert } = useAlert();

  // API hooks
  // Fetch only 2 resumes for the overview
  const { data: resumesData, isLoading, error, refetch, isUninitialized } = useGetMyResumesQuery({ limit: 2 });
  const [parseResumeAsync] = useParseResumeAsyncMutation();
  const [deleteResume] = useDeleteResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();
  const { data: subscriptionData } = useCheckSubscriptionStatusQuery();

  const resumes = resumesData?.myResumes || [];
  const isPaidUser = subscriptionData?.subscriptionStatus?.canUseAiFeatures || false;

  // Move all hooks to the top to avoid "Rendered fewer hooks than expected" error
  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = insets.top + 140; // Increased for glass header

  // Memoize callbacks to prevent CandidateLayout re-renders
  const handleSearchPress = useCallback(() => {
    onSearch?.();
  }, [onSearch]);

  const handleNotificationPress = useCallback(() => {
    onNotifications?.();
  }, [onNotifications]);

  const handleProfilePress = useCallback(() => {
    onNavigateToProfile?.();
  }, [onNavigateToProfile]);

  const handleBackPress = useCallback(() => {
    onBack?.();
  }, [onBack]);

  // Safe refetch wrapper
  const safeRefetch = () => {
    if (!isUninitialized) {
      return refetch();
    }
    return Promise.resolve({ data: resumesData });
  };

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      resumeParsingProgressService.disconnect();
    };
  }, []);

  // Auto-generate PDFs for pending resumes
  useEffect(() => {
    if (resumes.length === 0) return;

    const pendingResumes = resumes.filter(
      r => r.status === 'pending' && !processedResumeIds.has(r.id)
    );

    if (pendingResumes.length > 0) {
      pendingResumes.forEach(async (resume) => {
        setProcessedResumeIds(prev => new Set([...prev, resume.id]));

        try {
          const pdfData = await exportPdf(resume.id).unwrap();

          if (pdfData.exportResumePdf.__typename === 'SuccessType') {
            let pollCount = 0;
            const maxPolls = 15;
            const pollInterval = setInterval(async () => {
              pollCount++;
              const result = await safeRefetch();
              const updatedResume = result.data?.myResumes?.find((r: Resume) => r.id === resume.id);

              if (updatedResume?.status === 'completed' || pollCount >= maxPolls) {
                clearInterval(pollInterval);
              }
            }, 3000);

            setTimeout(() => {
              clearInterval(pollInterval);
              safeRefetch();
            }, 45000);
          }
        } catch (error) {
          setProcessedResumeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(resume.id);
            return newSet;
          });
        }
      });
    }
  }, [resumes]);

  // Refetch on mount
  useEffect(() => {
    if (!isUninitialized) {
      const timer = setTimeout(() => safeRefetch(), 500);
      return () => clearTimeout(timer);
    }
  }, [isUninitialized]);

  // Refetch on forceRefresh
  useEffect(() => {
    if (forceRefresh && !isUninitialized) {
      const timer = setTimeout(() => safeRefetch(), 1000);
      return () => clearTimeout(timer);
    }
  }, [forceRefresh, isUninitialized]);

  // Handle file upload
  const handleUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File',
          message: 'Only PDF and DOCX files are supported',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      if (file.size !== undefined && file.size > 10 * 1024 * 1024) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      showAlert({
        type: 'success',
        title: 'Upload Resume',
        message: `Ready to upload "${file.name}" for AI parsing.`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Upload',
            style: 'default',
            onPress: async () => {
              setIsUploading(true);

              try {
                const base64 = await FileSystem.readAsStringAsync(file.uri, {
                  encoding: 'base64',
                });

                const fileData = `data:${file.mimeType};base64,${base64}`;

                const data = await parseResumeAsync({
                  fileName: file.name,
                  fileData: fileData,
                }).unwrap();

                setIsUploading(false);

                if (data.parseResumeAsync.__typename === 'ResumeParsingTaskSuccessType') {
                  const taskId = data.parseResumeAsync.task.taskId;

                  setShowParsingProgress(true);
                  setParsingProgress(0);
                  setParsingStage('pending');
                  setParsingStageLabel('Starting...');
                  setParsingMessage('');

                  resumeParsingProgressService.subscribe(
                    taskId,
                    accessToken,
                    (update: ProgressUpdate) => {
                      setParsingProgress(update.progress);
                      setParsingStage(update.stage);
                      setParsingStageLabel(update.stageLabel);
                      setParsingMessage(update.message || '');
                      setParsingStatus(update.status || 'in_progress');
                    },
                    async (resumeId: string) => {
                      setShowParsingProgress(false);
                      await safeRefetch();
                      showAlert({
                        type: 'success',
                        title: 'Success!',
                        message: 'Your resume has been parsed and analyzed successfully!',
                        buttons: [{ text: 'OK', style: 'default' }],
                      });
                    },
                    (error: string) => {
                      setShowParsingProgress(false);
                      showAlert({
                        type: 'error',
                        title: 'Parsing Failed',
                        message: error || 'Failed to parse resume. Please try again.',
                        buttons: [{ text: 'OK', style: 'default' }],
                      });
                    }
                  );
                } else {
                  showAlert({
                    type: 'error',
                    title: 'Error',
                    message: data.parseResumeAsync.message || 'Failed to start resume parsing',
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              } catch (error: any) {
                setIsUploading(false);
                setShowParsingProgress(false);
                showAlert({
                  type: 'error',
                  title: 'Upload Failed',
                  message: error.message || 'Failed to upload and parse resume',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to select file',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Handle delete
  const handleDeleteCV = async (resumeId: string, resumeName: string) => {
    showAlert({
      type: 'confirm',
      title: 'Delete Resume',
      message: `Are you sure you want to delete "${resumeName}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await deleteResume(resumeId).unwrap();
              if (data.deleteResume.__typename === 'SuccessType') {
                showAlert({
                  type: 'success',
                  title: 'Deleted',
                  message: 'Resume deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                safeRefetch();
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: data.deleteResume.message,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete resume',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  // Handle download PDF
  const handleDownloadPDF = async (resume: Resume) => {
    if (resume.status === 'pending') {
      showAlert({
        type: 'info',
        title: 'PDF Generation Starting',
        message: 'Your PDF is being generated automatically. Please wait.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (resume.status === 'processing') {
      showAlert({
        type: 'info',
        title: 'Processing',
        message: 'Your PDF is currently being generated. Please wait.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (resume.status === 'completed') {
      const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000').replace(/\/$/, '');
      const downloadUrl = `${API_URL}/api/resume/build/${resume.id}/download/`;

      try {
        const canOpen = await Linking.canOpenURL(downloadUrl);
        if (canOpen) {
          await Linking.openURL(downloadUrl);
        } else {
          showAlert({
            type: 'confirm',
            title: 'Download Resume',
            message: 'Would you like to open this resume in your browser?',
            buttons: [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open',
                style: 'default',
                onPress: async () => {
                  try {
                    await Linking.openURL(downloadUrl);
                  } catch (error) {
                    showAlert({
                      type: 'error',
                      title: 'Error',
                      message: 'Could not open PDF.',
                      buttons: [{ text: 'OK', style: 'default' }],
                    });
                  }
                }
              }
            ],
          });
        }
      } catch (error) {
        showAlert({
          type: 'error',
          title: 'Download Failed',
          message: 'Failed to download PDF.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } else {
      showAlert({
        type: 'confirm',
        title: resume.status === 'failed' ? 'Retry PDF Generation' : 'Generate PDF',
        message: resume.status === 'failed'
          ? 'Previous generation failed. Would you like to try again?'
          : `Generate a PDF for this resume?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: resume.status === 'failed' ? 'Retry' : 'Generate',
            style: 'default',
            onPress: async () => {
              try {
                const data = await exportPdf(resume.id).unwrap();
                if (data.exportResumePdf.__typename === 'SuccessType') {
                  showAlert({
                    type: 'success',
                    title: 'Generating PDF',
                    message: 'Your PDF is being generated. This may take 10-15 seconds.',
                    buttons: [{
                      text: 'OK',
                      style: 'default',
                      onPress: () => {
                        const pollInterval = setInterval(() => safeRefetch(), 3000);
                        setTimeout(() => {
                          clearInterval(pollInterval);
                          safeRefetch();
                        }, 45000);
                      }
                    }],
                  });
                } else {
                  showAlert({
                    type: 'error',
                    title: 'Error',
                    message: data.exportResumePdf.message,
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              } catch (error) {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to generate PDF.',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            },
          },
        ],
      });
    }
  };

  // Handle file selection for analysis
  const selectFileForAnalysis = async (jobDesc: string | null) => {
    try {
      // Check for access token early
      if (!accessToken) {
        showAlert({
          type: 'error',
          title: 'Authentication Required',
          message: 'Please log in to use resume analysis.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // Validate result has assets
      if (!result.assets || result.assets.length === 0) {
        showAlert({
          type: 'error',
          title: 'File Selection Error',
          message: 'No file was selected. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const file = result.assets[0];

      // Validate file object
      if (!file || !file.uri) {
        showAlert({
          type: 'error',
          title: 'File Error',
          message: 'Could not read the selected file. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file type
      const validMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validMimeTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Only PDF and DOCX files are supported. Please select a valid resume file.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size !== undefined && file.size > 10 * 1024 * 1024) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB. Please select a smaller file.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file name
      if (!file.name) {
        showAlert({
          type: 'error',
          title: 'File Error',
          message: 'Could not determine file name. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      const analysisMessage = jobDesc
        ? `Ready to analyze "${file.name}" against the job description.`
        : `Ready to analyze "${file.name}" for general improvements.`;

      showAlert({
        type: 'info',
        title: 'Start Resume Analysis?',
        message: analysisMessage,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Analysis',
            style: 'default',
            onPress: async () => {
              setIsAnalyzing(true);

              // Small delay to ensure loading state is shown
              await new Promise(resolve => setTimeout(resolve, 100));

              try {
                // Create file object for upload
                let fileObject;
                try {
                  fileObject = await uriToBlob(
                    file.uri,
                    file.name,
                    file.mimeType || 'application/pdf'
                  );
                } catch (blobError: any) {
                  console.error('[CVUpload] Error creating file object:', blobError);
                  throw new Error('Failed to prepare file for upload. Please try selecting the file again.');
                }

                // Perform analysis
                let analysisData;
                try {
                  analysisData = await analyzeResume(
                    fileObject,
                    jobDesc,
                    accessToken,
                    userEmail
                  );
                } catch (analysisError: any) {
                  console.error('[CVUpload] Analysis error:', analysisError);
                  throw analysisError;
                }

                // Validate analysis result
                if (!analysisData) {
                  throw new Error('No analysis data received. Please try again.');
                }

                // Success - set the result
                setAnalysisResult(analysisData);
                setIsAnalyzing(false);

              } catch (error: any) {
                setIsAnalyzing(false);
                console.error('[CVUpload] Resume analysis failed:', error);

                // Determine appropriate error message
                let errorTitle = 'Analysis Failed';
                let errorMessage = error.message || 'Failed to analyze resume. Please try again.';

                // Handle specific error cases
                if (errorMessage.includes('session has expired') || errorMessage.includes('Authentication')) {
                  errorTitle = 'Session Expired';
                } else if (errorMessage.includes('permission') || errorMessage.includes('subscription')) {
                  errorTitle = 'Upgrade Required';
                } else if (errorMessage.includes('Network') || errorMessage.includes('connect')) {
                  errorTitle = 'Connection Error';
                } else if (errorMessage.includes('timed out')) {
                  errorTitle = 'Request Timeout';
                } else if (errorMessage.includes('Server')) {
                  errorTitle = 'Server Error';
                }

                showAlert({
                  type: 'error',
                  title: errorTitle,
                  message: errorMessage,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            },
          },
        ],
      });
    } catch (error: any) {
      console.error('[CVUpload] File selection error:', error);
      setIsAnalyzing(false);

      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to select file. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const performAnalysis = async (jobDesc: string | null) => {
    await selectFileForAnalysis(jobDesc);
  };

  const handleEditCV = (resumeId: string) => {
    if (onEditCV) {
      onEditCV(resumeId);
    } else if (onCreateCV) {
      onCreateCV();
    }
  };

  const handleViewDetails = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  // If analysis result is available, show analysis screen
  if (analysisResult && !isAnalyzing) {
    return (
      <ResumeAnalysisResultScreen
        analysis={analysisResult}
        resumeName="Your Resume"
        onBack={() => setAnalysisResult(null)}
      />
    );
  }

  // If a resume is selected, show detail screen
  if (selectedResumeId) {
    return (
      <ResumeDetailScreen
        resumeId={selectedResumeId}
        onBack={() => {
          setSelectedResumeId(null);
          safeRefetch();
        }}
        onEdit={(resumeId) => {
          setSelectedResumeId(null);
          handleEditCV(resumeId);
        }}
      />
    );
  }

  return (
    <CandidateLayout
      showBackButton={true}
      onBack={handleBackPress}
      headerTitle="Manage Your CV"
      headerSubtitle={`Manage your resumes, update, improve\nand export.`}
      showGlassPill={true}
      profilePictureUrl={profileImageUrl}
      onSearchPress={handleSearchPress}
      onNotificationPress={handleNotificationPress}
      onProfilePress={handleProfilePress}
    >
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* My Resumes Section */}
        <GlassSectionCard>
          <Text style={styles.sectionTitle}>My Resumes</Text>
          <Text style={styles.sectionDescription}>
            Manage your resumes effectively: update, enhance, and export them as needed.
          </Text>

          {/* Loading state */}
          {isLoading && resumes.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#437EF4" />
              <Text style={styles.loadingText}>Loading resumes...</Text>
            </View>
          )}

          {/* Error state */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load resumes</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => safeRefetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resume list - fetched with limit: 2 */}
          {!isLoading && resumes.length > 0 && (
            <View style={styles.resumeList}>
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={{
                    id: resume.id,
                    fullName: resume.fullName,
                    email: resume.email,
                    title: resume.fullName,
                    atsScore: resume.atsScore,
                    status: resume.status as any,
                    updatedAt: resume.updatedAt,
                    createdAt: resume.createdAt,
                  }}
                  onEdit={() => handleEditCV(resume.id)}
                  onDelete={() => handleDeleteCV(resume.id, resume.fullName)}
                  onDownload={() => handleDownloadPDF(resume)}
                  onPress={() => handleViewDetails(resume.id)}
                />
              ))}
            </View>
          )}

          {/* Empty state */}
          {!isLoading && resumes.length === 0 && !error && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
                </Svg>
              </View>
              <Text style={styles.emptyTitle}>No resumes yet</Text>
              <Text style={styles.emptyText}>Create your first resume to get started</Text>
            </View>
          )}

          {/* List of My Resumes Button */}
          {resumes.length > 0 && (
            <GlassButton
              text="List of My Resumes"
              width={SCREEN_WIDTH - 80}
              height={50}
              borderRadius={25}
              colors={['#437EF4', '#5B8FF9']}
              shadowColor="rgba(67, 126, 244, 0.4)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onViewAllResumes?.();
              }}
              style={styles.listButton}
            />
          )}
        </GlassSectionCard>

        {/* Create a New Resume Section */}
        <GlassSectionCard>
          <Text style={styles.sectionTitle}>Create a New Resume</Text>
          <Text style={styles.sectionDescription}>
            Utilize our advanced CV builder to craft a professional resume.
          </Text>

          <GlassButton
            text="Begin Creating"
            width={SCREEN_WIDTH - 80}
            height={50}
            borderRadius={25}
            colors={['#437EF4', '#5B8FF9']}
            shadowColor="rgba(67, 126, 244, 0.4)"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCreateCV?.();
            }}
            style={styles.createButton}
          />

          {/* Divider with "or" text */}
          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Upload Resume Button */}
          <GlassButton
            text="Upload Resume"
            width={SCREEN_WIDTH - 80}
            height={50}
            borderRadius={25}
            colors={['#10B981', '#34D399']}
            shadowColor="rgba(16, 185, 129, 0.4)"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleUploadCV();
            }}
            style={styles.uploadButton}
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
          />
          <Text style={styles.uploadHint}>
            Upload your existing CV (PDF or DOCX) for AI parsing
          </Text>
        </GlassSectionCard>

        {/* CV Analysis Section */}
        <GlassSectionCard>
          <Text style={styles.sectionTitle}>CV Analysis</Text>
          <Text style={styles.sectionDescription}>
            Get AI-Powered Insights on your Resume
          </Text>

          {isPaidUser ? (
            <GlassButton
              text="Analyze Resume"
              width={SCREEN_WIDTH - 80}
              height={50}
              borderRadius={25}
              colors={['#F59E0B', '#FBBF24']}
              shadowColor="rgba(245, 158, 11, 0.4)"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setPendingAnalysisResume(null);
                setShowAnalysisTypeModal(true);
              }}
              style={styles.analyzeButton}
            />
          ) : (
            <View style={styles.lockedContainer}>
              <Text style={styles.lockedText}>Upgrade to Unlock This Feature</Text>
              <TouchableOpacity
                style={styles.lockedButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onViewPricing?.();
                }}
                activeOpacity={0.8}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
                    fill="#9CA3AF"
                  />
                </Svg>
                <Text style={styles.lockedButtonText}>Locked</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassSectionCard>

        {/* Navigate to Main Profile Link */}
        <TouchableOpacity
          style={styles.navigateLink}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNavigateToProfile?.();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.navigateLinkText}>Navigate to Main Profile</Text>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="#437EF4"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </ScrollView>

      {/* Analysis Type Selection Modal */}
      <Modal
        visible={showAnalysisTypeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowAnalysisTypeModal(false);
          setPendingAnalysisResume(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#437EF4"/>
                </Svg>
              </View>
              <Text style={styles.modalTitle}>Analyze Resume</Text>
              <Text style={styles.modalDescription}>
                Upload your resume file (PDF/DOCX) for AI analysis
              </Text>
            </View>

            <TouchableOpacity
              style={styles.analysisOption}
              onPress={() => {
                setShowAnalysisTypeModal(false);
                setJobDescription('');
                setShowJobDescModal(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.analysisOptionIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#FFFFFF"/>
                </Svg>
              </View>
              <Text style={styles.analysisOptionTitle}>Job Match Analysis</Text>
              <Text style={styles.analysisOptionDescription}>
                Upload resume and add job description to see match score
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAnalysisTypeModal(false);
                setPendingAnalysisResume(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Job Description Modal */}
      <Modal
        visible={showJobDescModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowJobDescModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.jobDescModalOverlay}>
            <View style={styles.jobDescModalContent}>
              <View style={styles.jobDescHeader}>
                <Text style={styles.jobDescTitle}>Job Description</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowJobDescModal(false);
                    setJobDescription('');
                    setPendingAnalysisResume(null);
                  }}
                  style={styles.closeButton}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#6B7280"/>
                  </Svg>
                </TouchableOpacity>
              </View>

              <Text style={styles.jobDescSubtitle}>
                Paste the job description to get a detailed match analysis
              </Text>

              <TextInput
                style={styles.jobDescInput}
                multiline
                placeholder="Paste job description here..."
                placeholderTextColor="#9CA3AF"
                value={jobDescription}
                onChangeText={setJobDescription}
                onBlur={() => Keyboard.dismiss()}
              />

              <View style={styles.jobDescButtons}>
                <TouchableOpacity
                  style={styles.jobDescCancelButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowJobDescModal(false);
                    setJobDescription('');
                    setPendingAnalysisResume(null);
                  }}
                >
                  <Text style={styles.jobDescCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.jobDescAnalyzeButton,
                    !jobDescription.trim() && styles.jobDescAnalyzeButtonDisabled,
                  ]}
                  onPress={async () => {
                    if (!jobDescription.trim()) return;
                    Keyboard.dismiss();
                    setShowJobDescModal(false);
                    await performAnalysis(jobDescription.trim());
                    setJobDescription('');
                    setPendingAnalysisResume(null);
                  }}
                  disabled={!jobDescription.trim()}
                >
                  <Text style={styles.jobDescAnalyzeText}>Analyze</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Analysis Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.analysisOverlay}>
          <View style={styles.analysisModal}>
            <ActivityIndicator size="large" color="#437EF4" />
            <Text style={styles.analysisTitle}>Analyzing Resume</Text>
            <Text style={styles.analysisText}>
              AI is analyzing your resume...{'\n'}This may take 10-15 seconds
            </Text>
          </View>
        </View>
      )}

      {/* Resume Parsing Progress Modal */}
      <ResumeParsingProgressModal
        visible={showParsingProgress}
        progress={parsingProgress}
        stage={parsingStage}
        stageLabel={parsingStageLabel}
        message={parsingMessage}
        status={parsingStatus}
      />
    </CandidateLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 160,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resumeList: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  listButton: {
    alignSelf: 'center',
  },
  createButton: {
    alignSelf: 'center',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginHorizontal: 12,
  },
  uploadButton: {
    alignSelf: 'center',
  },
  uploadHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  analyzeButton: {
    alignSelf: 'center',
  },
  lockedContainer: {
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  lockedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  navigateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  navigateLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#437EF4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  analysisOption: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  analysisOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  analysisOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#581C87',
    marginBottom: 4,
  },
  analysisOptionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7C3AED',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  jobDescModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  jobDescModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '85%',
  },
  jobDescHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  jobDescTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  jobDescSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
  },
  jobDescInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  jobDescButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  jobDescCancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  jobDescCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  jobDescAnalyzeButton: {
    flex: 1,
    backgroundColor: '#437EF4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  jobDescAnalyzeButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  jobDescAnalyzeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  analysisModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  analysisText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
