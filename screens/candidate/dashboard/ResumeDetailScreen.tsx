import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import {
  useGetResumeByIdQuery,
  useDeleteResumeMutation,
  useExportResumePdfMutation,
} from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

interface ResumeDetailScreenProps {
  resumeId: string;
  onBack: () => void;
  onEdit: (resumeId: string) => void;
}

export default function ResumeDetailScreen({ resumeId, onBack, onEdit }: ResumeDetailScreenProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showAlert } = useAlert();

  // Fetch resume details
  const { data: resumeData, isLoading, error, refetch } = useGetResumeByIdQuery(resumeId);
  const [deleteResume] = useDeleteResumeMutation();
  const [exportPdf] = useExportResumePdfMutation();

  const resume = resumeData?.resumeById;

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Format full date
  const formatFullDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Handle Delete
  const handleDelete = () => {
    showAlert({
      type: 'confirm',
      title: 'Delete Resume',
      message: `Are you sure you want to delete "${resume?.fullName}"? This action cannot be undone.`,
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
                  title: 'Success',
                  message: 'Resume deleted successfully',
                  buttons: [{ text: 'OK', style: 'default', onPress: onBack }],
                });
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

  // Handle Download
  const handleDownload = async () => {
    if (resume?.status === 'completed' && resume?.generatedResumeUrl) {
      // PDF exists, open it
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
      const pdfUrl = `${API_URL}${resume.generatedResumeUrl}`;

      try {
        const canOpen = await Linking.canOpenURL(pdfUrl);
        if (canOpen) {
          await Linking.openURL(pdfUrl);
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: 'Cannot open PDF URL',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      } catch (error) {
        console.error('Failed to open PDF:', error);
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to open PDF',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } else {
      // Generate new PDF
      showAlert({
        type: 'confirm',
        title: 'Generate PDF',
        message: 'Do you want to generate a PDF for this resume?',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            style: 'default',
            onPress: async () => {
              setIsDownloading(true);
              try {
                const data = await exportPdf(resumeId).unwrap();

                if (data.exportResumePdf.__typename === 'SuccessType') {
                  showAlert({
                    type: 'success',
                    title: 'PDF Generation Started',
                    message: 'Your PDF is being generated. This may take 10-15 seconds. Please check back shortly.',
                    buttons: [{ text: 'OK', style: 'default' }],
                  });

                  // Poll for status update
                  setTimeout(() => refetch(), 5000);
                  setTimeout(() => refetch(), 10000);
                  setTimeout(() => refetch(), 15000);
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
                  message: 'Failed to generate PDF',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } finally {
                setIsDownloading(false);
              }
            },
          },
        ],
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LinearGradient
          colors={['#437EF4', '#437EF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#FFFFFF"/>
              </Svg>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Resume Details</Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#437EF4" />
          <Text className="text-gray-500 text-sm mt-3">Loading resume...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !resume) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <LinearGradient
          colors={['#437EF4', '#437EF4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-6 py-4"
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#FFFFFF"/>
              </Svg>
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold">Resume Details</Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <Svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444"/>
          </Svg>
          <Text className="text-gray-900 text-lg font-bold mt-4">Failed to load resume</Text>
          <Text className="text-gray-500 text-sm text-center mt-2 mb-6">
            Could not load resume details. Please try again.
          </Text>
          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-3 px-8"
            style={{ backgroundColor: '#437EF4' }}
            onPress={() => refetch()}
          >
            <Text className="text-white text-sm font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="#FFFFFF"/>
              </Svg>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Resume Details</Text>
              <Text className="text-white/90 text-xs mt-0.5">Complete resume information</Text>
            </View>
          </View>

          {/* ATS Score Badge */}
          <View className="bg-white/20 rounded-full px-3 py-1.5">
            <Text className="text-white text-xs font-semibold">{resume.atsScore}% ATS</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View className="flex-row bg-white px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-blue-50 rounded-lg py-2.5 mx-1"
          onPress={() => onEdit(resumeId)}
        >
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#437EF4"/>
          </Svg>
          <Text className="text-blue-600 text-sm font-semibold ml-2">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-green-50 rounded-lg py-2.5 mx-1"
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="#10B981"/>
              </Svg>
              <Text className="text-green-600 text-sm font-semibold ml-2">
                {resume.status === 'completed' ? 'Download' : 'Generate'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-red-50 rounded-lg py-2.5 mx-1"
          onPress={handleDelete}
        >
          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#EF4444"/>
          </Svg>
          <Text className="text-red-600 text-sm font-semibold ml-2">Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Resume Content */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header Section */}
        <View className="bg-white rounded-2xl p-6 mt-4 mb-4 shadow-sm border border-gray-100">
          <Text className="text-gray-900 text-2xl font-bold mb-2">{resume.fullName}</Text>

          <View className="flex-row items-center mb-1.5">
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#6B7280"/>
            </Svg>
            <Text className="text-gray-600 text-sm ml-2">{resume.email}</Text>
          </View>

          {resume.phone && (
            <View className="flex-row items-center mb-1.5">
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#6B7280"/>
              </Svg>
              <Text className="text-gray-600 text-sm ml-2">{resume.phone}</Text>
            </View>
          )}

          {resume.location && (
            <View className="flex-row items-center mb-1.5">
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#6B7280"/>
              </Svg>
              <Text className="text-gray-600 text-sm ml-2">{resume.location}</Text>
            </View>
          )}

          {/* Links */}
          {(resume.linkedinUrl || resume.githubUrl || resume.portfolioUrl) && (
            <View className="flex-row flex-wrap mt-3 pt-3 border-t border-gray-100">
              {resume.linkedinUrl && (
                <TouchableOpacity
                  className="bg-blue-50 rounded-lg px-3 py-1.5 mr-2 mb-2"
                  onPress={() => Linking.openURL(resume.linkedinUrl!)}
                >
                  <Text className="text-blue-600 text-xs font-medium">LinkedIn</Text>
                </TouchableOpacity>
              )}
              {resume.githubUrl && (
                <TouchableOpacity
                  className="bg-gray-800 rounded-lg px-3 py-1.5 mr-2 mb-2"
                  onPress={() => Linking.openURL(resume.githubUrl!)}
                >
                  <Text className="text-white text-xs font-medium">GitHub</Text>
                </TouchableOpacity>
              )}
              {resume.portfolioUrl && (
                <TouchableOpacity
                  className="bg-purple-50 rounded-lg px-3 py-1.5 mr-2 mb-2"
                  onPress={() => Linking.openURL(resume.portfolioUrl!)}
                >
                  <Text className="text-purple-600 text-xs font-medium">Portfolio</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Professional Summary */}
        {resume.professionalSummary && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-3">Professional Summary</Text>
            <Text className="text-gray-700 text-sm leading-6">{resume.professionalSummary}</Text>
          </View>
        )}

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Work Experience</Text>
            {resume.experience.map((exp, index) => (
              <View key={index} className={`${index > 0 ? 'pt-4 mt-4 border-t border-gray-100' : ''}`}>
                <Text className="text-gray-900 text-base font-semibold mb-1">{exp.title}</Text>
                <Text className="text-gray-700 text-sm font-medium mb-1">{exp.company}</Text>
                <View className="flex-row items-center mb-2">
                  {exp.location && (
                    <Text className="text-gray-500 text-xs mr-3">{exp.location}</Text>
                  )}
                  <Text className="text-gray-500 text-xs">
                    {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </Text>
                </View>
                {exp.responsibilities && exp.responsibilities.length > 0 && (
                  <View className="mt-2">
                    {exp.responsibilities.map((resp, idx) => (
                      <Text key={idx} className="text-gray-600 text-sm mb-1.5 pl-2">
                        • {resp}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Education</Text>
            {resume.education.map((edu, index) => (
              <View key={index} className={`${index > 0 ? 'pt-4 mt-4 border-t border-gray-100' : ''}`}>
                <Text className="text-gray-900 text-base font-semibold mb-1">{edu.degree}</Text>
                <Text className="text-gray-700 text-sm font-medium mb-1">{edu.institution}</Text>
                <View className="flex-row items-center mb-2">
                  {edu.location && (
                    <Text className="text-gray-500 text-xs mr-3">{edu.location}</Text>
                  )}
                  <Text className="text-gray-500 text-xs">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                </View>
                {edu.gpa && (
                  <Text className="text-gray-600 text-sm mb-1">GPA: {edu.gpa}</Text>
                )}
                {edu.description && (
                  <Text className="text-gray-600 text-sm mt-2">{edu.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Skills</Text>
            {resume.skills.map((skillCategory, index) => (
              <View key={index} className="mb-3">
                <Text className="text-gray-900 text-sm font-semibold mb-2">{skillCategory.category}</Text>
                <View className="flex-row flex-wrap">
                  {skillCategory.items.map((skill, idx) => (
                    <View key={idx} className="bg-blue-50 rounded-lg px-3 py-1.5 mr-2 mb-2">
                      <Text className="text-blue-700 text-xs font-medium">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Projects</Text>
            {resume.projects.map((project, index) => (
              <View key={index} className={`${index > 0 ? 'pt-4 mt-4 border-t border-gray-100' : ''}`}>
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="text-gray-900 text-base font-semibold flex-1">{project.name}</Text>
                  {project.url && (
                    <TouchableOpacity onPress={() => Linking.openURL(project.url!)}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <Path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="#437EF4"/>
                      </Svg>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-gray-600 text-sm mb-2">{project.description}</Text>
                {project.technologies && project.technologies.length > 0 && (
                  <View className="flex-row flex-wrap mb-2">
                    {project.technologies.map((tech, idx) => (
                      <View key={idx} className="bg-purple-50 rounded px-2 py-1 mr-2 mb-1">
                        <Text className="text-purple-700 text-xs">{tech}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {project.highlights && project.highlights.length > 0 && (
                  <View className="mt-2">
                    {project.highlights.map((highlight, idx) => (
                      <Text key={idx} className="text-gray-600 text-sm mb-1 pl-2">
                        • {highlight}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certificates */}
        {resume.certificates && resume.certificates.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Certificates</Text>
            {resume.certificates.map((cert, index) => (
              <View key={index} className={`${index > 0 ? 'pt-3 mt-3 border-t border-gray-100' : ''}`}>
                <Text className="text-gray-900 text-base font-semibold mb-1">{cert.name}</Text>
                <Text className="text-gray-700 text-sm mb-1">{cert.issuer}</Text>
                <Text className="text-gray-500 text-xs mb-1">{formatFullDate(cert.date)}</Text>
                {cert.credentialId && (
                  <Text className="text-gray-500 text-xs">ID: {cert.credentialId}</Text>
                )}
                {cert.url && (
                  <TouchableOpacity
                    className="mt-2"
                    onPress={() => Linking.openURL(cert.url!)}
                  >
                    <Text className="text-blue-600 text-xs font-medium">View Credential →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {resume.achievements && resume.achievements.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-4">Achievements</Text>
            {resume.achievements.map((achievement, index) => (
              <View key={index} className={`${index > 0 ? 'pt-3 mt-3 border-t border-gray-100' : ''}`}>
                <Text className="text-gray-900 text-base font-semibold mb-1">{achievement.title}</Text>
                <Text className="text-gray-600 text-sm mb-1">{achievement.description}</Text>
                <Text className="text-gray-500 text-xs">{formatFullDate(achievement.date)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Hobbies */}
        {resume.hobbiesList && resume.hobbiesList.length > 0 && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-900 text-lg font-bold mb-3">Hobbies & Interests</Text>
            <View className="flex-row flex-wrap">
              {resume.hobbiesList.map((hobby, index) => (
                <View key={index} className="bg-yellow-50 rounded-lg px-3 py-1.5 mr-2 mb-2">
                  <Text className="text-yellow-800 text-xs font-medium">{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Metadata */}
        <View className="bg-gray-100 rounded-xl p-4 mb-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-xs">Created</Text>
            <Text className="text-gray-700 text-xs font-medium">{formatFullDate(resume.createdAt)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-xs">Last Updated</Text>
            <Text className="text-gray-700 text-xs font-medium">{formatFullDate(resume.updatedAt)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500 text-xs">Status</Text>
            <View className={`rounded-full px-2 py-0.5 ${
              resume.status === 'completed' ? 'bg-green-100' :
              resume.status === 'processing' ? 'bg-yellow-100' :
              resume.status === 'failed' ? 'bg-red-100' : 'bg-gray-200'
            }`}>
              <Text className={`text-xs font-semibold ${
                resume.status === 'completed' ? 'text-green-700' :
                resume.status === 'processing' ? 'text-yellow-700' :
                resume.status === 'failed' ? 'text-red-700' : 'text-gray-600'
              }`}>
                {resume.status === 'completed' ? 'Ready' :
                 resume.status === 'processing' ? 'Processing' :
                 resume.status === 'failed' ? 'Failed' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
