/**
 * Direct Google Authentication Service
 * This sends a Google ID token directly to your backend
 * For testing purposes until native modules are available
 */

class DirectGoogleAuthService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:8000/';
  }

  /**
   * Send Google ID token directly to backend
   * This is what will be called after native Google Sign-In
   */
  async authenticateWithGoogleToken(googleIdToken: string) {
    try {
      const graphqlUrl = `${this.apiUrl}graphql/`.replace(/\/+/g, '/').replace(':/', '://');

      console.log('Sending Google ID token to backend:', graphqlUrl);
      console.log('Token preview:', googleIdToken.substring(0, 50) + '...');

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
      console.log('Backend response:', result);

      if (result.data?.googleCognitoLogin?.success) {
        return {
          success: true,
          ...result.data.googleCognitoLogin,
        };
      } else {
        return {
          success: false,
          message: result.data?.googleCognitoLogin?.message || 'Authentication failed',
          errors: result.data?.googleCognitoLogin?.errors,
        };
      }
    } catch (error) {
      console.error('Error authenticating with Google token:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Test the backend mutation with a sample token
   * This is just for testing the backend connection
   */
  async testBackendConnection() {
    // This is a dummy token - backend will correctly reject it
    // Real Google ID tokens are obtained from Google Sign-In SDK
    const testToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJUZXN0IFVzZXIiLCJnaXZlbl9uYW1lIjoiVGVzdCIsImZhbWlseV9uYW1lIjoiVXNlciIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAzNjAwfQ.test";

    console.log('⚠️ Using dummy token for testing - backend will reject this as invalid');
    console.log('✅ If you see "Invalid Google ID token" error, the backend is working correctly!');

    return this.authenticateWithGoogleToken(testToken);
  }

  /**
   * Get the actual Google ID token from the current auth session
   * This is what you'll use after Google Sign-In
   */
  async getActualGoogleToken() {
    // After successful Google Sign-In, you'll have:
    // - response.authentication.idToken (this is what backend needs)
    // - response.authentication.accessToken (for Google APIs)

    // Real Google ID tokens look like this (much longer):
    // eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4YmY1YTM3MTUwNTcyNGM2NjZhMDFjYzVhNDc... (1000+ characters)

    console.log('To get a real token:');
    console.log('1. Click the Google Sign-In button');
    console.log('2. Complete authentication');
    console.log('3. The response.authentication.idToken is what you send to backend');

    return null;
  }
}

export default new DirectGoogleAuthService();