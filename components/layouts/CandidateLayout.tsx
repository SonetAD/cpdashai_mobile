import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import { Canvas, Rect, RoundedRect, LinearGradient as SkiaLinearGradient, vec } from '@shopify/react-native-skia';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import LogoWhite from '../../assets/images/logoWhite.svg';
import SearchIcon from '../../assets/images/search.svg';
import DefaultAvatar from '../../assets/images/default.svg';
import { NotificationBadge } from '../notifications';
import { useNotifications } from '../../contexts/NotificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Memoized Bell/Notification Icon
const BellIcon = memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Memoized Search Icon for pill
const SearchIconWhite = memo(() => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

// Memoized Back Arrow Icon
const BackArrowIcon = memo(() => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
));

interface CandidateLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onSearchPress?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
  hideHeader?: boolean;
  // Glass pill props
  showGlassPill?: boolean;
  profilePictureUrl?: string | null;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

// Glass pill dimensions
const GLASS_PILL_HEIGHT = 48;
const GLASS_PILL_WIDTH = 130;
const AVATAR_SIZE = 40;

// Memoized Avatar component to prevent re-renders
const AvatarImage = memo(({ profilePictureUrl }: { profilePictureUrl: string | null | undefined }) => {
  if (profilePictureUrl) {
    return (
      <Image
        source={{ uri: profilePictureUrl }}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
        }}
        resizeMode="cover"
      />
    );
  }
  return <DefaultAvatar width={AVATAR_SIZE} height={AVATAR_SIZE} />;
});

function CandidateLayoutComponent({
  children,
  showSearch = true,
  onSearchPress,
  showBackButton = false,
  onBack,
  headerTitle,
  headerSubtitle,
  hideHeader = false,
  showGlassPill = true,
  profilePictureUrl,
  onNotificationPress,
  onProfilePress,
}: CandidateLayoutProps) {
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  // Check if we have a custom header (title provided)
  const hasCustomHeader = !!headerTitle;

  // Get notification count directly from context - single source of truth
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Content - can scroll behind the glass header */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Glass Header - Frosted glass effect with blur */}
      {/* pointerEvents="box-none" allows touches to pass through to ScrollView for pull-to-refresh */}
      {!hideHeader && (
        <View
          style={[styles.glassHeader, { paddingTop: insets.top }]}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          pointerEvents="box-none"
        >
          {/* Blur layer for glassmorphism effect */}
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="light"
            blurAmount={15}
            reducedTransparencyFallbackColor="rgba(0, 43, 255, 0.9)"
            pointerEvents="none"
          />
          {/* Skia Glass Polish Layer */}
          {headerHeight > 0 && (
            <Canvas style={styles.glassCanvas} pointerEvents="none">
              {/* Blue glass gradient - premium multi-stop */}
              <Rect x={0} y={0} width={SCREEN_WIDTH} height={headerHeight}>
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(0, headerHeight)}
                  colors={[
                    'rgba(37, 99, 235, 0.85)',
                    'rgba(59, 130, 246, 0.80)',
                    'rgba(37, 99, 235, 0.85)',
                  ]}
                />
              </Rect>

              {/* Top highlight - liquid glass reflection */}
              <Rect x={0} y={0} width={SCREEN_WIDTH} height={30}>
                <SkiaLinearGradient
                  start={vec(0, 0)}
                  end={vec(0, 30)}
                  colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0)']}
                />
              </Rect>

              {/* Bottom border - glass edge definition */}
              <Rect
                x={0}
                y={headerHeight - 1}
                width={SCREEN_WIDTH}
                height={1}
                color="rgba(255, 255, 255, 0.3)"
              />
            </Canvas>
          )}

          {/* Header content - pointerEvents="auto" ensures buttons remain interactive */}
          <View style={styles.headerContent} pointerEvents="auto">
            {showBackButton && onBack && showGlassPill ? (
              // Back button with glass pill (for profile summary, cv upload, etc.)
              <>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBack();
                  }}
                  style={styles.backButtonGlass}
                >
                  <View style={styles.backButtonGlassCircle}>
                    <BackArrowIcon />
                  </View>
                </TouchableOpacity>
                <View style={styles.titleContainerCustom}>
                  <Text style={styles.headerTitleCustom} numberOfLines={1}>{headerTitle || 'CPDash AI'}</Text>
                  {headerSubtitle && (
                    <Text style={styles.headerSubtitleCustom}>{headerSubtitle}</Text>
                  )}
                </View>
                <View style={styles.glassPillContainer}>
                  {/* Glass pill blur background */}
                  <BlurView
                    style={styles.glassPillBlur}
                    blurType="light"
                    blurAmount={20}
                    reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
                    pointerEvents="none"
                  />
                  {/* Glass pill Skia overlay */}
                  <Canvas style={styles.glassPillCanvas} pointerEvents="none">
                    <RoundedRect x={0} y={0} width={GLASS_PILL_WIDTH} height={GLASS_PILL_HEIGHT} r={GLASS_PILL_HEIGHT / 2}>
                      <SkiaLinearGradient
                        start={vec(0, 0)}
                        end={vec(0, GLASS_PILL_HEIGHT)}
                        colors={[
                          'rgba(30, 64, 175, 0.25)',
                          'rgba(30, 64, 175, 0.15)',
                          'rgba(30, 64, 175, 0.20)',
                        ]}
                      />
                    </RoundedRect>
                    {/* Border */}
                    <RoundedRect
                      x={0.5}
                      y={0.5}
                      width={GLASS_PILL_WIDTH - 1}
                      height={GLASS_PILL_HEIGHT - 1}
                      r={(GLASS_PILL_HEIGHT - 1) / 2}
                      style="stroke"
                      strokeWidth={1.5}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </Canvas>
                  {/* Pill content */}
                  <View style={styles.glassPillContent}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSearchPress?.();
                      }}
                      style={styles.pillIcon}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <SearchIconWhite />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onNotificationPress?.();
                      }}
                      style={styles.pillIcon}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <View>
                        <BellIcon />
                        <NotificationBadge
                          count={unreadCount}
                          size="small"
                          style={styles.notificationBadge}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onProfilePress?.();
                      }}
                      style={styles.pillAvatar}
                      activeOpacity={0.8}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <AvatarImage profilePictureUrl={profilePictureUrl} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : showBackButton && onBack ? (
              // Back button with title (for settings, etc.)
              <>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBack();
                  }}
                  style={styles.backButton}
                >
                  <BackArrowIcon />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  {headerTitle && <Text style={styles.headerTitle}>{headerTitle}</Text>}
                  {headerSubtitle && <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>}
                </View>
              </>
            ) : hasCustomHeader && showGlassPill ? (
              // Custom header with glass pill (for job matches, etc.)
              <>
                <View style={styles.titleContainerCustom}>
                  <Text style={styles.headerTitleCustom} numberOfLines={1}>{headerTitle}</Text>
                  {headerSubtitle && (
                    <Text style={styles.headerSubtitleCustom}>{headerSubtitle}</Text>
                  )}
                </View>
                <View style={styles.glassPillContainer}>
                  {/* Glass pill blur background */}
                  <BlurView
                    style={styles.glassPillBlur}
                    blurType="light"
                    blurAmount={20}
                    reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
                    pointerEvents="none"
                  />
                  {/* Glass pill Skia overlay */}
                  <Canvas style={styles.glassPillCanvas} pointerEvents="none">
                    <RoundedRect x={0} y={0} width={GLASS_PILL_WIDTH} height={GLASS_PILL_HEIGHT} r={GLASS_PILL_HEIGHT / 2}>
                      <SkiaLinearGradient
                        start={vec(0, 0)}
                        end={vec(0, GLASS_PILL_HEIGHT)}
                        colors={[
                          'rgba(30, 64, 175, 0.25)',
                          'rgba(30, 64, 175, 0.15)',
                          'rgba(30, 64, 175, 0.20)',
                        ]}
                      />
                    </RoundedRect>
                    {/* Border */}
                    <RoundedRect
                      x={0.5}
                      y={0.5}
                      width={GLASS_PILL_WIDTH - 1}
                      height={GLASS_PILL_HEIGHT - 1}
                      r={(GLASS_PILL_HEIGHT - 1) / 2}
                      style="stroke"
                      strokeWidth={1.5}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </Canvas>
                  {/* Pill content */}
                  <View style={styles.glassPillContent}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSearchPress?.();
                      }}
                      style={styles.pillIcon}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <SearchIconWhite />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onNotificationPress?.();
                      }}
                      style={styles.pillIcon}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <View>
                        <BellIcon />
                        <NotificationBadge
                          count={unreadCount}
                          size="small"
                          style={styles.notificationBadge}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onProfilePress?.();
                      }}
                      style={styles.pillAvatar}
                      activeOpacity={0.8}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <AvatarImage profilePictureUrl={profilePictureUrl} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : hasCustomHeader ? (
              <>
                <View style={styles.logoContainer}>
                  <LogoWhite width={44} height={37} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.headerTitleLarge}>{headerTitle}</Text>
                  {headerSubtitle && (
                    <Text style={styles.headerSubtitleSmall}>{headerSubtitle}</Text>
                  )}
                </View>
              </>
            ) : (
              <>
                <LogoWhite width={39} height={33} />
                <View style={styles.titleContainerDefault}>
                  <Text style={styles.headerTitleLarge} numberOfLines={1}>CPDash AI</Text>
                </View>
                {showGlassPill ? (
                  <View style={styles.glassPillContainer}>
                    {/* Glass pill blur background */}
                    <BlurView
                      style={styles.glassPillBlur}
                      blurType="light"
                      blurAmount={20}
                      reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.3)"
                      pointerEvents="none"
                    />
                    {/* Glass pill Skia overlay */}
                    <Canvas style={styles.glassPillCanvas} pointerEvents="none">
                      <RoundedRect x={0} y={0} width={GLASS_PILL_WIDTH} height={GLASS_PILL_HEIGHT} r={GLASS_PILL_HEIGHT / 2}>
                        <SkiaLinearGradient
                          start={vec(0, 0)}
                          end={vec(0, GLASS_PILL_HEIGHT)}
                          colors={[
                            'rgba(30, 64, 175, 0.25)',
                            'rgba(30, 64, 175, 0.15)',
                            'rgba(30, 64, 175, 0.20)',
                          ]}
                        />
                      </RoundedRect>
                      {/* Border */}
                      <RoundedRect
                        x={0.5}
                        y={0.5}
                        width={GLASS_PILL_WIDTH - 1}
                        height={GLASS_PILL_HEIGHT - 1}
                        r={(GLASS_PILL_HEIGHT - 1) / 2}
                        style="stroke"
                        strokeWidth={1.5}
                        color="rgba(255, 255, 255, 0.5)"
                      />
                    </Canvas>
                    {/* Pill content */}
                    <View style={styles.glassPillContent}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onSearchPress?.();
                        }}
                        style={styles.pillIcon}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <SearchIconWhite />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onNotificationPress?.();
                        }}
                        style={styles.pillIcon}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <View>
                          <BellIcon />
                          <NotificationBadge
                            count={unreadCount}
                            size="small"
                            style={styles.notificationBadge}
                          />
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onProfilePress?.();
                        }}
                        style={styles.pillAvatar}
                        activeOpacity={0.8}
                        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                      >
                        <AvatarImage profilePictureUrl={profilePictureUrl} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : showSearch ? (
                  <TouchableOpacity
                    onPress={onSearchPress}
                    style={styles.searchButton}
                    activeOpacity={0.7}
                  >
                    <SearchIcon width={24} height={24} />
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// Export directly without memo - layout components should re-render when context changes
export default CandidateLayoutComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Glass effect header - frosted glass with blur
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    // Figma shadow: 0px 5px 10px -2px rgba(37, 99, 235, 0.25)
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  // Skia glass canvas for premium polish
  glassCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 70,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonGlass: {
    marginRight: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  backButtonGlassCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainerCustom: {
    flex: 1,
    marginRight: 8,
  },
  headerTitleCustom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitleCustom: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    lineHeight: 20,
  },
  logoContainer: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleContainerDefault: {
    flex: 1,
    marginHorizontal: 8,
    minWidth: 60,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitleLarge: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  headerSubtitleSmall: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  searchButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  // Glass pill styles
  glassPillContainer: {
    width: GLASS_PILL_WIDTH,
    height: GLASS_PILL_HEIGHT,
    borderRadius: GLASS_PILL_HEIGHT / 2,
    overflow: 'hidden',
  },
  glassPillBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: GLASS_PILL_HEIGHT / 2,
    overflow: 'hidden',
  },
  glassPillCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  glassPillContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    zIndex: 10,
  },
  pillIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    marginLeft: 4,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
  },
});
