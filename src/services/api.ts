import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.figbud.com' 
  : 'http://localhost:3000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = storage.getItem('figbud_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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

  // Chat methods
  async sendMessage(message: string, context?: any) {
    const response = await this.client.post('/api/chat/message', {
      message,
      context,
    });
    return response.data;
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

  // Utility methods
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;