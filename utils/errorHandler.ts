/**
 * Centralized Error Handler for AI Features
 * Provides user-friendly error messages and consistent error handling across the app
 */

// Note: NetInfo is optional - if not available, network detection is skipped
let NetInfo: any;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch {
  NetInfo = null;
}

// Error types
export type ErrorType =
  | 'NETWORK'
  | 'AUTH'
  | 'RATE_LIMIT'
  | 'SERVER'
  | 'VALIDATION'
  | 'FEATURE_LOCKED'
  | 'TIMEOUT'
  | 'UNKNOWN';

// Alert button interface (matching AlertContext)
export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

// Alert options interface
export interface AlertOptions {
  type?: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  buttons?: AlertButton[];
  loading?: boolean;
}

// Show alert function type
export type ShowAlertFunction = (options: AlertOptions) => void;

// Error handler options
export interface ErrorHandlerOptions {
  onRetry?: () => void;
  onReport?: () => void;
  onAuthRequired?: () => void;
  featureName?: string;
  customMessages?: {
    network?: string;
    auth?: string;
    rateLimit?: string;
    server?: string;
    unknown?: string;
  };
}

// User-friendly error messages
const DEFAULT_ERROR_MESSAGES: Record<ErrorType, { title: string; message: string }> = {
  NETWORK: {
    title: 'Connection Issue',
    message: 'Please check your internet connection and try again.',
  },
  AUTH: {
    title: 'Session Expired',
    message: 'Please log in again to continue.',
  },
  RATE_LIMIT: {
    title: 'Slow Down',
    message: "You're doing great! Please wait a moment before trying again.",
  },
  SERVER: {
    title: 'Server Issue',
    message: "Something went wrong on our end. We're working on it!",
  },
  VALIDATION: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
  },
  FEATURE_LOCKED: {
    title: 'Feature Locked',
    message: 'Complete more profile tasks to unlock this feature.',
  },
  TIMEOUT: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },
  UNKNOWN: {
    title: 'Oops!',
    message: 'Something went wrong. Please try again.',
  },
};

/**
 * Extract error message from various error formats
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return '';

  // String error
  if (typeof error === 'string') return error;

  // Error object
  if (error instanceof Error) return error.message;

  // RTK Query error format
  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // GraphQL error format
    if (err.data && typeof err.data === 'object') {
      const data = err.data as Record<string, unknown>;
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors[0]?.message || '';
      }
      if (data.message) return String(data.message);
    }

    // Direct message property
    if (err.message) return String(err.message);

    // Error property
    if (err.error && typeof err.error === 'string') return err.error;

    // Status text
    if (err.statusText) return String(err.statusText);
  }

  return 'An unexpected error occurred';
};

/**
 * Determine error type from error object
 */
export const getErrorType = async (error: unknown): Promise<ErrorType> => {
  // Check network connectivity first if NetInfo is available
  if (NetInfo) {
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) return 'NETWORK';
    } catch {
      // If we can't check, assume network is OK
    }
  }

  if (!error) return 'UNKNOWN';

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Check HTTP status codes
    const status = err.status || err.statusCode;
    if (typeof status === 'number') {
      if (status === 401 || status === 403) return 'AUTH';
      if (status === 429) return 'RATE_LIMIT';
      if (status === 422 || status === 400) return 'VALIDATION';
      if (status === 408) return 'TIMEOUT';
      if (status >= 500) return 'SERVER';
    }

    // Check error message content
    const message = getErrorMessage(error).toLowerCase();
    if (message.includes('network') || message.includes('connection') || message.includes('offline')) {
      return 'NETWORK';
    }
    if (message.includes('auth') || message.includes('token') || message.includes('login') || message.includes('unauthorized')) {
      return 'AUTH';
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (message.includes('feature') || message.includes('locked') || message.includes('upgrade')) {
      return 'FEATURE_LOCKED';
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'VALIDATION';
    }
  }

  return 'UNKNOWN';
};

/**
 * Main error handler function
 * Shows user-friendly alerts based on error type
 */
export const handleApiError = async (
  error: unknown,
  showAlert: ShowAlertFunction,
  options?: ErrorHandlerOptions
): Promise<void> => {
  const errorType = await getErrorType(error);
  const errorMessage = getErrorMessage(error);

  // Get appropriate messages
  const messages = DEFAULT_ERROR_MESSAGES[errorType];
  const customMessages = options?.customMessages;

  switch (errorType) {
    case 'NETWORK':
      showAlert({
        type: 'error',
        title: messages.title,
        message: customMessages?.network || messages.message,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          ...(options?.onRetry ? [{ text: 'Retry', onPress: options.onRetry }] : []),
        ],
      });
      break;

    case 'AUTH':
      showAlert({
        type: 'warning',
        title: messages.title,
        message: customMessages?.auth || messages.message,
        buttons: [
          { text: 'OK', onPress: options?.onAuthRequired },
        ],
      });
      break;

    case 'RATE_LIMIT':
      showAlert({
        type: 'info',
        title: messages.title,
        message: customMessages?.rateLimit || messages.message,
        buttons: [{ text: 'OK' }],
      });
      break;

    case 'SERVER':
      showAlert({
        type: 'error',
        title: messages.title,
        message: customMessages?.server || messages.message,
        buttons: [
          { text: 'OK' },
          ...(options?.onReport ? [{ text: 'Report Issue', onPress: options.onReport }] : []),
        ],
      });
      break;

    case 'VALIDATION':
      showAlert({
        type: 'warning',
        title: messages.title,
        message: errorMessage || messages.message,
        buttons: [{ text: 'OK' }],
      });
      break;

    case 'FEATURE_LOCKED':
      showAlert({
        type: 'info',
        title: options?.featureName ? `${options.featureName} Locked` : messages.title,
        message: messages.message,
        buttons: [{ text: 'OK' }],
      });
      break;

    case 'TIMEOUT':
      showAlert({
        type: 'error',
        title: messages.title,
        message: messages.message,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          ...(options?.onRetry ? [{ text: 'Retry', onPress: options.onRetry }] : []),
        ],
      });
      break;

    default:
      showAlert({
        type: 'error',
        title: messages.title,
        message: customMessages?.unknown || errorMessage || messages.message,
        buttons: [
          { text: 'OK' },
          ...(options?.onRetry ? [{ text: 'Retry', onPress: options.onRetry }] : []),
        ],
      });
  }
};

/**
 * Synchronous error type checker (when network check isn't needed)
 */
export const getErrorTypeSync = (error: unknown): ErrorType => {
  if (!error) return 'UNKNOWN';

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;

    const status = err.status || err.statusCode;
    if (typeof status === 'number') {
      if (status === 401 || status === 403) return 'AUTH';
      if (status === 429) return 'RATE_LIMIT';
      if (status === 422 || status === 400) return 'VALIDATION';
      if (status === 408) return 'TIMEOUT';
      if (status >= 500) return 'SERVER';
    }

    const message = getErrorMessage(error).toLowerCase();
    if (message.includes('network') || message.includes('connection')) return 'NETWORK';
    if (message.includes('auth') || message.includes('token')) return 'AUTH';
    if (message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('timeout')) return 'TIMEOUT';
  }

  return 'UNKNOWN';
};

/**
 * Simple error handler for quick use (shows basic alert)
 */
export const handleError = (
  error: unknown,
  showAlert: ShowAlertFunction,
  onRetry?: () => void
): void => {
  handleApiError(error, showAlert, { onRetry });
};

/**
 * Create a wrapped async function with automatic error handling
 */
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  showAlert: ShowAlertFunction,
  options?: ErrorHandlerOptions
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleApiError(error, showAlert, options);
      return null;
    }
  };
};

/**
 * Check if error is a network error
 */
export const isNetworkError = async (error: unknown): Promise<boolean> => {
  return (await getErrorType(error)) === 'NETWORK';
};

/**
 * Check if error is an auth error
 */
export const isAuthError = (error: unknown): boolean => {
  return getErrorTypeSync(error) === 'AUTH';
};

/**
 * Format error for logging
 */
export const formatErrorForLogging = (error: unknown): string => {
  const type = getErrorTypeSync(error);
  const message = getErrorMessage(error);
  const timestamp = new Date().toISOString();

  return `[${timestamp}] Error Type: ${type} | Message: ${message}`;
};
