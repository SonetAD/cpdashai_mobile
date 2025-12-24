import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is needed for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
}

class GoogleAuthService {
  private config: GoogleAuthConfig;

  constructor() {
    // You'll need to add these to your .env file
    this.config = {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    };
  }

  /**
   * Get Google auth request configuration
   */
  getAuthRequest() {
    return Google.useAuthRequest({
      clientId: this.getClientId(),
      scopes: ['openid', 'profile', 'email'],
      responseType: Google.ResponseType.Token,
      shouldAutoExchangeCode: false,
    });
  }

  /**
   * Get the appropriate client ID based on platform
   */
  private getClientId(): string {
    if (Platform.OS === 'ios' && this.config.iosClientId) {
      return this.config.iosClientId;
    } else if (Platform.OS === 'android' && this.config.androidClientId) {
      return this.config.androidClientId;
    } else if (Platform.OS === 'web' && this.config.webClientId) {
      return this.config.webClientId;
    } else if (this.config.expoClientId) {
      // Expo client ID for development
      return this.config.expoClientId;
    } else if (this.config.webClientId) {
      // Fallback to web client ID
      return this.config.webClientId || '';
    }

    throw new Error('No Google Client ID configured for this platform');
  }

  /**
   * Handle the authentication response
   */
  async handleAuthResponse(response: Google.AuthSessionResult) {
    if (response?.type === 'success') {
      const { authentication } = response;

      if (authentication?.accessToken) {
        // Get user info from Google
        const userInfo = await this.getUserInfo(authentication.accessToken);

        return {
          success: true,
          accessToken: authentication.accessToken,
          idToken: authentication.idToken,
          refreshToken: authentication.refreshToken,
          user: userInfo,
        };
      }
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
      return {
        success: false,
        error: response.error,
      };
    } else if (response?.type === 'cancel') {
      return {
        success: false,
        error: 'User cancelled authentication',
      };
    }

    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
        locale: userInfo.locale,
        verified: userInfo.verified_email,
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Exchange Google token for backend JWT tokens
   */
  async exchangeGoogleTokenForJWT(googleToken: string, userInfo: any) {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:8000/';
      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation GoogleTokenLogin($googleToken: String!, $userInfo: JSONString!) {
              googleTokenLogin(googleToken: $googleToken, userInfo: $userInfo) {
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
            googleToken,
            userInfo: JSON.stringify(userInfo),
          },
        }),
      });

      const result = await response.json();

      if (result.data?.googleTokenLogin?.success) {
        return {
          success: true,
          ...result.data.googleTokenLogin,
        };
      } else {
        return {
          success: false,
          message: result.data?.googleTokenLogin?.message || 'Login failed',
          errors: result.data?.googleTokenLogin?.errors,
        };
      }
    } catch (error) {
      console.error('Error exchanging Google token for JWT:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Exchange failed',
      };
    }
  }

  /**
   * Direct Google Sign-In (without Cognito)
   * This is useful if your backend can handle Google tokens directly
   */
  async directGoogleSignIn(promptAsync: () => Promise<Google.AuthSessionResult>) {
    try {
      // Prompt the user to sign in with Google
      const response = await promptAsync();

      if (response?.type === 'success' && response.authentication?.accessToken) {
        // Get user info from Google
        const userInfo = await this.getUserInfo(response.authentication.accessToken);

        if (userInfo) {
          // Exchange Google token for your backend's JWT tokens
          const jwtResponse = await this.exchangeGoogleTokenForJWT(
            response.authentication.accessToken,
            userInfo
          );

          return jwtResponse;
        }
      }

      return {
        success: false,
        message: 'Google sign-in failed',
      };
    } catch (error) {
      console.error('Direct Google sign-in error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sign-in failed',
      };
    }
  }
}

export default new GoogleAuthService();