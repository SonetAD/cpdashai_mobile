/**
 * Native Google Sign-In Service
 * This uses @react-native-google-signin/google-signin for NATIVE popup
 * NO BROWSER - Just native account selector
 */

import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';

class NativeGoogleSignInService {
  constructor() {
    // Configure Google Sign-In with your Client IDs
    this.configure();
  }

  configure() {
    GoogleSignin.configure({
      // IMPORTANT: Use your Web Client ID for backend communication
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',

      // Android Client ID is configured in google-services.json
      // iOS Client ID would be in GoogleService-Info.plist

      // Request offline access for refresh token
      offlineAccess: true,

      // Force account selection even if one account
      forceCodeForRefreshToken: true,

      // Scopes you need
      scopes: ['profile', 'email'],

      // Force account picker to show every time (don't auto-select last used account)
      // This ensures user sees all their Google accounts after logout
      accountName: '',
    });
  }

  /**
   * Sign in with native Google popup
   * Returns ID token for backend authentication
   */
  async signIn() {
    try {
      // Sign out first to clear any cached selection and force account picker
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in
      }

      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices();

      // Show native account selector popup
      console.log('Showing native Google Sign-In popup...');
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token for backend authentication
      const tokens = await GoogleSignin.getTokens();

      console.log('Native Google Sign-In successful!');
      console.log('User:', userInfo.user);
      console.log('ID Token available:', !!tokens.idToken);

      return {
        success: true,
        user: userInfo.user,
        idToken: tokens.idToken,
        serverAuthCode: userInfo.serverAuthCode,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      await GoogleSignin.signOut();
      console.log('User signed out from Google');
      return { success: true };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is already signed in
   */
  async isSignedIn() {
    const isSignedIn = await GoogleSignin.isSignedIn();
    return isSignedIn;
  }

  /**
   * Get current user if signed in
   */
  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      return userInfo;
    } catch (error) {
      return null;
    }
  }

  /**
   * Handle Google Sign-In errors
   */
  private handleError(error: any) {
    console.error('Google Sign-In Error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return {
        success: false,
        cancelled: true,
        message: 'User cancelled the sign-in',
      };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return {
        success: false,
        message: 'Sign-in already in progress',
      };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        success: false,
        message: 'Google Play Services not available',
      };
    } else {
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
        error: error,
      };
    }
  }

  /**
   * Send Google ID token to your backend
   * @param idToken - Google ID token
   * @param role - Optional role ('candidate' or 'recruiter'). Defaults to 'candidate'.
   */
  async authenticateWithBackend(idToken: string, role?: 'candidate' | 'recruiter') {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://13.61.193.190:8000/';
      const graphqlUrl = `${apiUrl}/graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      console.log('Sending Google ID token to backend...', { role: role || 'candidate' });

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response: Response;
      try {
        response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              mutation GoogleCognitoLogin($googleIdToken: String!, $role: String) {
                googleCognitoLogin(googleIdToken: $googleIdToken, role: $role) {
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
                    profileSetupRequired
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
              googleIdToken: idToken,
              role: role || null,
            },
          }),
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            message: 'Request timed out. Please check your internet connection and try again.',
          };
        }
        throw fetchError;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Backend returned error status:', response.status);
        return {
          success: false,
          message: `Server error (${response.status}). Please try again later.`,
        };
      }

      const result = await response.json();
      console.log('Backend response:', result);
      console.log('googleCognitoLogin data:', result.data?.googleCognitoLogin);
      console.log('profileSetupRequired from backend:', result.data?.googleCognitoLogin?.profileSetupRequired);

      // Check for GraphQL errors
      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        return {
          success: false,
          message: result.errors[0]?.message || 'Authentication failed',
        };
      }

      if (result.data?.googleCognitoLogin?.success) {
        const loginData = result.data.googleCognitoLogin;
        console.log('Returning login data with profileSetupRequired:', loginData.profileSetupRequired);
        return {
          success: true,
          ...loginData,
        };
      } else {
        return {
          success: false,
          message: result.data?.googleCognitoLogin?.message || 'Authentication failed',
          errors: result.data?.googleCognitoLogin?.errors,
        };
      }
    } catch (error) {
      console.error('Error authenticating with backend:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed. Please try again.',
      };
    }
  }

  /**
   * Complete sign-in flow: Native popup → Backend authentication
   * @param role - Optional role ('candidate' or 'recruiter'). Defaults to 'candidate'.
   */
  async signInAndAuthenticate(role?: 'candidate' | 'recruiter') {
    // Step 1: Native Google Sign-In
    const signInResult = await this.signIn();

    // If user cancelled or sign-in failed, return immediately WITHOUT calling backend
    if (!signInResult.success) {
      console.log('Sign-in not successful, skipping backend call');
      return signInResult;
    }

    // If no ID token, return error
    if (!signInResult.idToken) {
      console.log('No ID token received, skipping backend call');
      return {
        success: false,
        message: 'No ID token received from Google',
      };
    }

    // Step 2: Send ID token to backend ONLY if sign-in was successful
    console.log('Sign-in successful, authenticating with backend...', { role: role || 'candidate' });
    const authResult = await this.authenticateWithBackend(signInResult.idToken, role);

    return {
      ...authResult,
      googleUser: signInResult.user,
    };
  }
}

export default new NativeGoogleSignInService();