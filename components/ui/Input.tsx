import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerClassName?: string;
  error?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ leftIcon, rightIcon, onRightIconPress, containerClassName, className, error, onBlur, onFocus, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
      // Note: Don't dismiss keyboard here to allow form navigation
    };

    return (
      <View className={containerClassName}>
        <View
          className="flex-row items-center px-4"
          style={[
            styles.inputContainer,
            error ? styles.inputError : isFocused ? styles.inputFocused : styles.inputDefault
          ]}
        >
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn('flex-1 text-gray-700 text-sm', className)}
            placeholderTextColor="#9CA3AF"
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{ fontSize: 14 }}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text className="text-error-red text-xs mt-1.5 ml-1">{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  inputContainer: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
  },
  inputDefault: {
    borderColor: 'rgba(100, 116, 139, 0.2)', // #64748B at 20%
  },
  inputFocused: {
    borderColor: '#2563EB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
});
