import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import SuccessIcon from '../assets/images/auth/success.svg';

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
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      iconScaleAnim.setValue(0);
      iconRotateAnim.setValue(0);

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
      ]).start(() => {
        // Icon bounce animation after card appears
        Animated.sequence([
          Animated.spring(iconScaleAnim, {
            toValue: 1.1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

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
        {/* Glass Blur Background */}
        <BlurView
          intensity={80}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
          <Pressable
            className="flex-1"
            onPress={handleContinue}
          />
        </BlurView>

        {/* Popup Card */}
        <Animated.View
          className="bg-white rounded-3xl mx-6 overflow-hidden"
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Content Container with padding */}
          <View className="px-8 pt-10 pb-6 items-center">
            {/* Success Icon with animation */}
            <Animated.View
              className="mb-8"
              style={{
                transform: [{ scale: iconScaleAnim }],
              }}
            >
              <SuccessIcon width={186} height={180} />
            </Animated.View>

            {/* Title */}
            <Text className="text-gray-900 text-2xl font-bold text-center mb-3">
              {title}
            </Text>

            {/* Message */}
            <Text className="text-gray-400 text-base text-center leading-6 mb-8">
              {message}
            </Text>

            {/* Continue Button with Gradient */}
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              className="w-full"
            >
              <LinearGradient
                colors={['#4F7DF3', '#5B7FF2', '#6B8AF5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text className="text-white text-center font-bold text-base">
                  {buttonText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#4F7DF3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
