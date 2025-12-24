import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is needed for web
WebBrowser.maybeCompleteAuthSession();

interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
}

class CognitoGoogleAuthService {
  private cognitoConfig: CognitoConfig;
  private googleConfig: {
    webClientId?: string;
    iosClientId?: string;
    androidClientId?: string;
  };

  constructor() {
    // Cognito configuration
    this.cognitoConfig = {
      region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
      userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
      clientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
    };

    // Google configuration
    this.googleConfig = {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    };
  }

  /**
   * Get the appropriate Google client ID based on platform
   */
  private getGoogleClientId(): string {
    if (Platform.OS === 'ios' && this.googleConfig.iosClientId) {
      return this.googleConfig.iosClientId;
    } else if (Platform.OS === 'android' && this.googleConfig.androidClientId) {
      return this.googleConfig.androidClientId;
    }
    return this.googleConfig.webClientId || '';
  }

  /**
   * Exchange Google ID Token for Cognito tokens
   * This is the key method that connects Google to Cognito
   */
  async exchangeGoogleTokenForCognitoTokens(googleIdToken: string) {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:8000/';
      const graphqlUrl = `${apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      console.log('Exchanging Google token for Cognito tokens...');

      // Call your backend mutation that handles Cognito federation
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation GoogleCognitoLogin($googleIdToken: String!) {
              googleCognitoLogin(googleIdToken: $googleIdToken) {
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
            googleIdToken,
          },
        }),
      });

      const result = await response.json();
      console.log('Cognito exchange response:', result);

      if (result.data?.googleCognitoLogin?.success) {
        return {
          success: true,
          ...result.data.googleCognitoLogin,
        };
      } else {
        return {
          success: false,
          message: result.data?.googleCognitoLogin?.message || 'Login failed',
          errors: result.data?.googleCognitoLogin?.errors,
        };
      }
    } catch (error) {
      console.error('Error exchanging Google token for Cognito tokens:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Exchange failed',
      };
    }
  }


  /**
   * Get user info from Google using access token
   */
  async getUserInfoFromGoogle(accessToken: string) {
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
      console.error('Error fetching user info from Google:', error);
      return null;
    }
  }

  /**
   * Complete authentication flow with native Google Sign-In + Cognito
   */
  async authenticateWithGoogleAndCognito(promptAsync: () => Promise<Google.AuthSessionResult>) {
    try {
      console.log('Starting native Google Sign-In...');

      // Step 1: Show native Google sign-in popup
      const googleResponse = await promptAsync();

      if (googleResponse?.type === 'success' && googleResponse.authentication) {
        const { idToken, accessToken } = googleResponse.authentication;

        console.log('Google sign-in successful, exchanging for Cognito tokens...');

        // Step 2: Get user info from Google (optional but useful)
        const userInfo = await this.getUserInfoFromGoogle(accessToken!);
        console.log('Google user info:', userInfo);

        // Step 3: Exchange Google ID token for Cognito tokens via your backend
        const cognitoResponse = await this.exchangeGoogleTokenForCognitoTokens(idToken!);

        if (cognitoResponse.success) {
          console.log('Successfully authenticated with Cognito!');
          return {
            success: true,
            ...cognitoResponse,
            googleUserInfo: userInfo,
          };
        } else {
          return cognitoResponse;
        }
      } else if (googleResponse?.type === 'cancel') {
        return {
          success: false,
          message: 'User cancelled Google sign-in',
        };
      } else {
        return {
          success: false,
          message: 'Google sign-in failed',
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }
}

export default new CognitoGoogleAuthService();