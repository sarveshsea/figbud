import { google } from 'googleapis';
import { config } from 'dotenv';
import { Tutorial, TutorialTimestamp } from '../models/User';
import { RedisService } from './redis';

config();

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export class YouTubeService {
  static async searchTutorials(
    query: string, 
    skillLevel?: string,
    maxResults: number = 5
  ): Promise<Tutorial[]> {
    try {
      // Check Redis cache first
      const cacheKey = RedisService.keys.youtubeSearch(query, skillLevel);
      const cachedResults = await RedisService.getJSON<Tutorial[]>(cacheKey);
      if (cachedResults) {
        console.log('YouTube search served from cache');
        return cachedResults.slice(0, maxResults);
      }
      // Add Figma-specific keywords to improve relevance
      const enhancedQuery = `${query} Figma tutorial`;
      
      // Search for videos
      const searchResponse = await youtube.search.list({
        part: ['snippet'],
        q: enhancedQuery,
        maxResults: maxResults,
        type: ['video'],
        videoDuration: skillLevel === 'beginner' ? 'short' : 'any',
        relevanceLanguage: 'en',
        order: 'relevance',
        safeSearch: 'strict'
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return [];
      }

      // Get video details including duration
      const videoIds = searchResponse.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      const videosResponse = await youtube.videos.list({
        part: ['contentDetails', 'statistics'],
        id: videoIds
      });

      // Map results to Tutorial format
      const tutorials: Tutorial[] = searchResponse.data.items.map((item, index) => {
        const videoDetails = videosResponse.data.items?.[index];
        const duration = this.parseDuration(videoDetails?.contentDetails?.duration || 'PT0S');
        
        return {
          id: item.id?.videoId || '',
          videoId: item.id?.videoId || '',
          title: item.snippet?.title || '',
          description: item.snippet?.description || '',
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || 
                        item.snippet?.thumbnails?.default?.url || '',
          duration: duration,
          channelTitle: item.snippet?.channelTitle || '',
          url: `https://youtube.com/watch?v=${item.id?.videoId}`,
          publishedAt: new Date(item.snippet?.publishedAt || Date.now()),
          skillLevel: this.determineSkillLevel(item.snippet?.title || '', duration),
          tags: this.extractTags(item.snippet?.title + ' ' + item.snippet?.description),
          views: parseInt(videoDetails?.statistics?.viewCount || '0'),
          timestamps: [], // Will be populated by AssemblyAI later
          rating: this.calculateRating(videoDetails?.statistics),
          cached: false,
          cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
      });

      // Cache the results
      await RedisService.setJSON(cacheKey, tutorials, RedisService.TTL.YOUTUBE_SEARCH);

      return tutorials;
    } catch (error) {
      console.error('YouTube API error:', error);
      throw new Error('Failed to search YouTube tutorials');
    }
  }

  static async getVideoDetails(videoId: string): Promise<Tutorial | null> {
    try {
      // Check Redis cache first
      const cacheKey = RedisService.keys.youtubeVideo(videoId);
      const cachedVideo = await RedisService.getJSON<Tutorial>(cacheKey);
      if (cachedVideo) {
        console.log('YouTube video details served from cache');
        return cachedVideo;
      }
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId]
      });

      const video = response.data.items?.[0];
      if (!video) return null;

      const duration = this.parseDuration(video.contentDetails?.duration || 'PT0S');
      
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
        publishedAt: new Date(video.snippet?.publishedAt || Date.now()),
        skillLevel: this.determineSkillLevel(video.snippet?.title || '', duration),
        tags: video.snippet?.tags || [],
        views: parseInt(video.statistics?.viewCount || '0'),
        timestamps: [],
        rating: this.calculateRating(video.statistics),
        cached: false,
        cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      // Cache the video details
      await RedisService.setJSON(cacheKey, tutorial, RedisService.TTL.YOUTUBE_VIDEO);
      
      return tutorial;
    } catch (error) {
      console.error('YouTube video details error:', error);
      return null;
    }
  }

  // Helper methods
  private static parseDuration(duration: string): number {
    // Parse ISO 8601 duration (e.g., PT1H30M45S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private static determineSkillLevel(title: string, duration: number): 'beginner' | 'intermediate' | 'advanced' {
    const lowerTitle = title.toLowerCase();
    
    // Check for explicit skill level keywords
    if (lowerTitle.includes('beginner') || lowerTitle.includes('basic') || 
        lowerTitle.includes('introduction') || lowerTitle.includes('getting started')) {
      return 'beginner';
    }
    
    if (lowerTitle.includes('advanced') || lowerTitle.includes('expert') || 
        lowerTitle.includes('master') || lowerTitle.includes('pro tips')) {
      return 'advanced';
    }
    
    // Use duration as a heuristic
    if (duration < 600) { // Less than 10 minutes
      return 'beginner';
    } else if (duration > 1800) { // More than 30 minutes
      return 'advanced';
    }
    
    return 'intermediate';
  }

  private static extractTags(text: string): string[] {
    const keywords = [
      'figma', 'design', 'ui', 'ux', 'component', 'prototype',
      'tutorial', 'basics', 'advanced', 'tips', 'tricks',
      'workflow', 'plugin', 'auto layout', 'variants', 'animation'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword));
  }

  private static calculateRating(statistics: any): number {
    if (!statistics) return 0;
    
    const likes = parseInt(statistics.likeCount || '0');
    const views = parseInt(statistics.viewCount || '1');
    
    // Simple rating calculation based on like/view ratio
    const ratio = likes / views;
    
    // Convert to 1-5 scale
    if (ratio > 0.1) return 5;
    if (ratio > 0.05) return 4.5;
    if (ratio > 0.02) return 4;
    if (ratio > 0.01) return 3.5;
    return 3;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}