import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ClaraSvg from '../assets/images/clara.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    image: require('../assets/images/onBoarding_3.jpg'),
    title: 'Turn You Growth into Achievements.',
    description: 'Apply, earn badges, and level up your career.',
  },
  {
    id: '4',
    title: 'Meet Clara',
    description: 'Your AI companion for career clarity, confidence, and emotional support.',
    isClara: true,
  },
];

interface OnboardingScreenProps {
  onFinish: () => void;
}

export default function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      onFinish();
    }
  };

  const renderClaraSlide = () => {
    return (
      <View style={{ width: SCREEN_WIDTH }} className="flex-1 bg-primary-blue">
        {/* Blue Background with Text */}
        <View className="flex-1 relative">
          {/* Background Text */}
          <View className="absolute top-20 left-0 right-0 flex-row justify-between">
            <Text className="text-white opacity-10 text-6xl font-bold">hAI</Text>
            <Text className="text-white opacity-10 text-6xl font-bold">CpDas</Text>
          </View>

          {/* Content Container */}
          <View className="flex-1 justify-end items-center">
            <View className="w-full relative">
              {/* Clara Image - Overlapping */}
              <View className="absolute -top-20 left-0 right-0 items-center" style={{ zIndex: 20 }}>
                <View className="relative">
                  {/* Circular Border - White */}
                  <View
                    className="items-center justify-center overflow-hidden"
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: 85,
                      borderWidth: 5,
                      borderColor: '#437EF4',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <ClaraSvg width={160} height={160} />
                  </View>
                </View>
              </View>

              {/* White Card Container with Blue Border */}
              <View
                className="bg-white px-6 pt-24 pb-6 w-full"
                style={{
                  borderTopWidth: 4,
                  borderLeftWidth: 4,
                  borderRightWidth: 4,
                  borderColor: '#437EF4',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                }}
              >
                {/* Title */}
                <Text className="text-center text-2xl font-bold mb-2">
                  <Text className="text-gray-900">Meet </Text>
                  <Text className="text-primary-blue">Clara</Text>
                </Text>

                {/* Subtitle */}
                <Text className="text-gray-400 text-sm text-center mb-6">
                  Your AI companion for career clarity, confidence,{'\n'}and emotional support.
                </Text>

                {/* Features Box - Transparent with Border Only */}
                <View className="border border-primary-blue rounded-2xl px-4 py-4 mb-6" style={{ backgroundColor: 'transparent' }}>
                  {[
                    'Personalized career & emotional insights',
                    'Daily motivation & confidence coaching',
                    'Stress & burnout prediction',
                    'Conflict & communication guidance',
                  ].map((feature, index) => (
                    <View key={index} className="flex-row items-start mb-2">
                      <Text className="mr-2 text-xl" style={{ color: '#EAEAEB' }}>•</Text>
                      <Text className="text-gray-600 text-sm flex-1">{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Start Button */}
                <TouchableOpacity
                  onPress={onFinish}
                  className="bg-primary-blue py-4 rounded-xl items-center mb-3"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold text-base">
                    Start With Clara
                  </Text>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity onPress={onFinish} className="py-2">
                  <Text className="text-primary-blue text-center font-medium">
                    Skip
                  </Text>
                </TouchableOpacity>
              </View>
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
      <View style={{ width: SCREEN_WIDTH }} className="flex-1">
        {/* Image */}
        <View className="flex-1 relative">
          <Image
            source={item.image}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Gradient Overlay */}
          <View
            className="absolute bottom-0 left-0 right-0 h-40"
            style={{
              backgroundColor: 'transparent',
            }}
          />
        </View>

        {/* Content */}
        <View className="bg-white rounded-t-3xl px-8 pt-10 pb-8">
          {/* Title */}
          <Text className="text-gray-900 text-3xl font-bold mb-3 leading-tight">
            {item.title}
          </Text>

          {/* Description */}
          <Text className="text-gray-500 text-base mb-8">
            {item.description}
          </Text>

          {/* Progress Dots */}
          <View className="flex-row justify-center mb-6">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${
                  index === currentIndex
                    ? 'bg-primary-blue w-8'
                    : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-primary-blue py-4 rounded-xl flex-row items-center justify-center mb-4"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold text-base mr-2">
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity onPress={onFinish} className="py-2">
            <Text className="text-primary-blue text-center font-medium">
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
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
      />
    </SafeAreaView>
  );
}
