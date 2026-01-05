import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  View,
} from 'react-native';

interface KeyboardDismissWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  avoidKeyboard?: boolean;
}

/**
 * Wrapper component for keyboard avoidance
 * Note: Keyboard dismissal is handled by ScrollView's keyboardDismissMode="on-drag"
 * and keyboardShouldPersistTaps="handled" props for better scroll compatibility
 */
export const KeyboardDismissWrapper: React.FC<KeyboardDismissWrapperProps> = ({
  children,
  style,
  avoidKeyboard = true
}) => {
  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[{ flex: 1 }, style]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return <View style={{ flex: 1 }}>{children}</View>;
};

export default KeyboardDismissWrapper;