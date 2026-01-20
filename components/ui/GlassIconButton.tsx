import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec, Circle } from '@shopify/react-native-skia';
import { BlurView } from '@react-native-community/blur';

interface GlassIconButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
  disabled?: boolean;
  variant?: 'light' | 'dark' | 'primary';
}

/**
 * GlassIconButton - A circular button with glassmorphism effect
 * Used for back buttons, action buttons, etc.
 */
export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  children,
  onPress,
  size = 44,
  style,
  disabled = false,
  variant = 'primary',
}) => {
  const radius = size / 2;

  // Color schemes based on variant
  const colors = {
    light: {
      gradient: ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.85)'],
      highlight: ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)'],
      border: 'rgba(255, 255, 255, 0.5)',
    },
    dark: {
      gradient: ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.75)'],
      highlight: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)'],
      border: 'rgba(255, 255, 255, 0.1)',
    },
    primary: {
      gradient: ['rgba(79, 125, 243, 0.95)', 'rgba(67, 126, 244, 0.9)'],
      highlight: ['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)'],
      border: 'rgba(255, 255, 255, 0.3)',
    },
  };

  const colorScheme = colors[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, { width: size, height: size }, style]}
    >
      {/* Blur layer for frosted effect */}
      <BlurView
        style={[styles.blur, { borderRadius: radius }]}
        blurType="light"
        blurAmount={10}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
      />

      {/* Skia glass layer */}
      <Canvas style={[styles.canvas, { width: size, height: size }]}>
        {/* Base gradient */}
        <Circle cx={radius} cy={radius} r={radius}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, size)}
            colors={colorScheme.gradient}
          />
        </Circle>

        {/* Top highlight reflection */}
        <Circle cx={radius} cy={radius * 0.6} r={radius * 0.85}>
          <SkiaLinearGradient
            start={vec(0, 0)}
            end={vec(0, size * 0.5)}
            colors={colorScheme.highlight}
          />
        </Circle>

        {/* Border for glass edge */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - 0.5}
          style="stroke"
          strokeWidth={1}
          color={colorScheme.border}
        />
      </Canvas>

      {/* Icon content */}
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GlassIconButton;
