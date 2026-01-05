import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TalentPartnerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function TalentPartnerLayout({
  children,
  title = 'Dashboard',
  subtitle,
}: TalentPartnerLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header with World Map Pattern */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#4F7DF3', '#5B8AF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* World Map Background Pattern */}
          <View style={styles.patternContainer}>
            <Image
              source={require('../../assets/images/talent-partner/layout/header.png')}
              style={styles.headerImage}
              resizeMode="cover"
            />
          </View>

          {/* Header Content */}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View className="flex-1">
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4F7DF3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    minHeight: 100,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerImage: {
    width: SCREEN_WIDTH,
    height: 140,
    opacity: 0.15,
  },
  headerContent: {
    zIndex: 1,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
});
