import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storage } from '../utils/storage';
import { getAuthHeaders } from './settingsManager';

const API_BASE_URL = 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;
  private widgetSessionId: string;
  private conversationId: string;

  constructor() {
    // Generate a unique session ID for this widget instance
    this.widgetSessionId = this.generateSessionId();
    
    // Initialize or retrieve conversation ID
    this.conversationId = this.getOrCreateConversationId();
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token and API keys
    this.client.interceptors.request.use(
      async (config) => {
        // Add JWT token if available
        const token = storage.getItem('figbud_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add user-provided API keys
        try {
          const apiKeyHeaders = await getAuthHeaders();
          Object.assign(config.headers, apiKeyHeaders);
        } catch (error) {
          console.error('Failed to get API key headers:', error);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = storage.getItem('figbud_refresh_token');
            if (refreshToken) {
              const response = await this.client.post('/api/auth/refresh', {
                refreshToken,
              });

              const { token, refreshToken: newRefreshToken } = response.data;
              storage.setItem('figbud_token', token);
              storage.setItem('figbud_refresh_token', newRefreshToken);

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            storage.removeItem('figbud_token');
            storage.removeItem('figbud_refresh_token');
            window.location.reload();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async register(email: string, password: string, figmaUserId?: string) {
    const response = await this.client.post('/api/auth/register', {
      email,
      password,
      figmaUserId,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/api/auth/logout');
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/api/auth/profile');
    return response.data;
  }

  async updateProfile(preferences: any) {
    const response = await this.client.put('/api/auth/profile', {
      preferences,
    });
    return response.data;
  }

  // Session management
  private generateSessionId(): string {
    return `figbud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId(): string {
    return this.widgetSessionId;
  }

  // Conversation management
  private getOrCreateConversationId(): string {
    // Try to get from storage first
    const stored = storage.getItem('figbud_conversation_id');
    if (stored) {
      return stored;
    }
    
    // Generate new conversation ID
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storage.setItem('figbud_conversation_id', newId);
    return newId;
  }
  
  getConversationId(): string {
    return this.conversationId;
  }
  
  // Start a new conversation
  startNewConversation(): void {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storage.setItem('figbud_conversation_id', this.conversationId);
  }

  // Chat methods
  async sendMessage(message: string, context?: any) {
    const response = await this.client.post('/api/chat/message', {
      message,
      context: {
        ...context,
        conversationId: this.conversationId
      },
      widgetSessionId: this.widgetSessionId,
    });
    return response.data;
  }

  async endChatSession() {
    try {
      const response = await this.client.post('/api/chat/session/end', {
        widgetSessionId: this.widgetSessionId,
      });
      return response.data;
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  }

  async getChatHistory(limit: number = 50, offset: number = 0) {
    const response = await this.client.get('/api/chat/history', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getConversationMessages(conversationId?: string) {
    const id = conversationId || this.conversationId;
    const response = await this.client.get(`/api/chat/conversations/${id}/messages`);
    return response.data;
  }
  
  async getCurrentConversationHistory() {
    return this.getConversationMessages(this.conversationId);
  }

  async searchTutorials(query: string, options?: {
    skillLevel?: string;
    maxResults?: number;
  }) {
    const response = await this.client.get('/api/chat/tutorials', {
      params: {
        query,
        ...options,
      },
    });
    return response.data;
  }

  async createDemo(prompt: string, options?: {
    style?: string;
    complexity?: string;
  }) {
    const response = await this.client.post('/api/chat/create-demo', {
      prompt,
      ...options,
    });
    return response.data;
  }

  async getGuidance(query: string, context: any, userLevel: string) {
    const response = await this.client.post('/api/chat/guidance', {
      query,
      context,
      userLevel,
    });
    return response.data;
  }

  // Link preview method
  async getLinkPreview(url: string) {
    try {
      const response = await this.client.get('/api/chat/link-preview', {
        params: { url }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch link preview:', error);
      return null;
    }
  }

  // Utility methods
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;