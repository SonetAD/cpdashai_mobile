/**
 * LinkedIn OAuth Service
 *
 * Opens LinkedIn OAuth in browser, backend handles callback and redirects
 * back to app with tokens via deep link.
 *
 * Flow:
 * 1. App opens LinkedIn authorization URL in browser
 * 2. User authorizes on LinkedIn
 * 3. LinkedIn redirects to backend: https://api.cpdash.ai/api/auth/linkedin/callback/
 * 4. Backend exchanges code for tokens, creates/finds user
 * 5. Backend redirects to app: cpdashai://auth/linkedin?accessToken=xxx&refreshToken=xxx&...
 * 6. App receives deep link and stores credentials
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useState, useEffect, useCallback } from 'react';

// LinkedIn OAuth configuration
const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '';
const LINKEDIN_REDIRECT_URI = 'https://api.cpdash.ai/api/auth/linkedin/callback/';
const LINKEDIN_SCOPES = ['openid', 'profile', 'email'];
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';

// Debug log for LinkedIn configuration
console.log('LinkedIn OAuth Config:', {
  clientIdExists: !!LINKEDIN_CLIENT_ID,
  clientIdLength: LINKEDIN_CLIENT_ID.length,
  redirectUri: LINKEDIN_REDIRECT_URI,
});

export interface LinkedInAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isVerified: boolean;
    phoneNumber?: string;
  };
  role?: string;
  profileSetupRequired?: boolean;
  error?: string;
  cancelled?: boolean;
}

/**
 * Build LinkedIn authorization URL with all required parameters
 */
const buildAuthUrl = (role?: string, state?: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    scope: LINKEDIN_SCOPES.join(' '),
    state: state || generateState(role),
  });

  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
};

/**
 * Generate state parameter to pass role and prevent CSRF
 * Format: role:randomString (e.g., "candidate:abc123" or "recruiter:xyz789")
 */
const generateState = (role?: string): string => {
  const randomPart = Math.random().toString(36).substring(2, 15);
  return role ? `${role}:${randomPart}` : `none:${randomPart}`;
};

/**
 * Parse deep link URL parameters from LinkedIn callback
 */
const parseDeepLinkParams = (url: string): LinkedInAuthResult => {
  try {
    const { queryParams } = Linking.parse(url);

    if (!queryParams) {
      return { success: false, error: 'No parameters in callback URL' };
    }

    // Check for error
    if (queryParams.error) {
      return {
        success: false,
        error: (queryParams.error_description as string) || (queryParams.error as string) || 'LinkedIn authorization failed',
      };
    }

    // Check for success with tokens
    if (queryParams.accessToken) {
      return {
        success: true,
        accessToken: queryParams.accessToken as string,
        refreshToken: queryParams.refreshToken as string,
        role: queryParams.role as string,
        profileSetupRequired: queryParams.profileSetupRequired === 'true',
        user: queryParams.userId ? {
          id: queryParams.userId as string,
          email: queryParams.email as string,
          firstName: queryParams.firstName as string,
          lastName: queryParams.lastName as string,
          role: queryParams.role as string,
          isVerified: queryParams.isVerified === 'true',
          phoneNumber: queryParams.phoneNumber as string,
        } : undefined,
      };
    }

    return { success: false, error: 'Invalid callback response' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to parse callback URL' };
  }
};

/**
 * Hook for LinkedIn OAuth authentication
 */
export const useLinkedInAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LinkedInAuthResult | null>(null);

  // Listen for deep link callback
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;

      // Check if this is a LinkedIn callback
      if (url.includes('auth/linkedin')) {
        const parsed = parseDeepLinkParams(url);
        setResult(parsed);
        setIsLoading(false);
      }
    };

    // Add listener for incoming links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a LinkedIn callback URL
    Linking.getInitialURL().then((url) => {
      if (url && url.includes('auth/linkedin')) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Start LinkedIn OAuth flow
   * Opens browser with LinkedIn authorization page
   */
  const signIn = useCallback(async (role?: 'candidate' | 'recruiter'): Promise<LinkedInAuthResult> => {
    if (!LINKEDIN_CLIENT_ID) {
      return {
        success: false,
        error: 'LinkedIn Client ID not configured',
      };
    }

    setIsLoading(true);
    setResult(null);

    try {
      const authUrl = buildAuthUrl(role);

      // Open LinkedIn auth in browser
      const browserResult = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'cpdashai://auth/linkedin', // Listen for this scheme
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        setIsLoading(false);
        return {
          success: false,
          cancelled: true,
        };
      }

      if (browserResult.type === 'success' && browserResult.url) {
        // Parse the callback URL
        const parsed = parseDeepLinkParams(browserResult.url);
        setResult(parsed);
        setIsLoading(false);
        return parsed;
      }

      // If we get here, wait for deep link (backend redirect)
      // The useEffect listener will handle it
      return {
        success: false,
        error: 'Waiting for callback...',
      };
    } catch (error: any) {
      setIsLoading(false);
      return {
        success: false,
        error: error.message || 'An error occurred during LinkedIn sign-in',
      };
    }
  }, []);

  /**
   * Clear the result state
   */
  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    signIn,
    result,
    isLoading,
    isReady: !!LINKEDIN_CLIENT_ID,
    clearResult,
    redirectUri: LINKEDIN_REDIRECT_URI,
  };
};

export default {
  useLinkedInAuth,
  buildAuthUrl,
  parseDeepLinkParams,
};
