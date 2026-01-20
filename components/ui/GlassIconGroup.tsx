import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, Image } from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import { BlurView } from '@react-native-community/blur';
import Svg, { Path } from 'react-native-svg';

interface GlassIconGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  height?: number;
  paddingHorizontal?: number;
}

/**
 * GlassIconGroup - A pill-shaped container with glassmorphism effect
 * Used for grouping multiple icons (search, notification, profile)
 */
export const GlassIconGroup: React.FC<GlassIconGroupProps> = ({
  children,
  style,
  height = 44,
  paddingHorizontal = 12,
}) => {
  const borderRadius = height / 2;

  return (
    <View style={[styles.container, { height, borderRadius, paddingHorizontal }, style]}>
      {/* Blur layer */}
      <BlurView
        style={[styles.blur, { borderRadius }]}
        blurType="light"
        blurAmount={12}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.85)"
      />

      {/* Skia glass layer - rendered as overlay */}
      <View style={[styles.glassOverlay, { borderRadius }]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <RoundedRect x={0} y={0} width={1000} height={height} r={borderRadius}>
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[
                'rgba(255, 255, 255, 0.75)',
                'rgba(248, 250, 252, 0.65)',
                'rgba(255, 255, 255, 0.70)',
              ]}
            />
          </RoundedRect>

          {/* Top highlight */}
          <RoundedRect x={1} y={1} width={998} height={height * 0.5} r={borderRadius - 1}>
            <SkiaLinearGradient
              start={vec(0, 0)}
              end={vec(0, height * 0.5)}
              colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
            />
          </RoundedRect>

          {/* Border */}
          <RoundedRect
            x={0.5}
            y={0.5}
            width={999}
            height={height - 1}
            r={borderRadius - 0.5}
            style="stroke"
            strokeWidth={1}
            color="rgba(255, 255, 255, 0.4)"
          />
        </Canvas>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

interface GlassIconGroupItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
}

/**
 * GlassIconGroupItem - An item inside GlassIconGroup
 */
export const GlassIconGroupItem: React.FC<GlassIconGroupItemProps> = ({
  children,
  onPress,
  size = 32,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.item, { width: size, height: size }, style]}
    >
      {children}
    </TouchableOpacity>
  );
};

interface GlassIconGroupAvatarProps {
  source?: { uri: string } | number;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
}

/**
 * GlassIconGroupAvatar - A circular avatar inside GlassIconGroup
 */
export const GlassIconGroupAvatar: React.FC<GlassIconGroupAvatarProps> = ({
  source,
  onPress,
  size = 36,
  style,
}) => {
  const iconSize = size * 0.55;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
      {source ? (
        <Image
          source={source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              fill="#9CA3AF"
            />
          </Svg>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarPlaceholder: {
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GlassIconGroup;
