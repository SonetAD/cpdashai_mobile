import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, StatusBar, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GlassDatePicker } from '../../../components/ui/GlassDatePicker';
import { z } from 'zod';
import KeyboardDismissWrapper from '../../../components/KeyboardDismissWrapper';
import FeatureGate, { LockedBadge } from '../../../components/FeatureGate';
import LogoWhite from '../../../assets/images/logoWhite.svg';
import ArrowLeft from '../../../assets/images/arrowLeft.svg';
import { styles } from '../../../styles/CVBuilderStyles';

// Validation schemas
const urlSchema = z.string().url().optional().or(z.literal(''));

const experienceSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  responsibilities: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
});

const resumeFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: urlSchema,
  githubUrl: urlSchema,
  portfolioUrl: urlSchema,
  professionalSummary: z.string().optional(),
  experience: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
});
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
  ResumeSkill,
} from '../../../services/api';
import { useAlert } from '../../../contexts/AlertContext';

// Calendar icon for date pickers
const CalendarIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M12.667 2.667H3.333C2.597 2.667 2 3.264 2 4v9.333c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V4c0-.736-.597-1.333-1.333-1.333zM10.667 1.333v2.667M5.333 1.333v2.667M2 6.667h12"
      stroke="#94A3B8"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Sparkle icon for AI buttons
const SparkleIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Path
      d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.5 1.5M8 8l1.5 1.5M9.5 2.5L8 4M4 8l-1.5 1.5"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

interface CVBuilderScreenProps {
  onBack?: () => void;
  onComplete?: () => void; // Called after successful save
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
  onBack,
  onComplete,
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

  // Input refs for proper tab navigation
  const fullNameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);
  const locationRef = useRef<RNTextInput>(null);
  const linkedinRef = useRef<RNTextInput>(null);
  const githubRef = useRef<RNTextInput>(null);
  const portfolioRef = useRef<RNTextInput>(null);
  const summaryRef = useRef<RNTextInput>(null);

  // Optional sections toggles
  const [hasExperience, setHasExperience] = useState(true);
  const [hasEducation] = useState(true);

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    // Clear previous validation errors
    setValidationErrors({});

    // Build form data for validation
    const formData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || undefined,
      professionalSummary: professionalSummary.trim() || undefined,
      experience: hasExperience ? experience.filter(exp => exp.title || exp.company) : undefined,
      education: hasEducation ? education.filter(edu => edu.degree || edu.institution) : undefined,
    };

    // Validate with Zod
    const validationResult = resumeFormSchema.safeParse(formData);

    if (!validationResult.success) {
      // Extract errors
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      setValidationErrors(errors);

      // Show first error in alert
      const firstError = validationResult.error.errors[0];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: firstError.message,
        buttons: [{ text: 'OK', style: 'default' }],
      });

      // Focus the first invalid field
      if (firstError.path[0] === 'fullName') fullNameRef.current?.focus();
      else if (firstError.path[0] === 'email') emailRef.current?.focus();
      else if (firstError.path[0] === 'phone') phoneRef.current?.focus();
      else if (firstError.path[0] === 'linkedinUrl') linkedinRef.current?.focus();
      else if (firstError.path[0] === 'githubUrl') githubRef.current?.focus();
      else if (firstError.path[0] === 'portfolioUrl') portfolioRef.current?.focus();

      return;
    }

    const resumeInput: CreateResumeInput = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      portfolioUrl: formData.portfolioUrl,
      professionalSummary: formData.professionalSummary,
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
                message: 'Resume created successfully!\n\nYour PDF is being generated and will be ready in a few seconds.',
                buttons: [{
                  text: 'OK',
                  style: 'default',
                  onPress: () => {
                    // Delay to allow backend to commit transaction before navigating
                    setTimeout(() => {
                      if (onComplete) onComplete();
                      else if (onBack) onBack();
                    }, 1000);
                  }
                }],
              });
            } else {
              // PDF generation failed, but resume was created
              showAlert({
                type: 'warning',
                title: 'Partial Success',
                message: 'Resume created successfully!\n\nPDF generation will be available from the CV Manager.',
                buttons: [{
                  text: 'OK',
                  style: 'default',
                  onPress: () => {
                    setTimeout(() => {
                      if (onComplete) onComplete();
                      else if (onBack) onBack();
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
              message: 'Resume created successfully!\n\nYou can generate the PDF from the CV Manager.',
              buttons: [{
                text: 'OK',
                style: 'default',
                onPress: () => {
                  setTimeout(() => {
                    if (onComplete) onComplete();
                    else if (onBack) onBack();
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
        const improvedContent = (data.improveContent as { improved_content: string }).improved_content;
        showAlert({
          type: 'success',
          title: 'Improved Content',
          message: improvedContent,
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use This',
              style: 'default',
              onPress: () => {
                if (contentType === 'summary') {
                  setProfessionalSummary(improvedContent);
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

  const handleDateSelect = (selectedDate: Date) => {
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

    setDatePicker(prev => ({ ...prev, show: false }));
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
            <Text style={styles.headerTitle}>
              {resumeId ? 'Edit Resume' : 'Create Resume'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {resumeId ? 'Update your professional resume' : 'Build your professional resume'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Back Button Row */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.backText}>
            {resumeId ? 'Edit Your CV' : 'Create Your CV'}
          </Text>
        </View>

        <KeyboardDismissWrapper>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onScrollBeginDrag={() => Haptics.selectionAsync()}
          >
            {/* Personal Information Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>

              <View style={styles.innerCard}>
                <View>
                  <Text style={styles.inputLabel}>
                    Full Name <Text style={styles.inputLabelRequired}>*</Text>
                  </Text>
                  <TextInput
                    ref={fullNameRef}
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, validationErrors.fullName && styles.textInputError]}
                    value={fullName}
                    onChangeText={(text) => {
                      setFullName(text);
                      if (validationErrors.fullName) {
                        setValidationErrors(prev => ({ ...prev, fullName: '' }));
                      }
                    }}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      Haptics.selectionAsync();
                      emailRef.current?.focus();
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                  {validationErrors.fullName && (
                    <Text style={styles.errorText}>{validationErrors.fullName}</Text>
                  )}
                </View>

                <View>
                  <Text style={styles.inputLabel}>
                    Email <Text style={styles.inputLabelRequired}>*</Text>
                  </Text>
                  <TextInput
                    ref={emailRef}
                    placeholder="john.doe@example.com"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, validationErrors.email && styles.textInputError]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      Haptics.selectionAsync();
                      phoneRef.current?.focus();
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                  {validationErrors.email && (
                    <Text style={styles.errorText}>{validationErrors.email}</Text>
                  )}
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                      ref={phoneRef}
                      placeholder="+1-555-0123"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={phone}
                      onChangeText={(text) => {
                        // Only allow numbers, +, -, spaces, and parentheses
                        const filtered = text.replace(/[^0-9+\-\s()]/g, '');
                        setPhone(filtered);
                      }}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        Haptics.selectionAsync();
                        locationRef.current?.focus();
                      }}
                      onFocus={() => Haptics.selectionAsync()}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      ref={locationRef}
                      placeholder="New York, USA"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={location}
                      onChangeText={setLocation}
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        Haptics.selectionAsync();
                        linkedinRef.current?.focus();
                      }}
                      onFocus={() => Haptics.selectionAsync()}
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.inputLabel}>LinkedIn URL</Text>
                  <TextInput
                    ref={linkedinRef}
                    placeholder="https://linkedin.com/in/johndoe"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, validationErrors.linkedinUrl && styles.textInputError]}
                    value={linkedinUrl}
                    onChangeText={(text) => {
                      setLinkedinUrl(text);
                      if (validationErrors.linkedinUrl) {
                        setValidationErrors(prev => ({ ...prev, linkedinUrl: '' }));
                      }
                    }}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      Haptics.selectionAsync();
                      githubRef.current?.focus();
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                  {validationErrors.linkedinUrl && (
                    <Text style={styles.errorText}>{validationErrors.linkedinUrl}</Text>
                  )}
                </View>

                <View>
                  <Text style={styles.inputLabel}>GitHub URL</Text>
                  <TextInput
                    ref={githubRef}
                    placeholder="https://github.com/johndoe"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, validationErrors.githubUrl && styles.textInputError]}
                    value={githubUrl}
                    onChangeText={(text) => {
                      setGithubUrl(text);
                      if (validationErrors.githubUrl) {
                        setValidationErrors(prev => ({ ...prev, githubUrl: '' }));
                      }
                    }}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      Haptics.selectionAsync();
                      portfolioRef.current?.focus();
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                  {validationErrors.githubUrl && (
                    <Text style={styles.errorText}>{validationErrors.githubUrl}</Text>
                  )}
                </View>

                <View>
                  <Text style={styles.inputLabel}>Portfolio URL</Text>
                  <TextInput
                    ref={portfolioRef}
                    placeholder="https://johndoe.com"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, validationErrors.portfolioUrl && styles.textInputError]}
                    value={portfolioUrl}
                    onChangeText={(text) => {
                      setPortfolioUrl(text);
                      if (validationErrors.portfolioUrl) {
                        setValidationErrors(prev => ({ ...prev, portfolioUrl: '' }));
                      }
                    }}
                    autoCapitalize="none"
                    keyboardType="url"
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      Haptics.selectionAsync();
                      summaryRef.current?.focus();
                    }}
                    onFocus={() => Haptics.selectionAsync()}
                  />
                  {validationErrors.portfolioUrl && (
                    <Text style={styles.errorText}>{validationErrors.portfolioUrl}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Professional Summary Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Professional Summary</Text>
                  <Text style={styles.sectionSubtitle}>A brief overview of your professional background</Text>
                </View>
                {resumeId && (
                  <FeatureGate featureId="skill_recommendations" featureName="AI Generate" showLockedState={false} fallback={<LockedBadge featureId="skill_recommendations" size="medium" />}>
                    <TouchableOpacity
                      style={styles.aiButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleGenerateSummary();
                      }}
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.aiButtonText}>AI Generate</Text>
                      )}
                    </TouchableOpacity>
                  </FeatureGate>
                )}
              </View>

              <View style={styles.innerCard}>
                <TextInput
                  ref={summaryRef}
                  nativeID="input-summary"
                  placeholder="Write a compelling professional summary highlighting your key skills and achievements..."
                  placeholderTextColor="#94A3B8"
                  style={[styles.textInput, styles.textInputMultiline]}
                  multiline
                  numberOfLines={5}
                  value={professionalSummary}
                  onChangeText={setProfessionalSummary}
                  returnKeyType="default"
                  onFocus={() => Haptics.selectionAsync()}
                />

                {resumeId && professionalSummary && (
                  <FeatureGate featureId="skill_recommendations" featureName="AI Improve" showLockedState={false} fallback={<View style={styles.actionButtonsRow}><LockedBadge featureId="skill_recommendations" size="medium" /></View>}>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          handleImproveContent(professionalSummary, 'summary');
                        }}
                        disabled={isImproving}
                      >
                        <SparkleIcon />
                        <Text style={styles.actionButtonText}>
                          {isImproving ? 'Improving...' : 'Improve Clarity'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </FeatureGate>
                )}
              </View>
            </View>

            {/* Work Experience Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Work Experience</Text>
                  <Text style={styles.sectionSubtitle}>Your professional work history</Text>
                </View>
                {hasExperience && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      addExperience();
                    }}
                  >
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Toggle switch for experience */}
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHasExperience(!hasExperience);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleTitle}>
                    {hasExperience ? 'I have work experience' : 'No work experience yet'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {hasExperience
                      ? 'Add your professional history below'
                      : 'Toggle on if you have previous jobs to add'}
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, hasExperience && styles.toggleSwitchActive]}>
                  <View style={[styles.toggleKnob, hasExperience && styles.toggleKnobActive]} />
                </View>
              </TouchableOpacity>

              {!hasExperience && (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateText}>
                    No problem! You can skip this section and fill it in later.
                  </Text>
                </View>
              )}

              {hasExperience && experience.map((exp, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Experience #{index + 1}</Text>
                    {experience.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          removeExperience(index);
                        }}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Job Title</Text>
                    <TextInput
                      placeholder="Software Engineer"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={exp.title}
                      onChangeText={(value) => updateExperienceField(index, 'title', value)}
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Company</Text>
                    <TextInput
                      placeholder="Company Name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={exp.company}
                      onChangeText={(value) => updateExperienceField(index, 'company', value)}
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      placeholder="City, Country"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={exp.location}
                      onChangeText={(value) => updateExperienceField(index, 'location', value)}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Start Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          Haptics.selectionAsync();
                          showDatePickerModal('experience', index, 'start', exp.startDate || '');
                        }}
                      >
                        <Text style={[styles.dateButtonText, !exp.startDate && styles.dateButtonPlaceholder]}>
                          {formatDateDisplay(exp.startDate || '')}
                        </Text>
                        <CalendarIcon />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>End Date</Text>
                      <TouchableOpacity
                        style={[styles.dateButton, exp.current && { opacity: 0.5 }]}
                        onPress={() => {
                          if (!exp.current) {
                            Haptics.selectionAsync();
                            showDatePickerModal('experience', index, 'end', exp.endDate || '');
                          }
                        }}
                        disabled={exp.current}
                      >
                        <Text style={[styles.dateButtonText, !exp.endDate && styles.dateButtonPlaceholder]}>
                          {exp.current ? 'Present' : formatDateDisplay(exp.endDate || '')}
                        </Text>
                        <CalendarIcon />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateExperienceField(index, 'current', !exp.current);
                    }}
                  >
                    <View style={[styles.checkbox, exp.current && styles.checkboxChecked]}>
                      {exp.current && <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>Currently working here</Text>
                  </TouchableOpacity>

                  <View>
                    <Text style={styles.inputLabel}>Key Responsibilities</Text>
                    <TextInput
                      placeholder="Enter key responsibilities (one per line)"
                      placeholderTextColor="#94A3B8"
                      style={[styles.textInput, styles.textInputMultiline, { minHeight: 80 }]}
                      multiline
                      numberOfLines={3}
                      value={exp.responsibilities?.join('\n') || ''}
                      onChangeText={(value) => updateExperienceField(index, 'responsibilities', value.split('\n'))}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Education Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Education</Text>
                  <Text style={styles.sectionSubtitle}>Your educational background</Text>
                </View>
                {hasEducation && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      addEducation();
                    }}
                  >
                    <Text style={styles.addButtonText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!hasEducation && (
                <View style={styles.emptyStateCard}>
                  <Text style={styles.emptyStateText}>
                    That's okay! You can skip this section.
                  </Text>
                </View>
              )}

              {hasEducation && education.map((edu, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>Education #{index + 1}</Text>
                    {education.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          removeEducation(index);
                        }}
                      >
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Degree</Text>
                    <TextInput
                      placeholder="Bachelor of Science"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={edu.degree}
                      onChangeText={(value) => updateEducationField(index, 'degree', value)}
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Institution</Text>
                    <TextInput
                      placeholder="University Name"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={edu.institution}
                      onChangeText={(value) => updateEducationField(index, 'institution', value)}
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Location</Text>
                    <TextInput
                      placeholder="City, Country"
                      placeholderTextColor="#94A3B8"
                      style={styles.textInput}
                      value={edu.location}
                      onChangeText={(value) => updateEducationField(index, 'location', value)}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Start Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          Haptics.selectionAsync();
                          showDatePickerModal('education', index, 'start', edu.startDate || '');
                        }}
                      >
                        <Text style={[styles.dateButtonText, !edu.startDate && styles.dateButtonPlaceholder]}>
                          {formatDateDisplay(edu.startDate || '')}
                        </Text>
                        <CalendarIcon />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>End Date</Text>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => {
                          Haptics.selectionAsync();
                          showDatePickerModal('education', index, 'end', edu.endDate || '');
                        }}
                      >
                        <Text style={[styles.dateButtonText, !edu.endDate && styles.dateButtonPlaceholder]}>
                          {formatDateDisplay(edu.endDate || '')}
                        </Text>
                        <CalendarIcon />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>GPA (optional)</Text>
                      <TextInput
                        placeholder="3.8"
                        placeholderTextColor="#94A3B8"
                        style={styles.textInput}
                        value={edu.gpa}
                        onChangeText={(value) => updateEducationField(index, 'gpa', value)}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Description (optional)</Text>
                    <TextInput
                      placeholder="Additional details about your education"
                      placeholderTextColor="#94A3B8"
                      style={[styles.textInput, styles.textInputMultiline, { minHeight: 60 }]}
                      multiline
                      numberOfLines={2}
                      value={edu.description}
                      onChangeText={(value) => updateEducationField(index, 'description', value)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardDismissWrapper>
      </View>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleSave();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        <View style={styles.exportButtonWrapper}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSave();
            }}
            disabled={isLoading}
          >
            <View style={styles.exportButtonInner}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.exportButtonText}>
                  {resumeId ? 'Update Resume' : 'Create Resume'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Glass Date Picker */}
      <GlassDatePicker
        visible={datePicker.show}
        onClose={closeDatePicker}
        onSelect={handleDateSelect}
        selectedDate={datePicker.currentDate}
        title={`Select ${datePicker.mode === 'start' ? 'Start' : 'End'} Date`}
        maxDate={datePicker.mode === 'start' ? new Date() : undefined}
      />
    </SafeAreaView>
  );
}
