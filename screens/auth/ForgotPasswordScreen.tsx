import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import BackArrowIcon from '../../assets/images/arrowLeft.svg';

type ResetMethod = 'sms' | 'email';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export default function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<ResetMethod>('sms');
  const [phoneNumber] = useState('+99 54 45 666');
  const [email] = useState('unnamed@gmail.com');

  const handleContinue = () => {
    console.log('Continue with:', selectedMethod);
    // TODO: Implement OTP sending logic
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-6 pt-6">
          {/* Back Button */}
          <TouchableOpacity className="mb-8" onPress={onBack}>
            <BackArrowIcon />
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Forgot Password?
          </Text>
          <Text className="text-sm text-gray-500 mb-8">
            Don't worry! Enter your registered email address and we will send you a link to reset your password
          </Text>

          {/* SMS Option */}
          <TouchableOpacity
            onPress={() => setSelectedMethod('sms')}
            className={`mb-4 rounded-xl p-4 border-2 ${
              selectedMethod === 'sms'
                ? 'bg-primary-blue/5 border-primary-blue'
                : 'bg-gray-50 border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
                selectedMethod === 'sms' ? 'bg-primary-blue/10' : 'bg-gray-200'
              }`}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={selectedMethod === 'sms' ? '#437EF4' : '#6B7280'}
                />
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${
                  selectedMethod === 'sms' ? 'text-primary-blue' : 'text-gray-500'
                }`}>
                  Send SMS via OTP
                </Text>
                <Text className={`text-sm font-medium ${
                  selectedMethod === 'sms' ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {phoneNumber}
                </Text>
              </View>
              {selectedMethod === 'sms' && (
                <Ionicons name="checkmark-circle" size={24} color="#437EF4" />
              )}
            </View>
          </TouchableOpacity>

          {/* Email Option */}
          <TouchableOpacity
            onPress={() => setSelectedMethod('email')}
            className={`mb-8 rounded-xl p-4 border-2 ${
              selectedMethod === 'email'
                ? 'bg-primary-blue/5 border-primary-blue'
                : 'bg-gray-50 border-gray-200'
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
                selectedMethod === 'email' ? 'bg-primary-blue/10' : 'bg-gray-200'
              }`}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={selectedMethod === 'email' ? '#437EF4' : '#6B7280'}
                />
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${
                  selectedMethod === 'email' ? 'text-primary-blue' : 'text-gray-500'
                }`}>
                  Send E-mail via OTP
                </Text>
                <Text className={`text-sm font-medium ${
                  selectedMethod === 'email' ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {email}
                </Text>
              </View>
              {selectedMethod === 'email' && (
                <Ionicons name="checkmark-circle" size={24} color="#437EF4" />
              )}
            </View>
          </TouchableOpacity>

          {/* Continue Button */}
          <Button
            className="bg-primary-blue rounded-xl"
            onPress={handleContinue}
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
