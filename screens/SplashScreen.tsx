import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import CpDashAILogo from '../assets/images/cpDashAILogo.svg';

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
    <View className="flex-1 bg-primary-blue">
      <ArrowPattern />
      <View style={StyleSheet.absoluteFillObject} className="justify-center items-start pl-20">
        <View className="mt-16">
          <CpDashAILogo width={207} height={44} />
        </View>
      </View>
    </View>
  );
}
