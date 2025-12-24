import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useSelector } from 'react-redux';
import { useParseResumeAsyncMutation, useGetMyResumesQuery, Resume } from '../../../../services/api';
import { useAlert } from '../../../../contexts/AlertContext';
import { resumeParsingProgressService, ProgressUpdate } from '../../../../services/resumeParsingProgress';
import Svg, { Path, Circle } from 'react-native-svg';

// Pending Task Card - Shows parsing progress
interface PendingTaskCardProps {
  taskId: string;
  fileName: string;
  progress: number;
  stage: string;
  stageLabel: string;
  status: string;
}

const PendingTaskCard: React.FC<PendingTaskCardProps> = ({ fileName, progress, stageLabel, status }) => {
  return (
    <View className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-200">
      <View className="flex-row items-center mb-2">
        <View className="bg-blue-100 rounded-full p-2 mr-3">
          <ActivityIndicator size="small" color="#437EF4" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-base font-semibold" numberOfLines={1}>
            {fileName}
          </Text>
          <Text className="text-blue-600 text-xs mt-0.5">
            {status === 'pending' ? 'Queued for processing...' : stageLabel}
          </Text>
        </View>
        <Text className="text-blue-600 text-xs font-semibold">
          {progress}%
        </Text>
      </View>
      {/* Progress Bar */}
      <View className="bg-blue-100 rounded-full h-1.5 overflow-hidden">
        <View 
          className="bg-blue-500 h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
};

// Simple Resume Card for Profile - No edit/delete, no ATS score/status
interface ResumeCardProps {
  resume: Resume;
  onDownload: () => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onDownload }) => {

  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 border border-gray-100 shadow-sm"
      activeOpacity={0.7}
      onPress={onDownload}
    >
      <View className="flex-row items-center">
        {/* Document Icon */}
        <View className="bg-blue-50 rounded-full p-3 mr-3">
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
          </Svg>
        </View>

        {/* Resume Info */}
        <View className="flex-1">
          <Text className="text-gray-900 text-base font-semibold" numberOfLines={1}>
            {resume.fullName}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
            {resume.email}
          </Text>
        </View>

        {/* Download Icon */}
        <View className="bg-green-50 rounded-full p-2">
          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="#10B981"/>
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ResumeTab: React.FC = () => {
  const [parseResumeAsync, { isLoading: isUploading }] = useParseResumeAsyncMutation();
  const { data: resumesData, isLoading: isLoadingResumes, error, refetch } = useGetMyResumesQuery();
  const { showAlert } = useAlert();
  const accessToken = useSelector((state: any) => state.auth.token);
  
  // Track pending parsing tasks with real-time progress
  const [pendingTasks, setPendingTasks] = useState<Map<string, {
    fileName: string;
    progress: number;
    stage: string;
    stageLabel: string;
    status: string;
  }>>(new Map());
  
  // Track active WebSocket subscriptions
  const [activeSubscriptions, setActiveSubscriptions] = useState<Set<string>>(new Set());

  const resumes = resumesData?.myResumes || [];
  
  // Display pending resumes from server (for tasks that may have been created before this session)
  useEffect(() => {
    const pendingResumes = resumes.filter(r => r.status === 'pending' || r.status === 'processing');
    
    // Add pending resumes to display (without active WebSocket subscription)
    pendingResumes.forEach(resume => {
      if (!pendingTasks.has(resume.id) && !activeSubscriptions.has(resume.id)) {
        setPendingTasks(prev => new Map(prev).set(resume.id, {
          fileName: resume.fileName || resume.fullName,
          progress: 0,
          stage: 'pending',
          stageLabel: 'Processing on server...',
          status: resume.status || 'pending'
        }));
      }
    });
    
    // Remove completed tasks from pending display
    setPendingTasks(prev => {
      const newMap = new Map(prev);
      const pendingIds = new Set(pendingResumes.map(r => r.id));
      
      for (const taskId of newMap.keys()) {
        // Only remove if not in pending list AND not actively subscribed
        if (!pendingIds.has(taskId) && !activeSubscriptions.has(taskId)) {
          newMap.delete(taskId);
        }
      }
      
      return newMap;
    });
  }, [resumes, activeSubscriptions]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('User cancelled document picker');
        return;
      }

      const file = result.assets[0];

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size && file.size > maxSize) {
        showAlert({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select a file smaller than 10MB.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.mimeType || '')) {
        showAlert({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Only PDF and DOCX files are supported.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      showAlert({
        type: 'confirm',
        title: 'Resume Selected',
        message: `${file.name}\nSize: ${((file.size || 0) / 1024).toFixed(2)} KB\n\nDo you want to upload and parse this resume?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upload', style: 'default', onPress: () => handleUploadResume(file) },
        ],
      });
    } catch (error) {
      console.error('DocumentPicker error:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to pick document. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleUploadResume = async (file: DocumentPicker.DocumentPickerAsset) => {
    try {
      console.log('📤 Reading file from path:', file.uri);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      // Add data URI prefix
      const fileData = `data:${file.mimeType};base64,${base64}`;

      console.log('📦 File converted to base64, uploading...');

      // Use async parsing mutation
      const data = await parseResumeAsync({
        fileName: file.name,
        fileData: fileData,
      }).unwrap();

      if (data.parseResumeAsync.__typename === 'ResumeParsingTaskSuccessType') {
        const taskId = data.parseResumeAsync.task.taskId;
        
        console.log('✅ Resume parsing task created. Task ID:', taskId);

        // Show success message immediately
        showAlert({
          type: 'success',
          title: 'Upload Started!',
          message: 'Your resume is being processed. You can see the progress below.',
          buttons: [{ text: 'OK', style: 'default' }],
        });

        // Add pending task to display immediately at 0%
        setPendingTasks(prev => new Map(prev).set(taskId, {
          fileName: file.name,
          progress: 0,
          stage: 'pending',
          stageLabel: 'Starting upload...',
          status: 'pending'
        }));

        // Track this subscription
        setActiveSubscriptions(prev => new Set(prev).add(taskId));

        // Track if minimum 0% display time has passed
        let canShowProgress = false;
        
        // Wait 1.5 seconds before allowing progress updates to show
        // This ensures user always sees 0% for at least 1.5 seconds
        setTimeout(() => {
          canShowProgress = true;
          console.log('✅ Minimum 0% display time reached, can now show real progress');
        }, 1500);

        // Queue to store updates that arrive before minimum display time
        let queuedUpdate: ProgressUpdate | null = null;

        // Subscribe to WebSocket progress updates
        resumeParsingProgressService.subscribe(
          taskId,
          accessToken,
          // On progress update
          (update: ProgressUpdate) => {
            console.log('📊 Progress update received:', update.progress + '%');
            
            if (canShowProgress) {
              // Minimum time has passed, show the update immediately
              setPendingTasks(prev => new Map(prev).set(taskId, {
                fileName: file.name,
                progress: update.progress,
                stage: update.stage,
                stageLabel: update.stageLabel,
                status: update.status
              }));
            } else {
              // Still in minimum display time, queue the latest update
              console.log('⏳ Queuing update until minimum 0% display time passes');
              queuedUpdate = update;
              
              // Check every 100ms if we can show the queued update
              const checkInterval = setInterval(() => {
                if (canShowProgress && queuedUpdate) {
                  console.log('🎬 Showing queued progress:', queuedUpdate.progress + '%');
                  setPendingTasks(prev => new Map(prev).set(taskId, {
                    fileName: file.name,
                    progress: queuedUpdate!.progress,
                    stage: queuedUpdate!.stage,
                    stageLabel: queuedUpdate!.stageLabel,
                    status: queuedUpdate!.status
                  }));
                  queuedUpdate = null;
                  clearInterval(checkInterval);
                }
              }, 100);
            }
          },
          // On completed
          async (resumeId: string) => {
            console.log('✅ Parsing completed! Resume ID:', resumeId);
            
            // Remove from pending tasks
            setPendingTasks(prev => {
              const newMap = new Map(prev);
              newMap.delete(taskId);
              return newMap;
            });
            
            // Remove from active subscriptions
            setActiveSubscriptions(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskId);
              return newSet;
            });

            // Refetch resumes to show the new one
            await refetch();
            
            // No success alert - user already got confirmation when upload started
          },
          // On error
          (error: string) => {
            console.error('❌ Parsing error:', error);
            
            // Remove from pending tasks
            setPendingTasks(prev => {
              const newMap = new Map(prev);
              newMap.delete(taskId);
              return newMap;
            });
            
            // Remove from active subscriptions
            setActiveSubscriptions(prev => {
              const newSet = new Set(prev);
              newSet.delete(taskId);
              return newSet;
            });

            showAlert({
              type: 'error',
              title: 'Parsing Failed',
              message: error || 'Failed to parse resume. Please try again.',
              buttons: [{ text: 'OK', style: 'default' }],
            });
          }
        );
      } else if (data.parseResumeAsync.__typename === 'ErrorType') {
        showAlert({
          type: 'error',
          title: 'Upload Failed',
          message: data.parseResumeAsync.message || 'Failed to start resume parsing.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to upload resume:', error);
      showAlert({
        type: 'error',
        title: 'Upload Failed',
        message: error?.data?.parseResumeAsync?.message || error?.message || 'Failed to upload resume. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Handle download resume
  const handleDownloadResume = async (resume: Resume) => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    const downloadUrl = `${API_URL}/api/resume/build/${resume.id}/download/`;

    try {
      console.log('📥 Downloading PDF from:', downloadUrl);

      const canOpen = await Linking.canOpenURL(downloadUrl);

      if (canOpen) {
        await Linking.openURL(downloadUrl);
        console.log('✅ PDF download initiated');
      } else {
        showAlert({
          type: 'confirm',
          title: 'Download Resume',
          message: `Would you like to download "${resume.fullName}" resume?`,
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Download',
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
  };

  return (
    <View className="flex-1">
      {/* Upload Button at Top */}
      <TouchableOpacity
        className="bg-primary-blue rounded-xl py-3 items-center flex-row justify-center mb-4"
        activeOpacity={0.8}
        onPress={handlePickDocument}
        disabled={isUploading}
        style={{ backgroundColor: '#437EF4' }}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <View className="mr-2">
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 15.01L9.41 16.42L11 14.84V19H13V14.84L14.59 16.43L16 15.01L12.01 11L8 15.01Z"
                  fill="#FFFFFF"
                />
              </Svg>
            </View>
            <Text className="text-white text-sm font-semibold">
              {isUploading ? 'Uploading...' : 'Upload Resume (PDF/DOCX)'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* My Resumes Section */}
      <View className="mb-3">
        <Text className="text-gray-900 text-base font-semibold mb-1">My Resumes</Text>
        <Text className="text-gray-500 text-xs">
          {resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} uploaded
          {pendingTasks.size > 0 && ` • ${pendingTasks.size} processing`}
        </Text>
      </View>
      
      {/* Pending Tasks */}
      {pendingTasks.size > 0 && (
        <View className="mb-3">
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
            <Text className="text-yellow-800 text-xs">
              ℹ️ Resumes are being processed on the server. Refresh to see updates.
            </Text>
          </View>
          {Array.from(pendingTasks.entries()).map(([taskId, task]) => (
            <PendingTaskCard
              key={taskId}
              taskId={taskId}
              fileName={task.fileName}
              progress={task.progress}
              stage={task.stage}
              stageLabel={task.stageLabel}
              status={task.status}
            />
          ))}
        </View>
      )}

      {/* Loading state */}
      {isLoadingResumes && resumes.length === 0 && (
        <View className="bg-white rounded-xl p-6 items-center justify-center border border-gray-100">
          <ActivityIndicator size="small" color="#437EF4" />
          <Text className="text-gray-400 text-xs mt-2">Loading resumes...</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View className="bg-red-50 rounded-xl p-4 mb-3 border border-red-200">
          <Text className="text-red-600 text-sm font-medium mb-2">Failed to load resumes</Text>
          <TouchableOpacity
            className="bg-red-500 rounded-lg py-2 items-center"
            onPress={() => refetch()}
          >
            <Text className="text-white text-xs font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!isLoadingResumes && resumes.length === 0 && pendingTasks.size === 0 && !error && (
        <View className="bg-gray-50 rounded-xl p-6 items-center border border-gray-100">
          <View className="bg-blue-100 rounded-full p-3 mb-3">
            <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
            </Svg>
          </View>
          <Text className="text-gray-700 text-sm font-semibold mb-1">No resumes yet</Text>
          <Text className="text-gray-500 text-xs text-center">
            Upload your first resume to get started
          </Text>
        </View>
      )}

      {/* Resume list - only show completed resumes */}
      {resumes.filter(r => r.status === 'completed').map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          onDownload={() => handleDownloadResume(resume)}
        />
      ))}
    </View>
  );
};
