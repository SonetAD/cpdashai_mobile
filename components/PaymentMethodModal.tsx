/**
 * Payment Method Selection Modal
 * Allows users to choose between Stripe (Credit Card) and PayPal for payment
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import PayPalLogo from '../assets/paypal-4.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type PaymentMethod = 'stripe' | 'paypal';

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMethod: (method: PaymentMethod) => void;
  planName: string;
  price: string;
  loading?: boolean;
}

// Stripe Icon
const StripeIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path
      d="M13.976 13.176c0-.904.744-1.252 1.976-1.252 1.768 0 4 .536 5.768 1.488V8.256c-1.932-.768-3.84-1.072-5.768-1.072-4.72 0-7.856 2.464-7.856 6.584 0 6.424 8.848 5.4 8.848 8.176 0 1.072-.936 1.416-2.24 1.416-1.936 0-4.416-.8-6.384-1.872v5.232c2.176.936 4.376 1.336 6.384 1.336 4.84 0 8.168-2.4 8.168-6.568-.024-6.936-8.896-5.704-8.896-8.312z"
      fill="#635BFF"
    />
  </Svg>
);


// Chevron Right Icon
const ChevronRightIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Close Icon
const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  onSelectMethod,
  planName,
  price,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Select Payment Method</Text>
              <Text style={styles.subtitle}>{planName} - {price}/month</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={loading}
            >
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {/* Payment Options */}
          <View style={styles.optionsContainer}>
            {/* Stripe Option */}
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => onSelectMethod('stripe')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.methodIconContainer}>
                <StripeIcon />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Stripe</Text>
                <Text style={styles.methodSubtitle}>Visa, Mastercard, Amex & more</Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color="#635BFF" />
              ) : (
                <ChevronRightIcon />
              )}
            </TouchableOpacity>

            {/* PayPal Option */}
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => onSelectMethod('paypal')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.methodIconContainer}>
                <PayPalLogo width={32} height={32} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>PayPal</Text>
                <Text style={styles.methodSubtitle}>Pay with your PayPal account</Text>
              </View>
              {loading ? (
                <ActivityIndicator size="small" color="#003087" />
              ) : (
                <ChevronRightIcon />
              )}
            </TouchableOpacity>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9 12l2 2 4-4"
                stroke="#10B981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.securityText}>
              Your payment is secure and encrypted
            </Text>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#10B981',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PaymentMethodModal;
