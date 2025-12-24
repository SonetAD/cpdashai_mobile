import React from 'react';
import { View, TouchableOpacity, Platform, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import HomeIcon from '../assets/images/navbar/home.svg';
import JobsIcon from '../assets/images/navbar/jobs.svg';
import AICoachIcon from '../assets/images/navbar/aiCoach.svg';
import ProfileIcon from '../assets/images/navbar/profile.svg';

interface NavItem {
  id: string;
  icon?: React.ComponentType<any>;
  label?: string;
  renderIcon?: (isActive: boolean) => React.ReactNode;
}

// Candidate nav items
const candidateNavItems: NavItem[] = [
  { id: 'home', icon: HomeIcon },
  { id: 'jobs', icon: JobsIcon },
  { id: 'aiCoach', icon: AICoachIcon },
  { id: 'profile', icon: ProfileIcon },
];

// Talent Partner nav items with icons
const talentPartnerNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    renderIcon: (isActive: boolean) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9.02 2.84016L3.63 7.04016C2.73 7.74016 2 9.23016 2 10.3602V17.7702C2 20.0902 3.89 21.9902 6.21 21.9902H17.79C20.11 21.9902 22 20.0902 22 17.7802V10.5002C22 9.29016 21.19 7.74016 20.2 7.05016L14.02 2.72016C12.62 1.74016 10.37 1.79016 9.02 2.84016Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M12 17.99V14.99"
          stroke={isActive ? '#437EF4' : 'rgba(255, 255, 255, 0.8)'}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    id: 'talent',
    label: 'Talent',
    renderIcon: (isActive: boolean) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C9.12 11.49 9.13 11.49 9.15 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M14.08 14.15C11.29 12.29 6.74 12.29 3.93 14.15C2.66 15 1.96 16.15 1.96 17.38C1.96 18.61 2.66 19.75 3.92 20.59C5.32 21.53 7.16 22 9 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M19.99 7.34C20.15 9.28 18.77 10.98 16.86 11.21C16.85 11.21 16.85 11.21 16.84 11.21H16.81C16.75 11.21 16.69 11.21 16.64 11.23C15.67 11.28 14.78 10.97 14.11 10.4C15.14 9.48 15.73 8.1 15.61 6.6C15.54 5.79 15.26 5.05 14.84 4.42C15.22 4.23 15.66 4.11 16.11 4.07C18.07 3.90 19.82 5.36 19.99 7.34Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M21.99 16.59C21.91 17.56 21.29 18.4 20.25 18.97C19.25 19.52 17.99 19.78 16.74 19.75C17.46 19.1 17.88 18.29 17.96 17.43C18.06 16.19 17.47 15 16.29 14.05C15.62 13.52 14.84 13.1 13.99 12.79C16.2 12.15 18.98 12.58 20.69 13.96C21.61 14.7 22.08 15.63 21.99 16.59Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
      </Svg>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    renderIcon: (isActive: boolean) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M7 10.75H5C2.58 10.75 1.25 9.42 1.25 7V5C1.25 2.58 2.58 1.25 5 1.25H7C9.42 1.25 10.75 2.58 10.75 5V7C10.75 9.42 9.42 10.75 7 10.75Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M19 10.75H17C14.58 10.75 13.25 9.42 13.25 7V5C13.25 2.58 14.58 1.25 17 1.25H19C21.42 1.25 22.75 2.58 22.75 5V7C22.75 9.42 21.42 10.75 19 10.75Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M19 22.75H17C14.58 22.75 13.25 21.42 13.25 19V17C13.25 14.58 14.58 13.25 17 13.25H19C21.42 13.25 22.75 14.58 22.75 17V19C22.75 21.42 21.42 22.75 19 22.75Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M7 22.75H5C2.58 22.75 1.25 21.42 1.25 19V17C1.25 14.58 2.58 13.25 5 13.25H7C9.42 13.25 10.75 14.58 10.75 17V19C10.75 21.42 9.42 22.75 7 22.75Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
      </Svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    renderIcon: (isActive: boolean) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
        <Path
          d="M12 14.5C6.99 14.5 2.91 17.86 2.91 22C2.91 22.28 3.13 22.5 3.41 22.5H20.59C20.87 22.5 21.09 22.28 21.09 22C21.09 17.86 17.01 14.5 12 14.5Z"
          fill={isActive ? 'white' : 'rgba(255, 255, 255, 0.5)'}
        />
      </Svg>
    ),
  },
];

interface BottomNavBarProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  userRole?: 'candidate' | 'recruiter';
}

export default function BottomNavBar({
  activeTab = 'home',
  onTabPress,
  userRole = 'candidate',
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const navItems = userRole === 'recruiter' ? talentPartnerNavItems : candidateNavItems;

  return (
    <View
      className="bg-primary-blue"
      style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 34 }}
    >
      <View className="flex-row justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          if (userRole === 'recruiter' && item.renderIcon) {
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onTabPress?.(item.id)}
                className="items-center justify-center flex-1 py-2"
                activeOpacity={0.7}
              >
                <View className="mb-1">{item.renderIcon(isActive)}</View>
                <Text
                  className="font-medium"
                  style={{
                    fontSize: 11,
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }

          // Candidate nav items with existing SVG icons
          const Icon = item.icon!;
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
