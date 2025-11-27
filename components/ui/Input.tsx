import React, { useState } from 'react';
import { View, TextInput, TextInputProps, TouchableOpacity, Text, Keyboard } from 'react-native';
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
      // Dismiss keyboard when input loses focus
      Keyboard.dismiss();
    };

    return (
      <View className={containerClassName}>
        <View className={cn(
          'bg-gray-50 border rounded-xl flex-row items-center px-4 py-3',
          error ? 'border-error-red' : isFocused ? 'border-primary-blue' : 'border-gray-200'
        )}>
          {leftIcon && <View className="mr-3">{leftIcon}</View>}
          <TextInput
            ref={ref}
            className={cn('flex-1 text-gray-700 text-base', className)}
            placeholderTextColor="#A8AAAD"
            onFocus={handleFocus}
            onBlur={handleBlur}
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
