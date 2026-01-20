/**
 * WebSocket Notification Service
 *
 * Manages real-time WebSocket connection for notifications.
 * Implements reconnection logic with exponential backoff.
 */

import { getAccessToken } from '../utils/authUtils';

// Derive WebSocket URL from API URL
const getWebSocketBaseUrl = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';

  // Convert HTTP to WS protocol
  let wsUrl = apiUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

  // Remove trailing slash if present
  wsUrl = wsUrl.replace(/\/$/, '');

  return wsUrl;
};

const WS_BASE_URL = getWebSocketBaseUrl();

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  related_job_id?: string;
  related_application_id?: string;
  related_mission_id?: string;
  related_subscription_id?: string;
  related_crs_id?: string;
  created_at: string;
}

// WebSocket message types
export type WebSocketMessageType =
  | 'connected'
  | 'new_notification'
  | 'notification_read'
  | 'all_notifications_read'
  | 'notification_deleted'
  | 'unread_count_update'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  message?: string;
  unread_count?: number;
  notification?: Notification;
  notification_id?: string;
}

// Client actions
export type ClientAction = 'mark_read' | 'mark_all_read' | 'ping';

export interface ClientMessage {
  action: ClientAction;
  notification_id?: string;
}

// Event handlers
export interface NotificationWebSocketHandlers {
  onConnected?: (unreadCount: number) => void;
  onNewNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onNotificationDeleted?: (notificationId: string) => void;
  onUnreadCountUpdate?: (count: number) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private handlers: NotificationWebSocketHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private isManuallyDisconnected = false;
  private token: string | null = null;

  /**
   * Connect to the notification WebSocket
   */
  async connect(handlers: NotificationWebSocketHandlers): Promise<void> {
    this.handlers = handlers;
    this.isManuallyDisconnected = false;

    try {
      this.token = await getAccessToken();

      if (!this.token) {
        console.log('NotificationWS: No token available, skipping connection');
        return;
      }

      this.establishConnection();
    } catch (error) {
      console.error('NotificationWS: Error getting token:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  private establishConnection(): void {
    if (!this.token || this.isManuallyDisconnected) return;

    // Close existing connection if any
    this.closeConnection();

    const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${this.token}`;
    console.log('NotificationWS: Connecting to:', wsUrl.replace(this.token, '[TOKEN]'));

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('NotificationWS: Connected');
        this.reconnectAttempts = 0;
        this.handlers.onConnectionChange?.(true);
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('NotificationWS: Error parsing message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('NotificationWS: Disconnected:', event.code, event.reason);
        this.handlers.onConnectionChange?.(false);
        this.stopPingInterval();

        // Handle specific close codes
        if (event.code === 4001) {
          console.log('NotificationWS: Unauthorized, not reconnecting');
          return;
        }

        // Attempt reconnection if not manually disconnected
        if (!this.isManuallyDisconnected && event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        // WebSocket error - connection likely failed
        // Don't log the error object as it's verbose and not useful
        console.log('NotificationWS: Connection error occurred');
        this.handlers.onError?.(new Error('WebSocket connection error'));
      };
    } catch (error) {
      console.error('NotificationWS: Error creating WebSocket:', error);
      this.handlers.onError?.(error as Error);
    }
  }

  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'connected':
        console.log('NotificationWS: Connection confirmed, unread:', data.unread_count);
        this.handlers.onConnected?.(data.unread_count || 0);
        break;

      case 'new_notification':
        if (data.notification) {
          console.log('NotificationWS: New notification:', data.notification.title);
          this.handlers.onNewNotification?.(data.notification);
        }
        break;

      case 'notification_read':
        if (data.notification_id) {
          this.handlers.onNotificationRead?.(data.notification_id);
        }
        break;

      case 'all_notifications_read':
        this.handlers.onAllNotificationsRead?.();
        break;

      case 'notification_deleted':
        if (data.notification_id) {
          this.handlers.onNotificationDeleted?.(data.notification_id);
        }
        break;

      case 'unread_count_update':
        if (typeof data.unread_count === 'number') {
          this.handlers.onUnreadCountUpdate?.(data.unread_count);
        }
        break;

      case 'pong':
        // Ping response, connection is alive
        break;

      default:
        console.log('NotificationWS: Unknown message type:', data.type);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('NotificationWS: Max reconnect attempts reached');
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 30s)
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`NotificationWS: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.establishConnection();
    }, delay);
  }

  private startPingInterval(): void {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private closeConnection(): void {
    this.stopPingInterval();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnection attempt
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    console.log('NotificationWS: Manual disconnect');
    this.isManuallyDisconnected = true;
    this.closeConnection();
    this.handlers.onConnectionChange?.(false);
  }

  /**
   * Send a message to the server
   */
  private send(message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('NotificationWS: Cannot send, not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('NotificationWS: Error sending message:', error);
      return false;
    }
  }

  /**
   * Mark a notification as read via WebSocket
   */
  markAsRead(notificationId: string): boolean {
    return this.send({
      action: 'mark_read',
      notification_id: notificationId,
    });
  }

  /**
   * Mark all notifications as read via WebSocket
   */
  markAllAsRead(): boolean {
    return this.send({
      action: 'mark_all_read',
    });
  }

  /**
   * Send a ping to keep the connection alive
   */
  sendPing(): boolean {
    return this.send({
      action: 'ping',
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Update the token and reconnect
   */
  async updateToken(): Promise<void> {
    const newToken = await getAccessToken();
    if (newToken && newToken !== this.token) {
      this.token = newToken;
      if (!this.isManuallyDisconnected) {
        this.establishConnection();
      }
    }
  }
}

// Export singleton instance
export const notificationWebSocket = new NotificationWebSocketService();
export default notificationWebSocket;
