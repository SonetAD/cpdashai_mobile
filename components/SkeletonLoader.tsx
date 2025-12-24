import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  type?: 'auth' | 'dashboard' | 'profile';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'auth' }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === 'profile') {
    return (
      <View style={styles.container}>
        {/* Profile Header skeleton */}
        <View style={styles.profileHeader}>
          <Animated.View style={[styles.avatarLarge, { opacity }]} />
          <Animated.View style={[styles.line, styles.lineMedium, { opacity, marginTop: 12 }]} />
          <Animated.View style={[styles.line, styles.lineShort, { opacity, marginTop: 8 }]} />
        </View>

        {/* Tabs skeleton */}
        <View style={styles.tabsContainer}>
          <Animated.View style={[styles.tab, { opacity }]} />
          <Animated.View style={[styles.tab, { opacity }]} />
          <Animated.View style={[styles.tab, { opacity }]} />
          <Animated.View style={[styles.tab, { opacity }]} />
        </View>

        {/* Fields skeleton */}
        <View style={styles.fieldsContainer}>
          <Animated.View style={[styles.field, { opacity }]} />
          <Animated.View style={[styles.field, { opacity }]} />
          <Animated.View style={[styles.field, { opacity }]} />
          <Animated.View style={[styles.field, { opacity }]} />
        </View>
      </View>
    );
  }

  if (type === 'dashboard') {
    return (
      <View style={styles.container}>
        {/* Header skeleton */}
        <View style={styles.dashboardHeader}>
          <Animated.View style={[styles.circle, { opacity }]} />
          <View style={styles.headerText}>
            <Animated.View style={[styles.line, styles.lineShort, { opacity }]} />
            <Animated.View style={[styles.line, styles.lineVeryShort, { opacity }]} />
          </View>
        </View>

        {/* Stats cards skeleton */}
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.statCard, { opacity }]} />
          <Animated.View style={[styles.statCard, { opacity }]} />
        </View>

        {/* Action cards skeleton */}
        <View style={styles.actionsContainer}>
          <Animated.View style={[styles.actionCard, { opacity }]} />
          <Animated.View style={[styles.actionCard, { opacity }]} />
          <Animated.View style={[styles.actionCard, { opacity }]} />
        </View>
      </View>
    );
  }

  // Auth screens skeleton
  return (
    <View style={styles.container}>
      {/* Logo/Title skeleton */}
      <View style={styles.authHeader}>
        <Animated.View style={[styles.logo, { opacity }]} />
        <Animated.View style={[styles.line, styles.lineLong, { opacity, marginTop: 20 }]} />
        <Animated.View style={[styles.line, styles.lineMedium, { opacity, marginTop: 8 }]} />
      </View>

      {/* Form fields skeleton */}
      <View style={styles.formContainer}>
        <Animated.View style={[styles.input, { opacity }]} />
        <Animated.View style={[styles.input, { opacity }]} />
        <Animated.View style={[styles.button, { opacity, marginTop: 20 }]} />
      </View>

      {/* Bottom text skeleton */}
      <View style={styles.bottomContainer}>
        <Animated.View style={[styles.line, styles.lineShort, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 24,
  },
  // Auth skeleton styles
  authHeader: {
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
  },
  formContainer: {
    marginTop: 20,
  },
  input: {
    height: 56,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    height: 56,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  // Dashboard skeleton styles
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#2AD1CC',
    padding: 20,
    borderRadius: 12,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    height: 80,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
  },
  // Line styles
  line: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  lineShort: {
    width: '40%',
  },
  lineMedium: {
    width: '60%',
  },
  lineLong: {
    width: '80%',
  },
  lineVeryShort: {
    width: '30%',
    marginTop: 8,
  },
  // Profile skeleton styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E0E0E0',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    width: 80,
    height: 36,
    backgroundColor: '#E0E0E0',
    borderRadius: 18,
  },
  fieldsContainer: {
    gap: 16,
  },
  field: {
    height: 56,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
});
