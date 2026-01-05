import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import LogoWhite from '../assets/images/logoWhite.svg';

const { width, height } = Dimensions.get('window');

const ArrowPattern = () => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 430 932"
      style={StyleSheet.absoluteFillObject}
      preserveAspectRatio="xMidYMid slice"
    >
      <Path
        d="M608.75 25.7959L608.75 980.204L-61.8809 503L608.75 25.7959Z"
        stroke="white"
        strokeOpacity={0.21}
        strokeWidth={50}
        fill="none"
      />
    </Svg>
  );
};

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={['#5B4FC4', '#6B5DD3']}
      locations={[0, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ArrowPattern />
      <View style={[StyleSheet.absoluteFillObject, { paddingTop: 60 }]} className="justify-center items-center">
        <View className="flex-row items-center">
          <LogoWhite width={44} height={44} />
          <Text style={{ fontSize: 28, fontWeight: '700', color: 'white', marginLeft: 12, letterSpacing: 1 }}>
            CPDASHAI
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
