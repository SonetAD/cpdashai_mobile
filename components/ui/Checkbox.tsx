import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { cn } from '../../lib/utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

const CheckIcon = () => (
  <Svg width={12} height={10} viewBox="0 0 12 10" fill="none">
    <Path
      d="M1 5L4.5 8.5L11 1"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, className }) => {
  return (
    <TouchableOpacity
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        'w-5 h-5 rounded border-2 items-center justify-center',
        checked ? 'bg-primary-blue border-primary-blue' : 'bg-white border-gray-300',
        className
      )}
      activeOpacity={0.7}
    >
      {checked && <CheckIcon />}
    </TouchableOpacity>
  );
};
