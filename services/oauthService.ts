import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable web browser completion for auth session
WebBrowser.maybeCompleteAuthSession();

interface OAuthConfig {
  redirectScheme: string;
  redirectPath: string;
  apiUrl: string;
}

interface AuthState {
  state: string;
  codeVerifier?: string;
  timestamp: number;
}

class OAuthService {
  private config: OAuthConfig;
  private authStateKey = '@oauth_auth_state';

  constructor() {
    this.config = {
      redirectScheme: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_SCHEME || 'cpdashai',
      redirectPath: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_PATH || 'auth/callback',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://13.61.193.190:8000/',
    };
  }

  /**
   * Get the redirect URI for the current platform
   */
  getRedirectUri(): string {
    if (Platform.OS === 'web') {
      // For web, use the current origin
      return `${window.location.origin}/${this.config.redirectPath}`;
    } else {
      // For mobile apps, use the custom scheme
      return `${this.config.redirectScheme}://${this.config.redirectPath}`;
    }
  }

  /**
   * Generate a random state for CSRF protection
   */
  async generateState(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return btoa(String.fromCharCode(...new Uint8Array(randomBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Store auth state for later validation
   */
  async storeAuthState(state: string, codeVerifier?: string): Promise<void> {
    const authState: AuthState = {
      state,
      codeVerifier,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(this.authStateKey, JSON.stringify(authState));
  }

  /**
   * Retrieve and validate auth state
   */
  async getAuthState(state: string): Promise<AuthState | null> {
    try {
      const stored = await AsyncStorage.getItem(this.authStateKey);
      if (!stored) return null;

      const authState: AuthState = JSON.parse(stored);

      // Check if state matches
      if (authState.state !== state) {
        console.warn('State mismatch in OAuth callback');
        return null;
      }

      // Check if state is not expired (15 minutes)
      const fifteenMinutes = 15 * 60 * 1000;
      if (Date.now() - authState.timestamp > fifteenMinutes) {
        console.warn('Auth state expired');
        await this.clearAuthState();
        return null;
      }

      return authState;
    } catch (error) {
      console.error('Error retrieving auth state:', error);
      return null;
    }
  }

  /**
   * Clear stored auth state
   */
  async clearAuthState(): Promise<void> {
    await AsyncStorage.removeItem(this.authStateKey);
  }

  /**
   * Get Google OAuth URL from backend
   */
  async getGoogleOAuthUrl(): Promise<{ authUrl: string; state: string } | null> {
    try {
      const redirectUri = this.getRedirectUri();
      const state = await this.generateState();

      // Store state for later validation
      await this.storeAuthState(state);

      // Ensure API URL doesn't have double slashes
      const apiUrl = this.config.apiUrl.endsWith('/')
        ? this.config.apiUrl
        : `${this.config.apiUrl}/`;

      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      console.log('OAuth Service - API URL:', apiUrl);
      console.log('OAuth Service - GraphQL URL:', graphqlUrl);
      console.log('OAuth Service - Redirect URI:', redirectUri);

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation GetGoogleOAuthUrl($redirectUri: String!) {
              getGoogleOauthUrl(redirectUri: $redirectUri) {
                __typename
                ... on SuccessType {
                  success
                  message
                  data
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: {
            redirectUri,
          },
        }),
      });

      if (!response.ok) {
        console.error('OAuth URL request failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return null;
      }

      const result = await response.json();
      console.log('OAuth URL response:', result);

      if (result.data?.getGoogleOauthUrl?.success) {
        const data = JSON.parse(result.data.getGoogleOauthUrl.data);
        return {
          authUrl: data.auth_url,
          state: data.state,
        };
      } else {
        console.error('Failed to get OAuth URL:', result.data?.getGoogleOauthUrl?.message);
        console.error('Errors:', result.data?.getGoogleOauthUrl?.errors);
        return null;
      }
    } catch (error) {
      console.error('Error getting Google OAuth URL:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        apiUrl: this.config.apiUrl,
      });
      return null;
    }
  }

  /**
   * Open Google OAuth in app browser
   */
  async initiateGoogleSignIn(): Promise<WebBrowser.WebBrowserAuthSessionResult | null> {
    try {
      const oauthData = await this.getGoogleOAuthUrl();
      if (!oauthData) {
        throw new Error('Failed to get OAuth URL');
      }

      const redirectUri = this.getRedirectUri();

      // Use WebBrowser for in-app OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        oauthData.authUrl,
        redirectUri,
        {
          showInRecents: true,
          preferEphemeralSession: false, // Keep login state
        }
      );

      return result;
    } catch (error) {
      console.error('Error initiating Google sign-in:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, state: string): Promise<any> {
    try {
      // Validate state
      const authState = await this.getAuthState(state);
      if (!authState) {
        throw new Error('Invalid or expired auth state');
      }

      const redirectUri = this.getRedirectUri();

      // Ensure API URL doesn't have double slashes
      const apiUrl = this.config.apiUrl.endsWith('/')
        ? this.config.apiUrl
        : `${this.config.apiUrl}/`;

      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      console.log('Exchange code - GraphQL URL:', graphqlUrl);
      console.log('Exchange code - Code:', code.substring(0, 10) + '...');
      console.log('Exchange code - Redirect URI:', redirectUri);

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation GoogleOAuthLogin($code: String!, $redirectUri: String!) {
              googleOauthLogin(code: $code, redirectUri: $redirectUri) {
                __typename
                ... on LoginSuccessType {
                  success
                  message
                  accessToken
                  refreshToken
                  user {
                    id
                    email
                    firstName
                    lastName
                    role
                    authProvider
                    googleId
                  }
                  role
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: {
            code,
            redirectUri,
          },
        }),
      });

      const result = await response.json();

      // Clear auth state after use
      await this.clearAuthState();

      if (result.data?.googleOauthLogin?.success) {
        return {
          success: true,
          ...result.data.googleOauthLogin,
        };
      } else {
        return {
          success: false,
          message: result.data?.googleOauthLogin?.message || 'Login failed',
          errors: result.data?.googleOauthLogin?.errors,
        };
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Exchange failed',
      };
    }
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(code: string, accessToken: string): Promise<any> {
    try {
      const redirectUri = this.getRedirectUri();

      // Ensure API URL doesn't have double slashes
      const apiUrl = this.config.apiUrl.endsWith('/')
        ? this.config.apiUrl
        : `${this.config.apiUrl}/`;

      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation LinkGoogleAccount($code: String!, $redirectUri: String!) {
              linkGoogleAccount(code: $code, redirectUri: $redirectUri) {
                __typename
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
          variables: {
            code,
            redirectUri,
          },
        }),
      });

      const result = await response.json();
      return result.data?.linkGoogleAccount;
    } catch (error) {
      console.error('Error linking Google account:', error);
      return {
        success: false,
        message: 'Failed to link account',
      };
    }
  }

  /**
   * Unlink Google account from user
   */
  async unlinkGoogleAccount(accessToken: string): Promise<any> {
    try {
      // Ensure API URL doesn't have double slashes
      const apiUrl = this.config.apiUrl.endsWith('/')
        ? this.config.apiUrl
        : `${this.config.apiUrl}/`;

      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation UnlinkGoogleAccount {
              unlinkGoogleAccount {
                __typename
                ... on SuccessType {
                  success
                  message
                }
                ... on ErrorType {
                  success
                  message
                  errors {
                    field
                    message
                  }
                }
              }
            }
          `,
        }),
      });

      const result = await response.json();
      return result.data?.unlinkGoogleAccount;
    } catch (error) {
      console.error('Error unlinking Google account:', error);
      return {
        success: false,
        message: 'Failed to unlink account',
      };
    }
  }

  /**
   * Parse OAuth callback URL
   */
  parseCallbackUrl(url: string): { code?: string; state?: string; error?: string } {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);

      return {
        code: params.get('code') || undefined,
        state: params.get('state') || undefined,
        error: params.get('error') || undefined,
      };
    } catch (error) {
      console.error('Error parsing callback URL:', error);
      return {};
    }
  }

  /**
   * Complete OAuth flow after redirect
   */
  async completeOAuthFlow(url: string): Promise<any> {
    try {
      const { code, state, error } = this.parseCallbackUrl(url);

      if (error) {
        return {
          success: false,
          message: `OAuth error: ${error}`,
        };
      }

      if (!code || !state) {
        return {
          success: false,
          message: 'Missing authorization code or state',
        };
      }

      // Exchange code for tokens
      return await this.exchangeCodeForTokens(code, state);
    } catch (error) {
      console.error('Error completing OAuth flow:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'OAuth flow failed',
      };
    }
  }
}

export default new OAuthService();