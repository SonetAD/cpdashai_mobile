import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="#10B981"
            />
          </Svg>
        );
      case 'error':
        return (
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="#EF4444"
            />
          </Svg>
        );
      case 'warning':
        return (
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
              fill="#F59E0B"
            />
          </Svg>
        );
      case 'confirm':
        return (
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="#437EF4"
            />
          </Svg>
        );
      default:
        return (
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="#437EF4"
            />
          </Svg>
        );
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return 'bg-gray-200';
      case 'destructive':
        return 'bg-red-500';
      default:
        return 'bg-primary-blue';
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return 'text-gray-700';
      case 'destructive':
        return 'text-white';
      default:
        return 'text-white';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
          {/* Icon */}
          <View className="items-center pt-8 pb-4">
            {getIcon()}
          </View>

          {/* Title */}
          <Text className="text-gray-900 text-xl font-bold text-center px-6 mb-2">
            {title}
          </Text>

          {/* Message */}
          {message && (
            <Text className="text-gray-600 text-sm text-center px-6 mb-6 leading-5">
              {message}
            </Text>
          )}

          {/* Loading Indicator */}
          {loading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#437EF4" />
            </View>
          )}

          {/* Buttons */}
          {!loading && (
            <View className="px-6 pb-6">
              {buttons.length === 1 ? (
                // Single button - full width
                <TouchableOpacity
                  className={`${getButtonStyle(buttons[0].style)} rounded-xl py-4 items-center shadow-sm`}
                  style={buttons[0].style === 'default' ? { backgroundColor: '#437EF4' } : undefined}
                  onPress={() => handleButtonPress(buttons[0])}
                  activeOpacity={0.8}
                >
                  <Text className={`${getButtonTextStyle(buttons[0].style)} text-base font-semibold`}>
                    {buttons[0].text}
                  </Text>
                </TouchableOpacity>
              ) : (
                // Multiple buttons - row layout
                <View className="flex-row space-x-3">
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      className={`flex-1 ${getButtonStyle(button.style)} rounded-xl py-4 items-center shadow-sm`}
                      style={button.style === 'default' ? { backgroundColor: '#437EF4' } : undefined}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.8}
                    >
                      <Text className={`${getButtonTextStyle(button.style)} text-base font-semibold`}>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
