import React from 'react';
import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center rounded-md font-medium transition-colors active:opacity-80',
  {
    variants: {
      variant: {
        default: 'bg-blue-600',
        destructive: 'bg-red-600',
        outline: 'border-2 border-gray-300 bg-transparent',
        secondary: 'bg-gray-200',
        ghost: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2',
        lg: 'h-14 px-8 py-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const textVariants = cva('text-center font-semibold', {
  variants: {
    variant: {
      default: 'text-white',
      destructive: 'text-white',
      outline: 'text-gray-900',
      secondary: 'text-gray-900',
      ghost: 'text-gray-900',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps
  extends PressableProps,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  className,
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        (disabled || isLoading) && 'opacity-50',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={textVariants({ variant, size })}>{children}</Text>
      )}
    </Pressable>
  );
}
