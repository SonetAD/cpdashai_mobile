/**
 * NotificationBadge
 *
 * Displays a badge with unread notification count.
 * Animates when count changes.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  maxCount?: number;
  style?: any;
}

const SIZES = {
  small: { width: 16, height: 16, fontSize: 9 },
  medium: { width: 20, height: 20, fontSize: 11 },
  large: { width: 24, height: 24, fontSize: 13 },
};

export default function NotificationBadge({
  count,
  size = 'medium',
  maxCount = 99,
  style,
}: NotificationBadgeProps) {
  const scaleAnim = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;
  const prevCount = useRef(count);

  useEffect(() => {
    // Animate when count changes
    if (count !== prevCount.current) {
      if (count > 0 && prevCount.current === 0) {
        // Appearing animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }).start();
      } else if (count === 0 && prevCount.current > 0) {
        // Disappearing animation
        Animated.spring(scaleAnim, {
          toValue: 0,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }).start();
      } else if (count > 0) {
        // Bounce animation for count change
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      prevCount.current = count;
    }
  }, [count, scaleAnim]);

  if (count <= 0) {
    return null;
  }

  const sizeConfig = SIZES[size];
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isWide = displayCount.length > 2;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          minWidth: sizeConfig.width,
          height: sizeConfig.height,
          paddingHorizontal: isWide ? 4 : 0,
          borderRadius: sizeConfig.height / 2,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizeConfig.fontSize },
        ]}
      >
        {displayCount}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});
