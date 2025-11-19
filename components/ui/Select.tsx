import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const ChevronDownIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M5 7.5L10 12.5L15 7.5"
      stroke="#6B7280"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  containerClassName?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  error,
  containerClassName = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className={containerClassName}>
      <TouchableOpacity
        className={`flex-row items-center justify-between bg-gray-50 border ${
          error ? 'border-error-red' : 'border-gray-200'
        } rounded-xl px-4 py-3.5`}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text className={selectedOption ? 'text-gray-900 text-base' : 'text-gray-400 text-base'}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDownIcon />
      </TouchableOpacity>

      {isOpen && (
        <View className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`px-4 py-3 border-b border-gray-100 ${
                value === option.value ? 'bg-primary-blue/10' : ''
              }`}
              onPress={() => {
                onValueChange(option.value);
                setIsOpen(false);
              }}
            >
              <Text
                className={`text-base ${
                  value === option.value ? 'text-primary-blue font-semibold' : 'text-gray-900'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error && (
        <Text className="text-error-red text-xs mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
