import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import {
  Canvas,
  RoundedRect,
  vec,
  LinearGradient,
  Shadow,
} from '@shopify/react-native-skia';

/**
 * GlassButton - Premium glass button using Skia
 *
 * Supports:
 * - Single color or gradient (pass 1 or 2 colors)
 * - Customizable shadow color
 * - Loading state with ActivityIndicator
 * - Disabled state
 * - Glass highlight overlay
 */
interface GlassButtonProps {
  children?: React.ReactNode;
  text?: string;
  width?: number; // Optional - defaults to 100% of container
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  colors?: string[]; // 1 color = solid, 2 colors = gradient (left to right)
  shadowColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  textStyle?: object;
  fullWidth?: boolean; // If true, button takes full width of container
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  text,
  width,
  height = 50,
  borderRadius = 14,
  style,
  colors = ['#2563EB', '#3B82F6'], // Default blue gradient
  shadowColor = 'rgba(37, 99, 235, 0.4)',
  onPress,
  disabled = false,
  loading = false,
  textStyle,
  fullWidth = false,
}) => {
  // Ensure valid height
  const safeHeight = height > 0 ? height : 50;

  // If no width provided or fullWidth mode, render simpler non-Skia button
  if (!width || width <= 0 || fullWidth) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.fullWidthButton,
          {
            height: safeHeight,
            borderRadius,
            backgroundColor: colors[0] || '#2563EB',
            shadowColor: shadowColor,
          },
          disabled && styles.buttonDisabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : children ? (
          children
        ) : text ? (
          <Text style={[styles.buttonText, textStyle]}>{text}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  // Fixed width mode with Skia Canvas
  const safeWidth = width;

  // Ensure we have at least 2 colors for gradient (duplicate if single color)
  const gradientColors = colors.length === 1 ? [colors[0], colors[0]] : colors;

  // Shadow padding to allow shadow to render outside button bounds
  const shadowPadding = 30;
  const canvasWidth = safeWidth + shadowPadding * 2;
  const canvasHeight = safeHeight + shadowPadding * 2;

  return (
    <View style={[styles.buttonWrapper, { width: safeWidth, height: safeHeight, borderRadius }, style]}>
      {/* Canvas extends beyond button for shadow - only render when dimensions valid */}
      {safeWidth > 10 && safeHeight > 10 && (
        <Canvas
          style={{
            position: 'absolute',
            top: -shadowPadding,
            left: -shadowPadding,
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          {/* Shadow only layer - renders just the shadow, not the shape */}
          <RoundedRect
            x={shadowPadding}
            y={shadowPadding}
            width={safeWidth}
            height={safeHeight}
            r={borderRadius}
            color="transparent"
          >
            <Shadow dx={0} dy={8} blur={20} color={shadowColor} shadowOnly />
          </RoundedRect>

          {/* Button background with gradient */}
          <RoundedRect
            x={shadowPadding}
            y={shadowPadding}
            width={safeWidth}
            height={safeHeight}
            r={borderRadius}
          >
            <LinearGradient
              start={vec(shadowPadding, 0)}
              end={vec(shadowPadding + safeWidth, 0)}
              colors={gradientColors}
            />
          </RoundedRect>

          {/* Glass highlight overlay */}
          <RoundedRect
            x={shadowPadding}
            y={shadowPadding}
            width={safeWidth}
            height={safeHeight / 2}
            r={Math.min(borderRadius, safeHeight / 4)}
          >
            <LinearGradient
              start={vec(0, shadowPadding)}
              end={vec(0, shadowPadding + safeHeight / 2)}
              colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0)']}
            />
          </RoundedRect>
        </Canvas>
      )}

      {/* Touchable area stays at button size */}
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[styles.buttonTouchable, { borderRadius }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : children ? (
          children
        ) : text ? (
          <Text style={[styles.buttonText, textStyle]}>{text}</Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    position: 'relative',
    overflow: 'visible', // Allow shadow to render outside
    backgroundColor: '#2563EB', // Fallback when Canvas is not ready
  },
  buttonTouchable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  fullWidthButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});

export default GlassButton;
