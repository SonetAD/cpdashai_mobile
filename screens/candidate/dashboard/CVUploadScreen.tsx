import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Linking, TextInput, Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSelector } from 'react-redux';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import BottomNavBar from '../../../components/BottomNavBar';
import ResumeParsingProgressModal from '../../../components/ResumeParsingProgressModal';
import {
  useGetMyResumesQuery,
  useParseAndCreateResumeMutation,
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

interface CVUploadScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  onCreateCV?: () => void;
  onEditCV?: (resumeId: string) => void;
  onViewPricing?: () => void;
  forceRefresh?: number; // Timestamp to trigger refresh
}

interface CVCardProps {
  resume: Resume;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onViewDetails: () => void;
}

const CVCard: React.FC<CVCardProps> = ({ resume, onEdit, onDelete, onDownload, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Ready';
      case 'processing': return 'Processing...';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  return (
    <TouchableOpacity
      onPress={onViewDetails}
      className="bg-white rounded-2xl p-5 mb-4 shadow-lg border border-gray-100"
      activeOpacity={0.7}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900 text-lg font-bold mb-1">{resume.fullName}</Text>
          <Text className="text-gray-500 text-xs mb-1">{resume.email}</Text>
          {/* Status Detail */}
          {resume.status && resume.status !== 'completed' && (
            <View className="flex-row items-center mt-2">
              <View className={`w-2 h-2 rounded-full mr-1.5 ${
                resume.status === 'pending' ? 'bg-gray-400' : 
                resume.status === 'processing' ? 'bg-yellow-500' : 
                resume.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <Text className="text-gray-500 text-xs">
                {resume.status === 'pending' ? 'Waiting to process' : 
                 resume.status === 'processing' ? 'Being analyzed by AI' : 
                 resume.status === 'failed' ? 'Processing failed' : 'In progress'}
              </Text>
            </View>
          )}
        </View>
        <View className="items-end">
          {resume.atsScore !== undefined && (
            <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full px-4 py-2 mb-2 shadow-sm" style={{ backgroundColor: '#437EF4' }}>
              <Text className="text-white text-sm font-bold">{resume.atsScore}%</Text>
              <Text className="text-white text-xs opacity-90">ATS Score</Text>
            </View>
          )}
          <View className={`${getStatusColor(resume.status)} rounded-full px-3 py-1`}>
            <Text className="text-white text-xs font-semibold">{getStatusText(resume.status)}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row justify-between pt-3 border-t border-gray-100">
        {/* Edit Button */}
        <TouchableOpacity
          className="items-center justify-center flex-1"
          onPress={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <View className="bg-blue-50 rounded-full p-3 mb-1">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#437EF4"/>
            </Svg>
          </View>
          <Text className="text-gray-600 text-xs font-medium">Edit</Text>
        </TouchableOpacity>

        {/* Download Button */}
        <TouchableOpacity
          className="items-center justify-center flex-1"
          onPress={(e) => {
            e.stopPropagation();
            onDownload();
          }}
        >
          <View className={`rounded-full p-3 mb-1 ${
            resume.status === 'completed'
              ? 'bg-green-50'
              : resume.status === 'processing'
              ? 'bg-yellow-50'
              : resume.status === 'pending'
              ? 'bg-gray-100'
              : resume.status === 'failed'
              ? 'bg-red-50'
              : 'bg-blue-50'
          }`}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                fill={
                  resume.status === 'completed'
                    ? '#10B981'
                    : resume.status === 'processing'
                    ? '#F59E0B'
                    : resume.status === 'pending'
                    ? '#9CA3AF'
                    : resume.status === 'failed'
                    ? '#EF4444'
                    : '#437EF4'
                }
              />
            </Svg>
          </View>
          <Text className={`text-xs font-medium ${
            resume.status === 'completed'
              ? 'text-gray-600'
              : resume.status === 'processing'
              ? 'text-yellow-600'
              : resume.status === 'pending'
              ? 'text-gray-500'
              : resume.status === 'failed'
              ? 'text-red-600'
              : 'text-blue-600'
          }`}>
            {resume.status === 'completed'
              ? 'Download'
              : resume.status === 'processing'
              ? 'Processing'
              : resume.status === 'pending'
              ? 'Pending'
              : resume.status === 'failed'
              ? 'Retry'
              : 'Generate'}
          </Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          className="items-center justify-center flex-1"
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <View className="bg-red-50 rounded-full p-3 mb-1">
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#EF4444"/>
            </Svg>
          </View>
          <Text className="text-gray-600 text-xs font-medium">Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function CVUploadScreen({
  activeTab = 'jobs',
  onTabChange,
  onBack,
  onCreateCV,
  onEditCV,
  onViewPricing,
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
  const accessToken = useSelector((state: any) => state.auth.token);
  const userEmail = useSelector((state: any) => state.auth.user?.email);
  const { showAlert } = useAlert();

  // API hooks
  const { data: resumesData, isLoading, error, refetch, isUninitialized } = useGetMyResumesQuery();
  const [parseAndCreateResume] = useParseAndCreateResumeMutation();
  const [parseResumeAsync] = useParseResumeAsyncMutation();
  const [deleteResume] = useDeleteResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();
  const { data: subscriptionData } = useCheckSubscriptionStatusQuery();

  const resumes = resumesData?.myResumes || [];
  const isPaidUser = subscriptionData?.subscriptionStatus?.canUseAiFeatures || false;

  // Safe refetch wrapper that checks if query has been started
  const safeRefetch = () => {
    if (!isUninitialized) {
      return refetch();
    } else {
      console.log('⚠️ Query not yet initialized, skipping refetch');
      return Promise.resolve({ data: resumesData });
    }
  };

  // Log resume data for debugging
  useEffect(() => {
    console.log('📋 CVUploadScreen - Resume data updated:', {
      hasData: !!resumesData,
      resumeCount: resumes.length,
      resumes: resumes.map(r => ({ id: r.id, name: r.fullName, email: r.email, status: r.status })),
    });
  }, [resumesData, resumes]);

  // Cleanup WebSocket connection on unmount
  useEffect(() => {
    return () => {
      resumeParsingProgressService.disconnect();
    };
  }, []);

  // Auto-generate PDFs for pending resumes in background
  useEffect(() => {
    if (resumes.length === 0) return;

    // Log all resume statuses for debugging
    console.log('📊 Current resume statuses:', resumes.map(r => ({
      id: r.id,
      name: r.fullName,
      status: r.status,
      hasUrl: !!r.generatedResumeUrl,
      url: r.generatedResumeUrl
    })));

    // Find pending resumes that we haven't processed yet
    const pendingResumes = resumes.filter(
      r => r.status === 'pending' && !processedResumeIds.has(r.id)
    );

    if (pendingResumes.length > 0) {
      console.log(`🔄 Found ${pendingResumes.length} new pending resume(s), auto-generating PDFs...`);
      console.log(`📝 Pending resume IDs:`, pendingResumes.map(r => r.id));

      // Trigger PDF generation for all unprocessed pending resumes
      pendingResumes.forEach(async (resume) => {
        // Mark as processed immediately to prevent duplicate calls
        setProcessedResumeIds(prev => new Set([...prev, resume.id]));

        try {
          console.log(`\n🔄 Starting PDF generation for: ${resume.fullName} (${resume.id})`);
          console.log(`📤 Calling exportResumePdf mutation for resume ID: ${resume.id}`);

          const pdfData = await exportPdf(resume.id).unwrap();
          console.log(`📥 Export response received:`, JSON.stringify(pdfData, null, 2));

          if (pdfData.exportResumePdf.__typename === 'SuccessType') {
            console.log(`✅ PDF generation started successfully for: ${resume.fullName}`);
            console.log(`📊 Backend says: ${pdfData.exportResumePdf.message}`);
            console.log(`📊 Expected status change: pending → processing → completed`);
            console.log(`⏳ Starting polling (every 3 seconds for 45 seconds)...`);

            // Start polling to update UI
            let pollCount = 0;
            const maxPolls = 15; // 15 polls * 3 seconds = 45 seconds
            const pollInterval = setInterval(async () => {
              pollCount++;
              console.log(`\n🔄 Poll #${pollCount}/${maxPolls} - Refetching resume list...`);
              const result = await safeRefetch();

              // Log the status after refetch
              const updatedResume = result.data?.myResumes?.find((r: Resume) => r.id === resume.id);
              if (updatedResume) {
                console.log(`📊 Resume status after poll #${pollCount}:`, {
                  status: updatedResume.status,
                  hasUrl: !!updatedResume.generatedResumeUrl,
                  url: updatedResume.generatedResumeUrl || 'none'
                });

                // If status changed to completed or processing, we can see progress
                if (updatedResume.status !== 'pending') {
                  console.log(`✅ Status changed from 'pending' to '${updatedResume.status}'!`);
                }

                // If completed, stop polling
                if (updatedResume.status === 'completed') {
                  console.log(`✅ PDF generation completed! Stopping polling.`);
                  clearInterval(pollInterval);
                  return;
                }
              }

              if (pollCount >= maxPolls) {
                console.log(`⏰ Polling timeout reached after ${maxPolls * 3} seconds`);
                console.log(`⚠️ Status still: ${updatedResume?.status || 'unknown'}`);
                clearInterval(pollInterval);
              }
            }, 3000);

            // Clean up after 45 seconds
            setTimeout(() => {
              clearInterval(pollInterval);
              console.log(`🛑 Stopped polling for ${resume.fullName}`);
              safeRefetch(); // One final check
            }, 45000);
          } else {
            console.error(`❌ Export failed with ErrorType:`, pdfData.exportResumePdf);
            console.error(`❌ Error message:`, pdfData.exportResumePdf.message);
          }
        } catch (error) {
          console.error(`❌ Failed to start PDF generation for ${resume.fullName}:`, error);
          console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
          // Remove from processed set so user can retry
          setProcessedResumeIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(resume.id);
            return newSet;
          });
        }
      });
    } else {
      console.log('✅ No pending resumes to process (all have been processed already)');
    }
  }, [resumes]); // Trigger when resumes array changes

  // Refetch resumes when screen becomes visible
  useEffect(() => {
    // Only refetch if query has been initialized
    if (!isUninitialized) {
      console.log('🔄 CVUploadScreen mounted - will refetch in 500ms');
      // Add a small delay to ensure backend has committed any pending transactions
      const timer = setTimeout(() => {
        console.log('🔄 Triggering refetch...');
        safeRefetch();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isUninitialized]); // Run when query initialization status changes

  // Refetch when forceRefresh prop changes (e.g., after coming back from builder)
  useEffect(() => {
    if (forceRefresh && !isUninitialized) {
      console.log('🔄 Force refresh triggered by prop change:', forceRefresh);
      const timer = setTimeout(() => {
        console.log('🔄 Executing forced refetch with 1 second delay...');
        safeRefetch();
      }, 1000); // Longer delay to ensure backend commits

      return () => clearTimeout(timer);
    }
  }, [forceRefresh, isUninitialized]);

  // Handle file upload
  const handleUploadCV = async () => {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File',
          message: 'Only PDF and DOCX files are supported',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size !== undefined && file.size > 10 * 1024 * 1024) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Show confirmation dialog before AI parsing
      showAlert({
        type: 'info',
        title: 'Start AI Analysis?',
        message: `Ready to upload "${file.name}" for AI parsing and analysis. This will extract information from your resume and generate an ATS score.`,
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Analysis',
            style: 'default',
            onPress: async () => {
              setIsUploading(true);

              try {
                // Read file as base64
                const base64 = await FileSystem.readAsStringAsync(file.uri, {
                  encoding: 'base64',
                });

                // Add data URI prefix
                const fileData = `data:${file.mimeType};base64,${base64}`;

                // Use async parsing with progress tracking
                const data = await parseResumeAsync({
                  fileName: file.name,
                  fileData: fileData,
                }).unwrap();

                setIsUploading(false);

                if (data.parseResumeAsync.__typename === 'ResumeParsingTaskSuccessType') {
                  const taskId = data.parseResumeAsync.task.taskId;
                  
                  console.log('📤 Resume parsing started. Task ID:', taskId);

                  // Show progress modal
                  setShowParsingProgress(true);
                  setParsingProgress(0);
                  setParsingStage('pending');
                  setParsingStageLabel('Starting...');
                  setParsingMessage('');

                  // Subscribe to progress updates
                  resumeParsingProgressService.subscribe(
                    taskId,
                    accessToken,
                    // On progress update
                    (update: ProgressUpdate) => {
                      console.log('Progress update:', update);
                      setParsingProgress(update.progress);
                      setParsingStage(update.stage);
                      setParsingStageLabel(update.stageLabel);
                      setParsingMessage(update.message || '');
                      setParsingStatus(update.status || 'in_progress');
                    },
                    // On completed
                    async (resumeId: string) => {
                      console.log('✅ Parsing completed! Resume ID:', resumeId);
                      setShowParsingProgress(false);

                      // Refetch resumes to get the new one
                      await safeRefetch();

                      // Show success alert
                      showAlert({
                        type: 'success',
                        title: 'Success!',
                        message: 'Your resume has been parsed and analyzed successfully! PDF generation has been started.',
                        buttons: [{
                          text: 'OK',
                          style: 'default',
                        }],
                      });
                    },
                    // On error
                    (error: string) => {
                      console.error('❌ Parsing error:', error);
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
                  // Error response
                  showAlert({
                    type: 'error',
                    title: 'Error',
                    message: data.parseResumeAsync.message || 'Failed to start resume parsing',
                    buttons: [{ text: 'OK', style: 'default' }],
                  });
                }
              } catch (error: any) {
                console.error('Upload failed:', error);
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
      console.error('File selection error:', error);
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
      message: `Are you sure you want to delete "${resumeName}"? This action cannot be undone.`,
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
              console.error('Delete failed:', error);
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
    // If status is pending, show message that auto-generation is happening
    if (resume.status === 'pending') {
      showAlert({
        type: 'info',
        title: 'PDF Generation Starting',
        message: 'Your PDF is being generated automatically in the background. This will take 10-15 seconds.\n\nThe button will change to "Processing" and then "Download" when ready.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // If status is processing, show message
    if (resume.status === 'processing') {
      showAlert({
        type: 'info',
        title: 'Processing',
        message: 'Your PDF is currently being generated. Please wait a moment.\n\nThe download button will appear when ready.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // If completed, download using API endpoint
    if (resume.status === 'completed') {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const downloadUrl = `${API_URL}/api/resume/build/${resume.id}/download/`;

      try {
        console.log('📥 Downloading PDF from:', downloadUrl);

        // Add authentication header for the download request
        const downloadUrlWithAuth = downloadUrl;

        // For React Native, we need to open the URL with authentication
        // Create a URL that includes the token as a query parameter or use Linking
        const canOpen = await Linking.canOpenURL(downloadUrl);

        if (canOpen) {
          // Open the download URL - the browser/system will handle the download
          await Linking.openURL(downloadUrl);
          console.log('✅ PDF download initiated');
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
                    console.log('✅ PDF download initiated');
                  } catch (error) {
                    console.error('❌ Failed to open URL:', error);
                    showAlert({
                      type: 'error',
                      title: 'Error',
                      message: 'Could not open PDF. Please try again.',
                      buttons: [{ text: 'OK', style: 'default' }],
                    });
                  }
                }
              }
            ],
          });
        }
      } catch (error) {
        console.error('❌ Error downloading PDF:', error);
        showAlert({
          type: 'error',
          title: 'Download Failed',
          message: 'Failed to download PDF. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } else {
      // Need to generate PDF (for failed or unknown status)
      const isFailed = resume.status === 'failed';
      showAlert({
        type: 'confirm',
        title: isFailed ? 'Retry PDF Generation' : 'Generate PDF',
        message: isFailed
          ? `Previous PDF generation failed. Would you like to try again?`
          : `Generate a PDF for ${resume.fullName}'s resume?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isFailed ? 'Retry' : 'Generate',
            style: 'default',
            onPress: async () => {
              try {
                const data = await exportPdf(resume.id).unwrap();

                if (data.exportResumePdf.__typename === 'SuccessType') {
                  showAlert({
                    type: 'success',
                    title: 'Generating PDF',
                    message: 'Your PDF is being generated. This may take 10-15 seconds. The status will update automatically.',
                    buttons: [{
                      text: 'OK',
                      style: 'default',
                      onPress: () => {
                        // Start polling to update status
                        const pollInterval = setInterval(() => {
                          safeRefetch();
                        }, 3000);

                        // Stop polling after 45 seconds
                        setTimeout(() => {
                          clearInterval(pollInterval);
                          safeRefetch(); // One final check
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
                console.error('Export failed:', error);
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to generate PDF. Please try again.',
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
      // Pick resume file
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        // Don't need to set isAnalyzing false here since we haven't set it true yet
        return;
      }

      const file = result.assets[0];

      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File',
          message: 'Only PDF and DOCX files are supported',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file size (10MB max)
      if (file.size !== undefined && file.size > 10 * 1024 * 1024) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'File size must be less than 10MB',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Show confirmation before starting analysis
      const analysisMessage = jobDesc
        ? `Ready to analyze "${file.name}" against the provided job description. This will evaluate your resume's compatibility and provide tailored suggestions.`
        : `Ready to analyze "${file.name}" for general improvements. This will provide comprehensive feedback on your resume's content and format.`;

      showAlert({
        type: 'info',
        title: 'Start Resume Analysis?',
        message: analysisMessage,
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Start Analysis',
            style: 'default',
            onPress: async () => {
              // Set loading state immediately
              setIsAnalyzing(true);

              // Small delay to ensure the loading modal appears
              await new Promise(resolve => setTimeout(resolve, 100));

              try {
                console.log('📊 Starting resume analysis');
                console.log('📄 Selected file:', file.name);

                // Convert file URI to file object
                const fileObject = await uriToBlob(file.uri, file.name, file.mimeType || 'application/pdf');
                console.log('✅ Created file object');

                console.log('📤 Calling analyzeResume API...');
                console.log('Job description provided:', !!jobDesc);
                console.log('User email:', userEmail);

                // Call the analyze API
                const analysisData = await analyzeResume(fileObject, jobDesc, accessToken, userEmail);

                console.log('✅ Analysis completed successfully');
                console.log('Overall score:', analysisData.overall_score);

                // Store results and show the analysis screen
                setAnalysisResult(analysisData);
                setIsAnalyzing(false);
              } catch (error: any) {
                console.error('❌ Analysis failed:', error);
                setIsAnalyzing(false);
                showAlert({
                  type: 'error',
                  title: 'Analysis Failed',
                  message: error.message || 'Failed to analyze resume. Please try again.',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            },
          },
        ],
      });

    } catch (error: any) {
      console.error('❌ File selection error:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to select file. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Handle analyze - prompt for file upload
  const performAnalysis = async (jobDesc: string | null) => {
    // Don't set loading here, let selectFileForAnalysis handle it after file is picked
    // Show file picker for analysis
    await selectFileForAnalysis(jobDesc);
  };


  // Handle edit
  const handleEditCV = (resumeId: string) => {
    if (onEditCV) {
      onEditCV(resumeId);
    } else if (onCreateCV) {
      // Fallback to create screen with edit mode
      onCreateCV();
    }
  };

  // Handle view details
  const handleViewDetails = (resumeId: string) => {
    setSelectedResumeId(resumeId);
  };

  // If analysis result is available, show analysis screen
  if (analysisResult && !isAnalyzing) {
    return (
      <ResumeAnalysisResultScreen
        analysis={analysisResult}
        resumeName="Your Resume"
        onBack={() => {
          setAnalysisResult(null);
        }}
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
          safeRefetch(); // Refresh list when coming back
        }}
        onEdit={(resumeId) => {
          setSelectedResumeId(null);
          handleEditCV(resumeId);
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#437EF4', '#437EF4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center">
          <LogoWhite width={39} height={33} />
          <View className="flex-1 ml-4">
            <Text className="text-white text-lg font-bold">CV Manager</Text>
            <Text className="text-white/90 text-xs mt-0.5">
              Manage, update, and improve your resumes
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* My CVs Section */}
        <View className="mt-6 mb-4">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-gray-900 text-xl font-bold mb-1">My Resumes</Text>
              <Text className="text-gray-500 text-sm">
                {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} created
              </Text>
            </View>
            <TouchableOpacity
              className="bg-primary-blue rounded-full px-5 py-2.5 flex-row items-center shadow-md"
              style={{ backgroundColor: '#437EF4' }}
              onPress={onCreateCV}
            >
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#FFFFFF"/>
              </Svg>
              <Text className="text-white text-sm font-bold ml-1">New</Text>
            </TouchableOpacity>
          </View>

          {/* Loading state */}
          {isLoading && resumes.length === 0 && (
            <View className="bg-white rounded-2xl p-8 items-center justify-center">
              <ActivityIndicator size="large" color="#437EF4" />
              <Text className="text-gray-400 text-sm mt-3">Loading resumes...</Text>
            </View>
          )}

          {/* Error state */}
          {error && (
            <View className="bg-red-50 rounded-2xl p-4 mb-3 border border-red-200">
              <Text className="text-red-600 text-sm font-medium mb-2">Failed to load resumes</Text>
              <TouchableOpacity
                className="bg-red-500 rounded-lg py-2 items-center"
                onPress={() => safeRefetch()}
              >
                <Text className="text-white text-xs font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty state */}
          {!isLoading && resumes.length === 0 && !error && (
            <View className="bg-gradient-to-b from-blue-50 to-white rounded-3xl p-8 items-center border border-blue-100 shadow-sm" style={{ backgroundColor: '#F0F7FF' }}>
              <View className="bg-blue-100 rounded-full p-4 mb-4">
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
                </Svg>
              </View>
              <Text className="text-gray-900 text-lg font-bold mb-2">No resumes yet</Text>
              <Text className="text-gray-500 text-sm text-center mb-6 px-4">
                Create your first professional resume or upload an existing one to get started
              </Text>
              <TouchableOpacity
                className="bg-primary-blue rounded-xl py-3 px-8 shadow-md"
                style={{ backgroundColor: '#437EF4' }}
                onPress={onCreateCV}
              >
                <Text className="text-white text-sm font-bold">+ Create Your First Resume</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resume list */}
          {resumes.map((resume) => (
            <CVCard
              key={resume.id}
              resume={resume}
              onEdit={() => handleEditCV(resume.id)}
              onDelete={() => handleDeleteCV(resume.id, resume.fullName)}
              onDownload={() => handleDownloadPDF(resume)}
              onViewDetails={() => handleViewDetails(resume.id)}
            />
          ))}
        </View>

        {/* Add New CV Section */}
        <View className="mt-6 mb-4">
          <Text className="text-gray-900 text-lg font-bold mb-1">Add New Resume</Text>
          <Text className="text-gray-500 text-sm mb-4">Choose how you want to create your resume</Text>

          {/* Upload Existing CV */}
          <View className={`bg-white rounded-2xl p-5 mb-3 border shadow-sm ${isPaidUser ? 'border-purple-100' : 'border-gray-200 opacity-75'}`}>
            <View className="flex-row items-center mb-3">
              <View className={`${isPaidUser ? 'bg-purple-100' : 'bg-gray-100'} rounded-full p-3 mr-3`}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" fill={isPaidUser ? "#9333EA" : "#9CA3AF"}/>
                </Svg>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 text-base font-bold">Upload Existing Resume</Text>
                  {!isPaidUser && (
                    <View className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-white text-xs font-bold">PRO</Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  {isPaidUser ? 'AI will extract all data automatically' : 'Upgrade to unlock AI resume parsing'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className={`rounded-xl py-3 items-center flex-row justify-center ${!isPaidUser && 'opacity-60'}`}
              style={{ backgroundColor: isPaidUser ? '#9333EA' : '#E5E7EB' }}
              onPress={isPaidUser ? handleUploadCV : () => {
                showAlert({
                  type: 'info',
                  title: 'Premium Feature',
                  message: 'AI resume upload and parsing is a premium feature. Upgrade your plan to access this functionality.',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', style: 'default', onPress: () => {
                      onViewPricing?.();
                    }}
                  ]
                });
              }}
              disabled={isUploading || !isPaidUser}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  {!isPaidUser && (
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                      <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#6B7280"/>
                    </Svg>
                  )}
                  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={isPaidUser ? "#FFFFFF" : "#6B7280"}/>
                  </Svg>
                  <Text className={`text-sm font-bold ml-2 ${isPaidUser ? 'text-white' : 'text-gray-600'}`}>
                    {isPaidUser ? 'Upload PDF/DOCX' : 'Locked'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Create New CV */}
          <View className="bg-white rounded-2xl p-5 mb-4 border border-blue-100 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-100 rounded-full p-3 mr-3">
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
                </Svg>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 text-base font-bold mb-1">Create New Resume</Text>
                <Text className="text-gray-500 text-xs">
                  Build from scratch with our smart builder
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-primary-blue rounded-xl py-3 items-center flex-row justify-center"
              style={{ backgroundColor: '#437EF4' }}
              onPress={onCreateCV}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#FFFFFF"/>
              </Svg>
              <Text className="text-white text-sm font-bold ml-2">Start Creating</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analyze Resume Section */}
        <View className="mt-2 mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-1">Resume Analysis</Text>
          <Text className="text-gray-500 text-sm mb-4">Get AI-powered insights on your resume</Text>

          {/* Analyze Resume Card */}
          <View className={`bg-white rounded-2xl p-5 border shadow-sm ${isPaidUser ? 'border-yellow-100' : 'border-gray-200 opacity-75'}`}>
            <View className="flex-row items-center mb-3">
              <View className={`${isPaidUser ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full p-3 mr-3`}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill={isPaidUser ? "#F59E0B" : "#9CA3AF"}/>
                </Svg>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 text-base font-bold">Analyze Your Resume</Text>
                  {!isPaidUser && (
                    <View className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-white text-xs font-bold">PRO</Text>
                    </View>
                  )}
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  {isPaidUser ? 'Upload resume to get ATS score & detailed feedback' : 'Upgrade to unlock AI resume analysis'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              className={`rounded-xl py-3 items-center flex-row justify-center ${!isPaidUser && 'opacity-60'}`}
              style={{ backgroundColor: isPaidUser ? '#F59E0B' : '#E5E7EB' }}
              onPress={isPaidUser ? () => {
                // Open analysis type modal without a specific resume
                setPendingAnalysisResume(null);
                setShowAnalysisTypeModal(true);
              } : () => {
                showAlert({
                  type: 'info',
                  title: 'Premium Feature',
                  message: 'AI resume analysis is a premium feature. Upgrade your plan to get detailed ATS scores and improvement suggestions.',
                  buttons: [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'View Plans', style: 'default', onPress: () => {
                      onViewPricing?.();
                    }}
                  ]
                });
              }}
            >
              {!isPaidUser && (
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-1">
                  <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#6B7280"/>
                </Svg>
              )}
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill={isPaidUser ? "#FFFFFF" : "#6B7280"}/>
              </Svg>
              <Text className={`text-sm font-bold ml-2 ${isPaidUser ? 'text-white' : 'text-gray-600'}`}>
                {isPaidUser ? 'Analyze Resume' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <BottomNavBar activeTab={activeTab} onTabPress={onTabChange} />

      {/* Analysis Loading Modal */}
      <Modal
        visible={isAnalyzing}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 items-center shadow-2xl">
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text className="text-gray-900 text-lg font-bold mt-4">Analyzing Resume</Text>
            <Text className="text-gray-600 text-sm text-center mt-2">
              Please wait while we analyze your resume...
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-2">
              This may take a few moments
            </Text>
          </View>
        </View>
      </Modal>

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
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full shadow-2xl">
            {/* Header */}
            <View className="items-center mb-6">
              <View className="bg-blue-100 rounded-full p-4 mb-3">
                <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <Path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.1h-15V5h15v14.1zm0-16.1h-15c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" fill="#437EF4"/>
                </Svg>
              </View>
              <Text className="text-gray-900 text-xl font-bold mb-2">Analyze Resume</Text>
              <Text className="text-gray-600 text-sm text-center">
                Upload your resume file (PDF/DOCX) for AI analysis
              </Text>
            </View>

            {/* Option 1: General Analysis */}
            {/* <TouchableOpacity
              className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 mb-3 border-2 border-blue-200"
              style={{ backgroundColor: '#EFF6FF' }}
              onPress={async () => {
                setShowAnalysisTypeModal(false);
                await performAnalysis(null);
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-2">
                <View className="bg-blue-500 rounded-full p-2 mr-3">
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#FFFFFF"/>
                  </Svg>
                </View>
                <Text className="text-blue-900 text-base font-bold flex-1">General Analysis</Text>
              </View>
              <Text className="text-blue-700 text-sm ml-11">
                Select your resume file to get overall ATS score, strong points, and improvement suggestions
              </Text>
            </TouchableOpacity> */}

            {/* Option 2: Job Match Analysis */}
            <TouchableOpacity
              className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-4 mb-4 border-2 border-purple-200"
              style={{ backgroundColor: '#FAF5FF' }}
              onPress={() => {
                setShowAnalysisTypeModal(false);
                setJobDescription('');
                setShowJobDescModal(true);
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-2">
                <View className="bg-purple-500 rounded-full p-2 mr-3">
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#FFFFFF"/>
                  </Svg>
                </View>
                <Text className="text-purple-900 text-base font-bold flex-1">Job Match Analysis</Text>
              </View>
              <Text className="text-purple-700 text-sm ml-11">
                Upload resume and add job description to see match score, matching & missing skills
              </Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-4 items-center"
              onPress={() => {
                setShowAnalysisTypeModal(false);
                setPendingAnalysisResume(null);
              }}
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
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
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl" style={{ height: '85%' }}>
              <View className="p-6 flex-1">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 text-xl font-bold">Job Description</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowJobDescModal(false);
                      setJobDescription('');
                      setPendingAnalysisResume(null);
                    }}
                    className="p-2"
                  >
                    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#6B7280"/>
                    </Svg>
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-600 text-sm mb-4">
                  Paste the job description to get a detailed match analysis
                </Text>

                {/* Text Input Area */}
                <View className="flex-1 mb-4">
                  <TextInput
                    className="bg-gray-50 rounded-xl p-4 text-gray-900 border border-gray-200"
                    style={{
                      flex: 1,
                      textAlignVertical: 'top',
                      fontSize: 14,
                    }}
                    multiline
                    placeholder="Paste job description here...&#10;&#10;Example:&#10;Senior Backend Developer&#10;&#10;Requirements:&#10;- 3+ years Python experience&#10;- Django/FastAPI expertise&#10;- PostgreSQL knowledge&#10;..."
                    placeholderTextColor="#9CA3AF"
                    value={jobDescription}
                    onChangeText={setJobDescription}
                    onBlur={() => Keyboard.dismiss()}
                  />
                </View>

                {/* Buttons */}
                <View className="flex-row" style={{ gap: 12 }}>
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowJobDescModal(false);
                      setJobDescription('');
                      setPendingAnalysisResume(null);
                    }}
                  >
                    <Text className="text-gray-700 text-base font-semibold">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 rounded-xl py-4 items-center"
                    style={{
                      backgroundColor: jobDescription.trim() ? '#437EF4' : '#D1D5DB',
                    }}
                    onPress={async () => {
                      if (!jobDescription.trim()) return;

                      Keyboard.dismiss();
                      setShowJobDescModal(false);

                      // Perform analysis with job description
                      await performAnalysis(jobDescription.trim());

                      setJobDescription('');
                      setPendingAnalysisResume(null);
                    }}
                    disabled={!jobDescription.trim()}
                  >
                    <Text className="text-white text-base font-bold">Analyze</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Analysis Loading Overlay */}
      {isAnalyzing && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <View className="bg-white rounded-2xl p-6 items-center shadow-2xl" style={{ minWidth: 280 }}>
            <ActivityIndicator size="large" color="#437EF4" />
            <Text className="text-gray-900 text-lg font-bold mt-4">Analyzing Resume</Text>
            <Text className="text-gray-500 text-sm mt-2 text-center">
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
    </SafeAreaView>
  );
}
