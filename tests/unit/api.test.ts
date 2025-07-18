import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock instance
const mockAxiosInstance = {
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

// Mock axios.create to return our mock instance
mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

// Import after mocking
import { apiService } from '../../src/services/api';

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authentication Methods', () => {
    test('should register user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: { id: '123', email: 'test@example.com' },
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.register('test@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    test('should login user successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: { id: '123', email: 'test@example.com' },
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.login('test@example.com', 'password123');
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe('test@example.com');
    });

    test('should get user profile', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: '123',
            email: 'test@example.com',
            preferences: {
              skillLevel: 'beginner',
              designStyle: 'modern',
            },
          },
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getProfile();
      
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('123');
    });
  });

  describe('Chat Methods', () => {
    test('should send message successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          response: 'AI response text',
          metadata: {
            tutorials: [],
            demos: [],
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.sendMessage('How do I create a button?');
      
      expect(result.success).toBe(true);
      expect(result.response).toBe('AI response text');
    });

    test('should search tutorials successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          tutorials: [
            {
              id: '1',
              title: 'Button Tutorial',
              description: 'Learn to create buttons',
              videoId: 'abc123',
            },
          ],
          cached: false,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.searchTutorials('button tutorial', {
        skillLevel: 'beginner',
        maxResults: 5,
      });
      
      expect(result.success).toBe(true);
      expect(result.tutorials).toHaveLength(1);
      expect(result.tutorials[0].title).toBe('Button Tutorial');
    });

    test('should create demo successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          demo: {
            id: 'demo-1',
            name: 'Login Form Demo',
            description: 'A demo login form',
            isPremium: false,
          },
          requiresPremium: false,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.createDemo('Create a login form', {
        style: 'modern',
        complexity: 'simple',
      });
      
      expect(result.success).toBe(true);
      expect(result.demo.name).toBe('Login Form Demo');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network Error'));

      await expect(apiService.login('test@example.com', 'password123')).rejects.toThrow('Network Error');
    });

    test('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            success: false,
            message: 'Invalid credentials',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      await expect(apiService.login('test@example.com', 'wrongpassword')).rejects.toEqual(errorResponse);
    });
  });

  describe('Utility Methods', () => {
    test('should perform health check', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: 12345,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.healthCheck();
      
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
    });
  });
});