/**
 * Stripe Configuration
 * Contains all Stripe-related configuration including price IDs for subscription plans
 * Updated: November 26, 2025 with actual test mode price IDs
 *
 * IMPORTANT: These are TEST MODE price IDs for development.
 * Do NOT use these in production!
 */

// Test Mode Stripe Price IDs from backend
// These are the actual price IDs created in your Stripe Test Account
export const STRIPE_PRICE_IDS = {
  // Monthly subscription price IDs
  monthly: {
    free: '', // Free plan has no price ID
    standard: process.env.EXPO_PUBLIC_STRIPE_PRICE_STANDARD_MONTHLY || '', // £9.99/month
    pro: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || '', // £19.99/month
    premium: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY || '', // £29.99/month
    enterprise: '', // Enterprise uses custom pricing
  },

  // Yearly subscription price IDs (if applicable)
  yearly: {
    standard: process.env.EXPO_PUBLIC_STRIPE_PRICE_STANDARD_YEARLY || '',
    pro: process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_YEARLY || '',
    premium: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY || '',
  }
};

// Plan configuration mapping
export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    price: 0,
    aiResumeParses: 0,
    aiContentImprovements: 0,
    features: [
      'Basic profile creation',
      'Limited resume upload',
      'View job listings',
    ],
  },
  standard: {
    name: 'Standard',
    price: 9.99,
    aiResumeParses: 10,
    aiContentImprovements: 20,
    features: [
      'AI Resume parsing (10/month)',
      'AI Content improvements (20/month)',
      'ATS keyword optimization',
      'Basic analytics',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    aiResumeParses: 30,
    aiContentImprovements: 50,
    features: [
      'AI Resume parsing (30/month)',
      'AI Content improvements (50/month)',
      'Advanced ATS optimization',
      'Professional summary generation',
      'Priority support',
      'Advanced analytics',
    ],
  },
  premium: {
    name: 'Premium',
    price: 29.99,
    aiResumeParses: -1, // Unlimited
    aiContentImprovements: -1, // Unlimited
    features: [
      'Unlimited AI Resume parsing',
      'Unlimited AI Content improvements',
      'Advanced ATS optimization',
      'Professional summary generation',
      'Priority support',
      'Advanced analytics',
      'Custom templates',
      'Job match scoring',
      'Personal career advisor',
      'White-glove support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 99999, // Custom pricing indicator
    aiResumeParses: -1, // Unlimited
    aiContentImprovements: -1, // Unlimited
    features: [
      'Unlimited everything',
      'Dedicated account manager',
      'Custom SLA',
      'API access',
      'Team collaboration',
      'Advanced security features',
      'Custom reporting',
    ],
  },
};

// Helper function to get price ID for a plan
export const getPriceIdForPlan = (planKey: string, billingPeriod: 'monthly' | 'yearly' = 'monthly'): string => {
  if (billingPeriod === 'yearly' && STRIPE_PRICE_IDS.yearly[planKey as keyof typeof STRIPE_PRICE_IDS.yearly]) {
    return STRIPE_PRICE_IDS.yearly[planKey as keyof typeof STRIPE_PRICE_IDS.yearly];
  }
  return STRIPE_PRICE_IDS.monthly[planKey as keyof typeof STRIPE_PRICE_IDS.monthly] || '';
};

// Contact sales configuration
export const CONTACT_SALES_CONFIG = {
  email: 'sales@cpdash.com',
  subject: 'Enterprise Plan Inquiry',
  enterprisePlanKeys: ['enterprise'], // Plans that require contacting sales
};

// Test Mode Stripe Public Key
export const STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY || '';

// Test Credit Card Numbers for Development
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",          // Always succeeds
  decline: "4000 0000 0000 9995",          // Always declines
  authentication: "4000 0025 0000 3155",   // Requires 3D Secure
  // Use any future date for expiry (e.g., 12/34)
  // Use any 3 digits for CVC (e.g., 123)
};

// Log configuration on load (development only)
if (__DEV__) {
  console.log("✅ Stripe Test Mode Configuration Loaded");
  console.log("Price IDs:", STRIPE_PRICE_IDS.monthly);
  console.log("Test Cards Available:", TEST_CARDS);
}