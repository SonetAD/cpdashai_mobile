import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Svg, { Path } from 'react-native-svg';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useLoginMutation } from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import SuccessPopup from '../../components/SuccessPopup';
import { storeTokens } from '../../utils/authUtils';
import { useAlert } from '../../contexts/AlertContext';

// Import NATIVE Google Sign-In service (NOT expo-auth-session!)
import nativeGoogleSignIn from '../../services/nativeGoogleSignIn';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path
      d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018l3.232 2.504c1.891-1.741 2.982-4.304 2.982-7.345z"
      fill="#4285F4"
    />
    <Path
      d="M10 20c2.7 0 4.964-.895 6.618-2.427l-3.232-2.505c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.755-5.595-4.114l-3.323 2.564A9.996 9.996 0 0 0 10 20z"
      fill="#34A853"
    />
    <Path
      d="M4.405 11.909A6.002 6.002 0 0 1 4.09 10c0-.659.114-1.3.314-1.909L1.082 5.527A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.082 4.473l3.323-2.564z"
      fill="#FBBC04"
    />
    <Path
      d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.869C14.959.992 12.695 0 10 0 6.09 0 2.71 2.24 1.082 5.527l3.322 2.564C5.19 5.732 7.395 3.977 10 3.977z"
      fill="#E94235"
    />
  </Svg>
);

const LinkedInIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path
      d="M18.52 0H1.477C.66 0 0 .645 0 1.441v17.118C0 19.355.66 20 1.477 20H18.52c.816 0 1.48-.645 1.48-1.441V1.441C20 .645 19.336 0 18.52 0zM5.934 17.043H2.96V7.496h2.974v9.547zM4.449 6.195a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44zM17.043 17.043h-2.968v-4.64c0-1.11-.02-2.536-1.547-2.536-1.547 0-1.785 1.21-1.785 2.46v4.716H7.777V7.496h2.848v1.305h.039c.398-.754 1.371-1.547 2.82-1.547 3.016 0 3.57 1.984 3.57 4.566v5.223h-.011z"
      fill="#0077B5"
    />
  </Svg>
);

interface LoginScreenProps {
  onBack?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onLoginSuccess?: () => void;
  showOAuth?: boolean; // Optional prop to show/hide OAuth buttons
}

type FormData = z.infer<typeof loginSchema>;

export default function LoginScreen({ onBack, onForgotPassword, onSignUp, onLoginSuccess, showOAuth = true }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const { showAlert } = useAlert();

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Detect if input is email or phone
      const isEmail = data.emailOrPhone.includes('@');
      const loginInput = isEmail
        ? { email: data.emailOrPhone, password: data.password }
        : { phoneNumber: data.emailOrPhone, password: data.password };

      const result = await login(loginInput).unwrap();

      const response = result.login;

      if (response.success && response.__typename === 'LoginSuccessType') {
        console.log('Login - Role from API:', response.role);
        console.log('Login - Full user data:', response.user);

        // Normalize role to lowercase to ensure consistency
        const normalizedRole = (response.role?.toLowerCase() || 'candidate') as 'candidate' | 'recruiter';

        // Store tokens securely in SecureStore
        await storeTokens(response.accessToken, response.refreshToken);

        // Store the credentials in Redux with full user data
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

        console.log('Login successful:', response);
        console.log('Access Token:', response.accessToken);
        console.log('Tokens stored securely in SecureStore');
        console.log('Role normalized and stored:', normalizedRole);

        // Show success popup
        setShowSuccessPopup(true);
      } else {
        showAlert({
          type: 'error',
          title: 'Login Failed',
          message: response.message || 'Login failed. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
        console.log('Login failed:', response.message);
      }
    } catch (error: any) {
      const errorMessage = error?.data?.login?.message || error?.data?.message || 'Login failed. Please check your credentials.';
      showAlert({
        type: 'error',
        title: 'Login Error',
        message: errorMessage,
        buttons: [{ text: 'OK', style: 'default' }],
      });
      console.log('Login error:', errorMessage);
    }
  };

  /**
   * NATIVE Google Sign-In Handler
   * This shows the native account selector popup - NO BROWSER!
   */
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('Starting NATIVE Google Sign-In (popup, no browser)...');

      // Use the native Google Sign-In service
      const result = await nativeGoogleSignIn.signInAndAuthenticate();

      // Handle cancellation first (user pressed cancel or back button)
      if (result.cancelled) {
        console.log('User cancelled Google Sign-In - no account created');
        // Don't show error, just exit gracefully
        return;
      }

      // Handle successful sign-in
      if (result.success && result.accessToken) {
        console.log('Native Google Sign-In successful!');

        // Normalize role to lowercase
        const normalizedRole = (result.role?.toLowerCase() || 'candidate') as 'candidate' | 'recruiter';

        // Store tokens securely
        await storeTokens(result.accessToken, result.refreshToken);

        // Store credentials in Redux
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

        console.log('Google authentication complete');
        setShowSuccessPopup(true);
      } else {
        // Show error only if it's not a cancellation
        showAlert({
          type: 'error',
          title: 'Google Sign-In Failed',
          message: result.message || 'Failed to sign in with Google. Please try again.',
          buttons: [{ text: 'OK', style: 'default' }],
        });
      }
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

  // Initialize Google Sign-In when component mounts
  useEffect(() => {
    // The configuration is done in the service constructor
    console.log('Native Google Sign-In initialized');
  }, []);

  // Initialize Google Sign-In on mount (configuration is done in service)
  // Success popup is now handled by the onContinue callback

  return (
    <>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-8">
              {onBack && (
                <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M15 18L9 12L15 6"
                      stroke="#111827"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
              <View className="flex-1" />
            </View>

            {/* Title */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
              <Text className="text-gray-500">Sign in to continue to CP-DashAI</Text>
            </View>

            {/* Form */}
            <View className="space-y-4 mb-6">
              {/* Email or Phone Input */}
              <View>
                <Text className="text-gray-700 mb-2 font-medium">Email or Phone Number</Text>
                <Controller
                  control={control}
                  name="emailOrPhone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Enter your email or phone"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      error={errors.emailOrPhone?.message}
                    />
                  )}
                />
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-gray-700 mb-2 font-medium">Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Enter your password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      error={errors.password?.message}
                      rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            {showPassword ? (
                              <Path
                                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                stroke="#6B7280"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <>
                                <Path
                                  d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                                  stroke="#6B7280"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <Path
                                  d="M1 1l22 22"
                                  stroke="#6B7280"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </>
                            )}
                          </Svg>
                        </TouchableOpacity>
                      }
                    />
                  )}
                />
              </View>

              {/* Remember Me & Forgot Password */}
              <View className="flex-row items-center justify-between">
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row items-center">
                      <Checkbox
                        checked={value || false}
                        onCheckedChange={onChange}
                      />
                      <Text className="text-gray-700 ml-2">Remember me</Text>
                    </View>
                  )}
                />
                {onForgotPassword && (
                  <TouchableOpacity onPress={onForgotPassword}>
                    <Text className="text-primary-blue text-sm font-medium">Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              className={`py-4 rounded-xl items-center ${isLoading ? 'bg-primary-blue/80' : 'bg-primary-blue'}`}
            >
              <Text className="text-white font-semibold text-lg">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* OAuth Social Login - Conditionally shown */}
            {showOAuth && (
              <>
                {/* Divider */}
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="text-gray-400 mx-4">OR</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                {/* Social Login Buttons */}
                <View className="space-y-3">
                  <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className={`flex-row items-center justify-center py-3 rounded-xl border bg-white ${
                      isGoogleLoading ? 'border-gray-300 opacity-50' : 'border-gray-300'
                    }`}
                  >
                    <GoogleIcon />
                    <Text className="text-gray-700 ml-3 font-medium">
                      {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center justify-center py-3 rounded-xl border border-gray-300 bg-white"
                    onPress={() => showAlert({
                      type: 'info',
                      title: 'Coming Soon',
                      message: 'LinkedIn login will be available soon.',
                      buttons: [{ text: 'OK', style: 'default' }],
                    })}
                  >
                    <LinkedInIcon />
                    <Text className="text-gray-700 ml-3 font-medium">Sign in with LinkedIn</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Sign Up Link */}
            {onSignUp && (
              <View className="flex-row items-center justify-center mt-8 mb-4">
                <Text className="text-gray-600">Don't have an account? </Text>
                <TouchableOpacity onPress={onSignUp}>
                  <Text className="text-primary-blue font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

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
    </>
  );
}