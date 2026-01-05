/**
 * Stripe Configuration
 * Configuration for Stripe PaymentSheet integration
 */

// Contact sales configuration for enterprise plans
export const CONTACT_SALES_CONFIG = {
  email: 'sales@cpdash.com',
  subject: 'Enterprise Plan Inquiry',
  enterprisePlanKeys: ['enterprise'], // Plans that require contacting sales
};

// Test Credit Card Numbers for Development
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',          // Always succeeds
  decline: '4000 0000 0000 9995',          // Always declines
  authentication: '4000 0025 0000 3155',   // Requires 3D Secure
  // Use any future date for expiry (e.g., 12/34)
  // Use any 3 digits for CVC (e.g., 123)
};

// Log configuration on load (development only)
if (__DEV__) {
  console.log('✅ Stripe PaymentSheet Configuration Loaded');
  console.log('Test Cards Available:', TEST_CARDS);
}