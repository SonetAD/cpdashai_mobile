import { useRef, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  SPRING_CONFIG,
  TAB_PRESS_ANIMATION,
  FAB_PRESS_ANIMATION,
} from '../constants';

interface UseNavBarAnimationProps {
  tabCount: number;
  activeIndex: number;
  tabWidth: number;
  indicatorWidth: number;
}

interface UseNavBarAnimationReturn {
  indicatorPosition: Animated.Value;
  scaleAnims: Animated.Value[];
  fabScale: Animated.Value;
  handleTabPress: (tabId: string, index: number, onTabPress?: (tabId: string) => void) => void;
  handleFABPress: (onPress?: () => void) => void;
}

export function useNavBarAnimation({
  tabCount,
  activeIndex,
  tabWidth,
  indicatorWidth,
}: UseNavBarAnimationProps): UseNavBarAnimationReturn {
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    Array.from({ length: tabCount }, () => new Animated.Value(1))
  ).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  // Animate indicator position when active tab changes
  useEffect(() => {
    const toValue = activeIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
    Animated.spring(indicatorPosition, {
      toValue,
      useNativeDriver: true,
      friction: SPRING_CONFIG.friction,
      tension: SPRING_CONFIG.tension,
    }).start();
  }, [activeIndex, tabWidth, indicatorWidth]);

  const handleTabPress = useCallback(
    (tabId: string, index: number, onTabPress?: (tabId: string) => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: TAB_PRESS_ANIMATION.scaleDown,
          duration: TAB_PRESS_ANIMATION.duration,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          friction: TAB_PRESS_ANIMATION.springFriction,
          tension: TAB_PRESS_ANIMATION.springTension,
          useNativeDriver: true,
        }),
      ]).start();

      onTabPress?.(tabId);
    },
    [scaleAnims]
  );

  const handleFABPress = useCallback(
    (onPress?: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: FAB_PRESS_ANIMATION.scaleDown,
          duration: FAB_PRESS_ANIMATION.duration,
          useNativeDriver: true,
        }),
        Animated.spring(fabScale, {
          toValue: 1,
          friction: FAB_PRESS_ANIMATION.springFriction,
          tension: FAB_PRESS_ANIMATION.springTension,
          useNativeDriver: true,
        }),
      ]).start();

      onPress?.();
    },
    [fabScale]
  );

  return {
    indicatorPosition,
    scaleAnims,
    fabScale,
    handleTabPress,
    handleFABPress,
  };
}
