import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import ResumeCard from '../../components/ResumeCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useGetMyResumesQuery, useDeleteResumeMutation, useExportResumePdfMutation, Resume } from '../../services/api';
import { useAlert } from '../../contexts/AlertContext';

export default function ResumesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  // Fetch resumes
  const { data: resumesData, isLoading, refetch, isFetching } = useGetMyResumesQuery();
  const [deleteResume] = useDeleteResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();

  const resumes = useMemo(() => resumesData?.myResumes || [], [resumesData]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleEditCV = useCallback((resumeId: string) => {
    router.push({
      pathname: '/(candidate)/cv-builder',
      params: { resumeId, source: 'resumes' },
    } as any);
  }, [router]);

  const handleDeleteCV = useCallback(async (resumeId: string, resumeName: string) => {
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
                refetch();
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
  }, [deleteResume, refetch, showAlert]);

  const handleDownloadPDF = useCallback(async (resume: Resume) => {
    if (resume.status === 'pending' || resume.status === 'processing') {
      showAlert({
        type: 'info',
        title: resume.status === 'pending' ? 'PDF Generation Starting' : 'Processing',
        message: 'Your PDF is being generated. Please wait.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (resume.status === 'completed') {
      const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000').replace(/\/$/, '');
      const downloadUrl = `${API_URL}/api/resume/build/${resume.id}/download/`;

      try {
        const { Linking } = await import('react-native');
        await Linking.openURL(downloadUrl);
      } catch (error) {
        showAlert({
          type: 'error',
          title: 'Download Failed',
          message: 'Failed to download PDF.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } else {
      // Generate PDF
      try {
        const data = await exportPdf(resume.id).unwrap();
        if (data.exportResumePdf.__typename === 'SuccessType') {
          showAlert({
            type: 'success',
            title: 'Generating PDF',
            message: 'Your PDF is being generated. This may take 10-15 seconds.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          // Poll for updates
          const pollInterval = setInterval(() => refetch(), 3000);
          setTimeout(() => {
            clearInterval(pollInterval);
            refetch();
          }, 45000);
        }
      } catch (error) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to generate PDF.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    }
  }, [exportPdf, refetch, showAlert]);

  const handleViewDetails = useCallback((resumeId: string) => {
    router.push({
      pathname: '/(candidate)/resume-detail',
      params: { resumeId },
    } as any);
  }, [router]);

  const handleCreateCV = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(candidate)/cv-builder?source=resumes' as any);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Resume }) => (
    <ResumeCard
      resume={{
        id: item.id,
        fullName: item.fullName,
        email: item.email,
        title: item.fullName,
        atsScore: item.atsScore,
        status: item.status as any,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
      }}
      onEdit={() => handleEditCV(item.id)}
      onDelete={() => handleDeleteCV(item.id, item.fullName)}
      onDownload={() => handleDownloadPDF(item)}
      onPress={() => handleViewDetails(item.id)}
    />
  ), [handleEditCV, handleDeleteCV, handleDownloadPDF, handleViewDetails]);

  const keyExtractor = useCallback((item: Resume) => item.id, []);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#437EF4"/>
        </Svg>
      </View>
      <Text style={styles.emptyTitle}>No Resumes Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first professional resume to get started!
      </Text>
      <GlassButton
        text="Create Resume"
        width={200}
        height={50}
        borderRadius={25}
        colors={['#437EF4', '#5B8FF9']}
        shadowColor="rgba(67, 126, 244, 0.4)"
        onPress={handleCreateCV}
        style={styles.emptyButton}
      />
    </View>
  ), [handleCreateCV]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.headerInfo}>
      <Text style={styles.resumeCount}>
        {resumes.length} {resumes.length === 1 ? 'Resume' : 'Resumes'}
      </Text>
    </View>
  ), [resumes.length]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={['#4F7DF3', '#5B7FF2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.backButtonCircle}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke="#437EF4"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Resumes</Text>
            <Text style={styles.headerSubtitle}>View and manage all your resumes</Text>
          </View>
          <TouchableOpacity onPress={handleCreateCV} style={styles.addButton} activeOpacity={0.7}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="#FFFFFF"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Resume List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#437EF4" />
          <Text style={styles.loadingText}>Loading resumes...</Text>
        </View>
      ) : (
        <FlatList
          data={resumes}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            resumes.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={resumes.length > 0 ? ListHeaderComponent : null}
          onRefresh={refetch}
          refreshing={isFetching}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120, // Extra padding for bottom navbar
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  headerInfo: {
    marginBottom: 16,
  },
  resumeCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
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
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    alignSelf: 'center',
  },
});
