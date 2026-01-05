import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import ClaraSvg from '../assets/images/clara.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  image?: any;
  title: string;
  description: string;
  isClara?: boolean;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    image: require('../assets/images/onBoarding_1.jpg'),
    title: 'Build your perfect CV with AI.',
    description: 'Get instant feedback and ATS optimization.',
  },
  {
    id: '2',
    image: require('../assets/images/onBoarding_2.jpg'),
    title: 'Understand Your Strengths and Gaps',
    description: 'Track Progress with Ai-driven Skill Insights.',
  },
  {
    id: '3',
    title: 'Meet',
    description: 'Your AI companion for career clarity, confidence, and emotional support.',
    isClara: true,
  },
];

// Only show pagination for image slides (not Clara)
const imageSlides = slides.filter(s => !s.isClara);

// Arrow Right Icon
const ArrowRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Path
      d="M4 10H16M16 10L11 5M16 10L11 15"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface OnboardingScreenProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Animation values
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate card entrance
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      Haptics.selectionAsync();
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFinish();
  };

  const renderClaraSlide = () => {
    return (
      <View style={styles.slideContainer}>
        <StatusBar barStyle="light-content" />

        {/* Background gradient - cyan top-left to purple bottom-right */}
        <LinearGradient
          colors={['#06B6D4', '#3B82F6', '#8B5CF6']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Content Container */}
        <View style={styles.claraContent}>
          <View style={styles.claraCardWrapper}>
            {/* Clara Image - Overlapping with white circle */}
            <View style={styles.claraImageContainer}>
              <View style={styles.claraImageCircle}>
                <ClaraSvg width={120} height={120} />
              </View>
            </View>

            {/* White Card Container */}
            <View style={styles.claraCard}>
              {/* Title */}
              <Text style={styles.claraTitleMeet}>Meet</Text>

              {/* Subtitle */}
              <Text style={styles.claraSubtitle}>
                Your AI companion for career clarity,{'\n'}confidence, and emotional support.
              </Text>

              {/* Features Box */}
              <View style={styles.claraFeatures}>
                {[
                  'Personalized career & emotional insights',
                  'Daily motivation & confidence coaching',
                  'Stress & burnout prediction',
                  'Conflict & communication guidance',
                ].map((feature, index) => (
                  <View key={index} style={styles.claraFeatureRow}>
                    <View style={styles.claraFeatureDot} />
                    <Text style={styles.claraFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Start Button with glass effect */}
              <View style={styles.claraButtonWrapper}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onFinish();
                  }}
                  activeOpacity={0.9}
                  style={styles.claraButtonTouchable}
                >
                  <LinearGradient
                    colors={['#06B6D4', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.claraButtonGradient}
                  >
                    <View style={styles.claraButtonOverlay}>
                      <Text style={styles.claraButtonText}>Start With Clara</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Skip Button */}
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    if (item.isClara) {
      return renderClaraSlide();
    }

    return (
      <View style={styles.slideContainer}>
        <StatusBar barStyle="light-content" />

        {/* Full-screen Image */}
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </View>

        {/* White Card at bottom */}
        <Animated.View
          style={[
            styles.contentCard,
            {
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
              opacity: cardAnim,
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.slideTitle}>{item.title}</Text>

          {/* Description */}
          <Text style={styles.slideDescription}>{item.description}</Text>

          {/* Progress Dots - active has gradient, inactive are pills */}
          <View style={styles.dotsContainer}>
            {imageSlides.map((_, dotIndex) => (
              dotIndex === currentIndex ? (
                // Active dot with gradient
                <LinearGradient
                  key={dotIndex}
                  colors={['#06B6D4', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dotActive}
                />
              ) : (
                // Inactive dot - pill shape
                <View
                  key={dotIndex}
                  style={styles.dotInactive}
                />
              )
            ))}
          </View>

          {/* Next Button with gradient and glass effect */}
          <Animated.View
            style={[
              styles.buttonWrapper,
              { transform: [{ scale: buttonScale }] },
            ]}
          >
            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.9}
              style={styles.nextButtonTouchable}
            >
              {/* Button gradient background */}
              <LinearGradient
                colors={['#06B6D4', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={styles.buttonGradient}
              >
                {/* Blue overlay */}
                <View style={styles.buttonBlueOverlay}>
                  <Text style={styles.nextButtonText}>Next</Text>
                  <ArrowRightIcon />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Skip Button */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        bounces={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  // Image Slide Styles
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  contentCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 50, // More padding for safe area
    // Card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 36,
  },
  slideDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 24,
  },
  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  dotActive: {
    width: 32,
    height: 10,
    borderRadius: 5,
    // Glass shadow effect
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dotInactive: {
    width: 18,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  // Button
  buttonWrapper: {
    marginBottom: 16,
    borderRadius: 30,
    // Glass shadow: box-shadow: 0px 5px 10px -2px #2563EB40
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  nextButtonTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: 30,
  },
  buttonBlueOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '400',
  },
  // Clara Slide Styles
  claraContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  claraCardWrapper: {
    position: 'relative',
  },
  claraImageContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  claraImageCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  claraCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 50,
  },
  claraTitleMeet: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  claraSubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  claraFeatures: {
    marginBottom: 24,
    gap: 10,
  },
  claraFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claraFeatureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginRight: 10,
  },
  claraFeatureText: {
    color: '#6B7280',
    fontSize: 14,
    flex: 1,
  },
  claraButtonWrapper: {
    marginBottom: 16,
    borderRadius: 30,
    // Glass shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  claraButtonTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  claraButtonGradient: {
    borderRadius: 30,
  },
  claraButtonOverlay: {
    backgroundColor: 'rgba(37, 99, 235, 0.8)',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  claraButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
