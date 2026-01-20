import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  Animated,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { Canvas, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { AppNavBarProps } from './types';
import { useNavBarAnimation } from './hooks/useNavBarAnimation';
import {
  TAB_BAR_HEIGHT,
  TAB_BAR_HORIZONTAL_PADDING,
  FAB_SIZE,
  INDICATOR_HEIGHT,
  INDICATOR_BORDER_RADIUS,
  ICON_SIZE,
  ACTIVE_COLOR,
  INACTIVE_COLOR,
} from './constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AppNavBar({
  tabs,
  activeTab = 'home',
  onTabPress,
  fab,
}: AppNavBarProps) {
  const insets = useSafeAreaInsets();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const fabRef = useRef<View>(null);
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 });

  // Animate dropdown
  useEffect(() => {
    Animated.spring(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [showDropdown]);

  const handleFABPressWithDropdown = () => {
    if (fab?.showDropdown && fab?.assistantOptions) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowDropdown(!showDropdown);
    } else if (fab?.onPress) {
      fab.onPress();
    }
  };

  const handleSelectAssistant = (assistantId: 'clara' | 'ray') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDropdown(false);
    fab?.onSelectAssistant?.(assistantId);
  };

  // Calculate dimensions
  const hasFAB = fab?.enabled ?? false;
  const tabBarWidth = hasFAB
    ? SCREEN_WIDTH - (TAB_BAR_HORIZONTAL_PADDING * 2) - FAB_SIZE - 10
    : SCREEN_WIDTH - (TAB_BAR_HORIZONTAL_PADDING * 2);
  const tabWidth = tabBarWidth / tabs.length;

  // Get active tab index and calculate indicator width
  const activeIndex = tabs.findIndex((item) => item.id === activeTab);
  const activeItem = tabs[activeIndex];
  const indicatorHorizontalMargin = activeItem?.indicatorWidthAdjustment ?? 1;
  const indicatorWidth = tabWidth - (indicatorHorizontalMargin * 2);

  // Animation hook
  const {
    indicatorPosition,
    scaleAnims,
    fabScale,
    handleTabPress,
    handleFABPress,
  } = useNavBarAnimation({
    tabCount: tabs.length,
    activeIndex,
    tabWidth,
    indicatorWidth,
  });

  // Safe bottom padding - account for Android navigation bar
  const bottomPadding = Platform.select({
    ios: Math.max(insets.bottom, 16),
    android: Math.max(insets.bottom, 24),
  });

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.navRow}>
        {/* Tab Bar with TRUE glassmorphism */}
        <View style={[styles.tabBarWrapper, { width: tabBarWidth }]}>
          {/* BlurView - Real frosted glass blur effect */}
          <BlurView
            style={styles.blurLayer}
            blurType="light"
            blurAmount={15}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.9)"
          />

          {/* Skia Glass Polish Layer */}
          <Canvas style={styles.glassCanvas}>
            {/* Semi-transparent glass gradient overlay */}
            <RoundedRect x={0} y={0} width={tabBarWidth} height={TAB_BAR_HEIGHT} r={30}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, TAB_BAR_HEIGHT)}
                colors={[
                  'rgba(255, 255, 255, 0.75)',
                  'rgba(248, 250, 252, 0.65)',
                  'rgba(255, 255, 255, 0.70)',
                ]}
              />
            </RoundedRect>

            {/* Top highlight - liquid glass reflection */}
            <RoundedRect x={1} y={1} width={tabBarWidth - 2} height={25} r={29}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, 25)}
                colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
              />
            </RoundedRect>

            {/* Subtle border for glass edge definition */}
            <RoundedRect
              x={0.5}
              y={0.5}
              width={tabBarWidth - 1}
              height={TAB_BAR_HEIGHT - 1}
              r={29.5}
              style="stroke"
              strokeWidth={1}
              color="rgba(255, 255, 255, 0.4)"
            />
          </Canvas>

          {/* Animated selection indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: indicatorWidth,
                transform: [{ translateX: indicatorPosition }],
              },
            ]}
          />

          {/* Tab items */}
          <View style={styles.tabBarContent}>
            {tabs.map((item, index) => {
              const isActive = activeTab === item.id;
              const { Icon, SelectedIcon } = item;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleTabPress(item.id, index, onTabPress)}
                  activeOpacity={1}
                  style={[styles.tabItem, { width: tabWidth }]}
                >
                  <Animated.View
                    style={[
                      styles.tabItemContent,
                      { transform: [{ scale: scaleAnims[index] }] },
                    ]}
                  >
                    <View style={styles.iconContainer}>
                      {isActive && SelectedIcon ? (
                        <SelectedIcon width={ICON_SIZE} height={ICON_SIZE} />
                      ) : (
                        <Icon
                          width={ICON_SIZE}
                          height={ICON_SIZE}
                          color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                        />
                      )}
                      {item.badge !== undefined && item.badge > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item.badge > 99 ? '99+' : item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FAB (Floating Action Button) - optional */}
        {fab?.enabled && fab.Icon && (
          <View ref={fabRef}>
            <TouchableOpacity
              onPress={handleFABPressWithDropdown}
              activeOpacity={0.8}
              style={styles.fabContainer}
            >
              <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                <fab.Icon width={84} height={85} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Backdrop to close dropdown - rendered first so it's behind */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* AI Assistant Dropdown Menu - rendered after backdrop so it's on top */}
      {showDropdown && fab?.assistantOptions && (
        <Animated.View
          style={[
            styles.dropdownContainer,
            {
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Blur background */}
          <BlurView
            style={styles.dropdownBlur}
            blurType="light"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.95)"
          />

          {/* Glass effect canvas */}
          <Canvas style={styles.dropdownCanvas}>
            <RoundedRect x={0} y={0} width={185} height={fab.assistantOptions.length * 72 + 16} r={16}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, fab.assistantOptions.length * 72 + 16)}
                colors={[
                  'rgba(255, 255, 255, 0.98)',
                  'rgba(248, 250, 252, 0.95)',
                  'rgba(255, 255, 255, 0.97)',
                ]}
              />
            </RoundedRect>
            {/* Border */}
            <RoundedRect
              x={0.5}
              y={0.5}
              width={184}
              height={fab.assistantOptions.length * 72 + 15}
              r={15.5}
              style="stroke"
              strokeWidth={1}
              color="rgba(0, 0, 0, 0.06)"
            />
          </Canvas>

          {/* Dropdown content */}
          <View style={styles.dropdownContent}>
            {fab.assistantOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownItem,
                  index < fab.assistantOptions!.length - 1 && styles.dropdownItemBorder,
                ]}
                onPress={() => handleSelectAssistant(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.dropdownIconContainer}>
                  <option.Icon width={40} height={40} />
                </View>
                <View style={styles.dropdownTextContainer}>
                  <Text style={styles.dropdownItemTitle}>{option.name}</Text>
                  <Text style={styles.dropdownItemDesc}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarWrapper: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    // Shadow for depth - separate from blur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  glassCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: 30,
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    backgroundColor: 'rgba(232, 236, 244, 0.9)',
    borderRadius: INDICATOR_BORDER_RADIUS,
    top: (TAB_BAR_HEIGHT - INDICATOR_HEIGHT) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    // Subtle inner shadow effect
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  fabContainer: {
    marginLeft: -2,
  },
  // Dropdown styles
  dropdownBackdrop: {
    position: 'absolute',
    top: -SCREEN_HEIGHT,
    left: -TAB_BAR_HORIZONTAL_PADDING,
    right: -TAB_BAR_HORIZONTAL_PADDING,
    bottom: 0,
    height: SCREEN_HEIGHT,
    zIndex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT + 45,
    right: TAB_BAR_HORIZONTAL_PADDING,
    width: 185,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 15,
    zIndex: 2,
  },
  dropdownBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  dropdownCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  dropdownContent: {
    paddingVertical: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  dropdownIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: '#6B7280',
  },
});
