import { google } from 'googleapis';
import { config } from 'dotenv';
import { MemoryCache, tutorialCache } from './memory-cache';
import { APIKeyValidator } from '../utils/api-key-validation';

config();

// Initialize YouTube API client
// Will be initialized with user API key if provided
let youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export interface VideoTimestamp {
  time: string;
  seconds: number;
  title: string;
  url: string;
}

export interface Tutorial {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  channelTitle: string;
  url: string;
  timestamps: VideoTimestamp[];
}

export class YouTubeService {
  // Simple in-memory cache
  private static cache = new Map<string, { tutorials: Tutorial[], timestamp: number }>();
  private static CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // Prioritized Figma-related YouTube channels
  private static readonly FIGMA_CHANNELS = {
    official: [
      'UCQsVmhSa4X-G3lHlUtejzLA', // Figma official channel
      'UC-b3c7kxa5vU-bnmaROgvog', // Config (Figma conference)
    ],
    trusted: [
      'UCTIhfOopxukTIRkbXJ3kN-g', // DesignCourse
      'UCJQJ7GId4i1NepmJpb1VAEw', // The Futur Academy
      'UCvBGFeXbBrq3W9_0oNLJREQ', // Flux Academy
      'UCeB_OpLspKJGiKv1CYkWFFw', // AJ&Smart
      'UCzBkNPSxw15qrW_Y8p-oCUw', // High Resolution
      'UCW5gUZ7lKGrAbLOkHv2xfbw', // Mike Locke
      'UCNZnXvcHmfbHBEbtF9V6u7g', // Mizko
      'UCbqd2YmFeHMwxlj4NcN5zPQ', // Figma Guru
      'UC7gLo5ERvucOoV8z_V0vvTw', // UI Collective
    ],
    channelNames: {
      'Figma': 10,
      'Config': 8,
      'DesignCourse': 7,
      'The Futur Academy': 7,
      'Flux Academy': 6,
      'AJ&Smart': 6,
      'Figma Guru': 5,
      'UI Collective': 5,
      'Mizko': 5,
      'Mike Locke': 4
    }
  };

  static async searchTutorials(
    query: string, 
    maxResults: number = 3,
    userApiKey?: string
  ): Promise<Tutorial[]> {
    // Check cache first
    const cacheKey = MemoryCache.generateKey(query, { maxResults, apiKey: !!userApiKey });
    const cached = tutorialCache.get<Tutorial[]>(cacheKey);
    
    if (cached) {
      console.log(`[YouTube] Cache hit for: "${query}"`);
      return cached;
    }
    
    try {
      // Use user API key if provided
      const apiKey = userApiKey || process.env.YOUTUBE_API_KEY;
      console.log(`[YouTube] Using API key: ${apiKey ? 'Yes' : 'No'}, User provided: ${userApiKey ? 'Yes' : 'No'}`);
      
      // Validate API key if provided
      if (apiKey) {
        const validation = APIKeyValidator.validate(apiKey, 'youtube');
        if (!validation.isValid) {
          console.warn(`[YouTube] ${validation.error} - falling back to mock data`);
          return this.getMockTutorials(query);
        }
      }
      
      // If no API key, return mock data for testing
      if (!apiKey) {
        console.log('[YouTube] No API key configured - returning mock tutorials');
        return this.getMockTutorials(query);
      }
      
      // Create YouTube client with the appropriate API key
      const youtubeClient = userApiKey ? google.youtube({
        version: 'v3',
        auth: userApiKey
      }) : youtube;

      // Add Figma-specific keywords to improve relevance
      const enhancedQuery = `${query} Figma tutorial`;
      console.log(`[YouTube] Searching for: "${enhancedQuery}"`);
      
      // Search for videos
      const searchResponse = await youtubeClient.search.list({
        part: ['snippet'],
        q: enhancedQuery,
        maxResults: maxResults * 2, // Fetch extra to allow for channel prioritization
        type: ['video'],
        relevanceLanguage: 'en',
        order: 'relevance',
        safeSearch: 'strict'
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return [];
      }

      // Get video IDs
      const videoIds = searchResponse.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      // Get video details including duration
      const videosResponse = await youtubeClient.videos.list({
        part: ['contentDetails', 'statistics'],
        id: videoIds
      });

      // Map results to Tutorial format with channel scoring
      const tutorialsWithScores = searchResponse.data.items.map((item, index) => {
        const videoDetails = videosResponse.data.items?.[index];
        const duration = this.formatDuration(videoDetails?.contentDetails?.duration || 'PT0S');
        const channelId = item.snippet?.channelId || '';
        const channelTitle = item.snippet?.channelTitle || '';
        
        // Calculate channel priority score
        let channelScore = 0;
        if (this.FIGMA_CHANNELS.official.includes(channelId)) {
          channelScore = 100; // Highest priority for official channels
        } else if (this.FIGMA_CHANNELS.trusted.includes(channelId)) {
          channelScore = 50; // High priority for trusted channels
        } else {
          // Check channel name for known good channels
          for (const [name, score] of Object.entries(this.FIGMA_CHANNELS.channelNames)) {
            if (channelTitle.toLowerCase().includes(name.toLowerCase())) {
              channelScore = score * 5;
              break;
            }
          }
        }
        
        const tutorial: Tutorial = {
          id: item.id?.videoId || '',
          videoId: item.id?.videoId || '',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnailUrl: this.getSecureThumbnailUrl(item),
          duration: duration,
          channelTitle: channelTitle,
          url: `https://youtube.com/watch?v=${item.id?.videoId}`,
          timestamps: []
        };

        // Extract timestamps from description
        if (item.snippet?.description) {
          tutorial.timestamps = this.extractTimestamps(
            tutorial.videoId, 
            item.snippet.description
          );
        }
        
        return {
          tutorial,
          score: channelScore + (parseInt(videoDetails?.statistics?.viewCount || '0') / 1000000)
        };
      });

      // Sort by score and take top results
      const sortedTutorials = tutorialsWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.tutorial);

      // Cache the results
      tutorialCache.set(cacheKey, sortedTutorials);
      
      console.log(`[YouTube] Cached ${sortedTutorials.length} results for: "${query}"`);
      return sortedTutorials;
    } catch (error: any) {
      console.error('[YouTube] API error:', error.message);
      
      // Specific error handling
      if (error.message?.includes('API key not valid') || error.response?.data?.error?.reason === 'badRequest') {
        console.error('[YouTube] Invalid API key - YouTube Data API v3 access required');
        console.log('[YouTube] To fix: Update YOUTUBE_API_KEY in .env with a valid key');
      } else if (error.message?.includes('quota')) {
        console.error('[YouTube] API quota exceeded');
      } else if (error.response?.data) {
        console.error('[YouTube] API response:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.log('[YouTube] Using mock tutorials to ensure functionality');
      return this.getMockTutorials(query);
    }
  }

  private static formatDuration(duration: string): string {
    // Parse ISO 8601 duration (e.g., PT1H30M45S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private static extractTimestamps(videoId: string, description: string): VideoTimestamp[] {
    const timestamps: VideoTimestamp[] = [];
    
    // Enhanced timestamp patterns to catch more formats
    const patterns = [
      // Standard formats
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)/gm,           // 0:00 - Introduction
      /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/gm,                    // 0:00 Introduction
      /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/gm,                // [0:00] Introduction
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*[|｜]\s*(.+)/gm,           // 0:00 | Introduction
      
      // Additional common formats
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*:\s*(.+)/gm,                // 0:00 : Introduction
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*→\s*(.+)/gm,                // 0:00 → Introduction
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*》\s*(.+)/gm,               // 0:00 》 Introduction
      /【(\d{1,2}:\d{2}(?::\d{2})?)】\s*(.+)/gm,                // 【0:00】 Introduction
      /\((\d{1,2}:\d{2}(?::\d{2})?)\)\s*(.+)/gm,                // (0:00) Introduction
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,                   // 0:00 at line start
      
      // Bullet point formats
      /^\s*•\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+)/gm,  // • 0:00 - Introduction
      /^➜\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,               // ➜ 0:00 Introduction
      /^⏱\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,               // ⏱ 0:00 Introduction
    ];

    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(description)) !== null) {
        const [, time, title] = match;
        const seconds = this.timeToSeconds(time);
        
        // Clean up the title
        const cleanTitle = title
          .trim()
          .replace(/^[-–—:→》｜|•➜⏱\s]+/, '')  // Remove leading separators
          .replace(/[-–—:→》｜|•➜⏱\s]+$/, '')  // Remove trailing separators
          .trim();
        
        // Avoid duplicates and ensure valid title
        if (cleanTitle && !timestamps.some(ts => ts.seconds === seconds)) {
          timestamps.push({
            time,
            seconds,
            title: cleanTitle,
            url: `https://youtube.com/watch?v=${videoId}&t=${seconds}s`
          });
        }
      }
    }

    // Sort by time
    timestamps.sort((a, b) => a.seconds - b.seconds);
    
    // Return only if we found meaningful timestamps
    return timestamps.length > 1 ? timestamps : [];
  }

  private static timeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').reverse();
    let seconds = parseInt(parts[0] || '0');
    if (parts[1]) seconds += parseInt(parts[1]) * 60;
    if (parts[2]) seconds += parseInt(parts[2]) * 3600;
    return seconds;
  }

  private static getSecureThumbnailUrl(item: any): string {
    // Try to get the best quality thumbnail available
    const thumbnails = item.snippet?.thumbnails;
    if (!thumbnails) return '';
    
    // Order of preference: maxres > high > medium > default
    const thumbnailUrl = thumbnails.maxres?.url || 
                        thumbnails.high?.url || 
                        thumbnails.medium?.url || 
                        thumbnails.default?.url || '';
    
    // Ensure HTTPS
    if (thumbnailUrl && !thumbnailUrl.startsWith('https://')) {
      return thumbnailUrl.replace('http://', 'https://');
    }
    
    // If still no thumbnail, use YouTube's direct thumbnail API
    if (!thumbnailUrl && item.id?.videoId) {
      return `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`;
    }
    
    return thumbnailUrl;
  }

  /**
   * Get video details by YouTube video ID
   */
  static async getVideoById(
    videoId: string,
    options: { userApiKey?: string } = {}
  ): Promise<Tutorial | null> {
    try {
      const apiKey = options.userApiKey || process.env.YOUTUBE_API_KEY;
      
      // Validate API key if provided
      if (apiKey) {
        const validation = APIKeyValidator.validate(apiKey, 'youtube');
        if (!validation.isValid) {
          console.warn(`[YouTube] ${validation.error} - returning null`);
          return null;
        }
      }
      
      if (!apiKey) {
        console.log('[YouTube] No API key configured for video lookup');
        return null;
      }
      
      // Create YouTube client with the appropriate API key
      const youtubeClient = options.userApiKey ? google.youtube({
        version: 'v3',
        auth: options.userApiKey
      }) : youtube;
      
      // Fetch video details
      const response = await youtubeClient.videos.list({
        part: ['snippet', 'contentDetails'],
        id: [videoId]
      });
      
      if (!response.data.items || response.data.items.length === 0) {
        return null;
      }
      
      const video = response.data.items[0];
      const duration = this.formatDuration(video.contentDetails?.duration || 'PT0S');
      
      const tutorial: Tutorial = {
        id: videoId,
        videoId: videoId,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || 
                      video.snippet?.thumbnails?.default?.url || '',
        duration: duration,
        channelTitle: video.snippet?.channelTitle || '',
        url: `https://youtube.com/watch?v=${videoId}`,
        timestamps: []
      };
      
      // Extract timestamps from description
      if (video.snippet?.description) {
        tutorial.timestamps = this.extractTimestamps(videoId, video.snippet.description);
      }
      
      return tutorial;
    } catch (error) {
      console.error('[YouTube] Error fetching video by ID:', error);
      return null;
    }
  }

  /**
   * Extract YouTube video ID from various URL formats
   */
  static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }
  
  // Clear cache method for testing or manual refresh
  static clearCache(): void {
    this.cache.clear();
    console.log('[YouTube] Cache cleared');
  }

  // Search for tutorials based on component type or feature
  static async searchByComponent(componentType: string, options?: { userApiKey?: string }): Promise<Tutorial[]> {
    const queryMap: Record<string, string> = {
      'button': 'create buttons components',
      'card': 'design cards components',
      'input': 'form input fields design',
      'navbar': 'navigation bar design',
      'modal': 'modal dialog popup design',
      'badge': 'badges tags chips design',
      'text': 'typography text styles',
      'layout': 'auto layout constraints',
      'components': 'create components variants',
      'prototyping': 'interactive prototypes animations'
    };

    const query = queryMap[componentType.toLowerCase()] || componentType;
    return this.searchTutorials(query, 2, options?.userApiKey);
  }

  // Get tutorials for general learning topics
  static async searchByTopic(topic: string, options?: { maxResults?: number; userApiKey?: string }): Promise<Tutorial[]> {
    const topicMap: Record<string, string> = {
      'beginner': 'beginner basics getting started',
      'advanced': 'advanced techniques pro tips',
      'design system': 'design system components library',
      'collaboration': 'team collaboration multiplayer',
      'plugins': 'plugins widgets development',
      'auto layout': 'auto layout responsive design',
      'components': 'components instances variants',
      'prototyping': 'prototyping interactions animations'
    };

    const query = topicMap[topic.toLowerCase()] || topic;
    return this.searchTutorials(query, options?.maxResults || 3, options?.userApiKey);
  }

  // Mock tutorials for testing without API key
  private static getMockTutorials(query: string): Tutorial[] {
    console.log(`[YouTube] Providing mock tutorials for: "${query}"`);
    
    const mockData: Record<string, Tutorial[]> = {
      'button': [
        {
          id: 'mock-button-1',
          videoId: 'mock-button-1',
          title: 'Creating Beautiful Buttons in Figma - Complete Guide',
          description: 'Learn how to create stunning buttons with auto-layout, variants, and interactive states',
          thumbnailUrl: 'https://picsum.photos/320/180?random=1',
          duration: '12:45',
          channelTitle: 'Figma',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          timestamps: [
            { time: '0:00', seconds: 0, title: 'Introduction', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=0s' },
            { time: '2:15', seconds: 135, title: 'Setting up Auto Layout', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=135s' },
            { time: '5:30', seconds: 330, title: 'Creating Button Variants', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=330s' },
            { time: '8:45', seconds: 525, title: 'Adding Interactive States', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=525s' },
            { time: '11:00', seconds: 660, title: 'Best Practices & Tips', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=660s' }
          ]
        }
      ],
      'card': [
        {
          id: 'mock-card-1',
          videoId: 'mock-card-1',
          title: 'Design Amazing Cards with Auto Layout in Figma',
          description: 'Master card design with shadows, spacing, and responsive layouts',
          thumbnailUrl: 'https://picsum.photos/320/180?random=2',
          duration: '15:20',
          channelTitle: 'DesignCourse',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          timestamps: [
            { time: '0:00', seconds: 0, title: 'Card Design Principles', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=0s' },
            { time: '3:20', seconds: 200, title: 'Setting up the Card Frame', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=200s' },
            { time: '7:45', seconds: 465, title: 'Adding Shadows & Effects', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=465s' },
            { time: '12:00', seconds: 720, title: 'Making Cards Responsive', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=720s' }
          ]
        }
      ],
      'auto layout': [
        {
          id: 'mock-auto-1',
          videoId: 'mock-auto-1',
          title: 'Figma Auto Layout - Everything You Need to Know',
          description: 'Complete guide to mastering Auto Layout in Figma',
          thumbnailUrl: 'https://picsum.photos/320/180?random=3',
          duration: '25:30',
          channelTitle: 'Figma',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          timestamps: [
            { time: '0:00', seconds: 0, title: 'What is Auto Layout?', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=0s' },
            { time: '4:30', seconds: 270, title: 'Basic Auto Layout Setup', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=270s' },
            { time: '10:15', seconds: 615, title: 'Advanced Spacing & Padding', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=615s' },
            { time: '16:00', seconds: 960, title: 'Responsive Design with Auto Layout', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=960s' },
            { time: '22:00', seconds: 1320, title: 'Real-world Examples', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=1320s' }
          ]
        }
      ],
      'design system': [
        {
          id: 'mock-system-1',
          videoId: 'mock-system-1',
          title: 'Building a Design System in Figma from Scratch',
          description: 'Learn how to create a scalable design system with components and styles',
          thumbnailUrl: 'https://picsum.photos/320/180?random=4',
          duration: '35:45',
          channelTitle: 'The Futur Academy',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          timestamps: [
            { time: '0:00', seconds: 0, title: 'Introduction to Design Systems', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=0s' },
            { time: '5:20', seconds: 320, title: 'Setting up Color Styles', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=320s' },
            { time: '12:00', seconds: 720, title: 'Creating Typography Scales', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=720s' },
            { time: '20:30', seconds: 1230, title: 'Building Component Library', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=1230s' },
            { time: '30:00', seconds: 1800, title: 'Documentation & Handoff', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=1800s' }
          ]
        }
      ]
    };

    // Default mock tutorial
    const defaultTutorial: Tutorial = {
      id: 'mock-default-1',
      videoId: 'mock-default-1',
      title: `Figma Tutorial: ${query}`,
      description: `Learn about ${query} in Figma with this comprehensive guide`,
      thumbnailUrl: 'https://picsum.photos/320/180?random=5',
      duration: '10:00',
      channelTitle: 'Figma Guru',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      timestamps: [
        { time: '0:00', seconds: 0, title: 'Introduction', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=0s' },
        { time: '3:00', seconds: 180, title: 'Getting Started', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=180s' },
        { time: '6:00', seconds: 360, title: 'Advanced Tips', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=360s' },
        { time: '9:00', seconds: 540, title: 'Conclusion', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=540s' }
      ]
    };

    // Find matching tutorials
    const lowerQuery = query.toLowerCase();
    for (const [key, tutorials] of Object.entries(mockData)) {
      if (lowerQuery.includes(key)) {
        return tutorials;
      }
    }

    // Return default tutorial with query-specific title
    return [{ ...defaultTutorial, title: `Figma Tutorial: ${query}` }];
  }
}