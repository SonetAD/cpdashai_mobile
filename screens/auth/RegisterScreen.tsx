import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Svg, { Path, Rect } from 'react-native-svg';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Select } from '../../components/ui/Select';
import SuccessPopup from '../../components/SuccessPopup';
import { useRegisterCandidateMutation, useRegisterRecruiterMutation } from '../../services/api';

// Import icons from assets
import BackArrowIcon from '../../assets/images/arrowLeft.svg';
import UserIcon from '../../assets/images/userIcon.svg';
import MailIcon from '../../assets/images/mailIcon.svg';
import LockIcon from '../../assets/images/lockIcon.svg';
import CallIcon from '../../assets/images/callIcon.svg';
import EyeSlashIcon from '../../assets/images/eyeSlash.svg';
import EyeIcon from '../../assets/images/eye.svg';

// Validation schema
const registerSchema = z.object({
  registrationType: z.enum(['email', 'phone', 'both']),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, 'You must agree to terms'),
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

interface RegisterScreenProps {
  role: 'candidate' | 'recruiter' | null;
  onBack: () => void;
  onLogin?: () => void;
}

type FormData = z.infer<typeof registerSchema>;

export default function RegisterScreen({ role, onBack, onLogin }: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [registerCandidate, { isLoading: isCandidateLoading }] = useRegisterCandidateMutation();
  const [registerRecruiter, { isLoading: isRecruiterLoading }] = useRegisterRecruiterMutation();

  const isLoading = isCandidateLoading || isRecruiterLoading;

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registrationType: 'email',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      agreedToTerms: false,
    },
  });

  const registrationType = watch('registrationType');

  const onSubmit = async (data: FormData) => {
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
        const result = await registerRecruiter(registrationData).unwrap();
        const response = result.createRecruiter;

        if (response.success && response.__typename === 'SuccessType') {
          console.log('Recruiter registration successful:', result);
          setShowSuccessPopup(true);
        } else {
          Alert.alert('Error', response.message || 'Registration failed. Please try again.', [{ text: 'OK' }]);
          console.log('Recruiter registration failed:', response.message);
        }
      } else {
        const result = await registerCandidate(registrationData).unwrap();
        const response = result.createCandidate;

        if (response.success && response.__typename === 'SuccessType') {
          console.log('Candidate registration successful:', result);
          setShowSuccessPopup(true);
        } else {
          Alert.alert('Error', response.message || 'Registration failed. Please try again.', [{ text: 'OK' }]);
          console.log('Candidate registration failed:', response.message);
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.createRecruiter?.message ||
        error?.data?.createCandidate?.message ||
        error?.data?.message ||
        'Registration failed. Please try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      console.log('Registration error:', errorMessage);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-6 pt-6">
        {/* Header */}
        <TouchableOpacity className="mb-6" onPress={onBack}>
          <BackArrowIcon />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Create your account
        </Text>
        <Text className="text-sm text-gray-500 mb-6">
          Register Your Account Building, Improving, Showcasing Your Career
        </Text>

        {/* Registration Type Selector - Segmented Control */}
        <Controller
          control={control}
          name="registrationType"
          render={({ field: { onChange, value } }) => (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">Register with</Text>
              <View className="flex-row bg-gray-100 rounded-xl p-1">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${
                    value === 'email' ? 'bg-primary-blue' : 'bg-transparent'
                  }`}
                  onPress={() => onChange('email')}
                >
                  <Text
                    className={`text-center font-semibold ${
                      value === 'email' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Email
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg mx-1 ${
                    value === 'phone' ? 'bg-primary-blue' : 'bg-transparent'
                  }`}
                  onPress={() => onChange('phone')}
                >
                  <Text
                    className={`text-center font-semibold ${
                      value === 'phone' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Phone
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${
                    value === 'both' ? 'bg-primary-blue' : 'bg-transparent'
                  }`}
                  onPress={() => onChange('both')}
                >
                  <Text
                    className={`text-center font-semibold ${
                      value === 'both' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Both
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Form Fields */}
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, value } }) => (
            <Input
              leftIcon={<UserIcon />}
              placeholder="Username"
              value={value}
              onChangeText={onChange}
              error={errors.username?.message}
              containerClassName="mb-4"
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
                leftIcon={<MailIcon />}
                placeholder="Enter your E-mail"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                containerClassName="mb-4"
              />
            )}
          />
        )}

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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <Input
              leftIcon={<LockIcon />}
              placeholder="Enter your Confirm Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry={!showConfirmPassword}
              rightIcon={showConfirmPassword ? <EyeIcon /> : <EyeSlashIcon />}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword?.message}
              containerClassName="mb-4"
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
                leftIcon={<CallIcon />}
                placeholder="Enter your Phone Number (e.g., +1234567890)"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
                containerClassName="mb-4"
              />
            )}
          />
        )}

        {/* Terms and Conditions */}
        <Controller
          control={control}
          name="agreedToTerms"
          render={({ field: { onChange, value } }) => (
            <View className="mb-4">
              <TouchableOpacity
                className="flex-row items-start space-x-2"
                onPress={() => onChange(!value)}
              >
                <Checkbox
                  checked={value}
                  onCheckedChange={onChange}
                  className="mr-3 mt-0.5"
                />
                <Text className="text-sm text-gray-700 flex-1">
                  Agree to the{' '}
                  <Text className="text-primary-blue">Term & Condition</Text> and{' '}
                  <Text className="text-primary-blue">Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.agreedToTerms && (
                <Text className="text-error-red text-xs mt-1 ml-1">
                  {errors.agreedToTerms.message}
                </Text>
              )}
            </View>
          )}
        />

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
        <View className="flex-row justify-between mb-6">
          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 flex-row items-center justify-center mr-3">
            <GoogleIcon />
            <Text className="ml-2 text-gray-700 font-medium">Google</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-white border border-gray-300 rounded-xl py-3 flex-row items-center justify-center">
            <LinkedInIcon />
            <Text className="ml-2 text-gray-700 font-medium">LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Already have account */}
        <View className="flex-row justify-center mb-8">
          <Text className="text-gray-600">Already have an account? </Text>
          <TouchableOpacity onPress={onLogin}>
            <Text className="text-primary-blue font-semibold">Log In</Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>

      {/* Success Popup */}
      <SuccessPopup
        visible={showSuccessPopup}
        title="Registration Successful!"
        message="Your account has been created successfully. Please check your email to verify your account."
        buttonText="Continue"
        onContinue={() => {
          setShowSuccessPopup(false);
          onLogin?.();
        }}
      />
    </SafeAreaView>
  );
}
