import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, LinearGradient, vec } from '@shopify/react-native-skia';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = SCREEN_WIDTH - 48;
const MIN_HEIGHT = 200;

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose?: () => void;
  loading?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onClose,
  loading = false,
}) => {
  const [contentHeight, setContentHeight] = useState(MIN_HEIGHT);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setContentHeight(Math.max(height, MIN_HEIGHT));
    }
  };

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.15)' };
      case 'error':
        return { color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
      case 'warning':
        return { color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.15)' };
    }
  };

  const getIcon = () => {
    const { color } = getIconConfig();
    switch (type) {
      case 'success':
        return (
          <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'error':
        return (
          <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <Path
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'warning':
        return (
          <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      default:
        return (
          <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <Path
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const { bgColor } = getIconConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Glass Shadow */}
          <View style={[styles.shadowLayer, { height: contentHeight }]} />

          {/* Glass Background */}
          <Canvas style={[styles.canvas, { height: contentHeight }]}>
            <RoundedRect x={0} y={0} width={ALERT_WIDTH} height={contentHeight} r={28}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(ALERT_WIDTH, contentHeight)}
                colors={['rgba(255, 255, 255, 0.98)', 'rgba(248, 250, 252, 0.95)', 'rgba(241, 245, 249, 0.92)']}
              />
            </RoundedRect>
            {/* Top highlight */}
            <RoundedRect x={2} y={2} width={ALERT_WIDTH - 4} height={60} r={26}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, 60)}
                colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
              />
            </RoundedRect>
            {/* Border */}
            <RoundedRect
              x={0.5}
              y={0.5}
              width={ALERT_WIDTH - 1}
              height={contentHeight - 1}
              r={27.5}
              style="stroke"
              strokeWidth={1}
              color="rgba(148, 163, 184, 0.3)"
            />
          </Canvas>

          {/* Content */}
          <View style={styles.content} onLayout={handleLayout}>
            {/* Icon Badge */}
            <View style={[styles.iconBadge, { backgroundColor: bgColor }]}>
              {getIcon()}
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            )}

            {/* Buttons */}
            {!loading && (
              <View style={styles.buttonContainer}>
                {buttons.map((button, index) => {
                  const isDestructive = button.style === 'destructive';
                  const isCancel = button.style === 'cancel';

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        isDestructive && styles.buttonDestructive,
                        isCancel && styles.buttonCancel,
                        !isDestructive && !isCancel && styles.buttonDefault,
                        buttons.length === 1 && { flex: 1 },
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.buttonText,
                        isDestructive && styles.buttonTextDestructive,
                        isCancel && styles.buttonTextCancel,
                        !isDestructive && !isCancel && styles.buttonTextDefault,
                      ]}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertContainer: {
    width: ALERT_WIDTH,
    borderRadius: 28,
  },
  shadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 28,
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  canvas: {
    position: 'absolute',
    width: ALERT_WIDTH,
    borderRadius: 28,
  },
  content: {
    padding: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDefault: {
    backgroundColor: '#3B82F6',
    shadowColor: 'rgba(59, 130, 246, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCancel: {
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
    shadowColor: 'rgba(239, 68, 68, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDefault: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#64748B',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});

export default CustomAlert;
