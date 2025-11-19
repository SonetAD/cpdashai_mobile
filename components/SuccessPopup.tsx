import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import SuccessIllustration from '../assets/images/illustrationSuccess.svg';

interface SuccessPopupProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttonText?: string;
  onContinue: () => void;
}

export default function SuccessPopup({
  visible,
  title = 'Success!',
  message = 'Your action has been completed successfully',
  buttonText = 'Continue',
  onContinue,
}: SuccessPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);

      // Run animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        className="flex-1 justify-center items-center"
        style={{ opacity: fadeAnim }}
      >
        {/* Blur Background */}
        <BlurView
          intensity={100}
          tint="dark"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Pressable
            className="flex-1"
            onPress={onContinue}
          />
        </BlurView>

        {/* Popup Card */}
        <Animated.View
          className="bg-white rounded-3xl mx-8 overflow-hidden shadow-lg"
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Content Container with padding */}
          <View className="px-8 pt-8 pb-6 items-center">
            {/* Success Icon */}
            <View className="mb-6">
              <SuccessIllustration width={120} height={120} />
            </View>

            {/* Title */}
            <Text className="text-gray-900 text-xl font-bold text-center mb-2">
              {title}
            </Text>

            {/* Message */}
            <Text className="text-gray-500 text-sm text-center mb-6">
              {message}
            </Text>
          </View>

          {/* Continue Button - Full Width */}
          <TouchableOpacity
            onPress={onContinue}
            className="bg-primary-blue py-4 mx-6 mb-6 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold text-base">
              {buttonText}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
