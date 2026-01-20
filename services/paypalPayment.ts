/**
 * PayPal Payment Service
 * Handles PayPal subscription flow using WebBrowser for approval
 */

import * as WebBrowser from 'expo-web-browser';

export interface PayPalPaymentResult {
  success: boolean;
  subscriptionId?: string;
  token?: string;
  cancelled?: boolean;
  error?: string;
}

export interface PayPalConfig {
  clientId: string;
  mode: 'sandbox' | 'live';
}

// PayPal configuration from environment
const PAYPAL_CLIENT_ID = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_MODE = (process.env.EXPO_PUBLIC_PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live';

/**
 * Get PayPal configuration
 */
export const getPayPalConfig = (): PayPalConfig => ({
  clientId: PAYPAL_CLIENT_ID,
  mode: PAYPAL_MODE,
});

/**
 * Check if PayPal is properly configured
 */
export const isPayPalConfigured = (): boolean => {
  return !!PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.length > 0;
};

/**
 * Open PayPal approval URL in a web browser session
 * Returns the subscription details after user approves
 *
 * @param approvalUrl - The PayPal approval URL from createPayPalSubscription mutation
 * @param returnUrl - The deep link URL for the app to return to after approval
 * @returns PayPalPaymentResult with subscription details or error
 */
export const openPayPalApproval = async (
  approvalUrl: string,
  returnUrl: string
): Promise<PayPalPaymentResult> => {
  try {
    console.log('Opening PayPal approval URL:', approvalUrl);
    console.log('Return URL:', returnUrl);

    // Open PayPal in an auth session (in-app browser that can redirect back)
    const result = await WebBrowser.openAuthSessionAsync(
      approvalUrl,
      returnUrl
    );

    console.log('PayPal WebBrowser result:', result);

    if (result.type === 'success' && result.url) {
      // Parse the redirect URL to extract subscription_id and token
      // PayPal redirects with: returnUrl?subscription_id=xxx&ba_token=xxx
      try {
        const url = new URL(result.url);
        const subscriptionId = url.searchParams.get('subscription_id');
        const token = url.searchParams.get('ba_token');

        console.log('PayPal approval success:', { subscriptionId, token });

        if (subscriptionId) {
          return {
            success: true,
            subscriptionId,
            token: token || undefined,
          };
        } else {
          return {
            success: false,
            error: 'No subscription ID received from PayPal',
          };
        }
      } catch (parseError) {
        console.error('Error parsing PayPal redirect URL:', parseError);
        return {
          success: false,
          error: 'Failed to parse PayPal response',
        };
      }
    } else if (result.type === 'cancel') {
      console.log('PayPal approval cancelled by user');
      return {
        success: false,
        cancelled: true,
      };
    } else if (result.type === 'dismiss') {
      console.log('PayPal browser dismissed');
      return {
        success: false,
        cancelled: true,
      };
    }

    return {
      success: false,
      error: 'Unknown error during PayPal approval',
    };
  } catch (error: any) {
    console.error('PayPal approval error:', error);
    return {
      success: false,
      error: error.message || 'Failed to open PayPal',
    };
  }
};

/**
 * Process a complete PayPal payment flow
 * This is a convenience function that combines create and capture
 *
 * @param params - Payment parameters
 * @param createSubscription - Function to call backend createPayPalSubscription
 * @param captureSubscription - Function to call backend capturePayPalSubscription
 * @returns PayPalPaymentResult
 */
export const processPayPalPayment = async (params: {
  planKey: string;
  returnUrl: string;
  cancelUrl: string;
  createSubscription: (input: {
    planKey: string;
    returnUrl: string;
    cancelUrl: string;
  }) => Promise<{
    success: boolean;
    message?: string;
    subscriptionId?: string;
    approvalUrl?: string;
  }>;
  captureSubscription: (input: {
    subscriptionId: string;
    token?: string;
  }) => Promise<{
    success: boolean;
    message: string;
    subscription?: {
      id: string;
      status: string;
      plan: string;
      currentPeriodEnd: string;
    };
  }>;
}): Promise<PayPalPaymentResult & { subscription?: any }> => {
  try {
    // Step 1: Create subscription on backend
    const createResult = await params.createSubscription({
      planKey: params.planKey,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
    });

    if (!createResult.success || !createResult.approvalUrl) {
      return {
        success: false,
        error: createResult.message || 'Failed to create PayPal subscription',
      };
    }

    // Step 2: Open PayPal for user approval
    const approvalResult = await openPayPalApproval(
      createResult.approvalUrl,
      params.returnUrl
    );

    if (!approvalResult.success) {
      return approvalResult;
    }

    // Step 3: Capture the subscription after approval
    const captureResult = await params.captureSubscription({
      subscriptionId: approvalResult.subscriptionId!,
      token: approvalResult.token,
    });

    if (!captureResult.success) {
      return {
        success: false,
        error: captureResult.message || 'Failed to activate subscription',
      };
    }

    return {
      success: true,
      subscriptionId: approvalResult.subscriptionId,
      subscription: captureResult.subscription,
    };
  } catch (error: any) {
    console.error('PayPal payment process error:', error);
    return {
      success: false,
      error: error.message || 'Payment processing failed',
    };
  }
};

// Deep link URLs for PayPal
export const PAYPAL_RETURN_URL = 'cpdashai://paypal-return';
export const PAYPAL_CANCEL_URL = 'cpdashai://paypal-cancel';
