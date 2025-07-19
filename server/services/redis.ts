import { createClient, RedisClientType } from 'redis';
import { config } from 'dotenv';

config();

export class RedisService {
  static client: RedisClientType | null = null;
  private static isConnected: boolean = false;

  static async initialize(): Promise<void> {
    if (this.client) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis: Connected successfully');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis: Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  static isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Cache operations with fallback handling
  static async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) return null;
    
    try {
      return await this.client!.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  static async set(key: string, value: string, expirySeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      if (expirySeconds) {
        await this.client!.setEx(key, expirySeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  static async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // JSON helpers
  static async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis JSON parse error:', error);
      return null;
    }
  }

  static async setJSON(key: string, value: any, expirySeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, expirySeconds);
    } catch (error) {
      console.error('Redis JSON stringify error:', error);
      return false;
    }
  }

  // Cache key generators
  static keys = {
    // API response caching
    openAIResponse: (message: string, context: string) => 
      `openai:${Buffer.from(message + JSON.stringify(context)).toString('base64').substring(0, 50)}`,
    
    // YouTube search caching
    youtubeSearch: (query: string, skillLevel?: string) => 
      `youtube:search:${query.toLowerCase().replace(/\s+/g, '-')}:${skillLevel || 'all'}`,
    
    // Tutorial details caching
    youtubeVideo: (videoId: string) => 
      `youtube:video:${videoId}`,
    
    // User session caching
    userSession: (token: string) => 
      `session:${token}`,
    
    // User data caching
    userData: (userId: string) => 
      `user:${userId}`,
    
    // Design analysis caching
    designAnalysis: (contextHash: string, analysisType: string) => 
      `analysis:${analysisType}:${contextHash}`,
    
    // Demo template caching
    demoTemplates: (category: string) => 
      `templates:${category}`,
    
    // Rate limiting
    rateLimit: (userId: string, endpoint: string) => 
      `rate:${userId}:${endpoint}`,
  };

  // Cache TTL values (in seconds)
  static TTL = {
    OPENAI_RESPONSE: 3600,      // 1 hour
    YOUTUBE_SEARCH: 86400,      // 24 hours  
    YOUTUBE_VIDEO: 604800,      // 7 days
    USER_SESSION: 3600,         // 1 hour
    USER_DATA: 300,             // 5 minutes
    DESIGN_ANALYSIS: 1800,      // 30 minutes
    DEMO_TEMPLATES: 3600,       // 1 hour
    RATE_LIMIT: 60,            // 1 minute
  };

  // Graceful shutdown
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      console.log('Redis: Disconnected gracefully');
    }
  }
}

// Initialize Redis on module load
RedisService.initialize().catch(console.error);

// Handle process termination
process.on('SIGINT', async () => {
  await RedisService.disconnect();
});

process.on('SIGTERM', async () => {
  await RedisService.disconnect();
});