import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Ellipse, G, Defs, Filter, FeFlood, FeColorMatrix, FeMorphology, FeOffset, FeGaussianBlur, FeComposite, FeBlend, ClipPath } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Success checkmark icon with decorative dots (from apply.svg)
const SuccessCheckIcon = ({ size = 180 }: { size?: number }) => {
  const scale = size / 187;
  return (
    <Svg width={193 * scale} height={187 * scale} viewBox="0 0 193 187" fill="none">
      {/* Decorative dots */}
      <Ellipse cx="185.5" cy="32.1571" rx="7.5" ry="7.19936" fill="#2563EB" />
      <Ellipse cx="20" cy="18.2383" rx="10" ry="9.59914" fill="#2563EB" />
      <Ellipse cx="15" cy="141.107" rx="5" ry="4.79957" fill="#2563EB" />
      <Ellipse cx="170.5" cy="167.505" rx="2.5" ry="2.39979" fill="#2563EB" />
      <Ellipse cx="136.5" cy="2.39979" rx="2.5" ry="2.39979" fill="#2563EB" />
      <Ellipse cx="67.5" cy="182.864" rx="3.5" ry="3.3597" fill="#2563EB" />
      <Ellipse cx="127" cy="177.584" rx="1" ry="0.959914" fill="#2563EB" />
      <Ellipse cx="185.5" cy="127.189" rx="2.5" ry="2.39979" fill="#2563EB" />
      <Ellipse cx="1" cy="78.7128" rx="1" ry="0.959914" fill="#2563EB" />
      {/* Main circle with checkmark */}
      <G>
        <Rect x="20" y="12" width="156" height="156" rx="78" fill="white" fillOpacity="0.75" />
        <Path
          d="M98 14.5C139.697 14.5 173.5 48.3025 173.5 90C173.5 131.697 139.697 165.5 98 165.5C56.3025 165.5 22.5 131.697 22.5 90C22.5 48.3025 56.3025 14.5 98 14.5Z"
          fill="#2563EB"
          stroke="white"
        />
      </G>
      {/* Checkmark */}
      <Path
        d="M141.166 88.9621V93.0254C141.161 102.55 138.077 111.817 132.374 119.445C126.672 127.073 118.656 132.654 109.523 135.354C100.389 138.055 90.6276 137.73 81.6936 134.43C72.7596 131.129 65.1319 125.029 59.9481 117.039C54.7643 109.049 52.3021 99.5977 52.9287 90.0942C53.5554 80.5906 57.2373 71.5442 63.4254 64.3042C69.6135 57.0641 77.9761 52.0184 87.2662 49.9194C96.5562 47.8205 106.276 48.7808 114.976 52.6571M141.166 57.6668L96.9997 101.878L83.7497 88.6277"
        stroke="white"
        strokeOpacity="0.75"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Briefcase icon for "Find More Jobs"
const BriefcaseIcon = ({ size = 48, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// List icon for "Track Applications"
const ListIcon = ({ size = 48, color = '#2563EB' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 6H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 12H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 18H21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 6H3.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 12H3.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 18H3.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Close X icon
const CloseIcon = ({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

interface ApplicationSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions?: ActionCardProps[];
  onFindMoreJobs?: () => void;
  onTrackApplications?: () => void;
}

export default function ApplicationSuccessPopup({
  visible,
  onClose,
  title = 'Successfully Applied',
  actions,
  onFindMoreJobs,
  onTrackApplications,
}: ApplicationSuccessPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;

  // Default actions if not provided
  const defaultActions: ActionCardProps[] = [
    {
      icon: <BriefcaseIcon size={40} color="#2563EB" />,
      title: 'Find More Jobs',
      description: 'Hunt more Project, according to your Matchs',
      onPress: onFindMoreJobs || onClose,
    },
    {
      icon: <ListIcon size={40} color="#2563EB" />,
      title: 'Track Applications',
      description: 'Check your Application Status',
      onPress: onTrackApplications || onClose,
    },
  ];

  const actionCards = actions || defaultActions;

  useEffect(() => {
    if (visible) {
      // Trigger success haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      iconScaleAnim.setValue(0);
      cardsAnim.setValue(0);

      // Run animations in sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Icon bounce animation after card appears
        Animated.sequence([
          Animated.spring(iconScaleAnim, {
            toValue: 1.15,
            tension: 80,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();

        // Cards fade in
        Animated.timing(cardsAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleActionPress = (action: ActionCardProps) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action.onPress();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.container, { opacity: fadeAnim }]}
      >
        {/* Heavy Blur Background */}
        <BlurView
          intensity={100}
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <View style={[StyleSheet.absoluteFill, styles.blurOverlay]} />
          <Pressable
            style={styles.backdropPressable}
            onPress={handleClose}
          />
        </BlurView>

        {/* Popup Card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <CloseIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Content Container */}
          <View style={styles.content}>
            {/* Success Icon with animation */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: iconScaleAnim }] },
              ]}
            >
              <SuccessCheckIcon size={170} />
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Action Cards */}
            <Animated.View
              style={[
                styles.actionsContainer,
                { opacity: cardsAnim },
              ]}
            >
              {actionCards.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionCard}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionIconContainer}>
                    {action.icon}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginHorizontal: 24,
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    // Premium shadow
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Shadow for close button
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    // Card border
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
    // Shadow for action cards
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
