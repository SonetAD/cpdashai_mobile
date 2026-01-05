import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Decorative white circle arc in top right
const CircleArc = () => {
  return (
    <Svg
      width={200}
      height={200}
      viewBox="0 0 200 200"
      fill="none"
      style={{ position: 'absolute', top: -20, right: -60 }}
    >
      <Circle
        cx={100}
        cy={100}
        r={90}
        stroke="rgba(255, 255, 255, 0.35)"
        strokeWidth={2}
        fill="none"
      />
    </Svg>
  );
};

// Target/Bullseye Icon for Candidate (matching Figma)
const CandidateIcon = () => {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      {/* Outer circle */}
      <Circle cx={16} cy={16} r={14} stroke="#06B6D4" strokeWidth={1.5} fill="none" />
      {/* Middle circle */}
      <Circle cx={16} cy={16} r={9} stroke="#06B6D4" strokeWidth={1.5} fill="none" />
      {/* Inner circle */}
      <Circle cx={16} cy={16} r={4} stroke="#06B6D4" strokeWidth={1.5} fill="none" />
      {/* Center dot */}
      <Circle cx={16} cy={16} r={1.5} fill="#06B6D4" />
      {/* Crosshair lines */}
      <Path d="M16 2V6" stroke="#06B6D4" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 26V30" stroke="#06B6D4" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M2 16H6" stroke="#06B6D4" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M26 16H30" stroke="#06B6D4" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
};

// User Icon for Talent Partners
const TalentIcon = () => {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 3C10.686 3 8 5.686 8 9C8 12.314 10.686 15 14 15C17.314 15 20 12.314 20 9C20 5.686 17.314 3 14 3Z"
        fill="rgba(255, 255, 255, 0.9)"
      />
      <Path
        d="M14 17C19.523 17 24 20.477 24 25C24 25.552 23.552 26 23 26H5C4.448 26 4 25.552 4 25C4 20.477 8.477 17 14 17Z"
        fill="rgba(255, 255, 255, 0.9)"
      />
    </Svg>
  );
};

// Chevron Right Icon
const ChevronRight = () => {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke="rgba(255, 255, 255, 0.7)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

interface CreateAccountScreenProps {
  onRoleSelect: (role: 'candidate' | 'recruiter') => void;
}

export default function CreateAccountScreen({ onRoleSelect }: CreateAccountScreenProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardScale1 = useRef(new Animated.Value(0.95)).current;
  const cardScale2 = useRef(new Animated.Value(0.95)).current;
  const cardOpacity1 = useRef(new Animated.Value(0)).current;
  const cardOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      // Title fade and slide
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Card 1 animation (delayed)
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.spring(cardScale1, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Card 2 animation (more delayed)
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.spring(cardScale2, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleCandidatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Press animation
    Animated.sequence([
      Animated.timing(cardScale1, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale1, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRoleSelect('candidate');
    });
  };

  const handleRecruiterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Press animation
    Animated.sequence([
      Animated.timing(cardScale2, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale2, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onRoleSelect('recruiter');
    });
  };

  return (
    <View style={styles.container}>
      {/*
        Background layers (from Figma):
        1. Base: linear-gradient(145.78deg, cyan 10.62%, transparent 50.64%, purple 90.66%)
        2. Overlay: linear-gradient(0deg, rgba(37, 99, 235, 0.8), rgba(37, 99, 235, 0.8))

        The overlay blends with the base gradient to create the final effect
      */}

      {/* Base gradient layer: cyan to purple at 145.78deg */}
      <LinearGradient
        colors={[
          '#06B6D4',  // Cyan (fully opaque for better visibility)
          '#8B5CF6',  // Purple
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Blue overlay at 80% - this creates the blended effect */}
      <View style={styles.blueOverlay} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Decorative circle arc */}
        <CircleArc />

        <View style={styles.content}>
          {/* Animated Title */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.title}>
              Create{'\n'}Your{'\n'}Account
            </Text>
            <Text style={styles.subtitle}>
              Choose your role to get started.
            </Text>
          </Animated.View>

          {/* Candidate Card - Gradient with glass layers and borders */}
          <Animated.View
            style={[
              styles.candidateCardOuter,
              {
                opacity: cardOpacity1,
                transform: [{ scale: cardScale1 }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleCandidatePress}
              activeOpacity={1}
              accessibilityLabel="Select Candidate role"
              accessibilityRole="button"
            >
              {/* Layer 1: Base gradient background */}
              <LinearGradient
                colors={['#06B6D4', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.candidateCardGradient}
              >
                {/* Blue overlay */}
                <View style={styles.candidateCardOverlay}>
                  {/* Layer 2: Inner glass effect with blur and white borders */}
                  <BlurView intensity={12} tint="light" style={styles.candidateGlassInner}>
                    <View style={styles.candidateGlassContent}>
                      {/* Card content */}
                      <View style={styles.cardContentPadded}>
                        <View style={styles.cardRow}>
                          <View style={styles.cardTextContainer}>
                            <View style={styles.iconTitleRow}>
                              <CandidateIcon />
                              <Text style={styles.candidateTitle}>Candidate</Text>
                            </View>
                            <Text style={styles.cardDescription}>
                              Your AI-powered career companion for CV improvement, job matching, interviews, AI career coach, upskilling and well-being support
                            </Text>
                          </View>
                          <View style={styles.chevronContainer}>
                            <ChevronRight />
                          </View>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Talent Partners Card - Glass effect only */}
          <Animated.View
            style={[
              styles.talentCardOuter,
              {
                opacity: cardOpacity2,
                transform: [{ scale: cardScale2 }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleRecruiterPress}
              activeOpacity={1}
              accessibilityLabel="Select Talent Partners role"
              accessibilityRole="button"
            >
              <BlurView intensity={15} tint="light" style={styles.talentCardBlur}>
                <View style={styles.talentCardInner}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardTextContainer}>
                      <View style={styles.iconTitleRow}>
                        <TalentIcon />
                        <Text style={styles.talentTitle}>Tallent Partners</Text>
                      </View>
                      <Text style={styles.cardDescription}>
                        Discover qualified talent, review higher-quality applications, and make faster, more confident hiring decisions with AI-enhanced support.
                      </Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <ChevronRight />
                    </View>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  title: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 60,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 48,
    fontWeight: '400',
  },
  // Candidate Card Styles
  candidateCardOuter: {
    marginBottom: 16,
    borderRadius: 20,
    // Combined shadows: cyan glow + purple shadow
    // box-shadow: 0px 0px 10px 2px #06B6D433
    // box-shadow: 0px 5px 10px -2px #8B5CF673
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  candidateCardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  candidateCardOverlay: {
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    padding: 8,
  },
  candidateGlassInner: {
    borderRadius: 16,
    overflow: 'hidden',
    // Inner glass shadow: box-shadow: 0px 5px 10px -2px #2563EB40
  },
  candidateGlassContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContentPadded: {
    padding: 16,
    paddingVertical: 18,
  },
  // Talent Partners Card Styles
  talentCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    // box-shadow: 0px 5px 10px -2px #2563EB40
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  talentCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  talentCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  // Shared Card Styles
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  candidateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2DD4BF', // Teal/cyan color for candidate
  },
  talentTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 21,
  },
  chevronContainer: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
});
