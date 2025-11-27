import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Svg, { Path, Rect } from 'react-native-svg';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import SuccessPopup from '../../components/SuccessPopup';
import KeyboardDismissWrapper from '../../components/KeyboardDismissWrapper';
import { useLoginMutation } from '../../services/api';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { storeTokens } from '../../utils/authUtils';
import { useAlert } from '../../contexts/AlertContext';

// Import icons from assets
import BackArrowIcon from '../../assets/images/arrowLeft.svg';
import MailIcon from '../../assets/images/mailIcon.svg';
import LockIcon from '../../assets/images/lockIcon.svg';
import EyeSlashIcon from '../../assets/images/eyeSlash.svg';
import EyeIcon from '../../assets/images/eye.svg';

const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M18.7509 10.1944C18.7509 9.47495 18.6913 8.94995 18.5624 8.40552H10.1794V11.6527H15.1C15.0009 12.4597 14.4652 13.675 13.2747 14.4916L13.258 14.6003L15.9085 16.6126L16.0921 16.6305C17.7786 15.1041 18.7509 12.8583 18.7509 10.1944Z"
      fill="#4285F4"
    />
    <Path
      d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
      fill="#34A853"
    />
    <Path
      d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
      fill="#FBBC05"
    />
    <Path
      d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26944C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
      fill="#EB4335"
    />
  </Svg>
);

const LinkedInIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Rect width={20} height={20} rx={10} fill="#006699" />
    <Path
      d="M7.69945 14.0526V8.65H5.90531V14.0526H7.69964H7.69945ZM6.80276 7.9125C7.42828 7.9125 7.81771 7.49764 7.81771 6.97919C7.806 6.44893 7.42828 6.04565 6.81465 6.04565C6.2006 6.04565 5.79956 6.44893 5.79956 6.97915C5.79956 7.4976 6.18885 7.91245 6.791 7.91245H6.80262L6.80276 7.9125ZM8.69253 14.0526H10.4865V11.0359C10.4865 10.8746 10.4982 10.7129 10.5456 10.5978C10.6753 10.275 10.9705 9.94093 11.4662 9.94093C12.1152 9.94093 12.375 10.4363 12.375 11.1627V14.0526H14.169V10.9549C14.169 9.29553 13.284 8.52334 12.1036 8.52334C11.1359 8.52334 10.7109 9.06472 10.4747 9.43344H10.4867V8.65019H8.69263C8.71604 9.15701 8.69249 14.0528 8.69249 14.0528L8.69253 14.0526Z"
      fill="white"
    />
  </Svg>
);

// Validation schema
const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

interface LoginScreenProps {
  onBack: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onLoginSuccess?: () => void;
}

type FormData = z.infer<typeof loginSchema>;

export default function LoginScreen({ onBack, onForgotPassword, onSignUp, onLoginSuccess }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardDismissWrapper>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="px-6 pt-6">
        {/* Back Button */}
        <TouchableOpacity className="mb-8" onPress={onBack}>
          <BackArrowIcon />
        </TouchableOpacity>

        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to CP Dash
        </Text>
        <Text className="text-sm text-gray-500 mb-8">
          Your AI-Powered Career Advancement Platform
        </Text>

        {/* Email or Phone Input */}
        <Controller
          control={control}
          name="emailOrPhone"
          render={({ field: { onChange, value } }) => (
            <Input
              leftIcon={<MailIcon />}
              placeholder="Enter your E-mail or Phone Number"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              error={errors.emailOrPhone?.message}
              containerClassName="mb-4"
            />
          )}
        />

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              leftIcon={<LockIcon />}
              placeholder="Enter your Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? <EyeIcon /> : <EyeSlashIcon />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              error={errors.password?.message}
              containerClassName="mb-4"
            />
          )}
        />

        {/* Remember Me & Forgot Password */}
        <View className="flex-row justify-between items-center mb-6">
          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                className="flex-row items-center space-x-2"
                onPress={() => onChange(!value)}
              >
                <Checkbox
                  checked={value}
                  onCheckedChange={onChange}
                  className="mr-2"
                />
                <Text className="text-sm text-gray-700">Remember Me</Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity onPress={onForgotPassword}>
            <Text className="text-sm text-primary-blue font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <Button
          className="bg-primary-blue rounded-xl mb-6"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
        >
          Sign In
        </Button>

        {/* OR Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-400">OR</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        {/* Social Login Buttons */}
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 flex-row items-center justify-center mr-3">
            <GoogleIcon />
            <Text className="ml-2 text-gray-700 font-medium">Google</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 flex-row items-center justify-center">
            <LinkedInIcon />
            <Text className="ml-2 text-gray-700 font-medium">LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <TouchableOpacity onPress={onSignUp}>
            <Text className="text-primary-blue font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
        </View>
        </ScrollView>
      </KeyboardDismissWrapper>

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        title="Login Successful!"
        message="You have successfully logged in. Welcome back!"
        buttonText="Continue"
        onContinue={() => {
          setShowSuccessPopup(false);
          onLoginSuccess?.();
        }}
      />
    </SafeAreaView>
  );
}
