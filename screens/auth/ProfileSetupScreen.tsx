import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { GlassDatePicker, DatePickerTrigger } from '../../components/ui/GlassDatePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import { useSelector } from 'react-redux';
import { z } from 'zod';
import {
  useGetProfileProgressQuery,
  useAwardProfilePointsMutation,
  useUpdateOnboardingStepMutation,
  useGetMyProfileQuery,
  useUpdatePersonalInfoMutation,
  useGetCandidateProfileQuery,
  useAddEducationMutation,
  useAddExperienceMutation,
  useUpdateEducationMutation,
  useDeleteEducationMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
  useGetMyCRSQuery,
} from '../../services/api';
import { useAlert } from '../../contexts/AlertContext';
import LogoWhite from '../../assets/images/logoWhite.svg';
import DefaultAvatar from '../../assets/images/default.svg';
import { GlassButton } from '../../components/ui/GlassButton';
import { styles } from '../../styles/ProfileSetupStyles';
import ProfilePictureUpload from '../../components/profile/ProfilePictureUpload';

// Import glassmorphism profile tab components
import { LocationSetupTab } from './profile-setup/tabs/LocationSetupTab';
import { SkillsSetupTab } from './profile-setup/tabs/SkillsSetupTab';
import { HobbySetupTab } from './profile-setup/tabs/HobbySetupTab';
// Import existing profile tab components for tabs not yet converted
import CertificatesTab from '../candidate/profile/tabs/CertificatesTab';
import ExtraCurricularTab from '../candidate/profile/tabs/ExtraCurricularTab';
import LeadershipSocialTab from '../candidate/profile/tabs/LeadershipSocialTab';

// Helper function to parse error messages and return user-friendly versions
const parseErrorMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  // Phone number already exists
  if (lowerMessage.includes('phone_number') && lowerMessage.includes('already exists')) {
    return 'This phone number is already registered to another account. Please use a different number.';
  }

  // Email already exists
  if (lowerMessage.includes('email') && lowerMessage.includes('already exists')) {
    return 'This email address is already registered to another account.';
  }

  // Unique constraint violation (generic)
  if (lowerMessage.includes('unique constraint') || lowerMessage.includes('duplicate key')) {
    return 'This information is already in use by another account. Please use different details.';
  }

  // Network/connection errors
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Return original message if no pattern matches, but clean it up
  if (message.includes('DETAIL:') || message.includes('violates')) {
    return 'Unable to save your information. Please check your details and try again.';
  }

  return message;
};

// Zod validation schema for personal info
const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[+]?[0-9]+$/, 'Phone number can only contain digits'),
  jobTitle: z
    .string()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must be less than 100 characters'),
  workplace: z
    .string()
    .min(2, 'Workplace must be at least 2 characters')
    .max(100, 'Workplace must be less than 100 characters'),
});

// Zod validation schema for education entry
const educationEntrySchema = z.object({
  institution: z
    .string()
    .min(2, 'Institution name must be at least 2 characters')
    .max(100, 'Institution name must be less than 100 characters'),
  degree: z
    .string()
    .min(2, 'Degree must be at least 2 characters')
    .max(100, 'Degree must be less than 100 characters'),
  fieldOfStudy: z
    .string()
    .min(2, 'Field of study must be at least 2 characters')
    .max(100, 'Field of study must be less than 100 characters'),
  startDate: z
    .string()
    .min(1, 'Start date is required'),
  endDate: z
    .string()
    .min(1, 'End date is required'),
  grade: z.string().optional(),
});

// Zod validation schema for experience entry
const experienceEntrySchema = z.object({
  position: z
    .string()
    .min(2, 'Job title must be at least 2 characters')
    .max(100, 'Job title must be less than 100 characters'),
  company: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  location: z.string().optional(),
  startDate: z
    .string()
    .min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  current: z.boolean(),
});

// Helper to validate date range
const validateDateRange = (startDate: string, endDate: string, isCurrent: boolean = false): string | null => {
  if (isCurrent) return null;
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return 'End date must be after start date';
  }
  return null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = SCREEN_WIDTH - 40;

// Gradient Progress Ring around avatar - shows completion percentage with gap at top
const GradientProgressRing = ({ size = 120, progress = 0 }: { size?: number; progress?: number }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Arc parameters - smaller gap at top (around 12 o'clock position)
  const gapAngle = 40; // degrees of gap (reduced from 60)
  const totalArcAngle = 360 - gapAngle; // 320 degrees of arc
  const startAngle = 270 + gapAngle / 2; // Right side of gap (top-right)
  const endAngle = 270 - gapAngle / 2; // Left side of gap (top-left)

  // Convert angles to cartesian coordinates
  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const rightEnd = polarToCartesian(startAngle); // Right side of gap
  const leftEnd = polarToCartesian(endAngle); // Left side of gap
  const largeArcFlag = totalArcAngle > 180 ? 1 : 0;

  // Background arc path (from right side, clockwise to left side)
  const backgroundArc = `M ${rightEnd.x} ${rightEnd.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${leftEnd.x} ${leftEnd.y}`;

  // Progress arc - fills from left side going counter-clockwise (minimum 5% if 0)
  const displayProgress = progress === 0 ? 5 : progress;
  const progressAngle = (displayProgress / 100) * totalArcAngle;
  const progressStart = polarToCartesian(endAngle - progressAngle); // Counter-clockwise from left end
  const progressLargeArc = progressAngle > 180 ? 1 : 0;
  // Arc from progressStart to leftEnd, going clockwise (sweep=1)
  const progressArc = `M ${progressStart.x} ${progressStart.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${leftEnd.x} ${leftEnd.y}`;

  return (
    <Svg width={size} height={size} style={styles.progressRing}>
      <Defs>
        <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#0E3FC8" />
          <Stop offset="100%" stopColor="#8C6BFF" />
        </SvgLinearGradient>
      </Defs>
      {/* Background arc with gap - matches page background */}
      <Path
        d={backgroundArc}
        stroke="#D1D5DB"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Progress arc - fills from left side */}
      <Path
        d={progressArc}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

interface ProfileSetupScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

// Back arrow icon
const BackArrowIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type TabId = 'personal' | 'location' | 'education' | 'experience' | 'skills' | 'certificates' | 'extracurricular' | 'leadership' | 'hobby';

interface Tab {
  id: TabId;
  label: string;
  required: boolean;
}

const tabs: Tab[] = [
  { id: 'personal', label: 'Personal', required: true },
  { id: 'location', label: 'Location', required: false },
  { id: 'education', label: 'Education', required: false },
  { id: 'experience', label: 'Experience', required: false },
  { id: 'skills', label: 'Skills', required: false },
  { id: 'certificates', label: 'Certificates', required: false },
  { id: 'extracurricular', label: 'Activities', required: false },
  { id: 'leadership', label: 'Leadership', required: false },
  { id: 'hobby', label: 'Hobbies', required: false },
];

interface PersonalFormData {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  workplace: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
}

interface ExperienceEntry {
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  current: boolean;
}

export default function ProfileSetupScreen({
  onComplete,
  onBack,
}: ProfileSetupScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [completedTabs, setCompletedTabs] = useState<Set<TabId>>(new Set());
  const [toastData, setToastData] = useState<{ points: number; badge: string } | null>(null);

  // Get user and auth state from Redux
  const user = useSelector((state: any) => state.auth.user);
  const authToken = useSelector((state: any) => state.auth.token);
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  // Personal info form
  const [personalData, setPersonalData] = useState<PersonalFormData>({
    fullName: user?.firstName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    jobTitle: '',
    workplace: '',
  });

  // Education entries - start empty, user clicks "Add" to show form
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  // Track how many education entries came from profile (rest are new)
  const [initialEducationCount, setInitialEducationCount] = useState(0);

  // Experience entries - start empty, user clicks "Add" to show form
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);
  // Track how many experience entries came from profile (rest are new)
  const [initialExperienceCount, setInitialExperienceCount] = useState(0);

  // Track if phone has initial data (non-editable if true)
  const [hasInitialPhone, setHasInitialPhone] = useState(!!user?.phoneNumber);

  // Date picker modal states
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    type: 'education' | 'experience';
    field: 'startDate' | 'endDate';
    index: number;
    minDate?: Date;
    selectedDate?: Date;
  }>({
    visible: false,
    type: 'education',
    field: 'startDate',
    index: 0,
  });

  // API hooks
  const { data: profileProgress, refetch: refetchProgress } = useGetProfileProgressQuery();
  const { data: myProfile } = useGetMyProfileQuery();
  const { data: candidateProfile, refetch: refetchCandidateProfile } = useGetCandidateProfileQuery();
  const { data: crsData } = useGetMyCRSQuery();

  // Get CRS level display and score
  const levelDisplay = crsData?.myCrs?.levelDisplay;
  const crsScore = crsData?.myCrs?.totalScore;
  const [awardProfilePoints] = useAwardProfilePointsMutation();
  const [updateOnboardingStep] = useUpdateOnboardingStepMutation();
  const [updatePersonalInfo] = useUpdatePersonalInfoMutation();
  const [addEducation] = useAddEducationMutation();
  const [addExperience] = useAddExperienceMutation();
  const [updateEducation] = useUpdateEducationMutation();
  const [deleteEducation] = useDeleteEducationMutation();
  const [updateExperience] = useUpdateExperienceMutation();
  const [deleteExperience] = useDeleteExperienceMutation();
  const { showAlert } = useAlert();

  // State for tracking which entry is being edited (null = none, index = editing that entry)
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);

  // Store original values when editing starts (for cancel/restore)
  const [originalEducationEntry, setOriginalEducationEntry] = useState<EducationEntry | null>(null);
  const [originalExperienceEntry, setOriginalExperienceEntry] = useState<ExperienceEntry | null>(null);

  // Track if initial data has been loaded (to prevent overwriting local edits)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Force re-render key for Skia Canvas components (increments after save to force remount)
  const [renderKey, setRenderKey] = useState(0);

  // Skills and Hobbies state (for passing to respective tabs)
  const [skills, setSkills] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);

  // Get profile picture URL
  const profilePictureUrl = myProfile?.myProfile?.profilePicture;

  // Calculate progress percentage
  const progressPercentage = profileProgress?.profileProgress?.completionPercentage || 0;

  // Populate form with existing profile data (only on initial load)
  useEffect(() => {
    // Skip if initial data already loaded (prevents overwriting local edits after mutation invalidates cache)
    if (initialDataLoaded) {
      console.log('Skipping profile data population - initial data already loaded');
      return;
    }

    if (candidateProfile?.myProfile && candidateProfile.myProfile.__typename === 'CandidateType') {
      const profile = candidateProfile.myProfile;
      const phoneFromProfile = profile.user?.phoneNumber;

      console.log('Profile data loaded (initial):', profile);

      setPersonalData(prev => ({
        ...prev,
        fullName: profile.user?.fullName || profile.user?.firstName || prev.fullName,
        phone: phoneFromProfile || prev.phone,
        jobTitle: profile.title || prev.jobTitle,
        workplace: profile.workplace || prev.workplace,
      }));

      // If phone exists in profile, mark it as non-editable
      if (phoneFromProfile) {
        setHasInitialPhone(true);
      }

      // Populate education entries from profile (API uses snake_case)
      if (profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
        console.log('Raw education data from API:', profile.education);
        const mappedEducation: EducationEntry[] = profile.education.map((edu: any, index: number) => {
          console.log(`Education ${index}:`, edu);
          return {
            institution: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.field_of_study || edu.fieldOfStudy || '',
            startDate: edu.start_date || edu.startDate || '',
            endDate: edu.end_date || edu.endDate || '',
            grade: edu.grade || '',
          };
        });
        console.log('Mapped education entries:', mappedEducation);
        setEducationEntries(mappedEducation);
        setInitialEducationCount(mappedEducation.length);
      }

      // Populate experience entries from profile (API uses snake_case)
      if (profile.experience && Array.isArray(profile.experience) && profile.experience.length > 0) {
        console.log('Raw experience data from API:', profile.experience);
        const mappedExperience: ExperienceEntry[] = profile.experience.map((exp: any, index: number) => {
          console.log(`Experience ${index}:`, exp);
          return {
            position: exp.position || exp.title || '',
            company: exp.company || '',
            location: exp.location || '',
            startDate: exp.start_date || exp.startDate || '',
            endDate: exp.end_date || exp.endDate || '',
            description: exp.description || '',
            current: exp.current || false,
          };
        });
        console.log('Mapped experience entries:', mappedExperience);
        setExperienceEntries(mappedExperience);
        setInitialExperienceCount(mappedExperience.length);
      }

      // Populate skills from profile
      const profileSkills = (profile as any).skills;
      if (profileSkills && typeof profileSkills === 'string' && profileSkills.trim()) {
        const skillsList = profileSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
        setSkills(skillsList);
      }

      // Populate hobbies from profile
      const profileHobbies = (profile as any).hobbies;
      if (profileHobbies && Array.isArray(profileHobbies) && profileHobbies.length > 0) {
        setHobbies(profileHobbies);
      }

      // Mark initial data as loaded
      setInitialDataLoaded(true);
    }
  }, [candidateProfile, initialDataLoaded]);

  const handleTabChange = (tabId: TabId) => {
    Haptics.selectionAsync();
    setActiveTab(tabId);
  };

  const handlePersonalChange = (field: keyof PersonalFormData, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    setEducationEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string | boolean) => {
    setExperienceEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEducationEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEducationEntries(prev => [
      ...prev,
      { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', grade: '' },
    ]);
  };

  const removeEducationEntry = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEducationEntries(prev => prev.filter((_, i) => i !== index));
  };

  const addExperienceEntry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperienceEntries(prev => [
      ...prev,
      { position: '', company: '', location: '', startDate: '', endDate: '', description: '', current: false },
    ]);
  };

  const removeExperienceEntry = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExperienceEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Edit existing education entry (expand for editing)
  const handleEditEducation = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Store original values for cancel/restore
    setOriginalEducationEntry({ ...educationEntries[index] });
    setEditingEducationIndex(index);
  };

  // Save edited education entry
  const handleSaveEducationEdit = async (index: number) => {
    const entry = educationEntries[index];

    // Validate the entry exists
    if (!entry) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Education entry not found',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Check authentication
    console.log('Auth state - Token exists:', !!authToken, 'IsAuthenticated:', isAuthenticated);
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Log the mutation input for debugging
    console.log('Updating education at index:', index);
    console.log('Education entry:', entry);

    try {
      const result = await updateEducation({
        index,
        degree: entry.degree.trim(),
        institution: entry.institution.trim(),
        fieldOfStudy: entry.fieldOfStudy.trim(),
        startDate: entry.startDate,
        endDate: entry.endDate,
        grade: entry.grade?.trim() || '',
      }).unwrap();

      console.log('Update education result:', result);

      if (result?.updateEducation?.__typename === 'SuccessType') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOriginalEducationEntry(null);
        setEditingEducationIndex(null);
        // Force Skia Canvas to re-render by updating the render key
        setRenderKey(prev => prev + 1);
        // Delay alert to allow UI to re-render first
        setTimeout(() => {
          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Education updated successfully',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }, 150);
      } else {
        console.error('Update education error response:', result?.updateEducation);
        showAlert({
          type: 'error',
          title: 'Error',
          message: result?.updateEducation?.message || 'Failed to update education',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Failed to update education:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract detailed error message
      let errorMessage = 'Failed to update education. Please try again.';
      if (error?.data?.errors?.[0]?.message) {
        errorMessage = error.data.errors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Cancel editing education
  const handleCancelEducationEdit = () => {
    // Restore original values if available
    if (originalEducationEntry !== null && editingEducationIndex !== null) {
      setEducationEntries(prev => {
        const updated = [...prev];
        updated[editingEducationIndex] = originalEducationEntry;
        return updated;
      });
    }
    setOriginalEducationEntry(null);
    setEditingEducationIndex(null);
  };

  // Delete existing education entry
  const handleDeleteEducation = async (index: number) => {
    // Check authentication first
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Delete Education',
      message: 'Are you sure you want to delete this education entry?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting education at index:', index);
              const result = await deleteEducation({ index }).unwrap();
              if (result?.deleteEducation?.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setEducationEntries(prev => prev.filter((_, i) => i !== index));
                setInitialEducationCount(prev => Math.max(0, prev - 1));
                refetchCandidateProfile();
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Education deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result?.deleteEducation?.message || 'Failed to delete education',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              console.error('Failed to delete education:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete education. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  // Edit existing experience entry (expand for editing)
  const handleEditExperience = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Store original values for cancel/restore
    setOriginalExperienceEntry({ ...experienceEntries[index] });
    setEditingExperienceIndex(index);
  };

  // Save edited experience entry
  const handleSaveExperienceEdit = async (index: number) => {
    const entry = experienceEntries[index];

    // Validate the entry exists
    if (!entry) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Experience entry not found',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Check authentication
    console.log('Auth state - Token exists:', !!authToken, 'IsAuthenticated:', isAuthenticated);
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Log the mutation input for debugging
    console.log('Updating experience at index:', index);
    console.log('Experience entry:', entry);

    try {
      const result = await updateExperience({
        index,
        company: entry.company.trim(),
        position: entry.position.trim(),
        location: entry.location?.trim() || '',
        startDate: entry.startDate,
        endDate: entry.current ? '' : entry.endDate,
        description: entry.description?.trim() || '',
        current: entry.current,
      }).unwrap();

      console.log('Update experience result:', result);

      if (result?.updateExperience?.__typename === 'SuccessType') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setOriginalExperienceEntry(null);
        setEditingExperienceIndex(null);
        // Force Skia Canvas to re-render by updating the render key
        setRenderKey(prev => prev + 1);
        // Delay alert to allow UI to re-render first
        setTimeout(() => {
          showAlert({
            type: 'success',
            title: 'Success',
            message: 'Experience updated successfully',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }, 150);
      } else {
        console.error('Update experience error response:', result?.updateExperience);
        showAlert({
          type: 'error',
          title: 'Error',
          message: result?.updateExperience?.message || 'Failed to update experience',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Failed to update experience:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract detailed error message
      let errorMessage = 'Failed to update experience. Please try again.';
      if (error?.data?.errors?.[0]?.message) {
        errorMessage = error.data.errors[0].message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  // Cancel editing experience
  const handleCancelExperienceEdit = () => {
    // Restore original values if available
    if (originalExperienceEntry !== null && editingExperienceIndex !== null) {
      setExperienceEntries(prev => {
        const updated = [...prev];
        updated[editingExperienceIndex] = originalExperienceEntry;
        return updated;
      });
    }
    setOriginalExperienceEntry(null);
    setEditingExperienceIndex(null);
  };

  // Delete existing experience entry
  const handleDeleteExperience = async (index: number) => {
    // Check authentication first
    if (!authToken) {
      showAlert({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    showAlert({
      type: 'warning',
      title: 'Delete Experience',
      message: 'Are you sure you want to delete this experience entry?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting experience at index:', index);
              const result = await deleteExperience({ index }).unwrap();
              if (result?.deleteExperience?.__typename === 'SuccessType') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setExperienceEntries(prev => prev.filter((_, i) => i !== index));
                setInitialExperienceCount(prev => Math.max(0, prev - 1));
                refetchCandidateProfile();
                showAlert({
                  type: 'success',
                  title: 'Success',
                  message: 'Experience deleted successfully',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Error',
                  message: result?.deleteExperience?.message || 'Failed to delete experience',
                  buttons: [{ text: 'OK', style: 'default' }],
                });
              }
            } catch (error) {
              console.error('Failed to delete experience:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete experience. Please try again.',
                buttons: [{ text: 'OK', style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  // Helper to parse date string (MM/DD/YYYY format)
  const parseDateString = (dateStr?: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return undefined;
  };

  // Open date picker modal
  const openDatePicker = (
    type: 'education' | 'experience',
    field: 'startDate' | 'endDate',
    index: number
  ) => {
    let minDate: Date | undefined;
    let selectedDate: Date | undefined;

    if (type === 'education') {
      const entry = educationEntries[index];
      // For end date, set minDate to start date + 1 day
      if (field === 'endDate' && entry.startDate) {
        const startDate = parseDateString(entry.startDate);
        if (startDate) {
          minDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      selectedDate = parseDateString(entry[field]);
    } else {
      const entry = experienceEntries[index];
      // For end date, set minDate to start date + 1 day
      if (field === 'endDate' && entry.startDate) {
        const startDate = parseDateString(entry.startDate);
        if (startDate) {
          minDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        }
      }
      selectedDate = parseDateString(entry[field]);
    }

    setDatePickerConfig({
      visible: true,
      type,
      field,
      index,
      minDate,
      selectedDate,
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const { type, field, index } = datePickerConfig;
    const formattedDate = date.toLocaleDateString('en-US');

    if (type === 'education') {
      handleEducationChange(index, field, formattedDate);
    } else {
      handleExperienceChange(index, field, formattedDate);
    }
  };

  // Close date picker
  const closeDatePicker = () => {
    setDatePickerConfig(prev => ({ ...prev, visible: false }));
  };

  const handleContinue = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);

      // Validate current tab data
      if (activeTab === 'personal') {
        // Validate all fields with Zod
        const validationResult = personalInfoSchema.safeParse({
          fullName: personalData.fullName.trim(),
          phone: personalData.phone.trim(),
          jobTitle: personalData.jobTitle.trim(),
          workplace: personalData.workplace.trim(),
        });

        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          showAlert({
            type: 'error',
            title: 'Validation Error',
            message: firstError.message,
            buttons: [{ text: 'OK', style: 'default' }],
          });
          setIsLoading(false);
          return;
        }

        // Save personal info to backend
        const updateResult = await updatePersonalInfo({
          fullName: personalData.fullName.trim(),
          phoneNumber: personalData.phone.trim(),
          jobTitle: personalData.jobTitle.trim(),
          workplace: personalData.workplace.trim(),
        }).unwrap();

        if (updateResult?.updatePersonalInfo?.__typename === 'ErrorType') {
          const errorMessage = parseErrorMessage(
            updateResult.updatePersonalInfo.message || 'Failed to save personal info'
          );
          showAlert({
            type: 'error',
            title: 'Error',
            message: errorMessage,
            buttons: [{ text: 'OK', style: 'default' }],
          });
          setIsLoading(false);
          return;
        }

        // Award points for personal info
        const result = await awardProfilePoints({ section: 'personal_info' }).unwrap();
        if (result?.awardProfilePoints?.pointsAwarded) {
          // Show toast with points and badge
          setToastData({
            points: result.awardProfilePoints.pointsAwarded,
            badge: result.awardProfilePoints.badge || 'Profile Updated',
          });
          // Auto-dismiss toast after 2.5 seconds
          setTimeout(() => {
            setToastData(null);
          }, 2500);
        }
        setCompletedTabs(prev => new Set([...prev, 'personal']));
        refetchProgress();
      }

      // Validate education tab
      if (activeTab === 'education') {
        // Check if user has entered any education data
        const hasEducationData = educationEntries.some(
          (entry) => entry.institution || entry.degree || entry.fieldOfStudy || entry.startDate || entry.endDate
        );

        if (hasEducationData) {
          // Validate all education entries that have data
          for (let i = 0; i < educationEntries.length; i++) {
            const entry = educationEntries[i];
            // Skip empty entries
            if (!entry.institution && !entry.degree && !entry.fieldOfStudy && !entry.startDate && !entry.endDate) {
              continue;
            }

            const validationResult = educationEntrySchema.safeParse({
              institution: entry.institution.trim(),
              degree: entry.degree.trim(),
              fieldOfStudy: entry.fieldOfStudy.trim(),
              startDate: entry.startDate,
              endDate: entry.endDate,
              grade: entry.grade,
            });

            if (!validationResult.success) {
              const firstError = validationResult.error.errors[0];
              showAlert({
                type: 'error',
                title: `Education ${i + 1} - Validation Error`,
                message: firstError.message,
                buttons: [{ text: 'OK', style: 'default' }],
              });
              setIsLoading(false);
              return;
            }

            // Validate date range
            const dateError = validateDateRange(entry.startDate, entry.endDate);
            if (dateError) {
              showAlert({
                type: 'error',
                title: `Education ${i + 1} - Invalid Dates`,
                message: dateError,
                buttons: [{ text: 'OK', style: 'default' }],
              });
              setIsLoading(false);
              return;
            }
          }

          // Save NEW education entries to backend (entries after initialEducationCount are new)
          for (let i = initialEducationCount; i < educationEntries.length; i++) {
            const entry = educationEntries[i];
            // Skip empty entries
            if (!entry.institution && !entry.degree && !entry.fieldOfStudy) {
              continue;
            }

            const addResult = await addEducation({
              degree: entry.degree.trim(),
              institution: entry.institution.trim(),
              fieldOfStudy: entry.fieldOfStudy.trim(),
              startDate: entry.startDate,
              endDate: entry.endDate,
              grade: entry.grade?.trim() || '',
            }).unwrap();

            if (addResult?.addEducation?.__typename === 'ErrorType') {
              showAlert({
                type: 'error',
                title: 'Error',
                message: addResult.addEducation.message || 'Failed to save education',
                buttons: [{ text: 'OK', style: 'default' }],
              });
              setIsLoading(false);
              return;
            }
          }

          // Update initial count after successful save
          setInitialEducationCount(educationEntries.length);
          refetchCandidateProfile();
        }

        // Award points for education
        const result = await awardProfilePoints({ section: 'education' }).unwrap();
        if (result?.awardProfilePoints?.pointsAwarded) {
          setToastData({
            points: result.awardProfilePoints.pointsAwarded,
            badge: result.awardProfilePoints.badge || 'Education Added',
          });
          setTimeout(() => {
            setToastData(null);
          }, 2500);
        }
        setCompletedTabs(prev => new Set([...prev, 'education']));
        refetchProgress();
      }

      // Validate experience tab
      if (activeTab === 'experience') {
        // Check if user has entered any experience data
        const hasExperienceData = experienceEntries.some(
          (entry) => entry.position || entry.company || entry.startDate || entry.endDate
        );

        if (hasExperienceData) {
          // Validate all experience entries that have data
          for (let i = 0; i < experienceEntries.length; i++) {
            const entry = experienceEntries[i];
            // Skip empty entries
            if (!entry.position && !entry.company && !entry.startDate && !entry.endDate) {
              continue;
            }

            const validationResult = experienceEntrySchema.safeParse({
              position: entry.position.trim(),
              company: entry.company.trim(),
              location: entry.location?.trim(),
              startDate: entry.startDate,
              endDate: entry.current ? undefined : entry.endDate,
              description: entry.description?.trim(),
              current: entry.current,
            });

            if (!validationResult.success) {
              const firstError = validationResult.error.errors[0];
              showAlert({
                type: 'error',
                title: `Experience ${i + 1} - Validation Error`,
                message: firstError.message,
                buttons: [{ text: 'OK', style: 'default' }],
              });
              setIsLoading(false);
              return;
            }

            // Validate date range (only if not current job)
            if (!entry.current && entry.endDate) {
              const dateError = validateDateRange(entry.startDate, entry.endDate, entry.current);
              if (dateError) {
                showAlert({
                  type: 'error',
                  title: `Experience ${i + 1} - Invalid Dates`,
                  message: dateError,
                  buttons: [{ text: 'OK', style: 'default' }],
                });
                setIsLoading(false);
                return;
              }
            }
          }

          // Save NEW experience entries to backend (entries after initialExperienceCount are new)
          for (let i = initialExperienceCount; i < experienceEntries.length; i++) {
            const entry = experienceEntries[i];
            // Skip empty entries
            if (!entry.position && !entry.company) {
              continue;
            }

            const addResult = await addExperience({
              company: entry.company.trim(),
              position: entry.position.trim(),
              location: entry.location?.trim() || '',
              startDate: entry.startDate,
              endDate: entry.current ? '' : entry.endDate,
              description: entry.description?.trim() || '',
              current: entry.current,
            }).unwrap();

            if (addResult?.addExperience?.__typename === 'ErrorType') {
              showAlert({
                type: 'error',
                title: 'Error',
                message: addResult.addExperience.message || 'Failed to save experience',
                buttons: [{ text: 'OK', style: 'default' }],
              });
              setIsLoading(false);
              return;
            }
          }

          // Update initial count after successful save
          setInitialExperienceCount(experienceEntries.length);
          refetchCandidateProfile();
        }

        // Award points for experience
        const result = await awardProfilePoints({ section: 'experience' }).unwrap();
        if (result?.awardProfilePoints?.pointsAwarded) {
          setToastData({
            points: result.awardProfilePoints.pointsAwarded,
            badge: result.awardProfilePoints.badge || 'Experience Added',
          });
          setTimeout(() => {
            setToastData(null);
          }, 2500);
        }
        setCompletedTabs(prev => new Set([...prev, 'experience']));
        refetchProgress();
      }

      // Move to next tab or complete
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
      } else {
        // All tabs completed, mark onboarding step complete
        await updateOnboardingStep({ step: 'profile', completed: true });
        onComplete();
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      // Extract error message from various error formats
      let errorMessage = 'Failed to save profile. Please try again.';
      if (error?.data?.errors?.[0]?.message) {
        errorMessage = parseErrorMessage(error.data.errors[0].message);
      } else if (error?.message) {
        errorMessage = parseErrorMessage(error.message);
      } else if (typeof error === 'string') {
        errorMessage = parseErrorMessage(error);
      }

      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (activeTab === 'personal') {
      showAlert({
        type: 'info',
        title: 'Required Section',
        message: 'Personal info is required to continue.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Move to next tab or complete
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else {
      await updateOnboardingStep({ step: 'profile', completed: true });
      onComplete();
    }
  };

  const renderPersonalInfoTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Your Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What's your full name, buddy?</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#9CA3AF"
          value={personalData.fullName}
          onChangeText={(value) => handlePersonalChange('fullName', value)}
          maxLength={50}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={personalData.email}
          editable={false}
          selectTextOnFocus={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What's your phone number?</Text>
        <TextInput
          style={[styles.input, hasInitialPhone && styles.inputDisabled]}
          placeholder="1234567890"
          placeholderTextColor="#9CA3AF"
          value={personalData.phone}
          onChangeText={(value) => {
            // Only allow digits and + sign
            const filtered = value.replace(/[^0-9+]/g, '');
            handlePersonalChange('phone', filtered);
          }}
          keyboardType="phone-pad"
          maxLength={20}
          editable={!hasInitialPhone}
          selectTextOnFocus={!hasInitialPhone}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>What do you do for a living?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. UX Designer"
          placeholderTextColor="#9CA3AF"
          value={personalData.jobTitle}
          onChangeText={(value) => handlePersonalChange('jobTitle', value)}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Where are you working now?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Google, Freelance"
          placeholderTextColor="#9CA3AF"
          value={personalData.workplace}
          onChangeText={(value) => handlePersonalChange('workplace', value)}
          maxLength={100}
        />
      </View>
    </View>
  );

  const renderEducationTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Education</Text>
        <TouchableOpacity style={styles.glassAddButtonSmall} onPress={addEducationEntry}>
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {educationEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No education added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your educational background to help employers understand your qualifications.
          </Text>
        </View>
      )}

      {educationEntries.map((entry, index) => {
        const isExisting = index < initialEducationCount;
        const isEditing = editingEducationIndex === index;

        // Render collapsed glass summary for existing entries (unless editing)
        if (isExisting && !isEditing) {
          return (
            <View key={`edu-${index}-${renderKey}`} style={styles.glassCardWrapper}>
              {/* Skia Glass Background */}
              <Canvas style={styles.glassCanvas}>
                <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 40} height={100} r={16}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(SCREEN_WIDTH - 40, 100)}
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                  />
                  <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
                </RoundedRect>
                {/* Top highlight for liquid glass effect */}
                <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 42} height={40} r={15}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 40)}
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                  />
                </RoundedRect>
              </Canvas>
              {/* Content overlay */}
              <View style={styles.glassCardContent}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>{entry.degree || 'Degree'}</Text>
                  <Text style={styles.summarySubtitle}>{entry.institution || 'Institution'}</Text>
                  <Text style={styles.summaryMeta}>
                    {entry.fieldOfStudy && `${entry.fieldOfStudy} • `}
                    {entry.startDate} - {entry.endDate}
                    {entry.grade && ` • Grade: ${entry.grade}`}
                  </Text>
                </View>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => handleEditEducation(index)}
                  >
                    <Text style={styles.summaryActionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => handleDeleteEducation(index)}
                  >
                    <Text style={styles.summaryActionDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }

        // Render full editable form for new entries OR when editing existing
        const isEditingExisting = isExisting && isEditing;
        return (
          <View key={index} style={styles.entryCard}>
            {/* Entry Header with Save/Cancel for editing OR Remove for new */}
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {isEditingExisting ? 'Edit Education' : `Education ${index + 1}`}
              </Text>
              {isEditingExisting ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={handleCancelEducationEdit}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={() => handleSaveEducationEdit(index)}
                  >
                    <Text style={styles.saveEditText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeEducationEntry(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>School/University</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Harvard University"
                placeholderTextColor="#9CA3AF"
                value={entry.institution}
                onChangeText={(value) => handleEducationChange(index, 'institution', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Degree / Qualification</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bachelor of Science"
                placeholderTextColor="#9CA3AF"
                value={entry.degree}
                onChangeText={(value) => handleEducationChange(index, 'degree', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Field of Study / Major</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Computer Science"
                placeholderTextColor="#9CA3AF"
                value={entry.fieldOfStudy}
                onChangeText={(value) => handleEducationChange(index, 'fieldOfStudy', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <DatePickerTrigger
                  value={entry.startDate}
                  placeholder="Select start date"
                  onPress={() => openDatePicker('education', 'startDate', index)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>End Date</Text>
                <DatePickerTrigger
                  value={entry.endDate}
                  placeholder="Select end date"
                  onPress={() => openDatePicker('education', 'endDate', index)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Grade / GPA (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3.8 / 4.0"
                placeholderTextColor="#9CA3AF"
                value={entry.grade}
                onChangeText={(value) => handleEducationChange(index, 'grade', value)}
                maxLength={20}
              />
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderExperienceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Work Experience</Text>
        <TouchableOpacity style={styles.glassAddButtonSmall} onPress={addExperienceEntry}>
          <Text style={styles.glassAddButtonSmallText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      {experienceEntries.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No experience added yet</Text>
          <Text style={styles.emptyStateText}>
            Add your work history to showcase your professional journey and skills.
          </Text>
        </View>
      )}

      {experienceEntries.map((entry, index) => {
        const isExisting = index < initialExperienceCount;
        const isEditing = editingExperienceIndex === index;

        // Render collapsed glass summary for existing entries (unless editing)
        if (isExisting && !isEditing) {
          return (
            <View key={`exp-${index}-${renderKey}`} style={styles.glassCardWrapper}>
              {/* Skia Glass Background */}
              <Canvas style={styles.glassCanvasLarge}>
                <RoundedRect x={0} y={0} width={SCREEN_WIDTH - 40} height={120} r={16}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(SCREEN_WIDTH - 40, 120)}
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(241, 245, 249, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                  />
                  <Shadow dx={0} dy={4} blur={12} color="rgba(37, 99, 235, 0.15)" />
                </RoundedRect>
                {/* Top highlight for liquid glass effect */}
                <RoundedRect x={1} y={1} width={SCREEN_WIDTH - 42} height={45} r={15}>
                  <SkiaLinearGradient
                    start={vec(0, 0)}
                    end={vec(0, 45)}
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                  />
                </RoundedRect>
              </Canvas>
              {/* Content overlay */}
              <View style={styles.glassCardContentLarge}>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>{entry.position || 'Position'}</Text>
                  <Text style={styles.summarySubtitle}>{entry.company || 'Company'}</Text>
                  <Text style={styles.summaryMeta}>
                    {entry.location && `${entry.location} • `}
                    {entry.startDate} - {entry.current ? 'Present' : entry.endDate}
                  </Text>
                  {entry.description && (
                    <Text style={styles.summaryDescription} numberOfLines={1}>
                      {entry.description}
                    </Text>
                  )}
                </View>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => handleEditExperience(index)}
                  >
                    <Text style={styles.summaryActionEdit}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.summaryActionButton}
                    onPress={() => handleDeleteExperience(index)}
                  >
                    <Text style={styles.summaryActionDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }

        // Render full editable form for new entries OR when editing existing
        const isEditingExisting = isExisting && isEditing;
        return (
          <View key={index} style={styles.entryCard}>
            {/* Entry Header with Save/Cancel for editing OR Remove for new */}
            <View style={styles.entryHeader}>
              <Text style={styles.entryTitle}>
                {isEditingExisting ? 'Edit Experience' : `Experience ${index + 1}`}
              </Text>
              {isEditingExisting ? (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={handleCancelExperienceEdit}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={() => handleSaveExperienceEdit(index)}
                  >
                    <Text style={styles.saveEditText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExperienceEntry(index)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title / Position</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor="#9CA3AF"
                value={entry.position}
                onChangeText={(value) => handleExperienceChange(index, 'position', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Google Inc."
                placeholderTextColor="#9CA3AF"
                value={entry.company}
                onChangeText={(value) => handleExperienceChange(index, 'company', value)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. San Francisco, CA"
                placeholderTextColor="#9CA3AF"
                value={entry.location}
                onChangeText={(value) => handleExperienceChange(index, 'location', value)}
                maxLength={100}
              />
            </View>

            {/* Current Job Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => handleExperienceChange(index, 'current', !entry.current)}
            >
              <View style={[styles.checkbox, entry.current && styles.checkboxChecked]}>
                {entry.current && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>I currently work here</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <DatePickerTrigger
                  value={entry.startDate}
                  placeholder="Select start date"
                  onPress={() => openDatePicker('experience', 'startDate', index)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>End Date</Text>
                <DatePickerTrigger
                  value={entry.current ? 'Present' : entry.endDate}
                  placeholder="Select end date"
                  onPress={() => openDatePicker('experience', 'endDate', index)}
                  disabled={entry.current}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Describe your responsibilities and achievements..."
                placeholderTextColor="#9CA3AF"
                value={entry.description}
                onChangeText={(value) => handleExperienceChange(index, 'description', value)}
                maxLength={500}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );
      })}

    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfoTab();
      case 'location':
        return <LocationSetupTab />;
      case 'education':
        return renderEducationTab();
      case 'experience':
        return renderExperienceTab();
      case 'skills':
        return <SkillsSetupTab skills={skills} onUpdateSkills={setSkills} />;
      case 'certificates':
        return (
          <View style={styles.tabContent}>
            <CertificatesTab />
          </View>
        );
      case 'extracurricular':
        return (
          <View style={styles.tabContent}>
            <ExtraCurricularTab />
          </View>
        );
      case 'leadership':
        return (
          <View style={styles.tabContent}>
            <LeadershipSocialTab />
          </View>
        );
      case 'hobby':
        return <HobbySetupTab hobbies={hobbies} onUpdateHobbies={setHobbies} />;
      default:
        return null;
    }
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
            <Text style={styles.headerTitle}>Create Your Profile</Text>
            <Text style={styles.headerSubtitle}>Your AI-powered career overview is ready!</Text>
          </View>
        </View>

        {/* Points Toast */}
        {toastData && (
          <View style={styles.pointsToast}>
            <Text style={styles.pointsToastText}>+{toastData.points} pts: {toastData.badge}</Text>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button & Progress */}
          <View style={styles.backRow}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <BackArrowIcon />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Avatar with Progress Ring and Profile Picture Upload */}
            <View style={styles.avatarWrapper}>
              <GradientProgressRing size={120} progress={progressPercentage} />
              <View style={styles.avatarInner}>
                <ProfilePictureUpload
                  currentPictureUrl={profilePictureUrl}
                  initials={user?.firstName?.charAt(0) || 'U'}
                  size={90}
                  editable={true}
                />
              </View>
            </View>
            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>

            {/* CRS Level Badge */}
            {(levelDisplay || crsScore !== undefined) && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>
                  {levelDisplay}{levelDisplay && crsScore !== undefined ? ' • ' : ''}{crsScore !== undefined ? `${Math.round(crsScore)} CRS` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.tabActive,
                  completedTabs.has(tab.id) && styles.tabCompleted,
                ]}
                onPress={() => handleTabChange(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive,
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Form Card */}
          <View style={styles.formCard}>
            {renderTabContent()}
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          {/* Continue Button - Glass Morph */}
          <GlassButton
            text="Continue"
            width={BUTTON_WIDTH}
            height={56}
            onPress={handleContinue}
            disabled={isLoading}
            loading={isLoading}
          />

          {/* Skip Button */}
          {activeTab !== 'personal' && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Glass Date Picker Modal */}
      <GlassDatePicker
        visible={datePickerConfig.visible}
        onClose={closeDatePicker}
        onSelect={handleDateSelect}
        selectedDate={datePickerConfig.selectedDate}
        minDate={datePickerConfig.minDate}
        title={datePickerConfig.field === 'startDate' ? 'Start Date' : 'End Date'}
      />
    </SafeAreaView>
  );
}
