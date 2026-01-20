import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import SuccessPopup from '../../components/SuccessPopup';
import KeyboardDismissWrapper from '../../components/KeyboardDismissWrapper';
import GDPRConsentBanner, { ConsentPreferences, POLICY_VERSION } from '../../components/GDPRConsentBanner';
import RecruiterProfileSetupModal from '../../components/RecruiterProfileSetupModal';
import {
  useRegisterCandidateMutation,
  useRegisterRecruiterMutation,
  useAcceptAllConsentsMutation,
  useRejectOptionalConsentsMutation,
  useUpdateAllConsentsMutation,
} from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials, logout as logoutAction } from '../../store/slices/authSlice';
import { storeTokens, clearTokens } from '../../utils/authUtils';
import { useAlert } from '../../contexts/AlertContext';

// Import NATIVE Google Sign-In service
import nativeGoogleSignIn from '../../services/nativeGoogleSignIn';

// Import LinkedIn OAuth service (backend handles token exchange)
import { useLinkedInAuth, LinkedInAuthResult } from '../../services/linkedinAuthService';

// Import icons from assets
import BackArrowIcon from '../../assets/images/arrowLeft.svg';
import UserIcon from '../../assets/images/userIcon.svg';
import MailIcon from '../../assets/images/mailIcon.svg';
import LockIcon from '../../assets/images/lockIcon.svg';
import CallIcon from '../../assets/images/callIcon.svg';
import EyeSlashIcon from '../../assets/images/eyeSlash.svg';
import EyeIcon from '../../assets/images/eye.svg';
import GoogleIcon from '../../assets/images/googleIcon.svg';
import LinkedInIcon from '../../assets/images/linkedinIcon.svg';

// Base object schema without refinements
const baseObjectSchema = z.object({
  registrationType: z.enum(['email', 'phone', 'both']),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, 'You must agree to terms'),
});

// Candidate schema with refinements
const registerSchema = baseObjectSchema.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  // Email is required when registrationType is 'email' or 'both'
  if ((data.registrationType === 'email' || data.registrationType === 'both') && !data.email) {
    return false;
  }
  // Email must be valid if provided
  if (data.email && !z.string().email().safeParse(data.email).success) {
    return false;
  }
  return true;
}, {
  message: "Valid email is required",
  path: ['email'],
}).refine((data) => {
  // Phone is required when registrationType is 'phone' or 'both'
  if ((data.registrationType === 'phone' || data.registrationType === 'both') && !data.phoneNumber) {
    return false;
  }
  // Phone must be at least 10 characters if provided
  if (data.phoneNumber && data.phoneNumber.length < 10) {
    return false;
  }
  return true;
}, {
  message: "Valid phone number is required (min 10 digits)",
  path: ['phoneNumber'],
});

// Extended schema for recruiter registration
const recruiterSchema = baseObjectSchema.extend({
  lastName: z.string().optional(),
  organizationName: z.string().min(2, 'Organization name is required'),
  organizationType: z.enum(['employer', 'university', 'agency']),
  subRole: z.string().min(1, 'Please select a sub role'),
  position: z.string().optional(),
  linkedinUrl: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  // Email is required when registrationType is 'email' or 'both'
  if ((data.registrationType === 'email' || data.registrationType === 'both') && !data.email) {
    return false;
  }
  // Email must be valid if provided
  if (data.email && !z.string().email().safeParse(data.email).success) {
    return false;
  }
  return true;
}, {
  message: "Valid email is required",
  path: ['email'],
}).refine((data) => {
  // Phone is required when registrationType is 'phone' or 'both'
  if ((data.registrationType === 'phone' || data.registrationType === 'both') && !data.phoneNumber) {
    return false;
  }
  // Phone must be at least 10 characters if provided
  if (data.phoneNumber && data.phoneNumber.length < 10) {
    return false;
  }
  return true;
}, {
  message: "Valid phone number is required (min 10 digits)",
  path: ['phoneNumber'],
});

interface RegisterScreenProps {
  role: 'candidate' | 'recruiter' | null;
  onBack: () => void;
  onLogin?: () => void;
  onRegisterSuccess?: () => void;
}

type CandidateFormData = z.infer<typeof registerSchema>;
type RecruiterFormData = z.infer<typeof recruiterSchema>;
type FormData = CandidateFormData | RecruiterFormData;

// Sub-role options based on organization type
const subRoleOptions = {
  employer: [
    { label: 'Company', value: 'company' },
    { label: 'Recruiter', value: 'recruiter' },
    { label: 'HR Team', value: 'hr_team' },
  ],
  university: [
    { label: 'College', value: 'college' },
    { label: 'University', value: 'university' },
    { label: 'Skill Bootcamp', value: 'bootcamp' },
    { label: 'Training Center', value: 'training_center' },
  ],
  agency: [
    { label: 'Staffing Agency', value: 'staffing_agency' },
    { label: 'Career Service', value: 'career_service' },
    { label: 'Placement Department', value: 'placement_dept' },
  ],
};

export default function RegisterScreen({ role, onBack, onLogin, onRegisterSuccess }: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(false);
  const [pendingLinkedInAuth, setPendingLinkedInAuth] = useState(false);
  const [linkedInConsentAction, setLinkedInConsentAction] = useState<'acceptAll' | 'rejectAll' | 'custom' | null>(null);
  const [linkedInConsentPreferences, setLinkedInConsentPreferences] = useState<ConsentPreferences | null>(null);
  const [showRecruiterProfileSetup, setShowRecruiterProfileSetup] = useState(false);
  const [recruiterSetupUserInfo, setRecruiterSetupUserInfo] = useState<{
    email?: string;
    name?: string;
    photoUrl?: string;
    authData?: {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        role: 'candidate' | 'recruiter';
        isVerified: boolean;
      };
      token: string;
      refreshToken: string;
    };
  } | null>(null);
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [registerCandidate, { isLoading: isCandidateLoading }] = useRegisterCandidateMutation();
  const [registerRecruiter, { isLoading: isRecruiterLoading }] = useRegisterRecruiterMutation();
  const [acceptAllConsents] = useAcceptAllConsentsMutation();
  const [rejectOptionalConsents] = useRejectOptionalConsentsMutation();
  const [updateAllConsents] = useUpdateAllConsentsMutation();

  // LinkedIn OAuth hook - backend handles token exchange and returns tokens via deep link
  const { signIn: linkedInSignIn, result: linkedInResult, isReady: linkedInReady, clearResult: clearLinkedInResult } = useLinkedInAuth();

  const dispatch = useAppDispatch();
  const { showAlert } = useAlert();

  // Input refs for form navigation
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  const isLoading = isCandidateLoading || isRecruiterLoading;

  // Use appropriate schema based on role
  const schema = role === 'recruiter' ? recruiterSchema : registerSchema;

  const { control, handleSubmit, formState: { errors }, watch, clearErrors } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      registrationType: 'email',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      agreedToTerms: false,
      ...(role === 'recruiter' && {
        lastName: '',
        organizationName: '',
        organizationType: 'employer' as const,
        subRole: '',
        position: '',
        linkedinUrl: '',
      }),
    },
  });

  const registrationType = watch('registrationType');
  const organizationType = role === 'recruiter' ? watch('organizationType' as any) : undefined;

  // Handle showing consent banner before registration
  const handleSignUpClick = (data: FormData) => {
    setPendingFormData(data);
    setShowConsentBanner(true);
  };

  // Process consent and then register
  const processConsentAndRegister = async (consentAction: 'acceptAll' | 'rejectAll' | 'custom', customPreferences?: ConsentPreferences) => {
    try {
      // First, proceed with registration based on auth method
      if (pendingGoogleAuth) {
        await handleGoogleAuthWithConsent(consentAction, customPreferences);
      } else if (pendingLinkedInAuth) {
        await handleLinkedInAuthWithConsent(consentAction, customPreferences);
      } else if (pendingFormData) {
        await performRegistration(pendingFormData, consentAction, customPreferences);
      }
    } catch (error) {
      console.error('Registration/Consent error:', error);
    } finally {
      setShowConsentBanner(false);
      setPendingFormData(null);
      setPendingGoogleAuth(false);
      // Note: Don't clear pendingLinkedInAuth here - it's cleared after OAuth callback
    }
  };

  // Handle consent acceptance
  const handleConsentAcceptAll = () => {
    // Immediately hide consent banner to prevent race condition
    setShowConsentBanner(false);
    processConsentAndRegister('acceptAll');
  };

  const handleConsentRejectAll = () => {
    // Don't proceed with registration if user rejects consent
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowConsentBanner(false);
    setPendingFormData(null);
    setPendingGoogleAuth(false);
    setPendingLinkedInAuth(false);
    setLinkedInConsentAction(null);
    setLinkedInConsentPreferences(null);
    showAlert({
      type: 'info',
      title: 'Consent Required',
      message: 'You need to accept our terms and privacy policy to create an account.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleConsentCustom = (preferences: ConsentPreferences) => {
    // Check if required consents are accepted
    if (!preferences.privacyPolicy || !preferences.termsOfService || !preferences.dataProcessing) {
      // Required consents not accepted - don't proceed with registration
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowConsentBanner(false);
      setPendingFormData(null);
      setPendingGoogleAuth(false);
      setPendingLinkedInAuth(false);
      setLinkedInConsentAction(null);
      setLinkedInConsentPreferences(null);
      showAlert({
        type: 'info',
        title: 'Consent Required',
        message: 'You must accept the Privacy Policy, Terms of Service, and Data Processing to create an account.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }
    // Immediately hide consent banner to prevent race condition with Reject button
    setShowConsentBanner(false);
    processConsentAndRegister('custom', preferences);
  };

  // Save consent after successful registration
  const saveConsent = async (consentAction: 'acceptAll' | 'rejectAll' | 'custom', customPreferences?: ConsentPreferences) => {
    try {
      if (consentAction === 'acceptAll') {
        await acceptAllConsents({ policyVersion: POLICY_VERSION }).unwrap();
      } else if (consentAction === 'rejectAll') {
        await rejectOptionalConsents().unwrap();
      } else if (consentAction === 'custom' && customPreferences) {
        await updateAllConsents({
          ...customPreferences,
          policyVersion: POLICY_VERSION,
        }).unwrap();
      }
      console.log('Consent saved successfully');
    } catch (error) {
      console.error('Failed to save consent:', error);
      // Don't block registration if consent save fails - can be retried later
    }
  };

  // Perform the actual registration
  const performRegistration = async (data: FormData, consentAction: 'acceptAll' | 'rejectAll' | 'custom', customPreferences?: ConsentPreferences) => {
    try {
      const registrationData: any = {
        password: data.password,
        passwordConfirm: data.confirmPassword,
        firstName: data.username,
      };

      // Add email if provided
      if (data.email) {
        registrationData.email = data.email;
      }

      // Add phone if provided
      if (data.phoneNumber) {
        registrationData.phoneNumber = data.phoneNumber;
      }

      if (role === 'recruiter') {
        // Add recruiter-specific fields
        const recruiterData = data as RecruiterFormData;
        registrationData.lastName = recruiterData.lastName || '';
        registrationData.organizationName = recruiterData.organizationName;
        registrationData.organizationType = recruiterData.organizationType;
        registrationData.subRole = recruiterData.subRole;
        if (recruiterData.position) {
          registrationData.position = recruiterData.position;
        }
        if (recruiterData.linkedinUrl) {
          registrationData.linkedinUrl = recruiterData.linkedinUrl;
        }
        const result = await registerRecruiter(registrationData).unwrap();
        const response = result.createRecruiter;

        if (response.success && response.__typename === 'LoginSuccessType') {
          console.log('Recruiter registration successful with tokens:', result);
          console.log('Access Token:', response.accessToken);
          console.log('Role:', response.role);

          // Store tokens securely in SecureStore
          await storeTokens(response.accessToken, response.refreshToken);

          // Normalize role to lowercase
          const normalizedRole = (response.role?.toLowerCase() || 'recruiter') as 'candidate' | 'recruiter';

          // Store credentials in Redux
          dispatch(setCredentials({
            user: {
              id: response.user.id,
              email: response.user.email || '',
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              phoneNumber: response.user.phoneNumber || '',
              role: normalizedRole,
              isVerified: response.user.isVerified,
            },
            token: response.accessToken,
            refreshToken: response.refreshToken,
          }));

          // Save consent preferences after successful registration
          await saveConsent(consentAction, customPreferences);

          console.log('Registration successful - tokens stored, redirecting to dashboard');

          // Show success popup and then navigate to dashboard
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowSuccessPopup(true);
        } else {
          showAlert({
            type: 'error',
            title: 'Registration Failed',
            message: response.message || 'Registration failed. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          console.log('Recruiter registration failed:', response.message);
        }
      } else {
        const result = await registerCandidate(registrationData).unwrap();
        const response = result.createCandidate;

        if (response.success && response.__typename === 'LoginSuccessType') {
          console.log('Candidate registration successful with tokens:', result);
          console.log('Access Token:', response.accessToken);
          console.log('Role:', response.role);

          // Store tokens securely in SecureStore
          await storeTokens(response.accessToken, response.refreshToken);

          // Normalize role to lowercase
          const normalizedRole = (response.role?.toLowerCase() || 'candidate') as 'candidate' | 'recruiter';

          // Store credentials in Redux
          dispatch(setCredentials({
            user: {
              id: response.user.id,
              email: response.user.email || '',
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              phoneNumber: response.user.phoneNumber || '',
              role: normalizedRole,
              isVerified: response.user.isVerified,
            },
            token: response.accessToken,
            refreshToken: response.refreshToken,
          }));

          // Save consent preferences after successful registration
          await saveConsent(consentAction, customPreferences);

          console.log('Registration successful - tokens stored, redirecting to dashboard');

          // Show success popup and then navigate to dashboard
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowSuccessPopup(true);
        } else {
          showAlert({
            type: 'error',
            title: 'Registration Failed',
            message: response.message || 'Registration failed. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
          console.log('Candidate registration failed:', response.message);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.createRecruiter?.message ||
        error?.data?.createCandidate?.message ||
        error?.data?.message ||
        'Registration failed. Please try again.';
      showAlert({
        type: 'error',
        title: 'Registration Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
      console.log('Registration error:', errorMessage);
    }
  };

  /**
   * Step 1: Do native Google Sign-In first, then show consent banner
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('Starting NATIVE Google Sign-In (popup, no browser)...', { role });

      // First, do the native Google sign-in to get the ID token
      const signInResult = await nativeGoogleSignIn.signIn();

      if (signInResult.cancelled) {
        console.log('User cancelled Google Sign-In');
        return;
      }

      if (!signInResult.success || !signInResult.idToken) {
        showAlert({
          type: 'error',
          title: 'Google Sign-In Failed',
          message: signInResult.message || 'Failed to sign in with Google. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      console.log('Google Sign-In successful, showing consent banner...');

      // Store the Google sign-in result for later use after consent
      setPendingGoogleIdToken(signInResult.idToken);
      setPendingGoogleUser(signInResult.user);
      setPendingGoogleAuth(true);

      // Now show the consent banner
      setShowConsentBanner(true);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      showAlert({
        type: 'error',
        title: 'Sign-In Error',
        message: 'An error occurred during Google sign-in. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Step 2: After consent, authenticate with backend using stored Google ID token
   */
  const handleGoogleAuthWithConsent = async (consentAction: 'acceptAll' | 'rejectAll' | 'custom', customPreferences?: ConsentPreferences) => {
    try {
      if (!pendingGoogleIdToken) {
        console.error('No pending Google ID token');
        return;
      }

      setIsGoogleLoading(true);
      console.log('Authenticating with backend after consent...', { role, roleType: typeof role });

      // Now authenticate with the backend using the stored ID token
      // Pass the role to ensure correct account type is created
      const roleToSend = role === 'recruiter' ? 'recruiter' : role === 'candidate' ? 'candidate' : undefined;
      console.log('Sending role to backend:', roleToSend);
      const result = await nativeGoogleSignIn.authenticateWithBackend(pendingGoogleIdToken, roleToSend);

      // Clear pending Google data
      setPendingGoogleIdToken(null);
      setPendingGoogleUser(null);

      if (result.success) {
        console.log('Backend authentication successful!');
        console.log('Backend result:', JSON.stringify(result, null, 2));
        console.log('result.role:', result.role);
        console.log('result.profileSetupRequired:', result.profileSetupRequired);

        // Normalize role to lowercase
        const normalizedRole = (result.role?.toLowerCase() || (role || 'candidate')) as 'candidate' | 'recruiter';
        console.log('normalizedRole:', normalizedRole);

        // Check if recruiter needs to complete profile setup BEFORE setting credentials
        // This prevents automatic navigation to dashboard
        console.log('Checking profile setup:', { normalizedRole, profileSetupRequired: result.profileSetupRequired });
        if (normalizedRole === 'recruiter' && result.profileSetupRequired) {
          console.log('Recruiter profile setup required, showing modal BEFORE setting credentials');

          // Save consent first
          await saveConsent(consentAction, customPreferences);

          // Store tokens securely but DON'T set Redux credentials yet
          // This prevents navigation to dashboard
          await storeTokens(result.accessToken, result.refreshToken);

          // Store the auth data for later use after profile setup
          setRecruiterSetupUserInfo({
            email: result.user?.email,
            name: result.user?.firstName || pendingGoogleUser?.name,
            photoUrl: pendingGoogleUser?.photo,
            // Store full auth data for use after profile completion
            authData: {
              user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
                phoneNumber: result.user.phoneNumber,
                role: normalizedRole,
                isVerified: result.user.isVerified,
              },
              token: result.accessToken,
              refreshToken: result.refreshToken,
            },
          });
          setShowRecruiterProfileSetup(true);
          return;
        }

        // For non-recruiters or recruiters with complete profiles, proceed normally
        // Store tokens securely
        await storeTokens(result.accessToken, result.refreshToken);

        // Store credentials in Redux (this triggers navigation)
        dispatch(setCredentials({
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            phoneNumber: result.user.phoneNumber,
            role: normalizedRole,
            isVerified: result.user.isVerified,
          },
          token: result.accessToken,
          refreshToken: result.refreshToken,
        }));

        // Save consent preferences after successful authentication
        await saveConsent(consentAction, customPreferences);

        console.log('Google registration complete - no profile setup needed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccessPopup(true);
      } else {
        showAlert({
          type: 'error',
          title: 'Authentication Failed',
          message: result.message || 'Failed to authenticate with server. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      showAlert({
        type: 'error',
        title: 'Authentication Error',
        message: 'An error occurred during authentication. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /**
   * Handle LinkedIn OAuth result from deep link callback
   * Backend handles token exchange and returns tokens via deep link
   */
  useEffect(() => {
    if (linkedInResult && pendingLinkedInAuth && linkedInConsentAction) {
      handleLinkedInResult(linkedInResult, linkedInConsentAction, linkedInConsentPreferences || undefined);
    }
  }, [linkedInResult]);

  /**
   * Step 1: Show consent banner first, then trigger LinkedIn OAuth
   */
  const handleLinkedInSignUp = async () => {
    if (!linkedInReady) {
      showAlert({
        type: 'error',
        title: 'LinkedIn Not Ready',
        message: 'LinkedIn sign-in is not ready yet. Please try again in a moment.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }

    // Show consent banner first
    setPendingLinkedInAuth(true);
    setShowConsentBanner(true);
  };

  /**
   * Step 2: After consent, trigger LinkedIn OAuth
   */
  const handleLinkedInAuthWithConsent = async (consentAction: 'acceptAll' | 'rejectAll' | 'custom', customPreferences?: ConsentPreferences) => {
    try {
      setIsLinkedInLoading(true);

      // Store consent action and preferences for use after OAuth callback
      setLinkedInConsentAction(consentAction);
      setLinkedInConsentPreferences(customPreferences || null);

      console.log('Starting LinkedIn OAuth after consent...', { role });

      // Trigger LinkedIn OAuth - pass role to backend via state parameter
      const roleToSend = role === 'recruiter' ? 'recruiter' : role === 'candidate' ? 'candidate' : undefined;
      const result = await linkedInSignIn(roleToSend);

      if (result.cancelled) {
        console.log('User cancelled LinkedIn Sign-In');
        setIsLinkedInLoading(false);
        setPendingLinkedInAuth(false);
        setLinkedInConsentAction(null);
        setLinkedInConsentPreferences(null);
        return;
      }

      // If result has tokens directly (from deep link), handle immediately
      if (result.success && result.accessToken) {
        await handleLinkedInResult(result, consentAction, customPreferences);
        return;
      }

      // If there's an error (not waiting for callback), show it
      if (result.error && result.error !== 'Waiting for callback...') {
        showAlert({
          type: 'error',
          title: 'LinkedIn Sign-In Failed',
          message: result.error || 'Failed to sign in with LinkedIn. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        setIsLinkedInLoading(false);
        setPendingLinkedInAuth(false);
        setLinkedInConsentAction(null);
        setLinkedInConsentPreferences(null);
      }
      // Otherwise, waiting for deep link callback - useEffect will handle it
    } catch (error: any) {
      console.error('LinkedIn Sign-In error:', error);
      showAlert({
        type: 'error',
        title: 'Sign-In Error',
        message: 'An error occurred during LinkedIn sign-in. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      setIsLinkedInLoading(false);
      setPendingLinkedInAuth(false);
      setLinkedInConsentAction(null);
      setLinkedInConsentPreferences(null);
    }
  };

  /**
   * Step 3: Process LinkedIn OAuth result - tokens come directly from backend via deep link
   */
  const handleLinkedInResult = async (
    result: LinkedInAuthResult,
    consentAction: 'acceptAll' | 'rejectAll' | 'custom',
    customPreferences?: ConsentPreferences
  ) => {
    try {
      if (!result.success || !result.accessToken) {
        showAlert({
          type: 'error',
          title: 'Authentication Failed',
          message: result.error || 'Failed to authenticate with LinkedIn. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        return;
      }

      console.log('LinkedIn authentication successful!');

      // Normalize role to lowercase
      const normalizedRole = (result.role?.toLowerCase() || (role || 'candidate')) as 'candidate' | 'recruiter';

      // Check if recruiter needs to complete profile setup
      if (normalizedRole === 'recruiter' && result.profileSetupRequired) {
        console.log('Recruiter profile setup required, showing modal');

        // Save consent first
        await saveConsent(consentAction, customPreferences);

        // Store tokens securely but DON'T set Redux credentials yet
        await storeTokens(result.accessToken, result.refreshToken!);

        // Store the auth data for later use after profile setup
        setRecruiterSetupUserInfo({
          email: result.user?.email,
          name: result.user?.firstName,
          authData: {
            user: {
              id: result.user?.id || '',
              email: result.user?.email || '',
              firstName: result.user?.firstName || '',
              lastName: result.user?.lastName || '',
              phoneNumber: result.user?.phoneNumber || '',
              role: normalizedRole,
              isVerified: result.user?.isVerified || true,
            },
            token: result.accessToken,
            refreshToken: result.refreshToken!,
          },
        });
        setShowRecruiterProfileSetup(true);
      } else {
        // For non-recruiters or recruiters with complete profiles
        await storeTokens(result.accessToken, result.refreshToken!);

        dispatch(setCredentials({
          user: {
            id: result.user?.id || '',
            email: result.user?.email || '',
            firstName: result.user?.firstName || '',
            lastName: result.user?.lastName || '',
            phoneNumber: result.user?.phoneNumber || '',
            role: normalizedRole,
            isVerified: result.user?.isVerified || true,
          },
          token: result.accessToken,
          refreshToken: result.refreshToken!,
        }));

        // Save consent preferences after successful authentication
        await saveConsent(consentAction, customPreferences);

        console.log('LinkedIn registration complete');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccessPopup(true);
      }
    } catch (error: any) {
      console.error('LinkedIn authentication error:', error);
      showAlert({
        type: 'error',
        title: 'Authentication Error',
        message: 'An error occurred during authentication. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
    } finally {
      setIsLinkedInLoading(false);
      setPendingLinkedInAuth(false);
      setLinkedInConsentAction(null);
      setLinkedInConsentPreferences(null);
      clearLinkedInResult();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardDismissWrapper>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Back Button */}
          <View className="px-4 pt-4">
            <TouchableOpacity
              className="w-12 h-12 bg-white rounded-full items-center justify-center"
              style={styles.backButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onBack();
              }}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <BackArrowIcon />
            </TouchableOpacity>
          </View>

          {/* White Card Container */}
          <View className="mx-4 mt-4 bg-white rounded-3xl p-6" style={styles.card}>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Create your account
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Register Your Account Building, Improving,{'\n'}Showcasing Your Career
            </Text>

            {/* Registration Type Selector - E-Mail / Phone Number */}
            <Controller
              control={control}
              name="registrationType"
              render={({ field: { onChange, value } }) => {
                const isEmailSelected = value === 'email';
                const isPhoneSelected = value === 'phone';

                return (
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-gray-900 mb-3">Sign Up With</Text>
                    <View className="flex-row" style={{ gap: 10 }}>
                      {/* E-Mail Button */}
                      <TouchableOpacity
                        style={[
                          styles.toggleButtonBase,
                          styles.toggleButtonShadow,
                          isEmailSelected ? styles.toggleButtonActive : styles.toggleButtonInactiveGlass
                        ]}
                        onPress={() => {
                          if (!isEmailSelected) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            clearErrors();
                            onChange('email');
                          }
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel="Sign up with email"
                        accessibilityRole="button"
                        accessibilityState={{ selected: isEmailSelected }}
                      >
                        <Text
                          style={[
                            styles.toggleButtonText,
                            { color: isEmailSelected ? '#FFFFFF' : '#2563EB' }
                          ]}
                        >
                          E-Mail
                        </Text>
                      </TouchableOpacity>

                      {/* Phone Number Button */}
                      <TouchableOpacity
                        style={[
                          styles.toggleButtonBase,
                          styles.toggleButtonShadow,
                          isPhoneSelected ? styles.toggleButtonActive : styles.toggleButtonInactiveGlass
                        ]}
                        onPress={() => {
                          if (!isPhoneSelected) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            clearErrors();
                            onChange('phone');
                          }
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel="Sign up with phone number"
                        accessibilityRole="button"
                        accessibilityState={{ selected: isPhoneSelected }}
                      >
                        <Text
                          style={[
                            styles.toggleButtonText,
                            { color: isPhoneSelected ? '#FFFFFF' : '#2563EB' }
                          ]}
                        >
                          Phone Number
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />

        {/* Form Fields */}
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <Input
              ref={usernameRef}
              leftIcon={<UserIcon />}
              placeholder="Username"
              value={value}
              onChangeText={onChange}
              error={errors.username?.message}
              containerClassName="mb-4"
              returnKeyType="next"
              onSubmitEditing={() => {
                if (registrationType === 'email' || registrationType === 'both') {
                  emailRef.current?.focus();
                } else {
                  passwordRef.current?.focus();
                }
              }}
              autoCorrect={false}
            />
          )}
        />

        {/* Email Input - Only show if registrationType is 'email' or 'both' */}
        {(registrationType === 'email' || registrationType === 'both') && (
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                ref={emailRef}
                leftIcon={<MailIcon />}
                placeholder="E-mail"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={errors.email?.message}
                containerClassName="mb-4"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              ref={passwordRef}
              leftIcon={<LockIcon />}
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? <EyeIcon /> : <EyeSlashIcon />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={errors.password?.message}
              containerClassName="mb-4"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              ref={confirmPasswordRef}
              leftIcon={<LockIcon />}
              placeholder="Confirm Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry={!showConfirmPassword}
              rightIcon={showConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword?.message}
              containerClassName="mb-4"
              returnKeyType={registrationType === 'phone' || registrationType === 'both' ? 'next' : 'done'}
              onSubmitEditing={() => {
                if (registrationType === 'phone' || registrationType === 'both') {
                  phoneRef.current?.focus();
                }
              }}
            />
          )}
        />

        {/* Phone Number Input - Only show if registrationType is 'phone' or 'both' */}
        {(registrationType === 'phone' || registrationType === 'both') && (
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, value } }) => (
              <Input
                ref={phoneRef}
                leftIcon={<CallIcon />}
                placeholder="Phone Number (+1234567890)"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
                containerClassName="mb-4"
                returnKeyType="done"
              />
            )}
          />
        )}

        {/* Recruiter-specific fields */}
        {role === 'recruiter' && (
          <>
            {/* Last Name */}
            <Controller
              control={control}
              name={'lastName' as any}
              render={({ field: { onChange, value } }) => (
                <Input
                  leftIcon={<UserIcon />}
                  placeholder="Last Name (Optional)"
                  value={value}
                  onChangeText={onChange}
                  error={errors['lastName' as keyof typeof errors]?.message}
                  containerClassName="mb-4"
                />
              )}
            />

            {/* Organization Name */}
            <Controller
              control={control}
              name={'organizationName' as any}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Organization Name *"
                  value={value}
                  onChangeText={onChange}
                  error={errors['organizationName' as keyof typeof errors]?.message}
                  containerClassName="mb-4"
                />
              )}
            />

            {/* Organization Type */}
            <Controller
              control={control}
              name={'organizationType' as any}
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onValueChange={onChange}
                  placeholder="Select Organization Type *"
                  options={[
                    { label: 'Employer', value: 'employer' },
                    { label: 'University', value: 'university' },
                    { label: 'Agency', value: 'agency' },
                  ]}
                  error={errors['organizationType' as keyof typeof errors]?.message}
                  containerClassName="mb-4"
                />
              )}
            />

            {/* Sub Role - conditional based on organization type */}
            {organizationType && (
              <Controller
                control={control}
                name={'subRole' as any}
                render={({ field: { onChange, value } }) => (
                  <Select
                    value={value}
                    onValueChange={onChange}
                    placeholder="Select Sub Role *"
                    options={subRoleOptions[organizationType as keyof typeof subRoleOptions] || []}
                    error={errors['subRole' as keyof typeof errors]?.message}
                    containerClassName="mb-4"
                  />
                )}
              />
            )}

            {/* Position */}
            <Controller
              control={control}
              name={'position' as any}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Position (Optional)"
                  value={value}
                  onChangeText={onChange}
                  error={errors['position' as keyof typeof errors]?.message}
                  containerClassName="mb-4"
                />
              )}
            />

            {/* LinkedIn URL */}
            <Controller
              control={control}
              name={'linkedinUrl' as any}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="LinkedIn URL (Optional)"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="url"
                  autoCapitalize="none"
                  error={errors['linkedinUrl' as keyof typeof errors]?.message}
                  containerClassName="mb-4"
                />
              )}
            />
          </>
        )}

          </View>
          {/* End of White Card Container */}

          {/* Terms and Conditions - Outside Card */}
          <Controller
            control={control}
            name="agreedToTerms"
            render={({ field: { onChange, value } }) => (
              <View className="mx-4 mt-4 mb-4">
                <TouchableOpacity
                  className="flex-row items-start"
                  style={{ gap: 12 }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(!value);
                  }}
                  accessibilityLabel="Agree to terms and conditions"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: value }}
                >
                  <Checkbox
                    checked={value}
                    onCheckedChange={(newValue) => {
                      Haptics.selectionAsync();
                      onChange(newValue);
                    }}
                    className="mt-0.5"
                  />
                  <Text className="text-sm text-gray-700 flex-1">
                    Agree to the{' '}
                    <Text className="text-primary-blue">Term & Condition</Text> and{' '}
                    <Text className="text-primary-blue">Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
                {errors.agreedToTerms && (
                  <Text className="text-error-red text-xs mt-1 ml-8">
                    {errors.agreedToTerms.message}
                  </Text>
                )}
              </View>
            )}
          />

          {/* Gradient Sign Up Button */}
          <View className="mx-4 mb-4">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSubmit(handleSignUpClick)();
              }}
              disabled={isLoading || showConsentBanner}
              activeOpacity={0.8}
              accessibilityLabel="Sign up"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <LinearGradient
                colors={['#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6']}
                locations={[0, 0.35, 0.65, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.gradientButton, isLoading && { opacity: 0.7 }]}
              >
                <Text className="text-white font-semibold text-base">
                  {isLoading ? 'Signing Up...' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* OAuth Social Sign Up */}
          {/* Divider */}
          <View className="flex-row items-center mx-4 my-4">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="text-gray-400 mx-4 text-sm">OR</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Social Sign Up Buttons - Side by Side */}
          <View className="mx-4 flex-row mb-4" style={{ gap: 12 }}>
            {/* Google Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.socialButtonShadow]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleGoogleSignIn();
              }}
              disabled={isGoogleLoading || isLoading || showConsentBanner}
              activeOpacity={0.8}
              accessibilityLabel="Sign up with Google"
              accessibilityRole="button"
            >
              <GoogleIcon width={20} height={20} />
              <Text className="text-gray-800 font-medium ml-2">
                {isGoogleLoading ? 'Loading...' : 'Google'}
              </Text>
            </TouchableOpacity>

            {/* LinkedIn Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.socialButtonShadow]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleLinkedInSignUp();
              }}
              disabled={isLinkedInLoading || isLoading || showConsentBanner || !linkedInReady}
              activeOpacity={0.8}
              accessibilityLabel="Sign up with LinkedIn"
              accessibilityRole="button"
            >
              <LinkedInIcon width={20} height={20} />
              <Text className="text-gray-800 font-medium ml-2">
                {isLinkedInLoading ? 'Loading...' : 'LinkedIn'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Already have account */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onLogin?.();
              }}
              accessibilityLabel="Sign in to existing account"
              accessibilityRole="link"
            >
              <Text className="text-primary-blue font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardDismissWrapper>

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        title="Registration Successful!"
        message="Your account has been created and you're now logged in. Welcome aboard!"
        buttonText="Continue to Dashboard"
        onContinue={() => {
          setShowSuccessPopup(false);
          onRegisterSuccess?.();
        }}
      />

      {/* GDPR Consent Banner */}
      <GDPRConsentBanner
        visible={showConsentBanner}
        onAcceptAll={handleConsentAcceptAll}
        onRejectAll={handleConsentRejectAll}
        onSavePreferences={handleConsentCustom}
      />

      {/* Recruiter Profile Setup Modal (for Google OAuth users) */}
      <RecruiterProfileSetupModal
        visible={showRecruiterProfileSetup}
        userEmail={recruiterSetupUserInfo?.email}
        userName={recruiterSetupUserInfo?.name}
        userPhotoUrl={recruiterSetupUserInfo?.photoUrl}
        onComplete={() => {
          // Now that profile is complete, set Redux credentials to trigger navigation
          if (recruiterSetupUserInfo?.authData) {
            console.log('Profile setup complete, setting Redux credentials to trigger navigation');
            dispatch(setCredentials(recruiterSetupUserInfo.authData));
          }
          setShowRecruiterProfileSetup(false);
          setRecruiterSetupUserInfo(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Note: Don't show success popup as navigation happens immediately
        }}
        onCancel={async () => {
          // If user cancels, clear all auth state since profile setup is required
          setShowRecruiterProfileSetup(false);
          setRecruiterSetupUserInfo(null);

          // Clear tokens from SecureStore
          await clearTokens();

          // Sign out from Google to clear cached account
          await nativeGoogleSignIn.signOut();

          // Properly logout to clear Redux state (sets isAuthenticated to false)
          dispatch(logoutAction());

          showAlert({
            type: 'info',
            title: 'Profile Setup Required',
            message: 'You need to complete your profile setup to use the app as a recruiter.',
            buttons: [{ text: 'OK', style: 'default' }],
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  toggleButtonBase: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonShadow: {
    // Figma: box-shadow: 0px 5px 10px -2px #2563EB40 (25% opacity)
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#2563EB',
  },
  toggleButtonInactiveGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(200, 205, 215, 0.6)',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  gradientButton: {
    height: 50,
    borderRadius: 33.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Glass effect shadow: 0px 5px 10px -2px #2563EB40
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    // Subtle inner glow border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200, 205, 215, 0.6)',
  },
  socialButtonShadow: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
});
