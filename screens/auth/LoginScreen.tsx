import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import {
  useLoginMutation,
  useAcceptAllConsentsMutation,
  useRejectOptionalConsentsMutation,
  useUpdateAllConsentsMutation,
  useLazyHasGivenConsentQuery,
} from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import SuccessPopup from '../../components/SuccessPopup';
import KeyboardDismissWrapper from '../../components/KeyboardDismissWrapper';
import GDPRConsentBanner, { ConsentPreferences, POLICY_VERSION } from '../../components/GDPRConsentBanner';
import { storeTokens } from '../../utils/authUtils';
import { useAlert } from '../../contexts/AlertContext';

// Import NATIVE Google Sign-In service
import nativeGoogleSignIn from '../../services/nativeGoogleSignIn';

// Import icons from assets
import BackArrowIcon from '../../assets/images/arrowLeft.svg';
import MailIcon from '../../assets/images/mailIcon.svg';
import LockIcon from '../../assets/images/lockIcon.svg';
import EyeSlashIcon from '../../assets/images/eyeSlash.svg';
import EyeIcon from '../../assets/images/eye.svg';
import GoogleIcon from '../../assets/images/googleIcon.svg';
import LinkedInIcon from '../../assets/images/linkedinIcon.svg';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

interface LoginScreenProps {
  onBack?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onLoginSuccess?: () => void;
  showOAuth?: boolean;
}

type FormData = z.infer<typeof loginSchema>;

export default function LoginScreen({ onBack, onForgotPassword, onSignUp, onLoginSuccess, showOAuth = true }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [checkConsent] = useLazyHasGivenConsentQuery();
  const [acceptAllConsents] = useAcceptAllConsentsMutation();
  const [rejectOptionalConsents] = useRejectOptionalConsentsMutation();
  const [updateAllConsents] = useUpdateAllConsentsMutation();
  const dispatch = useAppDispatch();
  const { showAlert } = useAlert();

  // Input refs for form navigation
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  });

  // Save consent after login
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
    }
  };

  // Handle consent acceptance
  const handleConsentAcceptAll = async () => {
    // Immediately hide consent banner to prevent race condition
    setShowConsentBanner(false);
    await saveConsent('acceptAll');
    setShowSuccessPopup(true);
  };

  const handleConsentRejectAll = async () => {
    // Don't allow login to proceed if user rejects consent - log them out
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowConsentBanner(false);

    // Clear credentials since they rejected consent
    dispatch(setCredentials({
      user: null,
      token: null,
      refreshToken: null,
    }));

    showAlert({
      type: 'info',
      title: 'Consent Required',
      message: 'You need to accept our terms and privacy policy to use the app.',
      buttons: [{ text: 'OK', style: 'default' }],
    });
  };

  const handleConsentCustom = async (preferences: ConsentPreferences) => {
    // Immediately hide consent banner to prevent race condition
    setShowConsentBanner(false);

    // Check if required consents are accepted
    if (!preferences.privacyPolicy || !preferences.termsOfService || !preferences.dataProcessing) {
      // Required consents not accepted - log out user
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      dispatch(setCredentials({
        user: null,
        token: null,
        refreshToken: null,
      }));
      showAlert({
        type: 'info',
        title: 'Consent Required',
        message: 'You must accept the Privacy Policy, Terms of Service, and Data Processing to use the app.',
        buttons: [{ text: 'OK', style: 'default' }],
      });
      return;
    }
    await saveConsent('custom', preferences);
    setShowSuccessPopup(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const isEmail = data.emailOrPhone.includes('@');
      const loginInput = isEmail
        ? { email: data.emailOrPhone, password: data.password }
        : { phoneNumber: data.emailOrPhone, password: data.password };

      const result = await login(loginInput).unwrap();
      const response = result.login;

      if (response.success && response.__typename === 'LoginSuccessType') {
        const normalizedRole = (response.role?.toLowerCase() || 'candidate') as 'candidate' | 'recruiter';

        await storeTokens(response.accessToken, response.refreshToken);

        dispatch(setCredentials({
          user: {
            id: response.user.id,
            email: response.user.email || (isEmail ? data.emailOrPhone : ''),
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            phoneNumber: response.user.phoneNumber || (!isEmail ? data.emailOrPhone : ''),
            role: normalizedRole,
            isVerified: response.user.isVerified,
          },
          token: response.accessToken,
          refreshToken: response.refreshToken,
        }));

        // Check if user has given consent
        try {
          const consentResult = await checkConsent().unwrap();
          if (!consentResult?.hasGivenConsent) {
            // Show consent banner for existing users who haven't given consent
            setShowConsentBanner(true);
            return;
          }
        } catch (consentError) {
          console.log('Consent check failed, proceeding without consent check:', consentError);
        }

        setShowSuccessPopup(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Login Failed',
          message: response.message || 'Login failed. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error?.data?.login?.message || error?.data?.message || 'Login failed. Please check your credentials.';
      showAlert({
        type: 'error',
        title: 'Login Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsGoogleLoading(true);

      const result = await nativeGoogleSignIn.signInAndAuthenticate();

      if (result.cancelled) {
        return;
      }

      if (result.success && result.accessToken) {
        const normalizedRole = (result.role?.toLowerCase() || 'candidate') as 'candidate' | 'recruiter';

        await storeTokens(result.accessToken, result.refreshToken);

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

        // Check if user has given consent
        try {
          const consentResult = await checkConsent().unwrap();
          if (!consentResult?.hasGivenConsent) {
            // Show consent banner for existing users who haven't given consent
            setShowConsentBanner(true);
            return;
          }
        } catch (consentError) {
          console.log('Consent check failed, proceeding without consent check:', consentError);
        }

        setShowSuccessPopup(true);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showAlert({
          type: 'error',
          title: 'Google Sign-In Failed',
          message: result.message || 'Failed to sign in with Google. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  useEffect(() => {
    console.log('Native Google Sign-In initialized');
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
      <KeyboardDismissWrapper>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
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
                onBack?.();
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
              Sign In
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Log in to access your personalized AI dashboard
            </Text>

            {/* Email Input */}
            <Controller
              control={control}
              name="emailOrPhone"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={emailRef}
                  leftIcon={<MailIcon />}
                  placeholder="Enter your Email"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.emailOrPhone?.message}
                  containerClassName="mb-4"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              )}
            />

            {/* Password Input */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  ref={passwordRef}
                  leftIcon={<LockIcon />}
                  placeholder="Enter your Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? <EyeIcon /> : <EyeSlashIcon />}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password?.message}
                  containerClassName="mb-4"
                  returnKeyType="done"
                />
              )}
            />
          </View>

          {/* Remember Me & Forgot Password - Outside Card */}
          <View className="mx-4 mt-4 flex-row items-center justify-between">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  className="flex-row items-center"
                  style={{ gap: 10 }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(!value);
                  }}
                  accessibilityLabel="Remember me"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: value || false }}
                >
                  <Checkbox
                    checked={value || false}
                    onCheckedChange={(newValue) => {
                      Haptics.selectionAsync();
                      onChange(newValue);
                    }}
                  />
                  <Text className="text-sm text-gray-700">Remember Me</Text>
                </TouchableOpacity>
              )}
            />
            {onForgotPassword && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onForgotPassword();
                }}
                accessibilityLabel="Forgot password"
                accessibilityRole="link"
              >
                <Text className="text-primary-blue text-sm font-medium">Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Gradient Sign In Button */}
          <View className="mx-4 mt-6 mb-4">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleSubmit(onSubmit)();
              }}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityLabel="Sign in"
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
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* OAuth Social Login */}
          {showOAuth && (
            <>
              {/* Divider */}
              <View className="flex-row items-center mx-4 my-4">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="text-gray-400 mx-4 text-sm">OR</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              {/* Social Login Buttons - Side by Side */}
              <View className="mx-4 flex-row" style={{ gap: 12 }}>
                {/* Google Button */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.socialButtonShadow]}
                  onPress={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  activeOpacity={0.8}
                  accessibilityLabel="Sign in with Google"
                  accessibilityRole="button"
                >
                  <GoogleIcon width={20} height={20} />
                  <Text className="text-gray-800 font-medium ml-2">Google</Text>
                </TouchableOpacity>

                {/* LinkedIn Button */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.socialButtonShadow]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showAlert({
                      type: 'info',
                      title: 'Available in Milestone 3',
                      message: 'LinkedIn login will be available in Milestone 3.',
                      buttons: [{ text: 'OK', style: 'default' }],
                    });
                  }}
                  activeOpacity={0.8}
                  accessibilityLabel="Sign in with LinkedIn"
                  accessibilityRole="button"
                >
                  <LinkedInIcon width={20} height={20} />
                  <Text className="text-gray-800 font-medium ml-2">LinkedIn</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Spacer to push Sign Up link to bottom */}
          <View className="flex-1" />

          {/* Sign Up Link */}
          {onSignUp && (
            <View className="flex-row items-center justify-center mt-8 mb-4">
              <Text className="text-gray-600">Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onSignUp();
                }}
                accessibilityLabel="Sign up for new account"
                accessibilityRole="link"
              >
                <Text className="text-primary-blue font-semibold">Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardDismissWrapper>

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        title="Login Successful!"
        message="Welcome back to CP-DashAI"
        onContinue={() => {
          setShowSuccessPopup(false);
          onLoginSuccess?.();
        }}
      />

      {/* GDPR Consent Banner for existing users */}
      <GDPRConsentBanner
        visible={showConsentBanner}
        onAcceptAll={handleConsentAcceptAll}
        onRejectAll={handleConsentRejectAll}
        onSavePreferences={handleConsentCustom}
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
  gradientButton: {
    height: 50,
    borderRadius: 33.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Glass effect shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
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
