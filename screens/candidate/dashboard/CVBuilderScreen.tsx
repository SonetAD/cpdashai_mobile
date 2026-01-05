import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import CandidateLayout from '../../../components/layouts/CandidateLayout';
import CandidateNavBar from '../../../components/CandidateNavBar';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';
import {
  useCreateResumeMutation,
  useUpdateResumeMutation,
  useGetResumeByIdQuery,
  useGenerateProfessionalSummaryMutation,
  useImproveContentMutation,
  useExportResumePdfMutation,
  CreateResumeInput,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeSkill,
} from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

interface CVBuilderScreenProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack?: () => void;
  resumeId?: string; // For edit mode
}

interface DatePickerState {
  show: boolean;
  mode: 'start' | 'end';
  field: 'experience' | 'education';
  index: number;
  currentDate: Date;
}

export default function CVBuilderScreen({
  activeTab = 'jobs',
  onTabChange,
  onBack,
  resumeId,
}: CVBuilderScreenProps) {
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [professionalSummary, setProfessionalSummary] = useState('');

  // Optional sections toggles
  const [hasExperience, setHasExperience] = useState(true);
  const [hasEducation, setHasEducation] = useState(true);

  // Experience
  const [experience, setExperience] = useState<ResumeExperience[]>([{
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    responsibilities: [''],
  }]);

  // Education
  const [education, setEducation] = useState<ResumeEducation[]>([{
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: '',
  }]);

  // Date picker state
  const [datePicker, setDatePicker] = useState<DatePickerState>({
    show: false,
    mode: 'start',
    field: 'experience',
    index: 0,
    currentDate: new Date(),
  });

  // Skills (simplified)
  const [skills, setSkills] = useState<ResumeSkill[]>([{
    category: 'Technical',
    items: [''],
  }]);

  // API hooks
  const [createResume, { isLoading: isCreating }] = useCreateResumeMutation();
  const [updateResume, { isLoading: isUpdating }] = useUpdateResumeMutation();
  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateProfessionalSummaryMutation();
  const [improveContent, { isLoading: isImproving }] = useImproveContentMutation();
  const [exportPdf] = useExportResumePdfMutation();
  const { showAlert } = useAlert();

  // Fetch existing resume if editing
  const { data: resumeData } = useGetResumeByIdQuery(resumeId || '', {
    skip: !resumeId,
  });

  // Load resume data for editing
  useEffect(() => {
    if (resumeData?.resumeById) {
      const resume = resumeData.resumeById;
      setFullName(resume.fullName || '');
      setEmail(resume.email || '');
      setPhone(resume.phone || '');
      setLocation(resume.location || '');
      setLinkedinUrl(resume.linkedinUrl || '');
      setGithubUrl(resume.githubUrl || '');
      setPortfolioUrl(resume.portfolioUrl || '');
      setProfessionalSummary(resume.professionalSummary || '');
      if (resume.experience && resume.experience.length > 0) {
        setExperience(resume.experience);
      }
      if (resume.education && resume.education.length > 0) {
        setEducation(resume.education);
      }
      if (resume.skills && resume.skills.length > 0) {
        setSkills(resume.skills);
      }
    }
  }, [resumeData]);

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!fullName.trim()) {
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Full name is required',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }
    if (!email.trim()) {
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    const resumeInput: CreateResumeInput = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      professionalSummary: professionalSummary.trim() || undefined,
      experience: hasExperience ? experience.filter(exp => exp.title && exp.company) : [],
      education: hasEducation ? education.filter(edu => edu.degree && edu.institution) : [],
      skills: skills.filter(skill => skill.items.some(item => item.trim())),
    };

    try {
      if (resumeId) {
        // Update existing resume
        const data = await updateResume({
          resumeId,
          ...resumeInput,
        }).unwrap();

        if (data.updateResume.__typename === 'ResumeBuilderSuccessType') {
          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Resume updated successfully!',
            buttons: [{ text: 'OK', style: 'default', onPress: onBack }],
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: data.updateResume.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      } else {
        // Create new resume
        const data = await createResume(resumeInput).unwrap();

        if (data.createResume.__typename === 'ResumeBuilderSuccessType') {
          const resume = data.createResume.resume;
          console.log('✅ Resume created successfully:', {
            id: resume.id,
            fullName: resume.fullName,
            email: resume.email,
            atsScore: resume.atsScore,
          });

          // Automatically trigger PDF generation
          try {
            console.log('🔄 Automatically triggering PDF generation for resume:', resume.id);
            const pdfData = await exportPdf(resume.id).unwrap();

            if (pdfData.exportResumePdf.__typename === 'SuccessType') {
              console.log('✅ PDF generation started successfully');
              showAlert({
                type: 'success',
                title: 'Success',
                message: `Resume created successfully!\n\nATS Score: ${resume.atsScore}%\n\nYour PDF is being generated and will be ready in a few seconds.`,
                buttons: [{
                  text: 'OK',
                  style: 'default',
                  onPress: () => {
                    // Delay to allow backend to commit transaction before navigating back
                    setTimeout(() => {
                      if (onBack) onBack();
                    }, 1000);
                  }
                }],
              });
            } else {
              // PDF generation failed, but resume was created
              showAlert({
                type: 'warning',
                title: 'Partial Success',
                message: `Resume created with ATS Score: ${resume.atsScore}%\n\nPDF generation will be available from the CV Manager.`,
                buttons: [{
                  text: 'OK',
                  style: 'default',
                  onPress: () => {
                    setTimeout(() => {
                      if (onBack) onBack();
                    }, 1000);
                  }
                }],
              });
            }
          } catch (pdfError) {
            // PDF generation failed, but resume was created
            console.error('PDF generation failed:', pdfError);
            showAlert({
              type: 'success',
              title: 'Resume Created',
              message: `Resume created with ATS Score: ${resume.atsScore}%\n\nYou can generate the PDF from the CV Manager.`,
              buttons: [{
                text: 'OK',
                style: 'default',
                onPress: () => {
                  setTimeout(() => {
                    if (onBack) onBack();
                  }, 1000);
                }
              }],
            });
          }
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: data.createResume.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to save resume',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Handle generate summary
  const handleGenerateSummary = async () => {
    if (!resumeId) {
      showAlert({
        type: 'info',
        title: 'Info',
        message: 'Please save the resume first before generating summary',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      const data = await generateSummary({
        resumeId,
        experienceYears: experience.length,
      }).unwrap();

      if (data.generateProfessionalSummary.__typename === 'ResumeBuilderSuccessType') {
        const summary = data.generateProfessionalSummary.resume.professionalSummary;
        setProfessionalSummary(summary || '');
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Professional summary generated!',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: data.generateProfessionalSummary.message,
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error('Generate summary failed:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate summary',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Handle improve content
  const handleImproveContent = async (content: string, contentType: string) => {
    if (!resumeId) {
      showAlert({
        type: 'info',
        title: 'Info',
        message: 'Please save the resume first before improving content',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    if (!content.trim()) {
      showAlert({
        type: 'info',
        title: 'Info',
        message: 'Please enter some content to improve',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    try {
      const data = await improveContent({
        resumeId,
        contentType,
        content,
      }).unwrap();

      if ('improved_content' in data.improveContent) {
        showAlert({
          type: 'success',
          title: 'Improved Content',
          message: data.improveContent.improved_content,
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use This',
              style: 'default',
              onPress: () => {
                if (contentType === 'summary') {
                  setProfessionalSummary(data.improveContent.improved_content);
                }
              },
            },
          ],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to improve content',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error) {
      console.error('Improve content failed:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to improve content',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Update experience field
  const updateExperienceField = (index: number, field: keyof ResumeExperience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  // Add/remove experience
  const addExperience = () => {
    setExperience([...experience, {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      responsibilities: [''],
    }]);
  };

  const removeExperience = (index: number) => {
    if (experience.length > 1) {
      setExperience(experience.filter((_, i) => i !== index));
    }
  };

  // Update education field
  const updateEducationField = (index: number, field: keyof ResumeEducation, value: any) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  // Add/remove education
  const addEducation = () => {
    setEducation([...education, {
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
    }]);
  };

  const removeEducation = (index: number) => {
    if (education.length > 1) {
      setEducation(education.filter((_, i) => i !== index));
    }
  };

  // Date picker functions
  const showDatePickerModal = (field: 'experience' | 'education', index: number, mode: 'start' | 'end', currentValue: string) => {
    // Parse existing date or use current date
    let initialDate = new Date();
    if (currentValue) {
      const [year, month] = currentValue.split('-');
      if (year && month) {
        initialDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      }
    }

    setDatePicker({
      show: true,
      mode,
      field,
      index,
      currentDate: initialDate,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setDatePicker(prev => ({ ...prev, show: false }));
    }

    if (selectedDate && event.type !== 'dismissed') {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

      if (datePicker.field === 'experience') {
        const updated = [...experience];
        if (datePicker.mode === 'start') {
          updated[datePicker.index].startDate = formattedDate;
        } else {
          updated[datePicker.index].endDate = formattedDate;
        }
        setExperience(updated);
      } else if (datePicker.field === 'education') {
        const updated = [...education];
        if (datePicker.mode === 'start') {
          updated[datePicker.index].startDate = formattedDate;
        } else {
          updated[datePicker.index].endDate = formattedDate;
        }
        setEducation(updated);
      }

      if (Platform.OS === 'ios') {
        setDatePicker(prev => ({ ...prev, currentDate: selectedDate }));
      }
    }
  };

  const closeDatePicker = () => {
    setDatePicker(prev => ({ ...prev, show: false }));
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const [year, month] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const isLoading = isCreating || isUpdating;

  return (
    <CandidateLayout
      showBackButton={true}
      onBack={onBack}
      headerTitle={resumeId ? 'Edit Resume' : 'Create Resume'}
      headerSubtitle={resumeId ? 'Update your resume' : 'Build your professional resume'}
    >
      {/* Content */}
      <KeyboardDismissWrapper>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          onScrollBeginDrag={() => Haptics.selectionAsync()}
        >
        {/* Personal Information */}
        <View className="mt-6 mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-4">Personal Information</Text>

          <Text className="text-gray-700 text-sm font-medium mb-2">Full Name *</Text>
          <TextInput
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">Email *</Text>
          <TextInput
            placeholder="john.doe@example.com"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">Phone</Text>
          <TextInput
            placeholder="+1-555-0123"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">Location</Text>
          <TextInput
            placeholder="New York, USA"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={location}
            onChangeText={setLocation}
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">LinkedIn URL</Text>
          <TextInput
            placeholder="https://linkedin.com/in/johndoe"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            autoCapitalize="none"
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">GitHub URL</Text>
          <TextInput
            placeholder="https://github.com/johndoe"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={githubUrl}
            onChangeText={setGithubUrl}
            autoCapitalize="none"
          />

          <Text className="text-gray-700 text-sm font-medium mb-2">Portfolio URL</Text>
          <TextInput
            placeholder="https://johndoe.com"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm mb-4 border border-gray-200"
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            autoCapitalize="none"
          />
        </View>

        {/* Professional Summary */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-bold">Professional Summary</Text>
            {resumeId && (
              <TouchableOpacity
                className="bg-primary-blue rounded-lg px-3 py-1"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleGenerateSummary();
                }}
                disabled={isGeneratingSummary}
              >
                {isGeneratingSummary ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-semibold">AI Generate</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            placeholder="Write a compelling professional summary highlighting your key skills and achievements..."
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-xl px-4 py-3 text-gray-900 text-sm border border-gray-200"
            multiline
            numberOfLines={5}
            value={professionalSummary}
            onChangeText={setProfessionalSummary}
            style={{ minHeight: 120 }}
          />

          {resumeId && professionalSummary && (
            <TouchableOpacity
              className="bg-blue-50 rounded-lg px-3 py-2 mt-2"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleImproveContent(professionalSummary, 'summary');
              }}
              disabled={isImproving}
            >
              <Text className="text-primary-blue text-xs font-medium text-center">
                {isImproving ? 'Improving...' : 'Improve with AI'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Work Experience */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-gray-900 text-lg font-bold mr-3">Work Experience</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHasExperience(!hasExperience);
                }}
              >
                <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${hasExperience ? 'bg-primary-blue border-primary-blue' : 'border-gray-300'}`}>
                  {hasExperience && (
                    <Text className="text-white text-xs">✓</Text>
                  )}
                </View>
                <Text className="text-gray-600 text-xs">{hasExperience ? 'I have experience' : 'No experience yet'}</Text>
              </TouchableOpacity>
            </View>
            {hasExperience && (
              <TouchableOpacity
                className="bg-primary-blue rounded-lg px-3 py-1"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addExperience();
                }}
              >
                <Text className="text-white text-xs font-semibold">+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {!hasExperience && (
            <View className="bg-gray-100 rounded-xl p-4 mb-3">
              <Text className="text-gray-500 text-sm text-center">
                No problem! You can skip this section and fill it in later.
              </Text>
            </View>
          )}

          {hasExperience && experience.map((exp, index) => (
            <View key={index} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 text-sm font-bold">Experience #{index + 1}</Text>
                {experience.length > 1 && (
                  <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeExperience(index);
                  }}>
                    <Text className="text-red-500 text-xs font-medium">Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                placeholder="Job Title"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={exp.title}
                onChangeText={(value) => updateExperienceField(index, 'title', value)}
              />

              <TextInput
                placeholder="Company"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={exp.company}
                onChangeText={(value) => updateExperienceField(index, 'company', value)}
              />

              <TextInput
                placeholder="Location"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={exp.location}
                onChangeText={(value) => updateExperienceField(index, 'location', value)}
              />

              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  className="bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-200"
                  onPress={() => {
                    Haptics.selectionAsync();
                    showDatePickerModal('experience', index, 'start', exp.startDate);
                  }}
                >
                  <Text className={`text-sm ${exp.startDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formatDateDisplay(exp.startDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-200 ${exp.current ? 'opacity-50' : ''}`}
                  onPress={() => {
                    if (!exp.current) {
                      Haptics.selectionAsync();
                      showDatePickerModal('experience', index, 'end', exp.endDate);
                    }
                  }}
                  disabled={exp.current}
                >
                  <Text className={`text-sm ${exp.endDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {exp.current ? 'Present' : formatDateDisplay(exp.endDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="flex-row items-center mb-2"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateExperienceField(index, 'current', !exp.current);
                }}
              >
                <View className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${exp.current ? 'bg-primary-blue border-primary-blue' : 'border-gray-300'}`}>
                  {exp.current && (
                    <Text className="text-white text-xs">✓</Text>
                  )}
                </View>
                <Text className="text-gray-700 text-sm">Currently working here</Text>
              </TouchableOpacity>

              <TextInput
                placeholder="Key responsibilities (one per line)"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm"
                multiline
                numberOfLines={3}
                value={exp.responsibilities.join('\n')}
                onChangeText={(value) => updateExperienceField(index, 'responsibilities', value.split('\n'))}
                style={{ minHeight: 80 }}
              />
            </View>
          ))}
        </View>

        {/* Education */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-gray-900 text-lg font-bold mr-3">Education</Text>
            </View>
            {hasEducation && (
              <TouchableOpacity
                className="bg-primary-blue rounded-lg px-3 py-1"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addEducation();
                }}
              >
                <Text className="text-white text-xs font-semibold">+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {!hasEducation && (
            <View className="bg-gray-100 rounded-xl p-4 mb-3">
              <Text className="text-gray-500 text-sm text-center">
                That's okay! You can skip this section.
              </Text>
            </View>
          )}

          {hasEducation && education.map((edu, index) => (
            <View key={index} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 text-sm font-bold">Education #{index + 1}</Text>
                {education.length > 1 && (
                  <TouchableOpacity onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    removeEducation(index);
                  }}>
                    <Text className="text-red-500 text-xs font-medium">Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                placeholder="Degree"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={edu.degree}
                onChangeText={(value) => updateEducationField(index, 'degree', value)}
              />

              <TextInput
                placeholder="Institution"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={edu.institution}
                onChangeText={(value) => updateEducationField(index, 'institution', value)}
              />

              <TextInput
                placeholder="Location"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={edu.location}
                onChangeText={(value) => updateEducationField(index, 'location', value)}
              />

              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  className="bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-200"
                  onPress={() => {
                    Haptics.selectionAsync();
                    showDatePickerModal('education', index, 'start', edu.startDate);
                  }}
                >
                  <Text className={`text-sm ${edu.startDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formatDateDisplay(edu.startDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-50 rounded-lg px-3 py-2 flex-1 border border-gray-200"
                  onPress={() => {
                    Haptics.selectionAsync();
                    showDatePickerModal('education', index, 'end', edu.endDate);
                  }}
                >
                  <Text className={`text-sm ${edu.endDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formatDateDisplay(edu.endDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="GPA (optional)"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm mb-2"
                value={edu.gpa}
                onChangeText={(value) => updateEducationField(index, 'gpa', value)}
              />

              <TextInput
                placeholder="Description (optional)"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-lg px-3 py-2 text-gray-900 text-sm"
                multiline
                numberOfLines={2}
                value={edu.description}
                onChangeText={(value) => updateEducationField(index, 'description', value)}
                style={{ minHeight: 60 }}
              />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-8">
          <TouchableOpacity
            className="bg-gray-200 rounded-xl py-4 flex-1 items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBack?.();
            }}
            disabled={isLoading}
          >
            <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary-blue rounded-xl py-4 flex-1 items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSave();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-sm font-semibold">
                {resumeId ? 'Update Resume' : 'Create Resume'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardDismissWrapper>

      {/* Date Picker Modal */}
      {datePicker.show && (
        <>
          {Platform.OS === 'ios' && (
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-8">
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  closeDatePicker();
                }}>
                  <Text className="text-primary-blue text-base font-medium">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-gray-900 text-base font-semibold">
                  Select {datePicker.mode === 'start' ? 'Start' : 'End'} Date
                </Text>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  closeDatePicker();
                }}>
                  <Text className="text-primary-blue text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={datePicker.currentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={datePicker.currentDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </>
      )}

      {/* Bottom Nav Bar */}
      <CandidateNavBar activeTab={activeTab} onTabPress={onTabChange} />
    </CandidateLayout>
  );
}
