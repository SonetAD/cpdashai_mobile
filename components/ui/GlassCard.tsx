import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Canvas,
  RoundedRect,
  BackdropBlur,
  Shadow,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';

interface GlassCardProps {
  children: React.ReactNode;
  width: number;
  height: number;
  borderRadius?: number;
  blurAmount?: number;
  style?: ViewStyle;
  variant?: 'light' | 'dark' | 'frost' | 'tinted';
  borderWidth?: number;
  shadowEnabled?: boolean;
}

/**
 * GlassCard - Premium glassmorphism card using React Native Skia
 *
 * Variants:
 * - light: White glass effect (default)
 * - dark: Dark glass effect
 * - frost: Frosted glass with stronger blur
 * - tinted: Light blue tinted glass
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  width,
  height,
  borderRadius = 25,
  blurAmount = 10,
  style,
  variant = 'light',
  borderWidth = 1,
  shadowEnabled = true,
}) => {
  // Variant configurations
  const variants = {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      gradientColors: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)'],
    },
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      gradientColors: ['rgba(50, 50, 50, 0.8)', 'rgba(30, 30, 30, 0.6)'],
    },
    frost: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.6)',
      gradientColors: ['rgba(255, 255, 255, 0.95)', 'rgba(240, 240, 255, 0.8)'],
    },
    tinted: {
      backgroundColor: 'rgba(241, 245, 249, 0.85)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      gradientColors: ['rgba(241, 245, 249, 0.95)', 'rgba(230, 238, 255, 0.8)'],
    },
  };

  const config = variants[variant];

  return (
    <View style={[styles.container, { width, height }, style]}>
      {/* Skia Canvas for glass effect */}
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Backdrop blur - this creates the frosted glass effect */}
        <BackdropBlur blur={blurAmount} clip={{ x: 0, y: 0, width, height }}>
          {/* Background fill with gradient */}
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={config.gradientColors}
            />
          </RoundedRect>
        </BackdropBlur>

        {/* Border overlay */}
        <RoundedRect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={width - borderWidth}
          height={height - borderWidth}
          r={borderRadius - borderWidth / 2}
          style="stroke"
          strokeWidth={borderWidth}
          color={config.borderColor}
        />

        {/* Shadow effect */}
        {shadowEnabled && (
          <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
            <Shadow dx={0} dy={8} blur={24} color="rgba(100, 116, 139, 0.15)" />
          </RoundedRect>
        )}
      </Canvas>

      {/* Content container */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default GlassCard;
