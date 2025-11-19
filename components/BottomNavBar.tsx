import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeIcon from '../assets/images/navbar/home.svg';
import JobsIcon from '../assets/images/navbar/jobs.svg';
import AICoachIcon from '../assets/images/navbar/aiCoach.svg';
import ProfileIcon from '../assets/images/navbar/profile.svg';

interface NavItem {
  id: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { id: 'home', icon: HomeIcon },
  { id: 'jobs', icon: JobsIcon },
  { id: 'aiCoach', icon: AICoachIcon },
  { id: 'profile', icon: ProfileIcon },
];

interface BottomNavBarProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
}

export default function BottomNavBar({
  activeTab = 'home',
  onTabPress,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary-blue"
      style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 34 }}
    >
      <View className="flex-row justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onTabPress?.(item.id)}
              className="items-center justify-center flex-1"
              activeOpacity={0.7}
              style={{ opacity: isActive ? 1 : 0.7 }}
            >
              <Icon width={68} height={52} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
