import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cn } from '../../lib/utils';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-xl border-2 border-gray-200 bg-white', className)}
      {...props}
    >
      {children}
    </View>
  );
}

export interface CardHeaderProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <View className={cn('p-6', className)} {...props}>
      {children}
    </View>
  );
}

export interface CardTitleProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
  return (
    <Text
      className={cn('text-2xl font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export interface CardDescriptionProps extends TextProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({
  children,
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <Text className={cn('text-sm text-gray-600 mt-2', className)} {...props}>
      {children}
    </Text>
  );
}

export interface CardContentProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <View className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}

export interface CardFooterProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <View className={cn('flex flex-row p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}
