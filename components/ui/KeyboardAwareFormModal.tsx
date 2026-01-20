import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  useWindowDimensions,
  KeyboardEvent,
  TextInput,
} from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec, Shadow } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface KeyboardAwareFormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  isLoading?: boolean;
}

export const KeyboardAwareFormModal: React.FC<KeyboardAwareFormModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footerContent,
  isLoading = false,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Ensure valid dimensions (fallback to reasonable defaults if 0)
  const safeScreenWidth = screenWidth > 0 ? screenWidth : 375;
  const safeScreenHeight = screenHeight > 0 ? screenHeight : 812;

  const translateY = useRef(new Animated.Value(safeScreenHeight)).current;

  // Calculate modal dimensions - responsive with safe values
  const modalWidth = safeScreenWidth;
  const maxModalHeight = safeScreenHeight * 0.92;
  const modalHeight = maxModalHeight;

  // Handle keyboard events
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: safeScreenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, safeScreenHeight]);

  // Handle close with keyboard dismiss
  const handleClose = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Calculate content area height accounting for keyboard
  const contentHeight = keyboardHeight > 0
    ? modalHeight - keyboardHeight - 100 // Account for header
    : modalHeight;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Animated Modal Container */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: modalWidth,
              height: modalHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Glass Background with Skia - only render when dimensions are valid */}
          {modalWidth > 10 && modalHeight > 100 && (
            <Canvas style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
              {/* Main glass panel */}
              <RoundedRect x={0} y={0} width={modalWidth} height={modalHeight} r={28}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(modalWidth, modalHeight)}
                  colors={[
                    'rgba(255, 255, 255, 0.98)',
                    'rgba(248, 250, 252, 0.96)',
                    'rgba(241, 245, 249, 0.94)',
                  ]}
                />
                <Shadow dx={0} dy={-8} blur={30} color="rgba(0, 0, 0, 0.12)" />
              </RoundedRect>

              {/* Top liquid glass highlight */}
              <RoundedRect x={2} y={2} width={modalWidth - 4} height={80} r={26}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, 80)}
                  colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
                />
              </RoundedRect>

              {/* Subtle border */}
              <RoundedRect
                x={0.5}
                y={0.5}
                width={modalWidth - 1}
                height={modalHeight - 1}
                r={27.5}
                style="stroke"
                strokeWidth={1}
                color="rgba(255, 255, 255, 0.6)"
              />
            </Canvas>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.cancelText, isLoading && styles.cancelTextDisabled]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              ref={scrollViewRef}
              style={[styles.scrollView, { maxHeight: contentHeight - 120 }]}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: keyboardHeight > 0 ? 20 : 40 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              bounces={true}
              scrollEventThrottle={16}
            >
              {children}
            </ScrollView>

            {/* Footer - stays above keyboard */}
            {footerContent && (
              <View
                style={[
                  styles.footer,
                  {
                    paddingBottom: Math.max(insets.bottom, 16),
                    marginBottom: Platform.OS === 'ios' ? keyboardHeight : 0,
                  },
                ]}
              >
                {footerContent}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Input group component for consistent styling
interface FormInputGroupProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormInputGroup: React.FC<FormInputGroupProps> = ({
  label,
  required = false,
  children,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {children}
  </View>
);

// Form text input with consistent styling
interface FormTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'url' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  scrollRef?: React.RefObject<ScrollView>;
}

export const FormTextInput: React.FC<FormTextInputProps> = ({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  scrollRef,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    // Auto-scroll to input when focused
    if (scrollRef?.current && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.measureLayout(
          scrollRef.current as any,
          (x, y) => {
            scrollRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {}
        );
      }, 100);
    }
  };

  return (
    <TextInput
      ref={inputRef}
      style={[
        styles.input,
        multiline && styles.textArea,
        !editable && styles.inputDisabled,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      editable={editable}
      textAlignVertical={multiline ? 'top' : 'center'}
      onFocus={handleFocus}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // Fallback when Canvas is not ready
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  cancelTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputDisabled: {
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
    color: '#64748B',
  },
});

export default KeyboardAwareFormModal;
