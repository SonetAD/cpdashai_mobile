import { API_URL } from './api';

export interface ProgressUpdate {
  taskId: string;
  stage: string;
  stageLabel: string;
  progress: number;
  message?: string;
  status: string;
  resumeId?: string;
}

export type ProgressCallback = (update: ProgressUpdate) => void;
export type ErrorCallback = (error: string) => void;
export type CompletedCallback = (resumeId: string) => void;

class ResumeParsingProgressService {
  private ws: WebSocket | null = null;
  private progressCallback: ProgressCallback | null = null;
  private errorCallback: ErrorCallback | null = null;
  private completedCallback: CompletedCallback | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;

  subscribe(
    taskId: string,
    token: string,
    onProgress: ProgressCallback,
    onCompleted: CompletedCallback,
    onError: ErrorCallback
  ) {
    this.progressCallback = onProgress;
    this.errorCallback = onError;
    this.completedCallback = onCompleted;

    // Convert http(s) to ws(s) and remove trailing slash from API_URL
    const baseUrl = API_URL.replace(/\/$/, ''); // Remove trailing slash
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const url = `${wsUrl}/ws/resume-parsing/${taskId}/?token=${token}`;

    console.log('📡 Connecting to WebSocket:', url);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received message:', data);

          switch (data.type) {
            case 'connected':
              console.log('Connected to task:', data.task_id, 'Status:', data.status);
              if (this.progressCallback) {
                this.progressCallback({
                  taskId: data.task_id,
                  stage: data.stage || 'pending',
                  stageLabel: data.stage_label || 'Starting...',
                  progress: data.progress || 0,
                  status: data.status,
                });
              }
              break;

            case 'progress':
              if (this.progressCallback) {
                this.progressCallback({
                  taskId: data.task_id,
                  stage: data.stage,
                  stageLabel: data.stage_label,
                  progress: data.progress,
                  message: data.message,
                  status: 'in_progress',
                });
              }
              break;

            case 'completed':
              console.log('✅ Parsing completed. Resume ID:', data.resume_id);
              if (this.completedCallback) {
                this.completedCallback(data.resume_id);
              }
              this.disconnect();
              break;

            case 'error':
              console.error('❌ Parsing error:', data.message);
              if (this.errorCallback) {
                this.errorCallback(data.message || 'An error occurred during parsing');
              }
              this.disconnect();
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        if (this.errorCallback) {
          this.errorCallback('Connection error occurred');
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);

        if (event.code === 4001) {
          if (this.errorCallback) {
            this.errorCallback('Unauthorized - Please log in again');
          }
        } else if (event.code === 4003) {
          if (this.errorCallback) {
            this.errorCallback('Access denied - This task belongs to another user');
          }
        } else if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Try to reconnect for abnormal closures
          this.reconnectAttempts++;
          console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => {
            this.subscribe(taskId, token, onProgress, onCompleted, onError);
          }, this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      if (this.errorCallback) {
        this.errorCallback('Failed to connect to progress updates');
      }
    }
  }

  disconnect() {
    if (this.ws) {
      console.log('Disconnecting WebSocket...');
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
    this.progressCallback = null;
    this.errorCallback = null;
    this.completedCallback = null;
  }
}

export const resumeParsingProgressService = new ResumeParsingProgressService();
