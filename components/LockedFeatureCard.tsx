import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface LockedFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onUpgrade: () => void;
  color?: string;
}

const LockIcon = ({ color = '#9CA3AF' }: { color?: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"
      stroke={color}
      strokeWidth={2}
      fill="none"
    />
    <Path
      d="M7 11V7a5 5 0 0 1 10 0v4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
  title,
  description,
  icon,
  onUpgrade,
  color = '#437EF4',
}) => {
  return (
    <TouchableOpacity
      className="bg-white rounded-3xl p-5 mb-4 shadow-md border-2 border-gray-200"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        opacity: 0.85,
      }}
      onPress={onUpgrade}
      activeOpacity={0.7}
    >
      {/* Lock Badge */}
      <View className="absolute top-3 right-3 bg-gray-100 rounded-full px-3 py-1 flex-row items-center">
        <LockIcon color="#6B7280" />
        <Text className="text-gray-600 text-xs font-semibold ml-1">Premium</Text>
      </View>

      {/* Content */}
      <View className="flex-row items-start">
        <View className="bg-gray-100 rounded-2xl p-4 mr-4" style={{ opacity: 0.5 }}>
          {icon}
        </View>
        <View className="flex-1 pt-1">
          <Text className="text-gray-400 text-lg font-bold mb-1">{title}</Text>
          <Text className="text-gray-400 text-sm leading-5 mb-3">{description}</Text>

          {/* Upgrade Button */}
          <View className="flex-row items-center mt-2">
            <View
              className="rounded-full px-4 py-2"
              style={{ backgroundColor: `${color}20` }}
            >
              <Text className="text-xs font-bold" style={{ color }}>
                Unlock Feature →
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Blur Overlay Effect */}
      <View
        className="absolute inset-0 rounded-3xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        }}
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
};

export default LockedFeatureCard;
