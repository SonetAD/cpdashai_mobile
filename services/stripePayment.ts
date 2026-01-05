/**
 * Stripe PaymentSheet Service
 * Handles in-app payments using @stripe/stripe-react-native
 */

import { Alert } from 'react-native';
import {
  initPaymentSheet,
  presentPaymentSheet,
  StripeProvider,
} from '@stripe/stripe-react-native';

export interface PaymentSheetParams {
  paymentIntentClientSecret?: string;
  setupIntentClientSecret?: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
  merchantDisplayName?: string;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

/**
 * Initialize the PaymentSheet with the given parameters
 */
export async function initializePaymentSheet(
  params: PaymentSheetParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { paymentIntentClientSecret, setupIntentClientSecret, ephemeralKey, customerId, merchantDisplayName } = params;

    // Determine if this is a payment or setup intent
    const clientSecret = paymentIntentClientSecret || setupIntentClientSecret;

    if (!clientSecret) {
      return { success: false, error: 'No client secret provided' };
    }

    const { error } = await initPaymentSheet({
      merchantDisplayName: merchantDisplayName || 'CP Dash AI',
      customerId: customerId,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntentClientSecret,
      setupIntentClientSecret: setupIntentClientSecret,
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: '',
      },
      returnURL: 'cpdashai://stripe-redirect',
      applePay: {
        merchantCountryCode: 'GB',
      },
      googlePay: {
        merchantCountryCode: 'GB',
        testEnv: __DEV__,
      },
    });

    if (error) {
      console.error('PaymentSheet init error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('PaymentSheet init exception:', error);
    return { success: false, error: error.message || 'Failed to initialize payment' };
  }
}

/**
 * Present the PaymentSheet to the user
 */
export async function openPaymentSheet(): Promise<PaymentResult> {
  try {
    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === 'Canceled') {
        return { success: false, cancelled: true };
      }
      console.error('PaymentSheet error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('PaymentSheet exception:', error);
    return { success: false, error: error.message || 'Payment failed' };
  }
}

/**
 * Complete payment flow - initialize and present PaymentSheet
 */
export async function processPayment(
  params: PaymentSheetParams
): Promise<PaymentResult> {
  // Initialize PaymentSheet
  const initResult = await initializePaymentSheet(params);

  if (!initResult.success) {
    return { success: false, error: initResult.error };
  }

  // Present PaymentSheet
  return await openPaymentSheet();
}

// Re-export StripeProvider for use in app root
export { StripeProvider };
