import React from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ViewStyle
} from 'react-native';

interface KeyboardDismissWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  avoidKeyboard?: boolean;
}

/**
 * Wrapper component that dismisses keyboard when tapping outside of text inputs
 * Optionally includes KeyboardAvoidingView for iOS
 */
export const KeyboardDismissWrapper: React.FC<KeyboardDismissWrapperProps> = ({
  children,
  style,
  avoidKeyboard = true
}) => {
  const content = (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );

  if (avoidKeyboard && Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="padding"
        style={[{ flex: 1 }, style]}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

export default KeyboardDismissWrapper;